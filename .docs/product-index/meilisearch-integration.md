# MeiliSearch Product Search Integration

> **Date:** March 2026
> **Status:** Production
> **Scope:** 803 products indexed across 7 categories
> **Infrastructure:** Self-hosted MeiliSearch v1.12.8 on Railway

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Infrastructure](#3-infrastructure)
4. [Backend Module](#4-backend-module)
5. [Workflows & Steps](#5-workflows--steps)
6. [Event Subscribers](#6-event-subscribers)
7. [Admin API & UI](#7-admin-api--ui)
8. [Storefront Integration](#8-storefront-integration)
9. [Index Schema](#9-index-schema)
10. [Configuration Script](#10-configuration-script)
11. [Environment Variables](#11-environment-variables)
12. [Operational Procedures](#12-operational-procedures)
13. [Troubleshooting](#13-troubleshooting)
14. [Design Decisions](#14-design-decisions)

---

## 1. Overview

Elvato uses MeiliSearch as a dedicated product search engine, replacing direct PostgreSQL queries for text search, category filtering, and price sorting on the storefront. The integration follows the official Medusa.js v2 module pattern — a custom module wraps the MeiliSearch client, workflows handle data synchronization, subscribers react to product lifecycle events, and an admin API route enables full re-indexing from the dashboard.

### What MeiliSearch Handles

- **Full-text search:** Typo-tolerant, ranked search across product titles, descriptions, tags, category names, and option values
- **Category filtering:** Filter products by one or multiple category IDs
- **Price sorting:** Sort by `price_cents` ascending/descending
- **Recency sorting:** Sort by `created_at` descending (newest first)

### What MeiliSearch Does Not Handle

- **Price calculation:** Prices in the index are raw variant amounts (lowest across all variants). Region-specific calculated prices still come from the Medusa Store API.
- **Product hydration:** MeiliSearch returns lightweight hits (IDs, handles, titles). Full product data (variants, images, inventory) is hydrated from Medusa after search.
- **Cart/checkout/orders:** All commerce operations remain on Medusa.

---

## 2. Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INDEXING PIPELINE                            │
│                                                                     │
│  Product Created/Updated/Deleted                                    │
│       │                                                             │
│       ▼                                                             │
│  Subscriber (meilisearch-product-upsert / delete)                   │
│       │                                                             │
│       ▼                                                             │
│  Workflow (sync-products-to-meilisearch)                            │
│       │                                                             │
│       ├── useQueryGraphStep ─── Fetch product + relations           │
│       ├── transform ─────────── Denormalize into flat document      │
│       ├── syncStep ──────────── indexData() → MeiliSearch           │
│       └── deleteStep ────────── deleteFromIndex() → MeiliSearch     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SEARCH PIPELINE                              │
│                                                                     │
│  User enters query / selects category / sorts by price              │
│       │                                                             │
│       ▼                                                             │
│  Storefront Server Component (PaginatedProducts)                    │
│       │                                                             │
│       ├── searchProducts() ──── MeiliSearch query (search.ts)       │
│       │       returns hit IDs                                       │
│       │                                                             │
│       ├── listProductsWithSort() ── Medusa Store API (hydration)    │
│       │       fetches full product data by IDs                      │
│       │                                                             │
│       └── Render ProductPreview components in MeiliSearch order     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Topology

```
Medusa Backend (Railway)
    │
    │  http://meilisearch.railway.internal:7700  (private network)
    │
    ▼
MeiliSearch (Railway)
    │
    │  https://meilisearch-production-3595.up.railway.app  (public)
    │
    ▼
Storefront (Vercel) ── reads via public URL with search-only API key
```

The Medusa backend communicates with MeiliSearch over Railway's private network (no public internet hop). The storefront uses the public endpoint with a restricted search-only key.

---

## 3. Infrastructure

### MeiliSearch on Railway

| Property | Value |
|----------|-------|
| Image | `getmeili/meilisearch:v1.12` |
| Version | 1.12.8 |
| Port | 7700 |
| Private URL | `http://meilisearch.railway.internal:7700` |
| Public URL | `https://meilisearch-production-3595.up.railway.app` |
| Storage | In-container (no persistent volume) |
| Indexing Memory | 150 MB cap (`MEILI_MAX_INDEXING_MEMORY`) |
| Authentication | Master key (`MEILI_MASTER_KEY`) |

### Storage Model

MeiliSearch runs without a persistent volume on Railway. This means:

- **Data is ephemeral:** If MeiliSearch restarts, the index is wiped and must be re-synced via the admin dashboard.
- **Keys regenerate on restart:** Derived API keys (admin key, search key) change every restart. The backend uses the master key directly to avoid auth failures after restarts.
- **Re-index time is negligible:** 803 products re-index in under 10 seconds (50-product batches, ~95ms each).

This trade-off was chosen because Railway volumes caused "failed to infer database version" errors with MeiliSearch's embedded database (LMDB). For 803 products, ephemeral storage with quick re-indexing is acceptable.

### Environment Variables (MeiliSearch Service)

| Variable | Value |
|----------|-------|
| `MEILI_ENV` | `production` |
| `MEILI_HTTP_ADDR` | `0.0.0.0:7700` |
| `MEILI_MASTER_KEY` | (secret — 32-byte base64) |
| `MEILI_MAX_INDEXING_MEMORY` | `150000000` (~150 MB) |
| `PORT` | `7700` |

---

## 4. Backend Module

### File Structure

```
admin/src/modules/meilisearch/
├── index.ts      Module definition & export
└── service.ts    MeilisearchModuleService class
```

### Module Registration (`index.ts`)

```typescript
export const MEILISEARCH_MODULE = "meilisearch"
export default Module(MEILISEARCH_MODULE, { service: MeilisearchModuleService })
```

The module identifier `"meilisearch"` is used to resolve the service from Medusa's dependency injection container.

### Configuration (`medusa-config.ts`)

```typescript
{
  resolve: "./src/modules/meilisearch",
  options: {
    host: process.env.MEILISEARCH_HOST!,
    apiKey: process.env.MEILISEARCH_API_KEY!,
    productIndexName: process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "products",
  }
}
```

### Service Class (`service.ts`)

`MeilisearchModuleService` wraps the `meilisearch` npm package (v0.55.0) and provides:

| Method | Description |
|--------|-------------|
| `indexData(documents)` | Adds documents to the index. Waits for MeiliSearch to confirm indexing is complete (30s timeout). |
| `deleteFromIndex(ids)` | Removes documents from the index by ID. |
| `search(query, options)` | Executes a search query with optional filters, sort, limit, offset. |
| `configureIndex(settings)` | Updates index settings (searchable/filterable/sortable/displayed attributes). |
| `getIndexStats()` | Returns index statistics (document count, field distribution). |

#### ESM Compatibility

The `meilisearch` npm package is ESM-only. Medusa's build system uses CommonJS module resolution. To avoid `ERR_REQUIRE_ESM` errors, the MeiliSearch client is loaded via lazy dynamic import:

```typescript
private async getClient() {
  if (!this.client_) {
    const { MeiliSearch } = await import("meilisearch")
    this.client_ = new MeiliSearch({ host: this.host, apiKey: this.apiKey })
  }
  return this.client_
}
```

#### Synchronous Indexing

`indexData()` calls `client.waitForTask(task.taskUid)` after submitting documents. This ensures each batch is fully indexed before the workflow step completes, preventing MeiliSearch from being overwhelmed with queued tasks.

---

## 5. Workflows & Steps

### Workflow: `sync-products-to-meilisearch`

**File:** `admin/src/workflows/sync-products-to-meilisearch.ts`

**Input:** `{ product_ids?: string[] }` — optional array of product IDs to sync. If omitted, syncs all products.

**Pipeline:**

1. **`useQueryGraphStep`** — Fetches products from Medusa's query graph with relations:
   - `categories.id`, `categories.name`
   - `tags.value`
   - `options.values.value`
   - `variants.prices.amount`, `variants.id`

2. **`transform`** — Splits products into two groups:
   - **Published** → Denormalized into flat `ProductDocument` objects for indexing
   - **Non-published** → Collected as IDs for deletion

3. **`syncProductsToMeilisearchStep`** — Sends published documents to MeiliSearch via `indexData()`

4. **`deleteProductsFromMeilisearchStep`** — Removes unpublished/draft product IDs via `deleteFromIndex()`

### Step: `sync-products-to-meilisearch`

**File:** `admin/src/workflows/steps/sync-products-to-meilisearch.ts`

Resolves the MeiliSearch module from the container and calls `indexData()` with the document array.

### Step: `delete-products-from-meilisearch`

**File:** `admin/src/workflows/steps/delete-products-from-meilisearch.ts`

Resolves the MeiliSearch module from the container and calls `deleteFromIndex()` with the ID array.

---

## 6. Event Subscribers

### Product Created / Updated

**File:** `admin/src/subscribers/meilisearch-product-upsert.ts`

Listens to: `product.created`, `product.updated`

Runs the `syncProductsToMeilisearchWorkflow` with the changed product's ID. This ensures the search index stays in sync with every product edit — title changes, category reassignments, price updates, status changes (publish/unpublish), etc.

### Product Deleted

**File:** `admin/src/subscribers/meilisearch-product-delete.ts`

Listens to: `product.deleted`

Directly calls `meilisearchService.deleteFromIndex([data.id])` to remove the product from the search index.

---

## 7. Admin API & UI

### API Route

**File:** `admin/src/api/admin/meilisearch/sync/route.ts`

**Endpoint:** `POST /admin/meilisearch/sync`

**Authentication:** Requires admin session (standard Medusa admin auth middleware).

**Behavior:**
1. Fetches all product IDs from the product module in batches of 50
2. Runs `syncProductsToMeilisearchWorkflow` for each batch
3. Catches errors per-batch so one failure doesn't abort the entire sync
4. Returns `{ success, productsProcessed, errors? }`

**Performance:** 803 products sync in ~10 seconds (17 batches × ~95ms indexing per batch).

### Admin UI Page

**File:** `admin/src/admin/routes/meilisearch/page.tsx`

Adds a **MeiliSearch** page to the Medusa Admin sidebar (under the magnifying glass icon). Features:

- **"Sync All Products"** button — triggers full re-index via `POST /admin/meilisearch/sync`
- Loading state while sync is in progress
- Success message showing the number of products synced
- Error display if sync fails

---

## 8. Storefront Integration

### Search Data Layer

**File:** `storefront/src/lib/data/search.ts`

Server-side MeiliSearch client that runs in Next.js server components. Provides `searchProducts()`:

```typescript
searchProducts({
  query?: string,       // Text search query
  categoryIds?: string[], // Filter by category IDs (OR logic)
  sortBy?: SortOptions, // "price_asc" | "price_desc" | "created_at"
  page?: number,        // Pagination (1-indexed)
  limit?: number,       // Results per page (default: 12)
}): Promise<SearchResult | null>
```

**Filter logic:**
- Always applies `status = "published"` filter
- Category filter uses OR: `category_ids = "cat_1" OR category_ids = "cat_2"`

**Sort mapping:**

| Storefront Sort | MeiliSearch Sort |
|-----------------|------------------|
| `price_asc` | `price_cents:asc` |
| `price_desc` | `price_cents:desc` |
| `created_at` | `created_at:desc` |

**Returns:** `{ hits, totalHits, page, totalPages, processingTimeMs }`

### PaginatedProducts Component

**File:** `storefront/src/modules/store/templates/paginated-products.tsx`

MeiliSearch is used when any of these conditions are true:
- A search query (`?q=...`) is present
- Category IDs are selected
- Price sort is active

**Hybrid fetch strategy:**
1. Search MeiliSearch → get hit IDs in ranked order
2. Fetch full product data from Medusa Store API using those IDs
3. Re-sort results to match MeiliSearch's ranking order (via Map lookup)
4. Falls back to standard Medusa API path when MeiliSearch is not needed

### Store Page

**File:** `storefront/src/app/[countryCode]/(main)/store/page.tsx`

Accepts `?q=` query parameter and passes it through `StoreTemplate` → `PaginatedProducts`.

---

## 9. Index Schema

### Document Shape

Each product is indexed as a flat document:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Medusa product ID (`prod_...`) — primary key |
| `handle` | `string` | URL-safe product handle |
| `title` | `string` | Product title |
| `description` | `string` | Product description (full text) |
| `status` | `string` | `"published"` or `"draft"` |
| `thumbnail` | `string \| null` | Primary thumbnail URL |
| `category_ids` | `string[]` | All assigned category IDs |
| `category_names` | `string[]` | All assigned category names |
| `tags` | `string[]` | Product tag values |
| `option_values` | `string[]` | Unique option values across all variants |
| `price_cents` | `number` | Minimum variant price in cents |
| `created_at` | `number` | Unix timestamp (seconds) of product creation |
| `variant_count` | `number` | Number of variants |

### Index Settings

| Setting | Values |
|---------|--------|
| **Searchable Attributes** | `title`, `description`, `tags`, `category_names`, `option_values`, `handle` |
| **Filterable Attributes** | `category_ids`, `status`, `price_cents`, `tags` |
| **Sortable Attributes** | `price_cents`, `created_at`, `title` |
| **Displayed Attributes** | All (`*`) |

Searchable attributes are ordered by relevance weight — `title` matches rank higher than `description` matches.

---

## 10. Configuration Script

**File:** `admin/src/scripts/configure-meilisearch.ts`

A Medusa exec script that configures the MeiliSearch index settings programmatically:

```bash
npx medusa exec ./src/scripts/configure-meilisearch.ts
```

This sets searchable, filterable, sortable, and displayed attributes on the `products` index. Run this after a fresh MeiliSearch deploy or after changing index settings.

Alternatively, index settings can be configured via curl:

```bash
curl -X PATCH 'https://meilisearch-production-3595.up.railway.app/indexes/products/settings' \
  -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "searchableAttributes": ["title", "description", "tags", "category_names", "option_values", "handle"],
    "filterableAttributes": ["category_ids", "status", "price_cents", "tags"],
    "sortableAttributes": ["price_cents", "created_at", "title"],
    "displayedAttributes": ["*"]
  }'
```

---

## 11. Environment Variables

### Medusa Backend (Railway)

| Variable | Value | Description |
|----------|-------|-------------|
| `MEILISEARCH_HOST` | `http://meilisearch.railway.internal:7700` | MeiliSearch internal URL (private network) |
| `MEILISEARCH_API_KEY` | Master key | Authentication key (uses master key for restart resilience) |
| `MEILISEARCH_PRODUCT_INDEX_NAME` | `products` | MeiliSearch index name |

### Storefront (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_MEILISEARCH_HOST` | `https://meilisearch-production-3595.up.railway.app` | MeiliSearch public URL |
| `NEXT_PUBLIC_MEILISEARCH_API_KEY` | Search-only key | Restricted key (search operations only) |

**Important:** The storefront must use the **search-only API key**, not the master key. The search key is derived by MeiliSearch from the master key. Since MeiliSearch runs without a persistent volume, the search key regenerates on restart and must be updated on Vercel. See [Troubleshooting](#13-troubleshooting) for the key retrieval procedure.

---

## 12. Operational Procedures

### Full Re-index

**Via Admin Dashboard:**
1. Navigate to `https://admin.elvato.shop/app/meilisearch`
2. Click **"Sync All Products"**
3. Wait for completion message

**Via API:**
```bash
curl -X POST https://admin.elvato.shop/admin/meilisearch/sync \
  -H "Cookie: connect.sid=<session_cookie>" \
  -H "Content-Type: application/json"
```

### After MeiliSearch Restart

Since MeiliSearch uses ephemeral storage, after any restart (deploy, crash, scaling):

1. **Reconfigure index settings** — run the curl command from Section 10 or the exec script
2. **Re-sync all products** — via admin dashboard or API
3. **Update storefront search key** on Vercel (if using derived key instead of master key)

### Check Index Health

```bash
# Health check
curl https://meilisearch-production-3595.up.railway.app/health

# Index stats (document count, field distribution)
curl https://meilisearch-production-3595.up.railway.app/indexes/products/stats \
  -H "Authorization: Bearer $MEILI_MASTER_KEY"

# Test search
curl https://meilisearch-production-3595.up.railway.app/indexes/products/search \
  -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "chandelier", "limit": 3}'
```

### Retrieve API Keys After Restart

```bash
curl https://meilisearch-production-3595.up.railway.app/keys \
  -H "Authorization: Bearer $MEILI_MASTER_KEY"
```

This returns both the Default Admin API Key and Default Search API Key.

---

## 13. Troubleshooting

### MeiliSearch Returns 502

**Cause:** Railway's proxy can't reach MeiliSearch. Usually a port mismatch.

**Fix:** Ensure `PORT=7700` is set as an environment variable on the MeiliSearch Railway service.

### "The provided API key is invalid"

**Cause:** MeiliSearch restarted and regenerated derived keys.

**Fix:** The Medusa backend uses the master key directly (stable across restarts). If the storefront uses a derived search key, retrieve the new key via the `/keys` endpoint and update the Vercel environment variable.

### MeiliSearch OOM / Crash Loop

**Cause:** Indexing consumes more memory than Railway's container limit.

**Fix:** Set `MEILI_MAX_INDEXING_MEMORY=150000000` on the MeiliSearch service to cap indexing RAM at ~150 MB.

### Sync Returns "0 products"

**Cause:** The admin UI response parsing issue. Ensure the admin page uses native `fetch` (not the Medusa SDK's `client.fetch`).

### Sync Timeout

**Cause:** Batch too large or MeiliSearch overwhelmed.

**Fix:** Batch size is configured in `admin/src/api/admin/meilisearch/sync/route.ts` (currently 50). The service's `indexData()` waits for each batch to complete before proceeding.

### "variants.calculated_price" Errors

**Cause:** `calculated_price` requires a pricing context (region/currency) that isn't available in workflow context.

**Fix:** The workflow uses `variants.prices.amount` (raw MoneyAmount records) instead.

---

## 14. Design Decisions

### Why Self-Hosted MeiliSearch (Not Algolia/Cloud)?

- **Cost:** MeiliSearch is open-source and runs on existing Railway infrastructure at no additional SaaS cost
- **Data sovereignty:** Product data stays within the Railway project's network
- **Latency:** Private networking between Medusa and MeiliSearch eliminates external API round-trips for indexing
- **Simplicity:** Single Docker image, minimal configuration, sub-100ms search responses

### Why No Persistent Volume?

Railway volumes caused LMDB database version detection failures with MeiliSearch's embedded storage engine. Since the catalog is 803 products and re-indexing takes ~10 seconds, ephemeral storage is an acceptable trade-off. If the catalog grows significantly (10,000+ products), re-evaluating persistent storage or MeiliSearch Cloud is recommended.

### Why Master Key for Backend Auth?

Derived API keys (admin key, search key) regenerate on every MeiliSearch restart. Using the master key directly for backend-to-MeiliSearch communication eliminates authentication failures after restarts without requiring environment variable updates.

### Why Batch Size of 50?

Testing showed that batch sizes above 100 caused MeiliSearch to consume excessive memory during indexing, triggering OOM kills on Railway's container. 50-product batches index in ~95ms each and keep memory usage well within the 150 MB cap.

### Why Hybrid Search + Hydration?

MeiliSearch returns lightweight search hits (ID, title, handle, price). Full product data (variants, calculated prices, images, inventory) is fetched from the Medusa Store API by ID after search. This keeps the search index small and simple while ensuring the storefront always displays authoritative product data.

---

## File Reference

| File | Purpose |
|------|---------|
| `admin/src/modules/meilisearch/index.ts` | Module definition |
| `admin/src/modules/meilisearch/service.ts` | MeiliSearch client wrapper |
| `admin/src/workflows/sync-products-to-meilisearch.ts` | Sync workflow |
| `admin/src/workflows/steps/sync-products-to-meilisearch.ts` | Index step |
| `admin/src/workflows/steps/delete-products-from-meilisearch.ts` | Delete step |
| `admin/src/subscribers/meilisearch-product-upsert.ts` | Create/update subscriber |
| `admin/src/subscribers/meilisearch-product-delete.ts` | Delete subscriber |
| `admin/src/api/admin/meilisearch/sync/route.ts` | Full sync API route |
| `admin/src/admin/routes/meilisearch/page.tsx` | Admin UI page |
| `admin/src/scripts/configure-meilisearch.ts` | Index settings script |
| `storefront/src/lib/data/search.ts` | Storefront search data layer |
| `admin/medusa-config.ts` | Module registration (lines 86-93) |
