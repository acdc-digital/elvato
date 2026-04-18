# Thumbnail Enhancement Script (FLUX.2)

Script: `scripts/catalog/enhance-thumbnails-flux.mjs`

## What It Does

Takes a single product's existing thumbnail image from ConvexFS (Bunny CDN), sends it to the FLUX.2 image editing API, and generates a professional e-commerce product image with a clean white background, studio lighting, and sharp detail. Optionally replaces the original thumbnail in ConvexFS so the storefront immediately displays the enhanced version.

## How It Works

### Pipeline Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  1. Resolve      │ ──> │  2. Fetch        │ ──> │  3. FLUX.2       │ ──> │  4. Replace      │
│  Product         │     │  Thumbnail       │     │  Image Edit      │     │  in ConvexFS     │
│  (Medusa API)    │     │  (ConvexFS)      │     │  (BFL API)       │     │  (Bunny CDN)     │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Phase 1 — Resolve Product

Queries the Medusa Store API to find the target product by `--title` (fuzzy search) or `--handle` (exact match). Returns the product's `id`, `title`, and `handle`.

### Phase 2 — Fetch Current Thumbnail

Queries Convex `files:getProductImages` for the product handle. Looks for a file matching `/products/{handle}/thumbnail.{ext}`. If none exists, falls back to the first gallery image (`/products/{handle}/images/1.{ext}`). If neither exists in ConvexFS, falls back to the Medusa thumbnail URL.

### Phase 3 — FLUX.2 Image Editing

Sends the thumbnail URL to the FLUX.2 API endpoint (`flux-2-pro-preview` by default) with a prompt instructing it to:
- Remove the existing background
- Replace with pure white (#FFFFFF)
- Upscale and sharpen the product image
- Apply studio lighting and soft shadow
- Center the product

The API is asynchronous — the script submits the task, then polls for the result (typically 5–10 seconds). The generated image is always saved locally to `reports/catalog/flux-images/{handle}-enhanced.png` for review.

### Phase 4 — Replace Thumbnail (live mode only)

In live mode (without `--dry-run`), the script:
1. Deletes the old thumbnail file(s) from ConvexFS
2. Writes the new PNG to `/products/{handle}/thumbnail.png` via the `files:ingestImage` Convex action
3. The storefront's CDN cache (24h TTL) will pick up the new image automatically

## Usage

### Single Product — Dry Run (recommended first)

```bash
node scripts/catalog/enhance-thumbnails-flux.mjs \
  --title "Modern Gold Wall Sconce - Luxury Minimalist Design" \
  --dry-run
```

This generates the enhanced image and saves it locally without replacing anything. Review the output at `reports/catalog/flux-images/`.

### Single Product — Live Replace

```bash
node scripts/catalog/enhance-thumbnails-flux.mjs \
  --title "Modern Gold Wall Sconce - Luxury Minimalist Design" \
  --out reports/catalog/flux-enhance-live.json
```

### By Handle

```bash
node scripts/catalog/enhance-thumbnails-flux.mjs \
  --handle "modern-gold-wall-sconce-luxury-minimalist-design" \
  --dry-run
```

## CLI Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--title <string>` | One of title/handle | Search product by title (fuzzy) |
| `--handle <string>` | One of title/handle | Target product by exact URL handle |
| `--dry-run` | No | Generate image but skip replacing the thumbnail |
| `--out <path>` | No | Write JSON report to custom path |
| `--prompt <string>` | No | Override the default FLUX.2 editing prompt |
| `--model <string>` | No | FLUX.2 model endpoint (default: `flux-2-pro-preview`) |
| `--size <int>` | No | Output width & height in px (default: `1024`) |

## Environment Variables

Loaded automatically from `.env.local` at the project root.

| Variable | Purpose |
|----------|---------|
| `FLUX2_API_KEY` | BFL API key for FLUX.2 |
| `CONVEX_URL` | Convex deployment URL (queries product images) |
| `CONVEX_SITE_URL` | Convex HTTP endpoint (file serving) |
| `MEDUSA_BACKEND_URL` | Medusa backend API (product lookup) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable key for store API |

## Image Storage Path Convention

```
/products/{handle}/
  ├── thumbnail.png        ← the main thumbnail (what this script replaces)
  └── images/
      ├── 1.jpg            ← gallery image rank 1
      ├── 2.jpg            ← gallery image rank 2
      └── ...
```

The storefront resolves thumbnails via `files:getBatchThumbnails` which does `fs.list()` with prefix `/products/{handle}/thumbnail.` and returns the first match. The `withCdnImages()` helper in `storefront/src/lib/data/convex-images.ts` swaps Medusa's default thumbnail URL with the CDN version.

## FLUX.2 Model Options

| Model | Speed | Quality | Cost | Endpoint |
|-------|-------|---------|------|----------|
| `flux-2-pro-preview` (default) | ~10s | High | ~$0.03/MP | Latest advances |
| `flux-2-pro` | ~10s | High | ~$0.03/MP | Pinned/stable |
| `flux-2-max` | ~15s | Highest | ~$0.07/MP | Best quality |
| `flux-2-flex` | Higher | High | ~$0.06/MP | Adjustable steps/guidance |
| `flux-2-klein-4b` | Sub-second | Good | ~$0.014 | Cost-efficient |
| `flux-2-klein-9b-preview` | Sub-second | Better | ~$0.015 | Balanced |

## Output

### Local Files
- Generated image: `reports/catalog/flux-images/{handle}-enhanced.png`
- JSON report: `reports/catalog/flux-enhance-{dry|live}-{timestamp}.json` (or custom `--out` path)

### JSON Report Shape

```json
{
  "startedAt": "2026-03-26T...",
  "dryRun": true,
  "model": "flux-2-pro-preview",
  "outputSize": 1024,
  "product": { "id": "prod_...", "title": "...", "handle": "..." },
  "originalThumbnail": "https://...",
  "fluxTaskId": "task-...",
  "fluxCost": 4.5,
  "generatedImageUrl": "https://...",
  "newThumbnailPath": "/products/{handle}/thumbnail.png",
  "status": "dry-run-complete | replaced | error",
  "completedAt": "2026-03-26T...",
  "error": null
}
```

## Future: Batch Processing

The script currently targets a single product. Batch mode (`--all` / `--collection`) for processing all products is planned as a follow-up.
