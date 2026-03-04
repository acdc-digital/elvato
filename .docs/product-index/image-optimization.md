# Image Optimization — Next Steps

## Current Architecture

```
Browser → Convex HTTP (/fs/blobs/{blobId}) → 302 redirect → Bunny CDN edge → image
```

### What works
- Images are stored in Bunny.net Edge Storage via ConvexFS
- Storefront resolves CDN thumbnails via batch Convex query (`getBatchThumbnails`)
- Fallback chain: CDN thumb → Medusa thumbnail → first image → "No image"

### Bottlenecks
1. **Extra redirect hop** — every image goes through Convex first (302), adding ~50-100ms
2. **SSR query overhead** — every page load POSTs to Convex API to resolve handles → proxy URLs
3. **No image optimization** — served at original size/format (JPEG), no WebP/AVIF, no responsive resizing
4. **In-memory cache useless on Vercel** — `thumbCache` Map resets every serverless invocation

## Recommended Improvements

### Option A: Direct Bunny CDN URLs (skip Convex redirect)
- Store direct `https://{zone}.b-cdn.net/products/{handle}/thumbnail.jpg` URLs
- Eliminates the Convex hop entirely
- Requires disabling Bunny token auth or generating signed URLs at SSR time
- **Code change**: Update `convex-images.ts` to build direct Bunny URLs instead of proxy URLs

### Option B: Next.js Image Optimization
- Add Bunny CDN domain to `next.config.js` `images.remotePatterns`
- Next.js automatically converts to WebP/AVIF (30-50% smaller)
- Resizes to the exact `sizes` needed (280px-800px per product card)
- Caches optimized versions on Vercel's edge
- **Code change**: One line in `next.config.js`

### Option C: Bunny Optimizer (edge-side, best performance)
- Bunny.net has built-in image processing via query params:
  ```
  https://{zone}.b-cdn.net/products/handle/thumbnail.jpg?width=400&format=webp
  ```
- Edge-side optimization — no Vercel processing needed, globally cached
- Requires Bunny Optimizer enabled on the pull zone

## Recommended Plan: Combine A + B

1. **Generate direct Bunny CDN URLs** — modify `convex-images.ts` or `getBatchThumbnails` to return direct CDN URLs
2. **Add Bunny domain to Next.js image config** — `remotePatterns` in `next.config.js`
3. Next.js handles WebP conversion + responsive sizing automatically
4. No redirect hop, optimized format, proper sizing

## Relevant Files
- `storefront/src/lib/data/convex-images.ts` — CDN URL resolution
- `storefront/next.config.js` — image optimization config
- `convex/files.ts` — `getBatchThumbnails` query (builds proxy URLs)
- `convex/fs.ts` — ConvexFS instance with Bunny storage config
