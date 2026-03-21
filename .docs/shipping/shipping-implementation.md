# Shipping Implementation — Elvato

**Strategy:** Shipping costs baked into product prices (free shipping at checkout)  
**Supplier:** CJ Dropshipping (freight API)  
**Fulfillment Provider:** Medusa Manual (`manual_manual`)  
**Regions Covered:** North America (US, CA, MX), Europe (DK, FR, DE, IT, ES, SE, GB)  
**Status:** ✅ Live  
**Last updated:** March 2026

---

## Overview

Elvato uses a **baked-in shipping model** — the cost of shipping each product from the CJ Dropshipping warehouse in China to North America is calculated per-variant, buffered by 15%, and added directly to the variant's USD price in Medusa. At checkout, customers see a single "Free Shipping" option at $0.00. This simplifies the customer experience and avoids sticker shock at checkout.

### Why Baked-In Pricing?

| Approach | Pros | Cons |
|----------|------|------|
| **Calculated at checkout** | Transparent, accurate per-order | Complex API integration, sticker shock, CJ API latency |
| **Flat-rate shipping** | Simple to implement | Loses money on heavy items, overcharges light items |
| **Baked into price** ✅ | "Free Shipping" marketing, no checkout friction | Prices appear higher, need periodic recalculation |

The baked-in model was chosen because:
1. CJ shipping costs vary dramatically by product weight (from $2 to $1,000+)
2. "Free Shipping" is a proven e-commerce conversion driver
3. The 15% buffer absorbs exchange rate and shipping cost fluctuations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRICE CALCULATION PIPELINE                                          │
│                                                                       │
│  CJ Dropshipping API                                                  │
│  ┌──────────────────────────┐                                         │
│  │ /api2.0/v1/product/list  │──── variant vid + weight ────┐          │
│  └──────────────────────────┘                              │          │
│  ┌──────────────────────────────────┐                      ▼          │
│  │ /api2.0/v1/logistic/             │    ┌──────────────────────────┐ │
│  │   freightCalculate               │───▶│ Freight costs per variant│ │
│  │                                  │    │ CA: $X.XX  US: $Y.YY    │ │
│  │  body: { startCountryCode: "CN", │    └───────────┬──────────────┘ │
│  │    endCountryCode: "CA"|"US",    │                │                │
│  │    products: [{ vid, qty: 1 }] } │                │                │
│  └──────────────────────────────────┘                │                │
│                                                      ▼                │
│  ┌───────────────────────────────────────────────────────────┐        │
│  │ FORMULA                                                   │        │
│  │                                                           │        │
│  │ shippingCost = max(CA_cost, US_cost) × 1.15              │        │
│  │ newPrice = originalVariantPrice + shippingCost            │        │
│  │                                                           │        │
│  │ Method priority:                                          │        │
│  │   1. CJPacket Ordinary (standard, 7-15 days)             │        │
│  │   2. Cheapest method under 20 transit days (fallback)     │        │
│  └───────────────────────────────┬───────────────────────────┘        │
│                                  │                                    │
│                                  ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐        │
│  │ Medusa Admin API                                          │        │
│  │ POST /admin/products/{id}                                 │        │
│  │                                                           │        │
│  │ • Update variant USD price (cents)                        │        │
│  │ • Store metadata on each variant:                         │        │
│  │     priceBeforeShipping, shippingCostUsd,                 │        │
│  │     shippingCostCA, shippingCostUS,                       │        │
│  │     shippingMethodCA, shippingMethodUS,                   │        │
│  │     shippingDaysCA, shippingDaysUS,                       │        │
│  │     shippingUpdatedAt                                     │        │
│  │ • Set product metadata: shippingBakedIn = true            │        │
│  └───────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CHECKOUT FLOW                                                        │
│                                                                       │
│  Customer adds product to cart                                        │
│       │                                                               │
│  Cart region = "North America" (USD)                                  │
│       │                                                               │
│  Checkout → Shipping step                                             │
│       │                                                               │
│  Store API: GET /store/shipping-options?cart_id=...                   │
│       │                                                               │
│  Returns: "Free Shipping" ($0.00 flat)                                │
│       │                                                               │
│  Customer selects → proceeds to payment                               │
│       │                                                               │
│  Total = product price (shipping already included) + $0 shipping      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Medusa Fulfillment Configuration

Checkout requires a valid fulfillment chain: **Stock Location → Fulfillment Set → Service Zone → Shipping Option**. Without this, the storefront cannot complete checkout for a region.

### Entity Graph

```
Stock Location: "European Warehouse" (sloc_01KDPCX8QBWT3SV1STQYB0PNKB)
├── Fulfillment Provider: manual_manual
│
├── Fulfillment Set: "European Warehouse delivery" (fuset_01KDPCX8QZTVE7W1D9EW0C7G5D)
│   └── Service Zone: "Europe" (serzo_01KDPCX8QZ7EBT4JQ75QTB6KHA)
│       ├── Geo Zones: dk, fr, de, it, es, se, gb
│       ├── Shipping Option: "Standard Shipping" (so_01KDPCX8RYQ7MYA28BRAKY83R7) — $10 flat
│       └── Shipping Option: "Express Shipping" (so_01KDPCX8RZ6HKT9GEM0JDCM4V1) — $10 flat
│
└── Fulfillment Set: "North America delivery" (fuset_01KK7PPSKK6S9ET2HRJQE7132F)
    └── Service Zone: "North America" (serzo_01KK7Q76Z02Q7BM7BCEXQCTJC1)
        ├── Geo Zones: us, ca, mx
        └── Shipping Option: "Free Shipping" (so_01KK7Q78700MTP8C35SJY7CP5E) — $0 flat
```

### Regions

| Region | ID | Currency | Countries | Shipping Options |
|--------|----|----------|-----------|------------------|
| North America | `reg_01KHKWETVP6ASC7ASMX6BKQX4G` | USD | US, CA, MX | Free Shipping ($0) |
| Europe | `reg_01KDPCX8PDEJ0NBMCHP2BD0FWS` | EUR | DK, FR, DE, IT, ES, SE, GB | Standard ($10), Express ($10) |

### Shipping Profiles

All 803 products use the single default shipping profile:

| Profile | ID | Type |
|---------|----|------|
| Default Shipping Profile | `sp_01KDPCN9M6FWK309G054X4RKQ6` | default |

---

## Price Calculation Details

### How Shipping Costs Are Determined

For each Medusa variant, the pipeline:

1. **Maps to CJ variant** — Medusa product `metadata.cjSku` → CJ product SKU → CJ variant API returns `vid`(s)
2. **Fetches freight rates** — Calls CJ Freight API for each `vid` to both CA and US destinations
3. **Selects shipping method** — Prefers "CJPacket Ordinary" (standard, 7-15 days); falls back to cheapest method under 20 transit days
4. **Computes buffered cost** — `max(CA_cost, US_cost) × 1.15` — uses the higher of the two destinations and adds a 15% margin
5. **Updates Medusa** — Adds shipping cost (in cents) to the variant's existing USD price

### Formula

```
shippingCostRaw  = max(freightCA, freightUS)
shippingBuffered = shippingCostRaw × 1.15
shippingCents    = round(shippingBuffered × 100)
newPriceCents    = originalPriceCents + shippingCents
```

### Example

| Field | Value |
|-------|-------|
| Original variant price | $40.56 (4056 cents) |
| CJ freight to CA | $42.42 |
| CJ freight to US | $49.71 |
| max(CA, US) | $49.71 |
| × 1.15 buffer | $57.17 |
| Shipping in cents | 5717 |
| **New price** | **$97.73 (9773 cents)** |

### Variant Metadata

After baking, each variant stores the original price and shipping breakdown in its metadata:

```json
{
  "priceBeforeShipping": 4056,
  "shippingCostUsd": 5717,
  "shippingCostCA": 4242,
  "shippingCostUS": 4971,
  "shippingMethodCA": "CJPacket Ordinary",
  "shippingMethodUS": "CJPacket Ordinary",
  "shippingDaysCA": "7-12",
  "shippingDaysUS": "7-15",
  "shippingUpdatedAt": "2026-03-08T..."
}
```

This metadata enables:
- **Double-bake prevention** — re-runs detect `priceBeforeShipping` and skip already-processed variants
- **Price auditing** — the exact pre-shipping price can always be recovered
- **Future recalculation** — shipping costs can be updated by reverting to `priceBeforeShipping` and re-running

### Product Metadata

Each product also gets a top-level flag:

```json
{
  "shippingBakedIn": true
}
```

---

## Catalog Statistics

| Metric | Value |
|--------|-------|
| Total products | 803 |
| Total Medusa variants | 3,911 |
| Variants with USD price (shipping baked) | 3,695 |
| Variants without USD price | 216 (pre-existing, never had pricing) |
| Products with `shippingBakedIn` flag | 803 (100%) |
| Median shipping cost (CA) | $31.73 |
| Median shipping cost (US) | $36.27 |
| Products with shipping under $50 | ~74% |
| CJ freight API calls made | 3,220 |
| Freight scan duration | ~50 minutes (full catalog) |

---

## Storefront UI

### Free Shipping Badge (Product Detail Page)

A green pill badge with a truck icon is displayed next to the collection badge on the product info section:

**File:** `storefront/src/modules/products/templates/product-info/index.tsx`

```tsx
<span className="inline-flex items-center gap-x-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
  <svg ...>  {/* Truck icon */}
  Free Shipping
</span>
```

The badge appears on **all products** since shipping is baked into every product's price.

### Checkout Shipping Step

The storefront shipping component (`storefront/src/modules/checkout/components/shipping/index.tsx`) renders available shipping options from the Store API. For North American carts, it will display:

- **Free Shipping** — $0.00

No code changes were needed in the checkout — the storefront already handles `flat` price type shipping options.

---

## Scripts

### `scripts/pricing/fetch-cj-freight.mjs`

Batch-fetches CJ shipping costs for all Medusa products.

```bash
# Full catalog scan (saves ~6,500 variant freight entries)
node scripts/pricing/fetch-cj-freight.mjs --all --out reports/pricing/freight-all.json

# Test with 5 products
node scripts/pricing/fetch-cj-freight.mjs --limit 5

# Specific product
node scripts/pricing/fetch-cj-freight.mjs --product-id prod_01KF76EYPNPZS396SN4A1NVJDB
```

| Option | Default | Description |
|--------|---------|-------------|
| `--all` | — | Scan all products (required for full run) |
| `--limit N` | 5 | Limit to N products |
| `--product-id ID` | — | Scan single product |
| `--out path` | — | Save JSON report |

**Output:** `reports/pricing/freight-all.json` — complete freight data for all variants, both CA and US destinations.

### `scripts/pricing/apply-shipping-to-prices.mjs`

Reads the freight report and bakes shipping costs into Medusa variant prices.

```bash
# Dry-run (no changes)
node scripts/pricing/apply-shipping-to-prices.mjs --dry-run --out reports/pricing/shipping-bake-dry.json

# Live run
node scripts/pricing/apply-shipping-to-prices.mjs --out reports/pricing/shipping-bake-live.json

# Custom buffer (default 15%)
node scripts/pricing/apply-shipping-to-prices.mjs --buffer 20 --dry-run

# Skip specific products
node scripts/pricing/apply-shipping-to-prices.mjs --skip-products prod_01KJJN86EF8897VWYWZJM341XD
```

| Option | Default | Description |
|--------|---------|-------------|
| `--dry-run` | false | Preview changes only |
| `--limit N` | ∞ | Limit to N products |
| `--buffer N` | 15 | Buffer percentage on shipping cost |
| `--freight-report path` | `reports/pricing/freight-all.json` | Path to freight data |
| `--out path` | — | Save JSON report |
| `--skip-products id1,id2` | — | Skip specific product IDs |

**Safety features:**
- Checks variant-level `priceBeforeShipping` metadata to prevent double-baking
- Batches variant updates (up to 40 per POST) with sub-chunk (10) and individual fallbacks
- 3 retries with 30s timeout per request
- Product-level `shippingBakedIn` flag only set when all variants succeed

### `scripts/pricing/fix-shipping-baked-flags.mjs`

Sets the `shippingBakedIn` product metadata flag on any products missing it.

```bash
# Dry-run
node scripts/pricing/fix-shipping-baked-flags.mjs --dry-run

# Live
node scripts/pricing/fix-shipping-baked-flags.mjs
```

### `scripts/admin/setup-na-fulfillment.mjs`

Creates the North America fulfillment set, service zone, and Free Shipping option in Medusa.

```bash
# Dry-run
node scripts/admin/setup-na-fulfillment.mjs --dry-run

# Live (idempotent — safe to re-run)
node scripts/admin/setup-na-fulfillment.mjs
```

Creates:
1. Fulfillment set "North America delivery" on the existing stock location
2. Service zone "North America" with geo zones: US, CA, MX
3. Shipping option "Free Shipping" — flat $0 USD

---

## Reports

| Report | Path | Description |
|--------|------|-------------|
| Full freight data | `reports/pricing/freight-all.json` | CJ shipping costs for all 803 products, ~6,550 variant entries, CA + US |
| Freight test (5 products) | `reports/pricing/freight-test-5.json` | Sample freight scan |
| Shipping bake dry-run (5) | `reports/pricing/shipping-bake-dry-5.json` | Dry-run on 5 products |
| Shipping bake dry-run (all) | `reports/pricing/shipping-bake-dry-all.json` | Full catalog dry-run projections |
| Shipping bake live run | `reports/pricing/shipping-bake-live.json` | Live run results (3,695 variants updated) |

---

## CJ Freight API Reference

### Authentication

```
POST https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken
Body: { email: "...", password: "..." }
Response: { data: { accessToken: "...", ... } }
```

Token is cached locally in `scripts/pricing/.cj-token-cache.json` with 23-hour TTL.

### Freight Calculation

```
POST https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate
Headers: { CJ-Access-Token: "..." }
Body: {
  startCountryCode: "CN",
  endCountryCode: "CA",     // or "US"
  products: [{ vid: "...", quantity: 1 }]
}
```

Returns an array of available shipping methods with costs and transit times.

### SKU Mapping Chain

```
Medusa variant (ELV* SKU)
    → parent product metadata.cjSku
        → CJ product variant API (/api2.0/v1/product/query)
            → vid (CJ variant ID)
                → CJ freight API (uses vid for weight-based calculation)
```

---

## Environment Variables

Scripts auto-load from `admin/.env` and `.agents/product-listing-analyst/.env`:

| Variable | Used By | Description |
|----------|---------|-------------|
| `MEDUSA_ADMIN_EMAIL` | All scripts | Medusa admin login |
| `MEDUSA_ADMIN_PASSWORD` | All scripts | Medusa admin password |
| `CJ_API_KEY` | `fetch-cj-freight.mjs` | CJ Dropshipping API key |

---

## Maintenance & Recalculation

### When to Re-Run

- **CJ changes shipping rates** — run `fetch-cj-freight.mjs` then `apply-shipping-to-prices.mjs`
- **New products synced from CJ** — run both scripts on new products
- **Buffer percentage changes** — use `--buffer` flag with `apply-shipping-to-prices.mjs`

### How to Recalculate Prices

The `priceBeforeShipping` metadata on each variant stores the original price before shipping was added. To recalculate:

1. **Revert prices to originals** — write a script that reads `priceBeforeShipping` from variant metadata and resets USD prices
2. **Fetch new freight data** — `node scripts/pricing/fetch-cj-freight.mjs --all --out reports/pricing/freight-refreshed.json`
3. **Re-bake with new data** — `node scripts/pricing/apply-shipping-to-prices.mjs --freight-report reports/pricing/freight-refreshed.json`

### Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| CJ variant count exceeds Medusa variants | 6,551 CJ options vs 3,911 Medusa variants — 2,640 CJ options were never synced | No impact — only synced variants need pricing |
| 216 variants without USD price | Pre-existing from CJ sync — these products display no price | Not data loss; these variants were never priced |
| MX shipping costs not included | Buffer on max(CA, US) covers MX | MX typically similar to US; monitor if MX sales grow |
| No EUR shipping bake-in | European fulfillment uses flat $10 shipping | Separate approach for Europe |
| Products with >40 variants | Medusa API struggles with large batch POSTs | Script chunks to 40 variants per POST with sub-chunk fallback |

---

## Troubleshooting

### Checkout shows no shipping options for NA customer

Verify the fulfillment chain exists:

```bash
node scripts/admin/setup-na-fulfillment.mjs
```

This is idempotent — it will report the current state or create any missing resources.

### A product price seems wrong

Check the variant metadata for the shipping breakdown:

```bash
curl -s "https://medusa-backend-production-d681.up.railway.app/admin/products/{PRODUCT_ID}?fields=*variants.metadata" \
  -H "Authorization: Bearer $JWT" | jq '.product.variants[] | {sku, metadata}'
```

Key fields: `priceBeforeShipping` (original price in cents), `shippingCostUsd` (shipping added in cents).

### Double-baked prices (shipping added twice)

The script prevents this by checking for `priceBeforeShipping` in variant metadata. If a variant already has this field, it is skipped. A full dry-run will confirm:

```bash
node scripts/pricing/apply-shipping-to-prices.mjs --dry-run
# Expected output: "Variants updated: 0, Already baked in: 3695"
```
