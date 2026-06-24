# Product Listing Refinement Playbook

> **Companion to** [`onboard-single-cj-product.md`](./onboard-single-cj-product.md).
> That doc covers getting a CJ SKU **onto** the storefront (draft → published).
> **This** doc covers the next stage: taking an already-published listing and
> **polishing** it into a unified, fully-specified product page — matching the
> six reference listings we've already completed.
>
> **Status:** Active runbook. Last updated 2026-06-02.
> **Goal of this document:** Define exactly what must be **checked, verified, and
> updated** on every listing so the catalogue is uniform, and document the
> interactive "walk-through" script that does it one product at a time.

---

## 1. Where we are (verified against live Medusa)

A live audit of the production Medusa catalogue on 2026-05-31 returned:

| Metric | Value |
| --- | --- |
| Total products | **740** |
| Published | **739** |
| Products with `metadata.comparisonTable` (spec table) | **6** |
| Products with `metadata.packageSize` | **5** |

The **6** products carrying a comparison table are exactly the reference set the
team has hand-polished:

1. Modern Gold Wall Sconce – Luxury Minimalist Design (`prod_01KJK5WG6WWRHXSQX9VF2M0KMD`)
2. Colorful Modern Bedroom Wall Light
3. Modern Wall Sconce – Minimalist Glass Suspended Luminaire
4. Galaxy Glass Blown Creative Art Sculptural Pendant
5. Modern Aluminum Geometric Pendant (`prod_01KJK5GH9Y8E9TWGNTCZCJ75DE`)
6. Iron Saucer Chandelier Postmodern Art Design (`prod_01KJK5G41XRXQGJWH9Z0W9ECXY`)

**Conclusion:** roughly **733 published products still need the polish pass.**
Onboarding (SKUs, prices, categories, descriptions, baked-in shipping) is largely
**done**; what's missing is the *presentation/verification* layer that makes the
reference six look finished.

### 1.1 What the un-polished products already have (good news)

Sampled across the catalogue, un-polished listings already carry:

- ✅ Normalized **`ELV…` SKUs** on every variant (100% on every product sampled).
- ✅ **Human-named options** (`Finish`, `Size`, `Voltage`, `Number of Lights`, …) —
  not `Default` / `Option 1`.
- ✅ At least one **category** assigned (e.g. `Pendants, Contemporary`).
- ✅ A **clean AI-generated description** (no raw `<img>` tags, ~800–1,200 chars).
- ✅ **Baked-in shipping** (`metadata.shippingBakedIn = true`, 15% buffer) and
  thumbnail + gallery images on the CDN.

### 1.2 What they are missing (the actual gap)

| Gap | Field / location | Coverage today |
| --- | --- | --- |
| **Spec / comparison table** | `product.metadata.comparisonTable` | 6 / 740 |
| **Package size** | `product.metadata.packageSize` (string) | 5 / 740 |
| **Per-variant image swap** | `variant.metadata.image` *or* `variant.metadata.color_image` | ~0 (none on samples) |
| **Verified options vs. CJ truth** | options/variants confirmed against CJ `/product/query` | unknown per-product |
| **Polished, structured description** | 2-paragraph human voice (many are 1-para "Transform your…" boilerplate) | partial |
| **Family sibling pin** (optional) | `product.metadata.family_sibling_handle` | 1 (gold sconce) |
| **`product_type`** (note) | `product.type_id` | null even on references — categories are the operative taxonomy; **not required** |

> ⚠️ Note: even the reference six have `expeditedSurcharge`/`type` unset. So the
> **definition of done is the comparison table + package size + per-variant
> images + verified options/SKUs/pricing**, not those two fields.

---

## 2. Anatomy of a "polished" listing (definition of done)

This is the contract every product must satisfy. Each row notes the field, where
it lives, and how the storefront consumes it.

### 2.1 Product-level fields (Medusa `product`)

| # | Field | Requirement | Storefront consumer |
| --- | --- | --- | --- |
| 1 | `title` | Brand-style name, ~30–60 chars, includes the fixture type (sconce/pendant/chandelier…). No raw CJ marketing dump. | `ProductInfo` heading + SEO metadata |
| 2 | `description` | 2 short paragraphs, human voice, no `<img>`/HTML. Paragraph 1 = what it is + hero benefit; paragraph 2 = options + practical fit (rooms, install, bulbs). Newline-separated (`\n\n`). | `ProductInfo` (renders `whitespace-pre-line`) |
| 3 | `metadata.packageSize` | String, e.g. `"410 × 410 × 300 mm"` or multi-variant `"A: 590×240×180(mm); B: …"`. | `ProductInfo` → "Package Size" highlight bullet |
| 4 | `metadata.comparisonTable` | Structured spec table (schema in §2.3). **The signature element.** | `ProductInfo` → `<table data-testid="product-comparison-table">` |
| 5 | `thumbnail` + `images[]` | ≥3 valid `cf.cjdropshipping.com` URLs; thumbnail is a **single URL string**, never a JSON-stringified array (see onboarding doc §5). | `ImageGallery` |
| 6 | `categories[]` | ≥1 category (Wall/Ceiling/Pendant/Chandelier + style/room). | Category badge + related products |
| 7 | `metadata.family_sibling_handle` | *Optional.* Handle of the "From the same family" companion. | `pick-family-sibling.ts` |
| 8 | `status` | `published`. | route 404s otherwise |

### 2.2 Variant-level fields (Medusa `product.variants[]`)

| # | Field | Requirement | Storefront consumer |
| --- | --- | --- | --- |
| 9 | `sku` | `ELV…` normalized SKU. Original CJ SKU preserved at `variant.metadata.cj_sku`. | `ProductActions` SKU display |
| 10 | `options` | Each variant maps to a value for **every** product option (`Color`, `Light Color`, `Size`, …). Options are human-named. | `OptionSelect` button grid |
| 11 | `prices` | ≥1 price (USD/CAD), shipping baked in. Cost preserved at `metadata.costPriceInCents`. | `ProductPrice` |
| 12 | `metadata.image` / `metadata.color_image` | Per-variant hero image URL so the gallery swaps when an option is selected. **The other big gap.** | `ImageGallery` (`meta.image \|\| meta.color_image`) |
| 13 | Inventory | `manage_inventory=false` **or** a valid `inventory_level` (the analyst agent's `fix_inventory`). | stock badge / Add-to-Cart |
| 14 | Shared shipping metadata | Every variant carries the expedited shipping tiers (`expeditedTier1Surcharge`/`DisplayName`/`Days`/`Method`, Tier2…) — **all** variants, not just the first. Expansion inherits these from the base variant. | `shipping-selector/index.tsx` (per-variant) |

### 2.3 `comparisonTable` schema (exact)

Consumed by [`storefront/src/modules/products/templates/product-info/index.tsx`](../../storefront/src/modules/products/templates/product-info/index.tsx):

```jsonc
metadata.comparisonTable = {
  // Column headers. For a single-axis spec sheet use one header ("Specification").
  // For true option comparison use the option values (e.g. ["4 Heads","6 Heads"]).
  "headers": ["Specification"],

  // Per-row spec values, one entry per header column.
  "rows": [
    { "label": "Material",          "values": ["Aluminum Alloy & Iron"] },
    { "label": "Style",             "values": ["Postmodern / Nordic Minimalist"] },
    { "label": "Light Source",      "values": ["Integrated LED (no replacement bulbs)"] },
    { "label": "Color Options",     "values": ["Black, White"] },
    { "label": "Color Temperature", "values": ["Warm White or Cool White (per variant)"] },
    { "label": "Diameter",          "values": ["400 mm"] },
    { "label": "Height",            "values": ["300 mm"] },
    { "label": "Voltage",           "values": ["220V"] },
    { "label": "Mounting",          "values": ["Ceiling, hardwired"] },
    { "label": "Installation",      "values": ["Easy DIY with included hardware"] },
    { "label": "Best For",          "values": ["Living room, bedroom, dining, hallway, study"] }
  ],

  // Optional rows that span all columns (full-width).
  "shared": []
}
```

Renderer rules to respect:
- `headers.length === 0 || rows.length === 0` → table is **not rendered**.
- Missing `row.values[ci]` renders as `—`.
- `shared[]` rows render full-width below the matrix.

**Recommended canonical row set for lighting** (use what CJ provides; omit unknowns
rather than guessing): Material · Style · Light Source / Bulb · Color Options ·
Color Temperature · Dimensions (Diameter/Height or L×W×H) · Voltage · Wattage ·
Mounting · Installation · Best For.

---

## 3. Architecture map (so the refiner knows where everything lives)

```
CJ Dropshipping  ──(source of truth: specs, options, dims, images, cost)──┐
   /api2.0/v1/product/query  (parent SKU only; variant SKU → trim trailing) │
                                                                            ▼
Convex (staging)  cjMyProducts → medusaProducts                            │
   convex/medusa/staging.ts  ·  convex/cj/myProducts.ts                    │
                                                                            ▼
Medusa (Neon Postgres)  products · variants · options · prices · metadata  │  ◀── refinement writes here
   Admin API: POST /admin/products/{id}      (JWT via /auth/user/emailpass) │
                                                                            ▼
Storefront (Next.js, elvato.shop)                                          │
   products/[handle]/page.tsx → ProductTemplate                            │
     ├─ ProductInfo        → title, description, packageSize, comparisonTable, highlights
     ├─ ImageGallery       → images[] + per-variant metadata.image/color_image
     ├─ ProductActions     → options, prices, SKU, inventory, add-to-cart
     └─ RelatedProducts / family sibling (metadata.family_sibling_handle)
```

### 3.1 Back-end APIs / entry points

- **Medusa Admin API** (writes): `POST /admin/products/{id}` updates `title`,
  `description`, `metadata`, `status`, `categories`, `type_id`. Variants via
  `POST /admin/products/{id}/variants/{variantId}` (sku, prices, options, metadata).
  Auth: `POST /auth/user/emailpass` → JWT (`MEDUSA_ADMIN_EMAIL`/`PASSWORD`).
- **CJ Open API** (read / source of truth): `POST /authentication/getAccessToken`
  then `GET /product/query?productSku=…` (header `CJ-Access-Token`). Token cached
  in `scripts/.cj-token-cache.json`. Only the **parent** SKU resolves — trim
  trailing variant chars (max 8). QPS 4/s; back off on `1600200`.
- **Convex** (staging mirror): `cj.myProducts.*`, `medusa.staging.*`. Useful for
  pulling the cached CJ payload (`extractedSpecs`, image set) without re-hitting CJ.

### 3.2 Front-end consumers (read-only — do not change to ship a listing)

| Field written in Medusa | Rendered by |
| --- | --- |
| `metadata.comparisonTable` | [`product-info/index.tsx`](../../storefront/src/modules/products/templates/product-info/index.tsx) — table block |
| `metadata.packageSize` | same file — "Package Size" highlight |
| `variant.metadata.image` / `color_image` | [`image-gallery/index.tsx`](../../storefront/src/modules/products/components/image-gallery/index.tsx) — `meta.image \|\| meta.color_image` |
| options / variants / prices / sku | [`product-actions/index.tsx`](../../storefront/src/modules/products/components/product-actions/index.tsx) |
| `metadata.family_sibling_handle` | [`pick-family-sibling.ts`](../../storefront/src/lib/util/pick-family-sibling.ts) |

---

## 4. The refinement checklist (per product)

For each product, the walk-through must **check → verify → update → confirm**:

### A. Identity & sourcing
- [ ] Resolve the **CJ parent SKU** from any variant's `metadata.cj_sku` (trim
      trailing chars if needed) and fetch live CJ `/product/query`.
- [ ] Cross-reference the cached Convex `extractedSpecs` / `apiDescriptionHtml`.

### B. Options & variants (verify against CJ truth)
- [ ] Every Medusa option is **human-named** (no `Default`/`Option N`).
- [ ] The Medusa variant matrix **matches** the CJ option matrix (colors, light
      temperature, size, head count, voltage). Flag missing or phantom variants.
- [ ] Each variant has a unique `ELV…` SKU and its `metadata.cj_sku` is preserved.
- [ ] Each variant maps a value for **every** option (no partial combinations).

### C. Pricing & shipping
- [ ] Every variant has a USD (and/or CAD) price > 0.
- [ ] `metadata.shippingBakedIn = true`; cost preserved at `costPriceInCents`.
- [ ] Markup is sane vs. cost (flag < 1.5× or absurd outliers for review).

### D. Imagery
- [ ] `thumbnail` is a **single URL** (not a `["…"]` JSON string — the known bug).
- [ ] ≥3 gallery images, all valid CDN URLs.
- [ ] If the product has a color/finish axis, set per-variant
      `metadata.image`/`color_image` so the hero swaps on selection.

### E. Copy
- [ ] Title is brand-style, includes fixture type, 30–60 chars.
- [ ] Description = 2 paragraphs, human voice, no HTML, options mentioned.

### F. Specs (the signature work)
- [ ] Build `metadata.comparisonTable` from CJ specs (§2.3 canonical rows).
- [ ] Set `metadata.packageSize` from CJ packing/dimension data.

### G. Taxonomy & inventory
- [ ] ≥1 category assigned and correct (Wall/Ceiling/Pendant/Chandelier + style/room).
- [ ] Inventory resolves to in-stock (analyst agent `check_inventory_levels` /
      `fix_inventory`).

### H. Publish & confirm
- [ ] `status = published`.
- [ ] Re-fetch and assert all of the above (the "confirm done" gate).
- [ ] (Optional) pin `family_sibling_handle`.

---

## 5. What information is required, and where to get it

| Needed input | Primary source | Fallback |
| --- | --- | --- |
| Material, style, voltage, wattage, bulb/socket, dimensions, color matrix | CJ `/product/query` → `productProperties`, `apiDescriptionHtml` | Convex `cjMyProducts.extractedSpecs`; reports/certifications scans |
| Package size | CJ packing list / `productProperties` dims | product weight + variant dims in Medusa |
| Per-variant images | CJ variant image set (`productImage`/`variantImage`) | gallery images by color match |
| Cost / price sanity | `variant.metadata.costPriceInCents` | CJ price fields |
| Option truth | CJ variant list | existing Medusa options |

> **CJ is the source of truth.** Always parse CJ image fields defensively with the
> `pickFirstImage()` pattern (JSON-stringified arrays) and translate CJ's
> Chinese-English spec dumps into clean, customer-facing values.

---

## 6. Existing tooling we can reuse

| Tool | Path | Role in refinement |
| --- | --- | --- |
| Onboard orchestrator | [`scripts/catalog/onboard-cj-product.mjs`](../../scripts/catalog/onboard-cj-product.mjs) | CJ auth/resolve helpers, `pickFirstImage()` |
| Per-product revise (template) | [`scripts/catalog/revise-CJJT1494811.mjs`](../../scripts/catalog/revise-CJJT1494811.mjs) | **Canonical example** of writing `packageSize` + `comparisonTable` + variant matrix + per-variant images. Pattern the script after this. |
| Variant expansion | [`scripts/catalog/expand-cj-variants.mjs`](../../scripts/catalog/expand-cj-variants.mjs) | Build/verify the option matrix from CJ. **Now built into `refine-listing.mjs`** (§9.2) — use the standalone only for one-off/bulk runs. |
| Variant image swap examples | [`expand-variants-ELV38609.mjs`](../../scripts/catalog/expand-variants-ELV38609.mjs) | `metadata.image`/`color_image` convention |
| SKU normalize | [`scripts/catalog/normalize-elv-skus.mjs`](../../scripts/catalog/normalize-elv-skus.mjs) | Ensure `ELV…` SKUs |
| Shipping bake / surcharge | [`scripts/pricing/`](../../scripts/pricing/) | Verify baked-in shipping |
| Listing analyst agent | [`.agents/product-listing-analyst/`](../../.agents/product-listing-analyst/) | `audit_listing` scorecard, `check_inventory_levels`, `fix_inventory`, `get_cj_product_detail`, `update_product` |

### 6.1 Gap in the current `audit_listing` scorecard

The agent's 14-point scorecard
([`handlers.ts`](../../.agents/product-listing-analyst/src/handlers.ts)) checks
title/description/images/variants/SKU/prices/category/material/weight — but it
**does not yet check** the three polish fields:

- `metadata.comparisonTable` present & well-formed
- `metadata.packageSize` present
- per-variant `metadata.image`/`color_image` when a color/finish axis exists

**Action:** extend the scorecard with these three checks so "polished" becomes a
measurable grade (this is the verification backbone of the walk-through script).

---

## 7. Proposed walk-through script (the final objective)

A single interactive CLI that processes the catalogue **one product at a time**:

```
node scripts/catalog/refine-listing.mjs [--product-id prod_…] [--next] [--dry-run]
```

**Loop per product:**

1. **Select** the next un-polished product (no `comparisonTable`), or a given id.
2. **Gather** Medusa product + CJ parent payload + Convex staging specs.
3. **Audit** against §4 checklist → print a pass/fail scorecard (reuse + extend
   the analyst's `audit_listing`).
4. **Propose** a diff: built `comparisonTable`, `packageSize`, description tweak,
   option/variant fixes, per-variant images, category/inventory fixes.
5. **Prompt** the operator to approve / edit / skip each section (interactive),
   honoring `--dry-run`.
6. **Apply** approved changes via Medusa Admin API; **re-fetch and verify**.
7. **Confirm done** — stamp `metadata.refinedAt` (ISO timestamp) + `refinedBy`
   so progress is queryable and the loop can skip completed items.
8. **Log** a per-product report under `reports/catalog/refine/`.

**Design principles** (from prior lessons in this repo):
- Idempotent and re-runnable; dry-run first, then `--live`.
- Source of truth = CJ; never invent specs — omit unknown rows.
- Defensive CJ image parsing (`pickFirstImage`).
- Preserve `cj_sku`, `costPriceInCents`, and existing metadata on every write
  (always spread `...existing.metadata`).
- A `metadata.refinedAt` marker is the "completed" signal for the whole catalogue.

> Suggested completion metric: **`# products with metadata.refinedAt` / 739**,
> reported after each session — the unified-catalogue progress bar.

---

## 8. Decisions (locked 2026-05-31)

1. **Comparison table style:** ✅ Single-column "Specification" sheet is the
   default; use a true multi-column side-by-side **only** when options differ
   materially.
2. **Description rewrite scope:** ✅ Rewrite **all** descriptions to the strict
   2-paragraph standard (don't just fix the weak ones).
3. **Per-variant images:** ✅ Set per-variant images for **every** color/finish
   axis, best-effort (use CJ per-color photos when available; fall back to the
   closest matching gallery image otherwise).
4. **Operator-in-the-loop:** ✅ The walk-through **requires human approval per
   product** — propose a diff, operator approves/edits/skips each section.
5. **"Done" marker:** Proposed `metadata.refinedAt` + `refinedBy` (confirm at
   build time).
6. **Type vs. category:** Leave `product_type` null — categories carry the
   taxonomy (matches the reference six).

> **Build status:** On hold pending operator review of this document. Do **not**
> scaffold `refine-listing.mjs` or modify `audit_listing` until sign-off.

---

## 9. The refiner script (`refine-listing.mjs`) — built

[`scripts/catalog/refine-listing.mjs`](../../scripts/catalog/refine-listing.mjs)
is the interactive walk-through. It implements the §7 loop with the §8 decisions.

```bash
# pick the next un-refined published product
node scripts/catalog/refine-listing.mjs --next

# target a specific product
node scripts/catalog/refine-listing.mjs --product-id prod_01KJK5...
node scripts/catalog/refine-listing.mjs --cj-sku CJJT1494811

# preview only — build + save the plan, write nothing
node scripts/catalog/refine-listing.mjs --product-id prod_... --dry-run

# non-interactive (accept all proposals) — for later batch runs
node scripts/catalog/refine-listing.mjs --product-id prod_... --yes

# non-interactive but POLISHED — supply axis names / tidied values / overrides
node scripts/catalog/refine-listing.mjs --cj-sku CJSN1051782 --yes \
  --config reports/catalog/refine/config-CJSN1051782.json
```

### 9.1 Flags

| Flag | Effect |
| --- | --- |
| `--product-id ID` / `--cj-sku SKU` / `--next` | Select the product to refine. |
| `--dry-run` | Build + save the plan, write nothing to Medusa. |
| `--yes` / `-y` | Accept all proposals (non-interactive). |
| `--no-cj` | Use Medusa data only (skip CJ). |
| `--no-flat-price` | Disable flat pricing across cosmetic (color/finish) axes. |
| `--config FILE` | JSON `{optionTitles, optionValues, skus?, prices?}` applied non-interactively (see §9.3). |
| `--refined-by NAME` | Stamp `metadata.refinedBy` (default `$USER`). |

**What it writes:** `title`, `description` (2-para), `metadata.packageSize`,
`metadata.comparisonTable` (single-column spec sheet), per-variant
`metadata.image`/`color_image`, and the `metadata.refinedAt` + `refinedBy`
"done" marker. When it expands variants it also writes the option matrix,
ELV SKUs, prices, and inherited shared variant metadata.

### 9.2 Variant expansion + SKU normalization (built in)

When Medusa has ≤1 variant but CJ exposes a full matrix, the refiner runs the
expansion engine (ported from `expand-cj-variants.mjs`) as a first-class step:

- **Axis detection** splits CJ variant keys into option axes, including on a
  bare `-` (e.g. `Black-7W warm light` → `Color` × `Light Mode`).
- **ELV SKUs** are assigned directly (`CJ**<digits><letters>` → `ELV<digits>`),
  with the original CJ SKU stashed at `variant.metadata.cj_sku`.
- **Reuse + create:** the existing variant is reused (price preserved) and the
  rest are created.
- **Shared metadata inheritance:** every NEW variant inherits the base variant's
  non-variant-specific metadata (e.g. expedited shipping tiers
  `expeditedTier1Surcharge`/`DisplayName`/`Days`/`Method`, `shippingBakedIn`).
  Per-variant keys (`image`, `color_image`, `cj_sku`, `cj_variant_sku`) are
  **not** inherited. ⚠️ This was a real bug: without it, the storefront shipping
  selector (which reads per-variant metadata) only showed on the original
  variant. Any new per-variant feature must be added to the inherited set.

One pass = expand + normalize SKUs + polish. The standalone
`expand-cj-variants.mjs` / `normalize-elv-skus.mjs` remain for one-off/bulk use,
but the refiner no longer delegates this work.

**Flat pricing (default on).** A purely cosmetic axis (Color/Finish) must not
change price. The engine groups variants by their non-cosmetic option indices
and aligns each group to one price (the human-anchored base price when the base
variant is in the group, otherwise the group's max). Only NEW variants are
adjusted — the reused variant keeps its price. A **spec-axis guard** runs first:
any axis whose values carry digits or unit/spec keywords (`7W`, `3000K`,
`Dimming`, `60cm`…) is never treated as cosmetic. Disable with
`--no-flat-price`.

**Description keep-by-default.** The 2-paragraph scaffold is a generic fallback.
When the current description is already clean (no `<img>`) and substantial
(≥300 chars), the description step recommends **keep** — Enter keeps it, `--yes`
auto-keeps. Accept only to replace good marketing copy with the scaffold.

**What it only reports on:** option naming (you rename `Option 1/2` → e.g.
`Color` / `Light Mode` interactively or via `--config`), pricing/shipping
sanity, category, thumbnail integrity.

**Per-section review:** each proposal shows current vs proposed and prompts
`[a]ccept / [e]dit / [k]eep / [s]kip`. `[e]dit` opens `$EDITOR` seeded with the
value (JSON for the table). CJ is the source of truth but optional — if CJ is
unavailable, the spec sheet/package size are built from existing Medusa
`extractedSpecs` + dimensions + options.

### 9.3 The `--config` file (non-interactive polished runs)

Because the interactive axis-rename and spelling cleanup happen in `$EDITOR`,
a `--config` JSON lets you pre-apply them so a `--yes` run still produces a
polished result. Saved per product at `reports/catalog/refine/config-<cjSku>.json`.

```jsonc
{
  // Rename axes + tidy value spellings. Counts/order MUST match the
  // auto-detected matrix (index-stable) — do not add/remove/reorder values.
  "optionTitles": ["Color", "Light Mode"],
  "optionValues": [
    ["Black", "White"],
    ["7W Warm Light", "9W Warm Light", "7W Natural Light", "..."]
  ],
  "skus":   { "CJSN105178201AZ": "ELV105178201" },  // optional cjSku → ELV override
  "prices": { "Black / 7W Warm Light": 4209 }        // optional "Val / Val" → cents
}
```

**Outputs:** plan JSON + applied report under `reports/catalog/refine/`.

### 9.4 Worked example — first live polish (2026-06-02)

`Modern Flush Mount Ceiling Light for Hallways`
(`prod_01KJK5G2EJPD22CRMZKZ7S9W6D`, CJ parent `CJSN1051782`) was taken from a
single placeholder variant to a full, polished listing in one automated pass:

- **1 → 16 variants** across `Color` (Black/White) × `Light Mode` (8 wattage/
  temperature/dimming modes), SKUs `ELV105178201`–`216`.
- **Flat pricing** across colors, scaling by mode
  ($42.09 / $51.61 / $56.42 / $53.76 / $47.79).
- **Description kept** (existing copy was clean & substantial).
- `packageSize` `Ø85 × H75 mm`, `comparisonTable` 5 rows, 16/16 variant images,
  `refinedAt` stamped.
- Shipping tiers (USPS Priority +$7, DHL Express +$22) inherited by all 16
  variants so the storefront shipping selector shows on every combination.

### Remaining steps

1. ✅ Gap analysis doc (this file).
2. ✅ `refine-listing.mjs` built.
3. ✅ Piloted live on `CJSN1051782` (1 → 16 variants); engine proven end-to-end.
4. ⏭️ (Optional) extend `audit_listing` with the 3 polish checks (§6.1) for batch reporting.
5. ⏭️ Roll through the remaining ~732 listings, tracking `metadata.refinedAt`.
