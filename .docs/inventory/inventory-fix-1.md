# Inventory & Category Assignment Issue

## Summary

Category assignment for 803 products was run on **2026-03-07**. **797/803 succeeded**, but **6 products failed** due to Medusa API 502 timeouts and request aborts on the Railway-hosted backend.

## Context

- All 803 products had `metadata.classification.mainType` and `metadata.classification.subcategories` set from the Convex→Medusa sync pipeline, but **no categories were assigned** to any product.
- A deduplication pass was run first, removing 102 duplicate subcategories (473 → 371 categories).
- The assignment script (`scripts/assign-product-categories.mjs`) maps each product to its top-level category via `type_id` or `metadata.classification.mainType`, and also assigns matching subcategories.

## Failed Products (6)

| Product ID | Title | Error |
|---|---|---|
| `prod_01KJJM0GA8QCDAXXS0VFWBPE13` | Modern Linear Pendant Light with Adjustable Height | Fetch timeout after 3 retries |
| `prod_01KJJN86EF8897VWYWZJM341XD` | Art Deco Window Panel Chandelier - Retro American | Medusa API 502 |
| `prod_01KJJNGRV6VRVP134WEY43KFZP` | Modern LED Bathroom Mirror Light with Eye Protection | Fetch timeout after 3 retries |
| `prod_01KJJNQXP1D82KGHVXEEJ2TSSM` | Modern Rectangular LED Ceiling Light for Dining Room | Fetch timeout after 3 retries |
| `prod_01KJK3NCBWYJWA7VVN2JXSDDQ0` | Modern Minimalist Chinese Wall Sconce | Fetch timeout after 3 retries |
| `prod_01KJK3XND1BVYSRCHSQNX8KGPP` | Round Feather Chandelier - Bohemian Statement Light | Medusa API 502 |

## Root Cause

The Railway-hosted Medusa backend intermittently returns **502 (Application failed to respond)** under sustained load. The assignment script sends sequential POST requests with 200ms spacing, but the API sometimes takes 30+ seconds per request, causing the AbortController timeout to fire.

## Resolution

Re-run the assignment script — it skips already-assigned products:

```bash
node scripts/assign-product-categories.mjs \
  --medusa-url https://medusa-backend-production-d681.up.railway.app \
  --out reports/assign-cats-retry.json
```

Or assign individually via the Medusa Admin API:

```bash
# Example for one product:
curl -X POST https://medusa-backend-production-d681.up.railway.app/admin/products/prod_01KJJM0GA8QCDAXXS0VFWBPE13 \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"categories": [{"id": "pcat_01KF73711R8NF7FV7BKB96PWA6"}]}'
```

## Reports

- `reports/assign-cats-live.json` — Full run results (797 assigned, 6 errors)
- `reports/assign-cats-dry-v2.json` — Dry run showing all 803 resolvable
- `reports/dedup-live-run.json` — 102 duplicate categories deleted
