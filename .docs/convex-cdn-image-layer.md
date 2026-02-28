# Convex CDN Image Layer — Elvato

**Provider:** Convex (ConvexFS + Bunny CDN)  
**Deployment:** `superb-dotterel-37`  
**Cloud URL:** `https://superb-dotterel-37.convex.cloud`  
**HTTP Actions URL:** `https://superb-dotterel-37.convex.site`  
**Deploy Key Name:** `elvato-storefront`  
**Status:** ✅ Functions deployed  
**Last verified:** February 2026

---

## Architecture Overview

Convex provides a CDN image optimization layer for the storefront. Product images are stored in Bunny.net Edge Storage and served via Bunny CDN through ConvexFS — a file-system abstraction that handles uploads, signed URLs, and CDN token authentication.

The storefront queries Convex for CDN image URLs and transparently swaps slow origin URLs (e.g. CJ Dropshipping) with fast CDN equivalents. If Convex is unavailable or a product hasn't been ingested, the storefront falls back to the original Medusa image URLs.

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Storefront (Vercel)     │         │  Bunny CDN               │
│  Next.js 15              │         │                          │
│                          │         │  Edge Storage (SSD)      │
│  NEXT_PUBLIC_CONVEX_URL  │         │  Pull Zone + Token Auth  │
│  (superb-dotterel-37     │    ┌───▶│  302 redirect from       │
│   .convex.cloud)         │    │    │  ConvexFS signed URLs    │
│                          │    │    │                          │
└──────────┬───────────────┘    │    └──────────────────────────┘
           │ /api/query         │
           ▼                    │
┌──────────────────────────────────────────────────────────────┐
│  Convex Cloud Deployment                                     │
│  superb-dotterel-37                                          │
│                                                              │
│  ConvexFS Component (convex-fs)                              │
│  ├── files.ts    — queries: getProductImages, getBatch...    │
│  ├── fs.ts       — ConvexFS instance (Bunny storage)         │
│  ├── http.ts     — HTTP router: /fs/upload, /fs/blobs/*      │
│  └── schema.ts   — tables: medusaProducts, variantMapping    │
│                                                              │
│  Env vars (set via Convex Dashboard):                        │
│    BUNNY_API_KEY, BUNNY_STORAGE_ZONE,                        │
│    BUNNY_CDN_HOSTNAME, BUNNY_TOKEN_KEY                       │
└──────────────────────────────────────────────────────────────┘
```

### Image Resolution Flow

```
1. Storefront renders product card / product page
       │
2. Server component calls getCdnThumbnail(handle) or withCdnImages(product)
       │
3. convex-images.ts fetches from Convex:
       POST ${CONVEX_URL}/api/query
       body: { path: "files:getProductImages", args: { productHandle } }
       │
4. Convex queries ConvexFS → builds signed CDN download URLs
       │
5. Returns array of { path, url, contentType, size }
       url = https://<deployment>.convex.site/fs/blobs/<blobId>/<path>
       │
6. Browser fetches URL → 302 redirect to Bunny CDN edge
       │
7. If Convex returns error or empty → falls back to Medusa image URLs
```

---

## File Structure

```
convex/
├── convex.config.ts      — App definition, installs ConvexFS component
├── files.ts              — Product image queries + mutations + actions
├── fs.ts                 — ConvexFS instance with Bunny storage config
├── http.ts               — HTTP router (/fs/upload, /fs/blobs/*)
├── schema.ts             — Database schema
├── _generated/           — Auto-generated types (do not edit)
├── cj/                   — CJ Dropshipping integration
├── medusa/               — Medusa staging + variant mapping
├── products/             — Product management + action history
└── utils/                — Shared utilities
```

### Key Files

| File | Purpose |
|------|---------|
| `convex/fs.ts` | Creates ConvexFS instance connected to Bunny.net storage |
| `convex/files.ts` | All product image operations — queries, mutations, actions |
| `convex/http.ts` | HTTP action router — upload proxy and blob download (302 → CDN) |
| `storefront/src/lib/data/convex-images.ts` | Storefront helper — fetches CDN URLs, swaps into product data |

---

## Configuration

### Environment Variables

**Convex Dashboard (production environment variables):**

These are set in the [Convex Dashboard](https://dashboard.convex.dev) → Project → Settings → Environment Variables. They are NOT in `.env` files — Convex cloud functions read them at runtime.

| Variable | Purpose | Where to find |
|----------|---------|---------------|
| `BUNNY_API_KEY` | Upload blobs to Bunny storage | Bunny Dashboard → Storage Zone → FTP & API Access → Password |
| `BUNNY_STORAGE_ZONE` | Name of the Bunny storage zone | The name you gave your storage zone |
| `BUNNY_CDN_HOSTNAME` | Full CDN hostname (e.g. `myzone-cdn.b-cdn.net`) | Bunny Dashboard → Pull Zone → Hostnames |
| `BUNNY_TOKEN_KEY` | Secret for signed CDN tokens | Bunny Dashboard → Pull Zone → Security → Token Authentication |
| `BUNNY_REGION` | *(Optional)* Storage region if not Frankfurt | Only needed for non-default regions |

**Storefront (Vercel / `.env.local`):**

| Variable | Local Dev | Production (Vercel) |
|----------|-----------|-------------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://127.0.0.1:3210` | `https://superb-dotterel-37.convex.cloud` |

**Root `.env.local` (local Convex dev):**

| Variable | Value |
|----------|-------|
| `CONVEX_DEPLOYMENT` | `local:local-acdc_digital-elvato` |
| `CONVEX_URL` | `http://127.0.0.1:3210` |
| `CONVEX_SITE_URL` | `http://127.0.0.1:3211` |

---

## Deployment

### Deploy Convex Functions

Convex functions must be deployed separately from the storefront. The deploy key authenticates pushes to the production deployment.

```bash
# From project root (/elvato)
CONVEX_DEPLOY_KEY='prod:superb-dotterel-37|<key>' npx convex deploy
```

Or using the npm script:

```bash
CONVEX_DEPLOY_KEY='prod:superb-dotterel-37|<key>' npm run convex:deploy
```

**What gets deployed:**
- All files in `convex/` (functions, schema, http routes)
- ConvexFS component (`convex-fs`)
- Table indexes

**What does NOT get deployed:**
- `convex/_generated/` — regenerated during deploy
- Environment variables — set separately in Convex Dashboard
- Data — tables persist across deployments

### Deploy Key

| Property | Value |
|----------|-------|
| Key name | `elvato-storefront` |
| Deployment | `prod:superb-dotterel-37` |
| Usage | Pass as `CONVEX_DEPLOY_KEY` env var to `npx convex deploy` |

> **Security:** The deploy key grants write access to your production Convex deployment. Store it as a CI/CD secret — never commit it to source control.

### CI/CD Integration

For automated deployments (e.g. GitHub Actions), set `CONVEX_DEPLOY_KEY` as a repository secret:

```yaml
- name: Deploy Convex functions
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
  run: npx convex deploy
```

### Vercel Build Integration

To deploy Convex functions during a Vercel build (useful when storefront and Convex are tightly coupled):

```bash
npx convex deploy --cmd 'npx next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

This deploys the Convex functions first, sets `NEXT_PUBLIC_CONVEX_URL` to the production URL, then runs the Next.js build.

---

## Storefront Integration

### How the Storefront Uses Convex

The storefront communicates with Convex entirely through server-side HTTP queries — there is no Convex React client in the storefront. All calls happen at build time or request time in server components.

| Function | Location | Usage |
|----------|----------|-------|
| `getCdnThumbnail(handle)` | Product preview cards | Replaces thumbnail URL with CDN version |
| `prefetchThumbnails(handles[])` | Product lists, rails | Batch-fetches thumbnails for multiple products |
| `getCdnGalleryImages(handle)` | Product detail page | Gets all gallery images sorted by rank |
| `withCdnImages(product)` | Product detail page | Swaps all product images with CDN versions |

### Graceful Fallback

Every function in `convex-images.ts` wraps its Convex fetch in a try/catch and returns empty results on failure. The `withCdnImages()` helper only replaces URLs when CDN alternatives exist:

```typescript
// If CDN thumbnail exists, use it; otherwise keep original
thumbnail: cdnThumb ?? product.thumbnail,

// If CDN gallery has images, use them; otherwise keep original
images: cdnGallery.length > 0 ? cdnGallery : product.images,
```

This means the storefront works correctly even when:
- Convex is down or unreachable
- A product hasn't been ingested into ConvexFS yet
- Bunny CDN credentials are missing

### Caching

- **HTTP-level:** Convex queries use `next: { revalidate: 3600 }` — cached for 1 hour by Next.js
- **In-memory:** `imageCache` and `thumbCache` Maps persist per-server-process
- **CDN-level:** Bunny CDN caches files at the edge with token-coordinated expiration

---

## ConvexFS Path Convention

Product images follow a strict path convention in ConvexFS:

```
/products/{productHandle}/thumbnail.{ext}     — Product thumbnail
/products/{productHandle}/images/{rank}.{ext}  — Gallery images (1.jpg, 2.jpg, ...)
```

| Path Component | Example | Purpose |
|----------------|---------|---------|
| `productHandle` | `modern-desk-lamp` | Medusa product handle (URL slug) |
| `thumbnail.{ext}` | `thumbnail.jpg` | The main product thumbnail |
| `images/{rank}` | `images/1.jpg` | Gallery images, sorted by numeric rank |

---

## HTTP Actions

The Convex HTTP router (`convex/http.ts`) mounts ConvexFS routes at `/fs`:

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/fs/upload` | POST | Upload proxy — streams file to Bunny storage | Authenticated users only |
| `/fs/blobs/*` | GET | Returns 302 redirect to signed Bunny CDN URL | Public (no auth required) |

**Production base URL:** `https://superb-dotterel-37.convex.site`

---

## Local Development

Start the local Convex dev server alongside the storefront:

```bash
# Terminal 1 — Convex dev server
cd /elvato
npx convex dev

# Terminal 2 — Storefront
cd /elvato/storefront
npm run dev
```

The local dev server reads from `/.env.local` and auto-syncs function changes. The storefront's `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` points to the local instance.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Product images not loading from CDN | Bunny env vars not set in Convex Dashboard | Set BUNNY_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_CDN_HOSTNAME, BUNNY_TOKEN_KEY in Convex Dashboard |
| Storefront shows original (slow) images | Product not ingested into ConvexFS | Upload product images to ConvexFS using the commit workflow |
| `Server Error` from Convex `/api/query` | Bunny env vars missing or ConvexFS not initialized | Check Convex Dashboard environment variables |
| Images load in dev but not production | `NEXT_PUBLIC_CONVEX_URL` still pointing to localhost | Set to `https://superb-dotterel-37.convex.cloud` on Vercel |
| Upload fails with 401 | No auth identity on upload request | Ensure user is authenticated before uploading |
| `npx convex deploy` fails | Missing or invalid deploy key | Set `CONVEX_DEPLOY_KEY` env var with production key |
| Functions deploy but queries fail | Schema mismatch or missing indexes | Run `npx convex deploy` again — indexes are created automatically |
