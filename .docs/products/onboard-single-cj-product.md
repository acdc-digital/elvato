# Onboarding a Single CJ Product End-to-End

> **Worked example:** CJ SKU `CJJT138697601AZ` → Medusa product
> `prod_01KPJZEAWM0J683NQFKNWWVWR6`
> ("Modern Minimalist Creative Bedroom Bedside Wall Lamp"), published live and
> pinned as the "From the same family" companion of the **Modern Gold Wall
> Sconce** (`prod_01KJK5WG6WWRHXSQX9VF2M0KMD`).

This document captures the complete runbook for taking a single CJ Dropshipping
SKU all the way from a raw CJ identifier to a published, fully-categorized
Medusa product visible on the storefront, including every bug we hit during
the worked example and the orchestrator improvements that resulted.

---

## 1. Goal

Given a CJ SKU (any variant SKU is acceptable), produce:

- A `cjMyProducts` row in Convex with the canonical CJ payload.
- A `medusaProducts` staging row in Convex.
- A draft Medusa product with cost-based price, normalized ELV SKU,
  expanded variants and option titles, type + categories assigned.
- The product `published` on the storefront.
- (Optional) a manual `family_sibling_handle` pin so it appears under
  "From the same family" on a related product page.

---

## 2. Pre-flight

### 2.1 Required environment

The orchestrator and helper scripts auto-load env from (in order):

1. `admin/.env`
2. `admin/.env.local`
3. `.env`
4. `.env.local`
5. `storefront/.env.local`
6. `.agents/product-listing-analyst/.env`

Required keys:

| Var | Purpose |
| --- | --- |
| `CJ_API_KEY` | CJ Open API authentication |
| `MEDUSA_BACKEND_URL` | e.g. `https://medusa-backend-production-d681.up.railway.app` |
| `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD` | Medusa admin auth (JWT) |
| `CONVEX_URL` | `https://superb-dotterel-37.convex.cloud` |

### 2.2 Known Medusa IDs

| Resource | ID |
| --- | --- |
| Stock location | `sloc_01KDPCX8QBWT3SV1STQYB0PNKB` |
| Sales channel | `sc_01KDPCP4E0TF4SFRM4KE4W8A8Z` |
| Shipping profile | `sp_01KDPCN9M6FWK309G054X4RKQ6` |
| Product type **Wall** | `ptyp_01KF7331FBRP67VBZN868BDSRJ` |
| Category **Wall** | `pcat_01KF7375B8QDW6HP07AHYCKZQ8` |
| Category **Wall → Bedroom** | `pcat_01KF7375TQDAMQB86Z311Y73Z1` |

### 2.3 CJ Open API rules learned

- Auth: `POST /api2.0/v1/authentication/getAccessToken {apiKey}` →
  `data.accessToken` (cached in `scripts/.cj-token-cache.json` for 23h).
- All authed calls send header `CJ-Access-Token`.
- **Only the parent SKU resolves** on `/product/query?productSku=…`. Variant
  SKUs return code `1602001` ("Product not found"). Trim 1–8 trailing chars
  to find it (e.g. `CJJT138697601AZ` → `CJJT1386976`).
- QPS limit is 4/sec. Code `1600200` means slow down. Sleep ~400ms × attempt
  and retry up to 5x.
- Codes `1600001` / `1600002` mean the cached token expired — clear the cache
  and re-auth.
- `productImage` is sometimes a **JSON-stringified array of URLs**, not a
  plain string. Always parse defensively.

---

## 3. The Orchestrator

`scripts/catalog/onboard-cj-product.mjs` is the single entrypoint that wraps
steps 4–6 below. Use it for every new fixture.

```bash
# Dry run (recommended first)
node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ --dry-run

# Live ingest
node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ
```

### Flags

| Flag | Default | Purpose |
| --- | --- | --- |
| `--cj-sku <sku>` | required | Variant SKU you have in hand. Parent will be auto-resolved. |
| `--markup <int>` | `100` | Markup percent applied during Medusa price staging. |
| `--title <str>` | (CJ name) | Override Medusa product title. |
| `--description <str>` | (CJ desc) | Override Medusa description. |
| `--skip-prices` | off | Skip the variant-price fetch step. |
| `--skip-normalize` | off | Skip the ELV SKU normalization step. |
| `--dry-run` | off | Resolve + log only; no Convex / Medusa writes. |

### What the orchestrator does (in order)

1. **CJ auth**: get/cache an access token.
2. **CJ resolve**: query `/product/query` with the SKU; on `1602001` trim a
   trailing character and retry (with 300 ms sleep + QPS backoff). Returns
   `{ detail, resolvedParentSku, originalSku }`.
3. **Convex `cj.myProducts.upsert`**: write the canonical CJ payload (with
   `pickFirstImage()` applied to `productImage`).
4. **Convex `medusa.staging.stageCjProduct`**: create the Medusa draft via
   the staging mutation. Idempotent: returns the existing
   `medusaProductId` if already staged.
5. **`scripts/sync/sync-convex-to-medusa.mjs --external-id <id>`**: push the
   staged product into Medusa.
6. **`scripts/catalog/fetch-cj-variant-prices.mjs`**: backfill cost prices
   from CJ for every variant.
7. (Manual, post-orchestrator) variant expansion, SKU normalization, type +
   category assignment, publish — see §5.

### Lessons baked into the orchestrator

- **Parent-SKU trim loop** (max 8 chars, 300 ms cadence) — discovered when
  the variant SKU returned `1602001`.
- **Token-expired retry** (`1600001`/`1600002`) — clear cache + retry once.
- **QPS backoff** (`1600200`) — exponential-ish (400 ms × attempt), 5
  retries.
- **Use `parentSku` (not the input variant) for downstream calls.**
- `fetch-cj-variant-prices` does **not** accept `--apply` — don't pass it.
- **`pickFirstImage()`** — unwraps CJ's JSON-stringified array shape so the
  thumbnail/images don't get serialized into a single broken URL.

---

## 4. Worked example — what happened on the live run

### 4.1 Input

```
--cj-sku CJJT138697601AZ
```

### 4.2 CJ resolution

- `CJJT138697601AZ` → `1602001`
- `CJJT138697601A` → `1602001`
- … trim more …
- `CJJT1386976` → success (pid `1474187962077024256`).

### 4.3 Convex / Medusa staging

| Layer | ID |
| --- | --- |
| `cjMyProducts` | `jh73k01cjs4fhh3397vsqnt48d8557w0` |
| `medusaProducts` (staging) | `k57465rb8d94qn1k0np6k3sv3x85561p` |
| Medusa product | `prod_01KPJZEAWM0J683NQFKNWWVWR6` |
| Handle | `modern-minimalist-creative-bedroom-bedside-wall-lamp-77024256` |

### 4.4 Mid-pipeline fix

The sync script failed with
`ERR_MODULE_NOT_FOUND: '../convex/_generated/api.js'`. It lives in
`scripts/sync/`, so the relative path needed an extra `..`:

```diff
- import { api } from "../convex/_generated/api.js";
+ import { api } from "../../convex/_generated/api.js";
```

Re-ran sync → success.

### 4.5 Variant + SKU finishing (manual)

```bash
# 1) Generate plan for variant expansion
node scripts/catalog/expand-cj-variants.mjs CJJT1386976

# 2) Edit reports/sync/expand-CJJT1386976-plan.json:
#    "Option 1" → "Color" (so the option is human-readable)

# 3) Apply
node scripts/catalog/expand-cj-variants.mjs CJJT1386976 --apply

# 4) Normalize SKU CJJT138697601AZ → ELV138697601
node scripts/catalog/normalize-elv-skus.mjs CJJT1386976 --apply
```

Result: 1 variant `Color: Gold`, SKU `ELV138697601`,
`metadata.cj_sku = CJJT138697601AZ` preserved on the variant.

### 4.6 Type + categories

`assign-product-categories.mjs` skipped the new product because **staging
does not propagate `product_type` from CJ → Medusa**, so the type-driven
mapping had nothing to match.

Workaround: a small one-shot patch via the admin API:

```js
POST /admin/products/prod_01KPJZEAWM0J683NQFKNWWVWR6
{
  "type_id": "ptyp_01KF7331FBRP67VBZN868BDSRJ",   // Wall
  "categories": [
    { "id": "pcat_01KF7375B8QDW6HP07AHYCKZQ8" },  // Wall
    { "id": "pcat_01KF7375TQDAMQB86Z311Y73Z1" }   // Bedroom
  ]
}
```

Verification (via `?fields=type.*,categories.id,categories.name`) showed
`type: Wall`, `categories: [Wall, Bedroom]`.

### 4.7 Publish

A direct admin call beats running the bulk
`publish-medusa-drafts.mjs` for a single product:

```js
POST /admin/products/prod_01KPJZEAWM0J683NQFKNWWVWR6
{ "status": "published" }
```

→ Live at
`/products/modern-minimalist-creative-bedroom-bedside-wall-lamp-77024256`.

---

## 5. Bug found during QA — image data corruption

### 5.1 Symptom

The "From the same family" card on the gold sconce showed a broken image,
with the title text rendered over a blank panel.

### 5.2 Diagnosis

`GET /admin/products/prod_01KPJZEAWM0J683NQFKNWWVWR6` returned:

```json
{
  "thumbnail": "[\"https://cf.cjdropshipping.com/...a.jpg\", ...]",
  "images": [
    { "url": "[\"https://cf.cjdropshipping.com/...a.jpg\", ...]" }
  ]
}
```

The **entire JSON array** had been stored as a single string in both
`thumbnail` and `images[0].url`.

### 5.3 Root cause

CJ's `/product/query` returns `productImage` as a JSON-stringified array.
The orchestrator's payload mapper passed it through verbatim:

```js
// before
const bigImage =
  cj.productImage ||
  cj.bigImage ||
  (Array.isArray(cj.productImageSet) ? cj.productImageSet[0] : "") ||
  "";
```

That string flowed into Convex (`bigImage`) → staging
(`thumbnail: cjProduct.bigImage`) → Medusa.

### 5.4 Fix (committed)

Added `pickFirstImage()` in
[scripts/catalog/onboard-cj-product.mjs](../../scripts/catalog/onboard-cj-product.mjs)
which:

1. Returns `value[0]` if it's already an array.
2. If the string starts with `[`, `JSON.parse` it and take element `0`.
3. Otherwise treat as a plain URL.

Applied to `productImage`, `bigImage`, and the `productImageSet[0]` fallback.

Repaired existing data on the live product directly via the admin API:
set `thumbnail` to the first URL and rewrote `images` to 5 separate entries.

---

## 6. Pinning a "From the same family" sibling

The default `pickFamilySibling` heuristic (collection → type → tag) chose
the wrong companion for the gold sconce. We added a metadata override so any
product can pin its own sibling.

### 6.1 Storefront change

[storefront/src/lib/util/pick-family-sibling.ts](../../storefront/src/lib/util/pick-family-sibling.ts)
now checks `product.metadata.family_sibling_handle` first. If set and a
product with that handle is fetchable in the current region, it's used.
Otherwise the original heuristic runs.

### 6.2 Setting the override

```js
POST /admin/products/<source-product-id>
{
  "metadata": {
    ...existingMetadata,
    "family_sibling_handle": "<sibling-handle>"
  }
}
```

For the worked example we set `family_sibling_handle` =
`modern-minimalist-creative-bedroom-bedside-wall-lamp-77024256` on
`prod_01KJK5WG6WWRHXSQX9VF2M0KMD`.

---

## 7. Final state of the worked product

| Field | Value |
| --- | --- |
| Medusa ID | `prod_01KPJZEAWM0J683NQFKNWWVWR6` |
| Handle | `modern-minimalist-creative-bedroom-bedside-wall-lamp-77024256` |
| Status | **published** |
| Type | Wall |
| Categories | Wall, Bedroom |
| Variants | 1 — `Color: Gold` |
| SKU | `ELV138697601` (CJ original at `metadata.cj_sku`) |
| Cost | $13.25 |
| Price | $26.50 (markup 100%) |
| Thumbnail | `cf.cjdropshipping.com/20c8ddf9…jpg` |
| Gallery | 5 images |
| Sibling-of | `prod_01KJK5WG6WWRHXSQX9VF2M0KMD` (Modern Gold Wall Sconce) |

---

## 8. Repeatable runbook (cheat sheet)

```bash
# 0. Prereqs: env vars set, repo clean

# 1. Onboard
node scripts/catalog/onboard-cj-product.mjs --cj-sku <variant-sku> --dry-run
node scripts/catalog/onboard-cj-product.mjs --cj-sku <variant-sku>
# → prints PARENT_SKU and prod_xxx

# 2. Variants
node scripts/catalog/expand-cj-variants.mjs <PARENT_SKU>
# edit reports/sync/expand-<PARENT_SKU>-plan.json: rename "Option 1" etc.
node scripts/catalog/expand-cj-variants.mjs <PARENT_SKU> --apply

# 3. Normalize SKUs
node scripts/catalog/normalize-elv-skus.mjs <PARENT_SKU> --apply

# 4. Type + categories
#    Either re-run the bulk assign script after type_id is set,
#    or do a targeted POST /admin/products/<id> with type_id + categories.

# 5. (Optional) shipping surcharge backfill, FLUX thumbnail enhance,
#    metadata.packageSize + comparisonTable for the storefront.

# 6. Publish (single product is faster than the bulk script)
#    POST /admin/products/<id> { "status": "published" }

# 7. (Optional) Pin as sibling on a related product
#    POST /admin/products/<other-id> { "metadata": { ..., "family_sibling_handle": "<handle>" } }

# 8. (Optional) Trigger Convex CDN ingest for the new images.
```

---

## 9. Future improvements

1. **Auto-set `product_type` post-sync** in the orchestrator using CJ
   `categoryName` / `productName` heuristics — eliminates the manual
   category step for Wall / Ceiling / etc.
2. **Auto-pick a starting `family_sibling_handle`** for new products in the
   same collection (or surface a CLI flag for it).
3. **Shipping surcharge step** (`backfill-shipping-<sku>.mjs`) should accept
   `--cj-sku` and become part of the orchestrator.
4. **Trigger Convex CDN ingest** at the end of the orchestrator so
   storefront thumbnails come from the CDN immediately.
5. **`pickFirstImage()` upstream** — apply the same defensive parse inside
   the `cj.myProducts.upsert` mutation so even non-orchestrator paths can't
   corrupt image fields.
