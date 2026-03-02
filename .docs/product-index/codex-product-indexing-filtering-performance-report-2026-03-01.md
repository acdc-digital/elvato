# Elvato Product Indexing, Filtering, and Performance Report

Date: 2026-03-01  
Scope: Storefront `/store` behavior with 803 published Medusa products, category sidebar logic, indexing behavior, and response-time bottlenecks.

## 1. Executive Summary

Elvato's storefront product discovery path currently relies on Medusa Store API query-time filtering and sorting, rather than a dedicated search/index engine. At current catalog size (803 products), this architecture is functional but now shows correctness and performance limitations.

Primary findings:
- Category filter behavior is inconsistent due to a UI/data mismatch.
- Price sorting is implemented with a 100-product client-side sort window, which causes inaccurate results at current scale.
- Product freshness perception ("slow indexing") is affected by cache invalidation strategy not being tied to product publish events.
- Image delivery has improved with Bunny/Convex, but partial rollout and per-handle thumbnail lookup in Convex still introduce latency variance.

## 2. Current Architecture (Relevant to Product Discovery)

Based on repository architecture docs (`README.md`) and storefront implementation:
- Storefront runtime: Next.js (Vercel)
- Commerce APIs: Medusa (Railway)
- Primary transactional DB: Neon Postgres
- Cache/event infra: Redis (Upstash)
- Media workflow: ConvexFS metadata/file API + Bunny CDN delivery

### Store listing request flow
1. Request enters `storefront/src/app/[countryCode]/(main)/store/page.tsx`.
2. Search params (`sortBy`, `page`, `category_id`) are passed into `StoreTemplate`.
3. `StoreTemplate` parses `category_id` from URL.
4. `PaginatedProducts` composes Medusa query params and calls `listProductsWithSort`.
5. `listProductsWithSort` fetches products from `/store/products`.
6. Store page prefetches Convex thumbnails for listed product handles.
7. Product cards render via `ProductPreview`.

## 3. Objective 1: How Indexing/Filtering Works Today

## 3.1 What "indexing" currently means in this stack

There is no standalone catalog index engine currently driving faceted search/filtering. "Indexing" is effectively Medusa Store API data retrieval at request-time, with Next.js caching around calls.

Product listing is handled through:
- `storefront/src/lib/data/products.ts` (`listProducts`, `listProductsWithSort`)
- Medusa endpoint `/store/products`

Category filter UI is handled through:
- `storefront/src/modules/store/components/refinement-list/category-filter/index.tsx`

Category tree is fetched through:
- `storefront/src/lib/data/categories.ts` (`getCategoryTree`)

## 3.2 Why filter behavior is inconsistent

### Finding A: Multi-select UI, single-select query application

The UI supports multiple selected categories using comma-separated IDs in `category_id`.

Evidence:
- UI appends/removes values from comma-separated `category_id` URL param.

However, only the first selected category is passed to product query logic in store template:
- `storefront/src/modules/store/templates/index.tsx`

Result:
- Users can select multiple categories visually.
- Backend query applies only one category.
- Active filter chips/counts can show multiple filters while results do not reflect all of them.

### Finding B: Collection pages show category filters that are not wired through

Collection template renders full `RefinementList` (includes category filter by default), but collection page path does not pass `category_id` into query composition.

Result:
- Sidebar appears interactive.
- Category filter can appear to apply but does not actually constrain collection product results.

### Finding C: Behavior differences across store/category/collection contexts

- Store page: category filter shown.
- Category page: `showCategoryFilter={false}` (sort only).
- Collection page: category filter UI visible, but category filtering not applied in query flow.

Result:
- No consistent product discovery semantics across listing surfaces.

### Finding D: Category counts may be incomplete

`getCategoryTree` requests limited category fields and then tries to compute `productCount` from `cat.products?.length`. Depending on returned payload shape, count can be undefined/partial.

Result:
- Sidebar counts may be missing or misleading.

## 4. Objective 2: Why It Feels Slow (Load Times, Indexing, Filtering)

## 4.1 Critical bottleneck: price sorting strategy at current scale

`price_asc` and `price_desc` currently:
- Fetch only up to 100 products.
- Sort client-side.
- Paginate after local sort.

At 803 products, this creates:
- Incorrect global sort order (partial window only).
- Pagination mismatch for price sort.
- Unnecessary compute/data transfer work per request.

This is both a correctness and performance issue.

## 4.2 Product freshness and "indexing delay" perception

Storefront data fetches use force-cache patterns and per-cache-id tags. Revalidation of product/category/collection tags appears tied mainly to locale/cart flows, not directly to Medusa product publish/update events.

Result:
- Newly published/updated products can appear delayed.
- Team perceives this as slow indexing, even when backend product exists.

## 4.3 Image pipeline status and residual latency variance

Positive:
- Bunny CDN + ConvexFS integration is in place and prefetching is used for listing pages.

Residual risk:
- Convex batch thumbnail query still loops each handle and performs per-handle fs listing.
- Partial migration to Bunny causes mixed source performance (some products fast via Bunny, others slower fallback origin paths).

Result:
- Inconsistent image TTFB/user experience across catalog.

## 4.4 Additional load contributors

- Per-product async thumbnail resolution in card rendering path (mitigated by prefetch cache, but still additional orchestration).
- High-frequency filter/sort URL updates causing repeated data fetch/render cycles.

## 5. Priority Improvement Plan

## P0 (Immediate: correctness and trust)

1. Unify category filter semantics
- Decide and enforce one mode:
- Single-select: simplify UI to one category at a time.
- Multi-select: pass all selected category IDs through query pipeline and API call.
- Ensure behavior is identical across store, collection, and category routes.

2. Remove partial-window price sorting
- Replace `limit: 100` client-side sort strategy.
- Implement full-catalog, server-side sortable price strategy (denormalized min price), or move to dedicated search/index layer.

3. Resolve collection filter mismatch
- Either wire category filter into collection product query path.
- Or disable category filter UI on collection pages until fully supported.

## P1 (Near-term: performance and freshness)

4. Add publish-driven cache invalidation
- Trigger Next revalidation when Medusa products/categories/collections change.
- Use webhook/event bridge from Medusa backend to storefront revalidation endpoint.

5. Complete Bunny rollout coverage
- Backfill remaining non-ingested products.
- Track image ingestion coverage and retry failures.

6. Optimize Convex thumbnail lookup path
- Replace per-handle fs listing with direct lookup structure (precomputed map/table).

## P2 (Scalability and observability)

7. Introduce dedicated product discovery index
- Evaluate Meilisearch/OpenSearch/Algolia for faceted filtering + numeric sort + relevance.
- Keep Medusa as source of truth; index asynchronously with event-based updates.

8. Implement latency SLO instrumentation
- Track p50/p95 for:
- Medusa `/store/products` response times
- Convex thumbnail query times
- Store page TTFB and LCP
- Add dashboard thresholds and alerts.

## 6. Recommended Target State (High-Level)

- Medusa remains authoritative commerce backend.
- Search/facet/sort offloaded to proper index layer or robust denormalized query model.
- Next.js storefront serves cached content with deterministic publish-triggered revalidation.
- Convex/Bunny serves media with complete ingestion coverage and O(1)-style thumbnail lookup path.
- Filter behavior is consistent and predictable across all discovery surfaces.

## 7. Implementation Sequence (Suggested)

Phase 1 (1-2 sprints)
- Fix category filter logic contract.
- Fix collection filter wiring/visibility.
- Remove incorrect price-sort partial-window behavior.

Phase 2 (1 sprint)
- Add publish/update webhook-driven cache revalidation.
- Add observability for listing/filtering latency and freshness lag.

Phase 3 (2+ sprints)
- Complete Bunny ingestion to full catalog.
- Optimize Convex lookup path.
- Introduce dedicated index service if growth trajectory continues.

## 8. Risks If No Changes Are Made

- Continued user confusion from mismatched filters vs displayed results.
- Increasing sort/pagination inaccuracy as product count grows.
- Ongoing business perception of slow indexing due to stale cache windows.
- Higher infra and render overhead under increased traffic/catalog size.

## 9. Files Reviewed (Key)

- `README.md`
- `storefront/src/app/[countryCode]/(main)/store/page.tsx`
- `storefront/src/modules/store/templates/index.tsx`
- `storefront/src/modules/store/templates/paginated-products.tsx`
- `storefront/src/lib/data/products.ts`
- `storefront/src/lib/data/categories.ts`
- `storefront/src/modules/store/components/refinement-list/category-filter/index.tsx`
- `storefront/src/modules/store/components/refinement-list/active-filters/index.tsx`
- `storefront/src/modules/collections/templates/index.tsx`
- `storefront/src/modules/categories/templates/index.tsx`
- `storefront/src/lib/data/convex-images.ts`
- `convex/files.ts`
- `storefront/src/middleware.ts`
- `admin/medusa-config.ts`

---

Prepared for Elvato architecture optimization and future implementation planning.
