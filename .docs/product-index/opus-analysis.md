# Elvato Store — Product Indexing, Filtering & Performance Analysis

> **Date:** March 2026  
> **Scope:** 803 published products across 7 main categories  
> **Stack:** Medusa.js (Railway) → Next.js storefront (Vercel) → Neon PostgreSQL / Upstash Redis / Convex + Bunny.net CDN

---

## Table of Contents

1. [How Current Indexing Works](#1-how-current-indexing-works)
2. [Performance Bottlenecks](#2-performance-bottlenecks)
3. [Recommended Improvements](#3-recommended-improvements)
4. [Summary Table](#4-summary-table)

---

## 1. How Current Indexing Works

### 1.1 There Is No Search Index

The Medusa backend (`admin/medusa-config.ts`) configures Redis for caching, event bus, workflow engine, and locking — but **does not configure a search index module** (no MeiliSearch, Algolia, or ElasticSearch). Every product query from the storefront hits the Medusa Store API, which executes SQL against the Neon PostgreSQL database directly.

### 1.2 The Request Chain

```
Browser → Vercel Edge (middleware.ts)
         ↓ resolves countryCode → region
       Next.js Server Component (store/page.tsx)
         ↓ extracts sortBy, page, category_id from URL
       StoreTemplate (modules/store/templates/index.tsx)
         ├── RefinementList → getCategoryTree() → Medusa /store/product-categories
         └── PaginatedProducts → listProductsWithSort() → Medusa /store/products
                                  └── prefetchThumbnails() → Convex /api/query
                                       └── ProductPreview → getCdnThumbnail() → Convex (per-product fallback)
```

### 1.3 Category Sidebar

Categories are fetched via `getCategoryTree()` in `storefront/src/lib/data/categories.ts`:

- Queries `/store/product-categories` with `include_descendants_tree: true` and `parent_category_id: "null"` (root nodes only)
- Fields requested: `id, name, handle, parent_category_id, category_children` — **no products included**
- Builds a `CategoryNode[]` tree via `buildCategoryTree()`
- Uses `cache: "force-cache"` with tag-based revalidation

The 7 main categories are defined in `storefront/src/lib/data/categories-client.ts`:

| Category | ID |
|----------|------|
| Chandeliers | `pcat_01KF736S869NMN0XA35AA07XPM` |
| Pendants | `pcat_01KF73711R8NF7FV7BKB96PWA6` |
| Wall | `pcat_01KF7375B8QDW6HP07AHYCKZQ8` |
| Ceiling | `pcat_01KF737B8B0SPRD4DV9W2RGTM8` |
| Table & Floor | `pcat_01KF737DY59JFQDPA35FTCZ7HM` |
| Outdoor | `pcat_01KF737MPK7JZFATG1DBV0RBC8` |
| Accessories | `pcat_01KF737PCZPCQ39EMRNTJHQT9B` |

### 1.4 Filter Logic — The Multi-Category Bug

The `CategoryFilter` component (`modules/store/components/refinement-list/category-filter/index.tsx`) properly supports **multi-select**:

- Toggling a category appends/removes its ID in a comma-separated `category_id` URL parameter
- Active filters badge accurately shows the count
- State management is correct

**However, the `StoreTemplate` drops all but the first selection:**

```typescript
// storefront/src/modules/store/templates/index.tsx — lines 56-59
categoryId={
  selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined
}
```

**Result:** User selects "Chandeliers" + "Pendants" → URL says `category_id=pcat_X,pcat_Y` → UI shows "2 filters applied" → **only Chandeliers products appear**. This is the root cause of inconsistent filtering behavior.

### 1.5 Missing Product Counts in Sidebar

The `CategoryNode` type includes `productCount?: number`, and the sidebar conditionally renders `({category.productCount})`. But `getCategoryTree()` does **not** include products in its field list, so `cat.products?.length` is always `undefined` and no counts ever display.

---

## 2. Performance Bottlenecks

### 2.1 Price Sorting Only Fetches 100 of 803 Products

When `sortBy` is `price_asc` or `price_desc`, `listProductsWithSort()` in `storefront/src/lib/data/products.ts` runs:

```typescript
const { response: { products, count } } = await listProducts({
  pageParam: 0,
  queryParams: { ...queryParams, limit: 100, fields: LISTING_FIELDS },
  countryCode,
})
const sortedProducts = sortProducts(products, sortBy)
```

This fetches a **maximum of 100 products**, sorts them client-side (in the Next.js server component), then paginates. With 803 products:

- **703 products are completely excluded** from price-sorted results
- The `count` returned from Medusa reflects the true total, so pagination shows the correct page count, but pages beyond the first ~8 show **no products**
- Client-side sorting in server memory doesn't scale — fetching all 803 products with variant pricing data creates significant payload and compute overhead

### 2.2 N+1 CDN Thumbnail Queries

The `PaginatedProducts` component batch-prefetches CDN thumbnails for 12 products per page via a single Convex query (`prefetchThumbnails`). This is efficient.

However, for products **not yet ingested into Bunny.net CDN**, `getCdnThumbnail()` inside each `ProductPreview` calls `fetchProductImages()` which makes an **individual Convex API call** per product:

```
Page render (12 products)
  ├── 1 batch Convex query (prefetchThumbnails) → returns CDN URLs for ingested products
  └── For each non-CDN product: 1 individual Convex query (fetchProductImages)
       └── Could be up to 12 additional sequential HTTP calls
```

With partial CDN coverage, a page with mostly non-CDN products generates up to **13 Convex API calls** (1 batch + 12 individual).

### 2.3 In-Memory Cache Ineffective in Serverless

`convex-images.ts` uses `Map<string, ...>` caches:

```typescript
const imageCache = new Map<string, ConvexImage[]>()
const thumbCache = new Map<string, string | null>()
```

On Vercel (serverless), each function invocation starts fresh. These in-memory maps are effectively **single-request caches** — they don't persist across different page loads. The only actual caching comes from Next.js `revalidate: 3600` on the `fetch` calls.

### 2.4 `listCategories` Over-Fetches Product Data

The `listCategories()` function requests fields including `*products`:

```typescript
fields: "*category_children, *products, *parent_category, *parent_category.parent_category"
```

This expands **every product object** for every category. With 803 products across 7+ categories, this query returns massive payloads. It's used in `generateStaticParams` for category pages (build time + ISR), creating slow builds and high memory usage.

### 2.5 Cache Tag Dependency on Cookie

All product/category cache tags depend on `_medusa_cache_id` cookie:

```typescript
// storefront/src/lib/data/cookies.ts
export const getCacheTag = async (tag: string): Promise<string> => {
  const cookies = await nextCookies()
  const cacheId = cookies.get("_medusa_cache_id")?.value
  if (!cacheId) return ""        // ← returns empty string
  return `${tag}-${cacheId}`
}

export const getCacheOptions = async (tag: string): Promise<{ tags: string[] } | {}> => {
  const cacheTag = await getCacheTag(tag)
  if (!cacheTag) return {}       // ← returns empty object = NO cache tags
  return { tags: [`${cacheTag}`] }
}
```

If `_medusa_cache_id` is not set (first visit, bot crawlers, direct API hits), `getCacheOptions` returns `{}` and Next.js has no cache tags to work with. The `cache: "force-cache"` still caches the response, but **tag-based revalidation won't work** — stale data may persist indefinitely until a full redeploy.

### 2.6 No Full-Text Search Capability

Without a search index, there is no way to search products by name, description, material, or any free-text attribute. The only filtering available is:

- Category (single category due to the bug)
- Sort by created_at, price_asc, price_desc

This is a significant gap at 803 products.

---

## 3. Recommended Improvements

### 3.1 Fix Multi-Category Filtering (Bug Fix — Immediate)

**Problem:** Only first category ID is passed to `PaginatedProducts`.

**Fix:** Pass all selected category IDs. Medusa's Store API accepts `category_id` as an array, and the `PaginatedProductsParams` type already defines `category_id?: string[]`.

```typescript
// StoreTemplate — change from:
categoryId={selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined}

// To:
categoryIds={selectedCategoryIds}
```

Update `PaginatedProducts` to accept `categoryIds: string[]` and pass it as `queryParams["category_id"] = categoryIds`.

### 3.2 Fix Price Sort at Scale (Critical — Immediate)

**Short-term:** Increase the limit to cover the full catalog:

```typescript
// products.ts — change limit: 100 to:
limit: 1000,
```

This ensures all 803 products are fetched for price sorting. Performance impact is mitigated by using slim fields (`LISTING_FIELDS` excludes images).

**Long-term:** Implement a search index module (see 3.3) that supports server-side price sorting, eliminating client-side fetch-all entirely.

### 3.3 Add a Search Index Module (Strategic)

Add MeiliSearch to the Medusa configuration. MeiliSearch is self-hostable on Railway alongside the Medusa backend and integrates natively with Medusa v2.

**Benefits:**
- Server-side price sorting (eliminates client-side fetch-all)
- Full-text product search (name, description, tags, materials)
- Faceted filtering (price ranges, categories, attributes)
- Sub-50ms query times at 800+ products
- Scales to 10,000+ products without architecture changes

**Implementation outline:**
1. Deploy MeiliSearch on Railway
2. Add `@medusajs/index` module to `medusa-config.ts`
3. Run initial product indexing
4. Replace `listProducts` API calls with search index queries
5. Add a search bar to the storefront navigation

### 3.4 Complete Bunny.net CDN Rollout (Performance)

The CDN image pipeline (Convex → Bunny.net) is architecturally sound but partially deployed. The fallback chain in `ProductPreview`:

```
cdnThumb → product.thumbnail → product.images[0] → "No image"
```

Products still using CJ Dropshipping URLs (`cf.cjdropshipping.com`) are served from a third-party origin with no image optimization. Priority actions:

1. **Ingest remaining products** into ConvexFS / Bunny.net CDN
2. **Eliminate per-product fallback queries** — if `prefetchThumbnails` returns null for a handle, skip the individual `fetchProductImages` call (the product simply doesn't have CDN images yet; no point querying Convex again)
3. **Add `priority` and `loading="lazy"`** attributes to product grid images for proper LCP optimization

### 3.5 Slim Down Category Queries (Performance)

**`listCategories()`:** Remove `*products` from the field list. Replace with a count-only approach:

```typescript
fields: "*category_children, *parent_category"
// Get counts separately via a lightweight query or metadata
```

**`getCategoryTree()`:** Already lean. To add product counts to the sidebar, either:
- Add a `product_count` computed field (if supported by Medusa version)
- Run a parallel count query: `GET /store/products?category_id=X&limit=0` returns `count` without product data

### 3.6 Replace In-Memory Cache with Redis (Performance)

Move the CDN URL cache from in-process `Map` to Upstash Redis (already provisioned):

```typescript
// Instead of:
const thumbCache = new Map<string, string | null>()

// Use Upstash Redis:
import { Redis } from "@upstash/redis"
const redis = Redis.fromEnv()

async function getCachedThumbnail(handle: string): Promise<string | null> {
  return redis.get(`cdn:thumb:${handle}`)
}
```

This persists across serverless invocations and across Vercel edge nodes.

### 3.7 Add Cache Tag Fallback (Reliability)

When `_medusa_cache_id` cookie is absent, fall back to time-based revalidation:

```typescript
export const getCacheOptions = async (tag: string): Promise<{ tags: string[] } | { next: { revalidate: number } }> => {
  const cacheTag = await getCacheTag(tag)
  if (!cacheTag) {
    return { next: { revalidate: 300 } } // 5-minute fallback
  }
  return { tags: [`${cacheTag}`] }
}
```

---

## 4. Summary Table

| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| Multi-category filter only uses first ID | **Bug** | `storefront/src/modules/store/templates/index.tsx` L56-59 | Pass all selected IDs to `PaginatedProducts` |
| Price sort capped at 100 products (803 exist) | **Critical** | `storefront/src/lib/data/products.ts` L126 | Increase limit; long-term add search index |
| No search index module configured | **Architectural gap** | `admin/medusa-config.ts` | Add MeiliSearch module |
| Category sidebar missing product counts | **UI gap** | `storefront/src/lib/data/categories.ts` L76 | Add count query or metadata field |
| `listCategories` over-fetches with `*products` | **Performance** | `storefront/src/lib/data/categories.ts` L26 | Remove `*products` from fields |
| N+1 CDN fallback queries per page | **Performance** | `storefront/src/lib/data/convex-images.ts` L111 | Skip individual queries after batch miss |
| In-memory CDN cache ineffective in serverless | **Performance** | `storefront/src/lib/data/convex-images.ts` L23-25 | Move to Upstash Redis |
| Cache tags depend on cookie that may be absent | **Reliability** | `storefront/src/lib/data/cookies.ts` L38 | Add time-based revalidation fallback |
| Partial Bunny.net CDN coverage | **Performance** | Product image pipeline | Complete CDN ingestion for all 803 products |
| No full-text search capability | **Feature gap** | Storefront architecture | Implement with MeiliSearch |
