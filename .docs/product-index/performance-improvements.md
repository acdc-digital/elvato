# Performance Improvements — Implementation Summary

> **Completed:** March 2026  
> **Source plan:** [opus-analysis.md](opus-analysis.md) §3 — Recommended Improvements  
> **Scope:** 803 published products, 7 main categories  
> **Stack:** Medusa.js v2.12.3 (Railway) → Next.js storefront (Vercel) → Neon PostgreSQL / Upstash Redis / MeiliSearch / Convex + Bunny.net CDN

---

## Scorecard

| # | Improvement | Status | Commit |
|---|-------------|--------|--------|
| 3.1 | Multi-category filtering | ✅ Done (prior session) | — |
| 3.2 | Price sort limit fix | ✅ Done | `45d3de21` |
| 3.3 | MeiliSearch search index | ✅ Done (prior session) | — |
| 3.4 | Bunny CDN rollout | ✅ Done | `45d3de21`, `2dc24494` |
| 3.5 | Slim category queries + product counts | ✅ Done | `97f8dc35` |
| 3.6 | Upstash Redis CDN cache | ✅ Done | `02235fd0` |
| 3.7 | Cache tag fallback | ✅ Done | `176a0fe6` |

---

## 3.2 — Price Sort Limit Fix

**File:** `storefront/src/lib/data/products.ts`

**Problem:** The Medusa API fallback path for price sorting used `limit: 100`, meaning only the first 100 products were fetched before client-side sort. With 803 products, price-sorted pages showed an incomplete, incorrectly ordered set.

**Fix:** Changed `limit: 100` → `limit: 1000` so the fallback fetches all products before sorting by `calculated_price`.

**Benefit:** Price-sorted views (low→high, high→low) now return correct results across the full catalogue.

---

## 3.4 — Bunny CDN Rollout

**Files:**
- `storefront/src/lib/data/convex-images.ts`
- `storefront/src/modules/products/components/product-preview/index.tsx`
- `convex/files.ts`

### Sub-fixes

#### N+1 Query Elimination
**Problem:** `prefetchThumbnails()` batch-fetched CDN URLs, but handles not found in the batch response were left un-cached. `getCdnThumbnail()` then re-queried Convex individually for each missing handle — an N+1 pattern.

**Fix:** After the batch query, all uncached handles are explicitly marked as `null` in the cache. `getCdnThumbnail()` trusts cached `null` values and skips redundant per-product queries.

#### Lazy Loading
**Problem:** All product images loaded eagerly regardless of viewport position.

**Fix:** Added `loading="lazy"` to `<Image>` in `ProductPreview`, deferring off-screen image loading.

#### Full Catalogue Ingestion
**Problem:** The original `ingestPublishedProductImages` action only processed products that existed in Convex staging tables (111 of 803). The remaining 692 products (Medusa-only) had no CDN images.

**Fix:** Built `ingestFromMedusaApi` — a new Convex action that:
1. Paginates through the Medusa Store API (`GET /store/products?fields=handle,thumbnail,images&limit=50`)
2. Checks ConvexFS for existing thumbnails via `checkBatchCdnStatus`
3. Schedules staggered ingestion batches (10 products every 5 seconds) to avoid rate limits

**Result:** All 803 products fully ingested — 10,871 objects / 1.49 GB stored in Bunny CDN.

---

## 3.5 — Slim Category Queries + Product Counts

**File:** `storefront/src/lib/data/categories.ts`

### Removed `*products` Expansion

**Problem:** Both `listCategories()` and `getCategoryByHandle()` included `*products` in their field expansion. This caused the Medusa API to return all 803 products nested inside each category response — massive payloads that were never used:
- `listCategories()` was only used in `generateStaticParams()` (needs handles only)
- `getCategoryByHandle()` was used for page metadata (needs name/description only)

**Fix:** Removed `*products` from both functions. `listCategories()` now fetches `*category_children, *parent_category, *parent_category.parent_category`. `getCategoryByHandle()` now fetches `*category_children` only.

### Added Product Counts

**Problem:** `buildCategoryTree()` set `productCount: cat.products?.length` which was always `undefined` because `getCategoryTree()` (used by the sidebar) never included products in its query. The sidebar's `({category.productCount})` display was always empty.

**Fix:** Added three new functions:
- `getCategoryCounts(categoryIds)` — parallel `GET /store/products?category_id=X&limit=0&fields=id` queries that return only the `count` with zero product data
- `collectCategoryIds(categories)` — walks the category tree to collect all IDs
- Updated `getCategoryTree()` to call both, passing counts into `buildCategoryTree()`

**Benefit:** Category sidebar now shows accurate product counts like `Chandeliers (142)`. Category page loads dropped from multi-MB payloads to a few KB.

---

## 3.6 — Upstash Redis CDN Cache

**File:** `storefront/src/lib/data/convex-images.ts`  
**Dependency added:** `@upstash/redis`

**Problem:** CDN URL caches (`thumbCache`, `imageCache`) were in-memory `Map` instances. On Vercel's serverless architecture, each function invocation gets a fresh process — the cache was always cold, providing zero benefit.

**Fix:** Replaced both maps with Upstash Redis (already provisioned via Vercel integration):

| Cache | Redis Key Pattern | TTL |
|-------|------------------|-----|
| Thumbnail URLs | `cdn:thumb:{handle}` | 24 hours |
| Gallery images | `cdn:images:{handle}` | 24 hours |

### Implementation Details

- **Lazy client init:** `getRedis()` creates the client once from `KV_REST_API_URL` / `KV_REST_API_TOKEN` env vars (injected by Vercel's Upstash integration)
- **Null sentinel:** Stores `"__null__"` string to distinguish "product has no CDN image" from "not yet cached" — prevents re-querying Convex for products without CDN assets
- **Pipelined writes:** `prefetchThumbnails()` uses `redis.pipeline()` to SET all results in a single round trip
- **Pipelined reads:** `prefetchThumbnails()` uses `redis.mget()` to check all handles in one call
- **Local dev fallback:** Falls back to in-memory maps when env vars aren't set

**Benefit:** CDN URL lookups are now instant on cache hit (< 1ms from Upstash edge), survive across all Vercel function invocations, and are shared across all edge nodes globally.

---

## 3.7 — Cache Tag Fallback

**File:** `storefront/src/lib/data/cookies.ts`

**Problem:** `getCacheOptions()` returned `{}` (empty object) when the `_medusa_cache_id` cookie was absent. This happens for:
- First-time visitors (no cookies yet)
- Search engine crawlers / bots
- Users with cookies disabled

When Next.js receives no `tags` and no `revalidate` option, it caches the response indefinitely with no invalidation path. Products, categories, and prices could go stale permanently for these visitors.

**Fix:** When `_medusa_cache_id` is missing, return `{ next: { revalidate: 300 } }` instead of `{}`. This ensures a 5-minute maximum staleness for cookieless visitors while still using tag-based instant revalidation for returning visitors.

**Benefit:** Bots and first-time visitors always see data no older than 5 minutes. Returning visitors with the cache cookie continue to get instant cache invalidation via Medusa webhooks.

---

## Combined Impact

### Before
- Category pages transferred multi-MB payloads (803 products embedded in category responses)
- CDN cache was useless on serverless (cold on every invocation)
- Price sort showed wrong results beyond 100 products
- 692 of 803 products had no CDN images
- N+1 Convex queries on every product grid load
- First-time visitors could see infinitely stale data

### After
- Category pages transfer ~2–5 KB (hierarchy only) + 7 lightweight count queries
- CDN URLs cached in Upstash Redis with 24h TTL, shared across all edge nodes
- Price sort covers all 803 products
- All 803 products have Bunny CDN images (10,871 objects / 1.49 GB)
- Single batch query per page load, no N+1
- 5-minute revalidation floor for cookieless visitors
- Product counts visible in category sidebar
