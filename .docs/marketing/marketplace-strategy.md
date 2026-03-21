# Elvato Marketplace Go-To-Market Strategy

> **Status:** Draft v2 — March 2026
> **Scope:** Multi-channel expansion for CJ-sourced lighting catalog (~803 SKUs)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Model Reality](#business-model-reality)
3. [Channel Evaluation](#channel-evaluation)
4. [Fulfillment Strategy](#fulfillment-strategy)
5. [Unit Economics & Margin Model](#unit-economics--margin-model)
6. [Compliance & Certification](#compliance--certification)
7. [Marketplace Requirements Reference](#marketplace-requirements-reference)
8. [Technical Architecture](#technical-architecture)
9. [Data Pipeline — Convex Marketplace Tables](#data-pipeline--convex-marketplace-tables)
10. [Phased Rollout Plan](#phased-rollout-plan)
11. [Risk Register](#risk-register)
12. [Appendix — Marketplace Requirements Checklist](#appendix--marketplace-requirements-checklist)

---

## Executive Summary

Elvato operates a curated lighting catalog (~803 published products) sourced via CJ Dropshipping, sold through a Medusa-powered storefront at elvato.shop. The existing infrastructure includes a Convex real-time database for product staging, automated sync pipelines to Medusa, pricing reconciliation with baked-in shipping costs, and a Meilisearch-powered faceted search layer.

This strategy outlines expansion into external sales channels, **prioritized by compatibility with a CJ dropship fulfillment model** — not by raw marketplace size. Channels requiring fast US-based fulfillment (Wayfair, Walmart WFS) are deferred until domestic inventory is viable.

### Recommended Launch Order

| Phase | Channel | Rationale |
|-------|---------|-----------|
| 1 | **Google Shopping** | No fulfillment requirements. Drives traffic to owned storefront. Best margin preservation. |
| 2 | **eBay** | Tolerant of longer shipping times. Low barrier. Good demand signal testing. |
| 3 | **Etsy** | Curated/artisan-style pieces. Forgiving fulfillment. Loyal buyer base. |
| 4 | **Amazon (Merchant Fulfilled)** | Massive audience, but strict seller metrics. Small test catalog only. |
| 5 | **Walmart Marketplace** | Deferred until US fulfillment established. Strict delivery metrics. |
| 6 | **Wayfair** | Deferred. Requires reliable US drop-ship warehouse. |

---

## Business Model Reality

### What We Are

Elvato is a **CJ Dropshipping reseller** with a curated, lighting-focused brand identity. Products are sourced from CJ's supplier network, staged through Convex, synced to Medusa, and sold through a branded Next.js storefront.

### What This Means for Marketplace Expansion

| Constraint | Impact |
|---|---|
| **No US-based inventory** | Cannot use FBA, WFS, or CastleGate. Must merchant-fulfill from CJ warehouses. |
| **CJ shipping timelines** | Standard CJ fulfillment = 7-15 business days to North America. Incompatible with Prime/2-day promises. |
| **No UPC/GTIN barcodes** | CJ products are typically unbranded. Need GS1 purchase or GTIN exemptions per channel. |
| **UL/ETL certification unknown** | Most CJ lighting fixtures lack US electrical safety certification. Gate-blocking for Amazon and Walmart. |
| **Images are CJ-sourced** | May not meet white-background studio requirements for all channels. |
| **Pricing includes baked shipping** | Current pricing already incorporates CJ freight + 15% buffer. Additional marketplace fees compound on top. |

### Strategic Implications

1. **Prioritize channels tolerant of 7-15 day shipping** (Google Shopping, eBay, Etsy)
2. **Avoid channels with strict delivery SLAs** until US fulfillment is established (Wayfair, Walmart WFS, Amazon FBA)
3. **Google Shopping is the highest-ROI first move** — it drives traffic to our own storefront where we control margin and fulfillment expectations
4. **Build toward US 3PL** as a Phase 2 infrastructure investment if marketplace demand validates the catalog

---

## Channel Evaluation

### Tier 1 — Launch Candidates

#### Google Shopping (Priority: #1)

| Factor | Detail |
|---|---|
| **Model** | Product feed -> Google Merchant Center -> Google search results |
| **Fees** | Free product listings. Pay-per-click if running Shopping Ads. |
| **Fulfillment** | None — traffic goes to elvato.shop checkout. Fulfillment is our existing CJ pipeline. |
| **Why First** | Zero incremental fulfillment complexity. Preserves full margin on storefront purchases. Tests demand signals across the full catalog at minimal cost. |
| **Requirements** | Google Merchant Center account, product feed (XML/CSV/API), verified website, shipping/tax config |
| **Product Feed** | id, title (<=150 chars), description (>=500 chars), link, image_link, price, availability, brand, GTIN (or identifier_exists=false for unbranded), google_product_category, shipping |
| **Risks** | Requires GTIN or explicit "identifier_exists: false" flag. Disapprovals for non-compliant data. |
| **Integration** | Medium — build Convex -> Google Merchant Center feed export |

#### eBay (Priority: #2)

| Factor | Detail |
|---|---|
| **Model** | Fixed-price or auction listings. Seller-fulfilled. |
| **Fees** | ~250 free listings/month, then $0.35/listing. Final value fee ~13.6% + $0.30-$0.40/order. |
| **Fulfillment** | Seller ships. **eBay is tolerant of 7-15 day handling times** if disclosed upfront. |
| **Why Second** | Broad audience, flexible fulfillment expectations, low barrier to entry. Good for testing which SKUs have marketplace demand. |
| **Requirements** | Seller account (free), Managed Payments enrollment, photos >=500px (recommend >=1600px), item specifics (brand, MPN, measurements, finish, bulb type) |
| **Titles** | <=80 chars. Include brand, product type, key features. |
| **Variants** | Multi-variation listings supported (color, finish, size). |
| **Risks** | Price competition from other CJ resellers. Seller metric thresholds (late shipment rate <4%). |
| **Integration** | Medium — Convex -> eBay Trading API or File Exchange CSV |

#### Etsy (Priority: #3)

| Factor | Detail |
|---|---|
| **Model** | Marketplace for unique/handmade/vintage goods. |
| **Fees** | $0.20 listing fee, 6.5% transaction fee, ~3% + $0.25 payment processing. |
| **Fulfillment** | Seller ships. Handling times are flexible. |
| **Why Third** | Strong category fit for curated/artisan-style lighting. Loyal, design-focused buyer base. Lower competition. |
| **Requirements** | Shop account, original product photos only (no stock images), titles with clear keywords, up to 13 tags per listing, attributes (style, material) |
| **Catalog Fit** | Not all 803 SKUs — curate a subset (~50-100) of distinctive, artisan-style pieces. Bohemian chandeliers, handcrafted pendants, unique materials (rattan, bamboo, blown glass). |
| **Risks** | Etsy's "handmade" positioning — mass-produced CJ items may face policy scrutiny. Must position as "curated" not "manufactured." |
| **Integration** | Low-Medium — CSV upload or Etsy API. Limited variant support. |

### Tier 2 — Conditional Launch

#### Amazon US — Merchant Fulfilled (Priority: #4)

| Factor | Detail |
|---|---|
| **Model** | Professional Seller account ($39.99/mo). Merchant Fulfilled (FBM). |
| **Fees** | ~15% referral fee (Home & Kitchen). No FBA fees if merchant-fulfilled. |
| **Fulfillment** | **FBM only.** FBA is not viable without US inventory. Must maintain <4% late shipment rate and <2.5% order defect rate. CJ's 7-15 day timelines are risky — set handling time to 10+ business days and monitor metrics. |
| **Why Conditional** | Massive audience (~220M Prime users), but seller metrics are unforgiving. A small test catalog (20-50 SKUs) with conservative handling times can validate demand before scaling. |
| **Requirements** | Professional Seller account, US tax info, UPC/GTIN per SKU (or GTIN exemption for unbranded), images >=1000x1000px white background, titles <=200 chars following Amazon style guide, bullet features + rich description |
| **Variants** | Parent-child variation listings (finish, size). Each variant needs own SKU/UPC. |
| **Compliance** | **UL/ETL certification required for electrical lighting fixtures.** Amazon actively enforces this — uncertified products get suppressed and repeat violations lead to account suspension. **This must be resolved before listing.** |
| **Risks** | High competition, UL certification gap, seller metric pressure with CJ timelines, price parity with other CJ resellers. |
| **Integration** | High — SP-API or flat-file CSV, strict data requirements |

### Tier 3 — Deferred

#### Walmart Marketplace (Deferred)

| Factor | Detail |
|---|---|
| **Why Deferred** | No monthly fee and ~15% referral is attractive, but Walmart enforces strict delivery metrics. WFS (2-day shipping) requires US warehouse. Merchant-fulfilled with 10+ day handling is uncompetitive. **Price parity policy** — Walmart may delist if your prices exceed other sites. |
| **Activate When** | US-based 3PL is established with pre-stocked top sellers. |
| **Requirements** | US Business EIN, GTIN/UPC required, images >=1500x1500px white background, title <=150 chars, description >=150 words + 3-10 bullets |

#### Wayfair (Deferred)

| Factor | Detail |
|---|---|
| **Why Deferred** | Excellent category fit (home lighting specialist, design-focused audience), but the drop-ship model requires **you** to ship when Wayfair sends a PO. CJ fulfillment from China means 7-15 day shipping, which violates Wayfair's delivery expectations. Wholesale pricing model (Wayfair sets retail) also limits control. |
| **Activate When** | US-based warehouse or 3PL established. Can fulfill POs within 2-5 business days. |
| **Requirements** | Partner Home application, drop-ship agreement, >=3 images >=1000x1000px, detailed specs, wholesale pricing, meet packing/label standards |

#### Overstock / Houzz / Target+ (Not Planned)

| Channel | Status | Notes |
|---|---|---|
| Overstock | Low priority | ~3.7M monthly visits. Apply via SupplierOasis (>=3 SKUs). Commission model. Low traffic for the setup effort. |
| Houzz | Low priority | ~40M visits, design-focused. Strict vetting, manual approval process. Revisit if/when brand is established. |
| Target+ | N/A | Invite-only. Not accessible at current scale. |

---

## Fulfillment Strategy

### Current State

```
Customer Order -> Medusa Backend -> Manual CJ Order Placement -> CJ Ships (7-15 days)
```

### Marketplace Fulfillment Matrix

| Channel | Fulfillment Method | Handling Time Disclosed | Risk Level |
|---|---|---|---|
| Google Shopping | Own storefront (CJ) | Set on elvato.shop (existing) | Low |
| eBay | Seller-fulfilled (CJ) | 10-15 business days | Medium |
| Etsy | Seller-fulfilled (CJ) | 10-15 business days | Medium |
| Amazon FBM | Seller-fulfilled (CJ) | 10-15 business days | **High** |
| Walmart | Deferred | — | — |
| Wayfair | Deferred | — | — |

### Return Handling

Returns are a key challenge with CJ dropshipping:

| Scenario | Approach |
|---|---|
| **Defective/damaged** | Full refund, don't require return (shipping cost exceeds product cost for bulky lighting). Claim with CJ. |
| **Buyer's remorse** | Accept return to a designated US address (or refund minus restocking fee per marketplace policy). **Need a US returns address** — PO Box or 3PL returns processing. |
| **Marketplace-specific** | Amazon: 30-day liberal return policy (mandatory). eBay: return policy optional but recommended. Etsy: seller-set policy. |

### Future State — US 3PL

If marketplace sales validate demand (threshold defined by margin targets), invest in US-based pre-stocking:

1. Identify top 50 SKUs by marketplace demand
2. Pre-order bulk from CJ to US 3PL warehouse
3. Enable FBA (Amazon), WFS (Walmart), CastleGate (Wayfair)
4. Reduce shipping to 2-5 days, unlock Tier 2 channels

---

## Unit Economics & Margin Model

### Current Pricing Structure

Elvato's existing pricing pipeline (built in `scripts/pricing/`):

```
CJ Base Price
 + 100% Markup (default)
 + CJ Freight Cost (per-variant, per-destination)
 + 15% Shipping Buffer
 = Storefront Retail Price
```

### Per-Channel Margin Impact

Example product: **CJ cost $40, Storefront price $120**

| Channel | Fees | Net After Fees | Margin |
|---|---|---|---|
| **elvato.shop (direct)** | ~3% payment processing ($3.60) | $116.40 | **$76.40 (63.7%)** |
| **Google Shopping** | CPC ad spend (~$1-3/click, ~5% conversion = ~$20-60 CAC) | ~$60-96 | **$20-56 (17-47%)** — highly variable |
| **eBay** | 13.6% + $0.35 (~$16.67) | $103.33 | **$63.33 (52.8%)** |
| **Etsy** | 6.5% + $0.20 listing + ~3% processing (~$11.80) | $108.20 | **$68.20 (56.8%)** |
| **Amazon FBM** | 15% referral ($18) + ~3% processing | $98.40 | **$58.40 (48.7%)** |
| **Amazon FBA** | 15% referral + ~$8 fulfillment + storage | ~$90 | **$50 (41.7%)** — requires US inventory |
| **Walmart** | 15% referral ($18) | $102 | **$62 (51.7%)** |

### Minimum Viable Margin Threshold

Recommend **40% gross margin minimum** per channel to cover:
- Customer service / dispute handling
- Returns / refund absorption
- Advertising spend (Amazon PPC, eBay Promoted Listings)
- Platform-specific tools / subscriptions

**Products below $80 retail with CJ cost >$30 are not viable on high-fee channels (Amazon, Walmart).** Pre-filter the catalog per channel.

### Action Item: Build Margin Calculator

Create a Convex function that:
1. Takes each product's CJ cost + baked storefront price
2. Applies each channel's fee structure
3. Outputs per-product, per-channel margin
4. Flags products below the 40% threshold per channel
5. Generates a "marketplace-eligible" product list per channel

---

## Compliance & Certification

### UL/ETL Certification (Critical — Gate-Blocking)

US marketplaces (especially Amazon and Walmart) **require UL or ETL listing for electrical lighting fixtures**. This is the single biggest risk factor for marketplace expansion.

| Status | Action Required |
|---|---|
| **Unknown** | Audit top 100 SKUs for existing UL/ETL marks. Check CJ product spec sheets. |
| **If certified** | Collect certificate numbers, add to product data (new field in Convex schema). |
| **If not certified** | Cannot list on Amazon/Walmart as electrical fixtures. Options: (a) limit listings to "decorative" categories, (b) obtain certification ($2K-$10K per product family), (c) restrict to channels without enforcement (eBay, Etsy). |

### UPC/GTIN Requirements

| Channel | Requirement | Solution |
|---|---|---|
| Amazon | GTIN/UPC required per SKU | Apply for GTIN exemption (unbranded goods) or purchase GS1 prefix |
| Walmart | GTIN/UPC mandatory | Same as Amazon |
| eBay | Recommended, not mandatory | Use MPN + Brand as fallback |
| Etsy | Not required for handmade | N/A |
| Google Shopping | GTIN required for branded, `identifier_exists: false` for unbranded | Set flag in product feed |

**GS1 Costs:** ~$250/year for 1-10 products, ~$750/year for 1-100, ~$2,500/year for 1-1,000. At 803 SKUs, budget ~$2,500/year.

### Image Compliance

| Channel | Min Size | Background | Notes |
|---|---|---|---|
| Amazon | 1000x1000px | Pure white | No text, watermarks, logos |
| Walmart | 1500x1500px | Pure white | >=4 images recommended |
| eBay | 500x500px (1600 recommended) | Any (white preferred) | No watermarks |
| Etsy | 2000x2000px | Any | Original photos only — no stock |
| Google Shopping | 800x1000px | White or lifestyle | Clear product representation |

**CJ Image Audit Needed:** Check how many of our 803 products have images meeting white-background + resolution requirements. Build a Convex query to flag products with inadequate images per channel.

### Brand Strategy

| Approach | Pros | Cons |
|---|---|---|
| **List as "Elvato" brand** | Brand building, Amazon Brand Registry eligible, differentiation | Must maintain brand consistency, harder to claim "handmade" on Etsy |
| **List as manufacturer brand** | Use existing brand names from CJ | No brand ownership, Buy Box competition with other resellers |
| **Unbranded / Generic** | Simple, GTIN exemption eligible | No brand moat, maximum competition |

**Recommendation:** List as **Elvato** brand on Amazon/eBay/Google. Apply for Amazon Brand Registry (requires trademark — ~$350 USPTO filing). Etsy: position as "curated collection" under Elvato.

---

## Marketplace Requirements Reference

### Fee Comparison Matrix

| Marketplace | Monthly Fee | Referral/Commission | Payment Processing | Listing Fee | Fulfillment Fees |
|---|---|---|---|---|---|
| **Google Shopping** | Free | None (CPC ads optional) | Own processor (~3%) | None | None (own fulfillment) |
| **eBay** | Free (or $4.95-$299.95 store subscription) | ~13.6% FVF + $0.30-$0.40/order | Included in FVF | ~250 free/mo, then $0.35 | Seller-managed |
| **Etsy** | Free | 6.5% transaction | ~3% + $0.25 | $0.20/listing | Seller-managed |
| **Amazon** | $39.99/mo (Pro) | ~15% (Home) | Included in referral | None | FBA: ~$3-8+/unit; FBM: seller-managed |
| **Walmart** | Free | ~15% (Home) | Included in referral | None | WFS: ~$3.45+/unit; Self: seller-managed |
| **Wayfair** | Free | Wholesale model (margin set by Wayfair) | Wayfair handles | None | Seller drop-ships |

### Audience & Reach

| Marketplace | Monthly Traffic/Users | Audience Profile | Lighting Category Fit |
|---|---|---|---|
| **Google Shopping** | Billions (Google search) | Everyone — intent-based | Universal |
| **eBay** | >1B visits/mo | Broad — bargain + collectors | Good (Home & Garden) |
| **Etsy** | ~80M active buyers | Design-oriented, handmade-focused | Strong for curated/unique |
| **Amazon US** | ~220M Prime users | Mass market, convenience-driven | Crowded but massive |
| **Walmart** | ~270M shoppers | Value-oriented, broad US | Good, less saturated than Amazon |
| **Wayfair** | Large US/EU home audience | Design shoppers, home decor | Excellent — home lighting specialist |

---

## Technical Architecture

### Existing Infrastructure

Elvato's data pipeline is already production-grade:

```
CJ API -> cjMyProducts (Convex) -> medusaProducts (Convex staging)
    -> Medusa PostgreSQL -> Meilisearch (faceted search) -> Storefront (Next.js)
```

**Existing Convex tables:** `cjMyProducts`, `medusaProducts`, `medusaProductVariants`, `medusaImages`, `medusaPrices`, `medusaCategories`, `medusaProductOptions`, `variantMapping`, `lightingOptionDefinitions`

**Existing sync scripts:** `sync-convex-to-medusa.mjs`, `preflight-convex-medusa-sync.mjs`, `publish-synced-products.mjs`, `reconcile-unresolved-statuses.mjs`

**Existing pricing scripts:** `reconcile-cj-prices.mjs`, `fetch-cj-freight.mjs`, `apply-shipping-to-prices.mjs`, `compute-expedited-surcharges.mjs`

### Design Principle

**Build on Convex as the data hub.** Each marketplace gets its own Convex table for channel-specific data, feed generation, and sync status tracking. Convex functions handle transformations. Export scripts or API integrations push data to each channel.

### Architecture Diagram

```
+---------------------------------------------------------------------+
|                         CJ DROPSHIPPING API                         |
+-------------------------------+-------------------------------------+
                                |
                                v
                  +----------------------------+
                  |   cjMyProducts (Convex)    |
                  |   Source of truth for      |
                  |   raw product data         |
                  +-------------+--------------+
                                |
                    +-----------+-----------+
                    v                       v
         +-----------------+   +----------------------+
         | medusaProducts  |   | Marketplace Tables   |
         | (Convex)        |   | (Convex)             |
         |                 |   |                      |
         | Storefront      |   | googleShopFeed       |
         | staging         |   | ebayListings         |
         |                 |   | etsyListings         |
         +--------+--------+   | amazonListings       |
                  |            | marketplaceEligibility|
                  v            | marketplaceSyncLog   |
         +------------+       +----------+-----------+
         | Medusa DB  |                  |
         +------+-----+       +----------+----------+
                |              |         |          |
                v              v         v          v
         +------------+  +--------+ +------+ +--------+
         |Meilisearch |  |Google  | | eBay | | Amazon |
         +------+-----+  |Shopping| |      | |        |
                |         +--------+ +------+ +--------+
                v              |
         +----------+         v
         |Storefront|    +------+
         |elvato.shop|   | Etsy |
         +----------+    +------+
```

---

## Data Pipeline — Convex Marketplace Tables

### Schema Design

Each marketplace gets a dedicated Convex table that extends the base product data with channel-specific fields, sync state, and listing metadata. All tables reference back to `medusaProducts` via `medusaProductId`.

#### Google Shopping Feed Table: `googleShopFeed`

```typescript
googleShopFeed: defineTable({
  // Reference
  medusaProductId: v.string(),       // FK -> medusaProducts
  cjProductId: v.optional(v.string()),

  // Google required fields
  googleProductId: v.string(),       // Our generated ID (matches Medusa product ID)
  title: v.string(),                 // <=150 chars, optimized for Google
  description: v.string(),           // >=500 chars, SEO keywords
  link: v.string(),                  // URL to elvato.shop product page
  imageLink: v.string(),             // Primary image URL
  additionalImageLinks: v.optional(v.array(v.string())),
  availability: v.string(),          // "in_stock" | "out_of_stock" | "preorder"
  price: v.string(),                 // "120.00 CAD" format
  brand: v.string(),                 // "Elvato"
  gtin: v.optional(v.string()),      // If available
  identifierExists: v.boolean(),     // false for unbranded CJ products
  googleProductCategory: v.string(), // Google taxonomy ID
  productType: v.optional(v.string()), // Our own category path
  condition: v.string(),             // "new"
  shipping: v.optional(v.string()),  // Shipping config

  // Sync state
  feedStatus: v.string(),            // "pending" | "approved" | "disapproved" | "excluded"
  lastExportedAt: v.optional(v.number()),
  lastGoogleResponse: v.optional(v.string()),
  errors: v.optional(v.array(v.string())),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

#### eBay Listings Table: `ebayListings`

```typescript
ebayListings: defineTable({
  // Reference
  medusaProductId: v.string(),
  cjProductId: v.optional(v.string()),

  // eBay fields
  ebayItemId: v.optional(v.string()),    // Assigned after listing created
  title: v.string(),                      // <=80 chars
  description: v.string(),               // HTML allowed
  categoryId: v.string(),                // eBay category ID
  condition: v.string(),                 // "New"
  brand: v.string(),
  mpn: v.optional(v.string()),
  upc: v.optional(v.string()),

  // Pricing
  price: v.number(),                     // In cents
  currency: v.string(),                  // "USD" | "CAD"

  // Images
  imageUrls: v.array(v.string()),

  // Variants
  variants: v.optional(v.array(v.object({
    sku: v.string(),
    nameValueList: v.array(v.object({
      name: v.string(),
      value: v.string(),
    })),
    price: v.number(),
    quantity: v.number(),
  }))),

  // Shipping
  handlingTimeDays: v.number(),          // 10-15 for CJ
  shippingPolicy: v.string(),

  // Sync state
  listingStatus: v.string(),             // "draft" | "active" | "ended" | "error"
  lastSyncedAt: v.optional(v.number()),
  syncErrors: v.optional(v.array(v.string())),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

#### Etsy Listings Table: `etsyListings`

```typescript
etsyListings: defineTable({
  // Reference
  medusaProductId: v.string(),
  cjProductId: v.optional(v.string()),

  // Etsy fields
  etsyListingId: v.optional(v.number()), // Assigned after creation
  title: v.string(),                      // Keyword-rich, noun + descriptors
  description: v.string(),               // Detailed, no HTML
  tags: v.array(v.string()),             // Up to 13 tags
  materials: v.array(v.string()),        // e.g. ["glass", "brass", "fabric"]
  style: v.optional(v.array(v.string())), // e.g. ["Modern", "Minimalist"]

  // Pricing
  price: v.number(),                     // In cents
  currency: v.string(),

  // Images — must be original
  imageUrls: v.array(v.string()),
  imageComplianceChecked: v.boolean(),   // Flag: verified not stock/duplicate

  // Taxonomy
  etsyTaxonomyId: v.optional(v.number()),
  whoMadeIt: v.string(),                 // "someone_else" for CJ-sourced
  isSupply: v.boolean(),                 // false for finished products
  whenMadeIt: v.string(),               // "2020_2026"

  // Variants (limited on Etsy)
  variants: v.optional(v.array(v.object({
    propertyName: v.string(),
    values: v.array(v.string()),
    priceAdjustment: v.optional(v.number()),
  }))),

  // Shipping
  shippingTemplateId: v.optional(v.number()),
  processingDays: v.number(),            // 10-15 for CJ

  // Sync state
  listingStatus: v.string(),             // "draft" | "active" | "inactive" | "error"
  lastSyncedAt: v.optional(v.number()),
  syncErrors: v.optional(v.array(v.string())),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

#### Amazon Listings Table: `amazonListings`

```typescript
amazonListings: defineTable({
  // Reference
  medusaProductId: v.string(),
  cjProductId: v.optional(v.string()),

  // Amazon fields
  asin: v.optional(v.string()),          // Assigned by Amazon
  sku: v.string(),                        // Our merchant SKU
  title: v.string(),                      // <=200 chars, Amazon style guide
  bulletPoints: v.array(v.string()),     // 5 feature bullets
  description: v.string(),

  // Identifiers
  upc: v.optional(v.string()),
  gtinExemption: v.boolean(),            // true if exemption granted
  brand: v.string(),

  // Pricing
  price: v.number(),                     // In cents
  currency: v.string(),

  // Images
  mainImageUrl: v.string(),              // White background, >=1000x1000
  additionalImageUrls: v.array(v.string()),

  // Category
  amazonCategoryId: v.string(),
  itemTypeKeyword: v.string(),

  // Variants (parent-child)
  parentSku: v.optional(v.string()),     // If this is a child variant
  variationTheme: v.optional(v.string()), // e.g. "ColorName-SizeName"
  variationAttributes: v.optional(v.array(v.object({
    name: v.string(),
    value: v.string(),
  }))),

  // Compliance
  ulCertified: v.boolean(),
  certificationNumber: v.optional(v.string()),
  energyStarRated: v.optional(v.boolean()),

  // Fulfillment
  fulfillmentChannel: v.string(),        // "MERCHANT" (FBM)
  handlingTimeDays: v.number(),          // 10-15 for CJ

  // Sync state
  listingStatus: v.string(),             // "draft" | "active" | "suppressed" | "error"
  amazonStatus: v.optional(v.string()),  // Amazon's listing status
  lastSyncedAt: v.optional(v.number()),
  syncErrors: v.optional(v.array(v.string())),
  buyBoxOwner: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

#### Shared: Marketplace Sync Log Table: `marketplaceSyncLog`

```typescript
marketplaceSyncLog: defineTable({
  channel: v.string(),                   // "google" | "ebay" | "etsy" | "amazon"
  action: v.string(),                    // "create" | "update" | "delete" | "feed_export"
  productId: v.string(),                 // medusaProductId
  status: v.string(),                    // "success" | "failed" | "warning"
  message: v.optional(v.string()),
  responseData: v.optional(v.string()),  // JSON blob from channel API
  timestamp: v.number(),
})
```

#### Shared: Marketplace Eligibility Table: `marketplaceEligibility`

```typescript
marketplaceEligibility: defineTable({
  medusaProductId: v.string(),

  // Per-channel eligibility flags
  googleEligible: v.boolean(),
  googleBlockers: v.optional(v.array(v.string())),  // e.g. ["missing_gtin", "image_too_small"]

  ebayEligible: v.boolean(),
  ebayBlockers: v.optional(v.array(v.string())),

  etsyEligible: v.boolean(),
  etsyBlockers: v.optional(v.array(v.string())),

  amazonEligible: v.boolean(),
  amazonBlockers: v.optional(v.array(v.string())),   // e.g. ["no_ul_cert", "margin_below_40"]

  // Computed
  marginByChannel: v.optional(v.object({
    google: v.optional(v.number()),
    ebay: v.optional(v.number()),
    etsy: v.optional(v.number()),
    amazon: v.optional(v.number()),
  })),

  lastCheckedAt: v.number(),
})
```

### Convex Functions to Build

| Function | Purpose |
|---|---|
| `marketplace.checkEligibility(productId)` | Run all compliance checks (images, GTIN, UL, margin) per channel. Write to `marketplaceEligibility`. |
| `marketplace.getEligibleProducts(channel)` | Query products eligible for a specific channel. |
| `marketplace.generateGoogleFeed()` | Transform eligible products -> `googleShopFeed` records. |
| `marketplace.generateEbayListings()` | Transform eligible products -> `ebayListings` records. |
| `marketplace.generateEtsyListings()` | Transform eligible products -> `etsyListings` records. |
| `marketplace.generateAmazonListings()` | Transform eligible products -> `amazonListings` records. |
| `marketplace.exportGoogleFeedCSV()` | Export `googleShopFeed` -> Merchant Center CSV/XML format. |
| `marketplace.getSyncStats(channel)` | Dashboard stats: listed, pending, errors per channel. |
| `marketplace.logSync(channel, action, ...)` | Write to `marketplaceSyncLog`. |

### Export Scripts (in `scripts/marketplace/`)

Following the existing pattern from `scripts/sync/` and `scripts/pricing/`:

| Script | Purpose |
|---|---|
| `export-google-feed.mjs` | Pull from Convex `googleShopFeed` -> generate XML/CSV -> upload to Merchant Center (or scheduled fetch URL) |
| `sync-to-ebay.mjs` | Pull from Convex `ebayListings` -> push via eBay Trading API |
| `sync-to-etsy.mjs` | Pull from Convex `etsyListings` -> push via Etsy API |
| `sync-to-amazon.mjs` | Pull from Convex `amazonListings` -> push via Amazon SP-API flat file |
| `check-marketplace-eligibility.mjs` | Batch-run eligibility checks across all products |
| `marketplace-margin-report.mjs` | Generate per-product, per-channel margin analysis |

---

## Phased Rollout Plan

### Phase 0 — Audit & Prerequisites (Weeks 1-3)

**Goal:** Understand what we can actually list, and where.

| Task | Detail | Output |
|---|---|---|
| **UL/ETL Audit** | Check top 100 SKUs for electrical safety certification via CJ spec sheets | Certified vs. uncertified product lists |
| **Image Audit** | Convex query: flag products with images <1000px, no white background, <3 images | Image compliance report per channel |
| **GTIN Decision** | Decide: GS1 purchase (~$2,500/yr for 803 SKUs) vs. GTIN exemptions vs. channel-specific strategy | GTIN strategy document |
| **Margin Calculator** | Build Convex function: CJ cost + channel fees -> per-product margin per channel | `marketplaceEligibility` table populated |
| **Brand / Trademark** | Decide brand strategy. If "Elvato" brand: file USPTO trademark (~$350) for Amazon Brand Registry | Trademark filing (if applicable) |
| **Returns Address** | Secure US mailing address or PO Box for returns | Returns address confirmed |

### Phase 1 — Google Shopping (Weeks 4-6)

**Goal:** Drive traffic to owned storefront. Zero fulfillment complexity.

| Task | Detail |
|---|---|
| Set up Google Merchant Center | Business verification, website claim, shipping/tax config |
| Build `googleShopFeed` Convex table + functions | Transform `medusaProducts` -> Google feed format |
| Build `export-google-feed.mjs` | Export script generating compliant product feed |
| Upload initial feed | All eligible products (likely 700+ after filtering) |
| Fix disapprovals | Iterate on data quality issues flagged by Google |
| Launch Shopping Ads (optional) | Start with $10-20/day budget on top performers |

**Success Metric:** Feed approved, products appearing in Google search, measurable click-through to elvato.shop.

### Phase 2 — eBay (Weeks 7-10)

**Goal:** Test marketplace demand with flexible fulfillment expectations.

| Task | Detail |
|---|---|
| Create eBay Business seller account | Managed Payments enrollment |
| Build `ebayListings` Convex table + functions | Transform products -> eBay format with item specifics |
| Build `sync-to-ebay.mjs` | Push listings via API or generate File Exchange CSV |
| List initial 100 products | Start with highest-margin, best-image products |
| Set handling time to 12-15 business days | Clearly disclosed in listing |
| Configure shipping (calculated or flat rate) | Based on CJ freight data already in our system |
| Set return policy | 30-day returns, buyer pays return shipping |
| Monitor seller metrics | Late shipment rate, defect rate |

**Success Metric:** 100 active listings, first sales within 2 weeks, seller metrics green.

### Phase 3 — Etsy (Weeks 9-12)

**Goal:** Curated collection for design-focused buyers.

| Task | Detail |
|---|---|
| Create Etsy Shop ("Elvato Lighting" or similar) | Identity verification |
| Curate 50-100 SKUs | Focus on: bohemian, artisan, unique materials (rattan, glass, bamboo, crystal) |
| Build `etsyListings` Convex table + functions | With tags, materials, style attributes |
| Optimize titles + tags for Etsy SEO | Noun-first titles, 13 relevant tags per listing |
| Upload listings | Manual review of each for Etsy policy compliance |
| Set processing time to 10-15 business days | Standard for Etsy |

**Success Metric:** 50+ active listings, shop rating established, first reviews.

### Phase 4 — Amazon FBM Test (Weeks 13-18)

**Goal:** Small-scale test of marketplace viability with strict metrics monitoring.

| Task | Detail |
|---|---|
| Register Professional Seller account ($39.99/mo) | US tax info, bank account |
| Apply for GTIN exemption (if unbranded) | Or assign GS1 barcodes to test SKUs |
| Resolve UL certification for test products | Only list products with confirmed UL/ETL |
| Build `amazonListings` Convex table + functions | Full spec: parent-child variants, bullet points |
| List 20-50 test products | Highest margin, certified, best images |
| Set handling time to 10-14 business days | Monitor late shipment rate weekly |
| Run minimal PPC ($5-10/day) on top 10 SKUs | Test demand and ACoS |
| **Kill switch:** Pause if seller metrics drop | Late shipment >3%, ODR >1.5% |

**Success Metric:** Positive seller metrics after 30 days, ACoS <25% on PPC, validated demand for catalog expansion.

### Phase 5 — Scale & Evaluate (Weeks 19+)

| Task | Detail |
|---|---|
| Analyze sales data across all channels | Revenue, margin, return rate, customer acquisition cost |
| Expand catalog on performing channels | Add remaining eligible products |
| Evaluate US 3PL investment | If volume justifies: pre-stock top 50 SKUs domestically |
| Unlock Tier 2 channels | Walmart, Wayfair — only with US fulfillment |
| Automate inventory sync | Real-time CJ stock levels -> all channel listings |
| Build marketplace dashboard | Convex queries powering a unified view of all channel status |

### Timeline Summary

| Milestone | Timeframe | Deliverables |
|---|---|---|
| Audit complete, eligibility data populated | Week 3 | `marketplaceEligibility` table, compliance reports |
| Google Shopping live | Week 6 | Feed approved, products in Google search |
| eBay live (100 listings) | Week 10 | Active listings, first sales |
| Etsy live (50 curated listings) | Week 12 | Shop established, listings active |
| Amazon FBM test (20-50 listings) | Week 18 | Seller metrics validated |
| Scale decision + Tier 2 evaluation | Week 22+ | Data-driven channel expansion plan |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **UL/ETL certification gap** blocks Amazon/Walmart | High | High | Audit first. Fall back to eBay/Etsy/Google if uncertified. |
| **CJ shipping delays** erode seller metrics | Medium | High | Conservative handling times (12-15 days). Monitor CJ fulfillment times weekly. Auto-pause channels if metrics degrade. |
| **Price competition** from other CJ resellers on same products | High | Medium | Differentiate via brand (Elvato), better images, SEO-optimized listings. Avoid products with >10 competing sellers. |
| **Image non-compliance** causes listing disapprovals | Medium | Medium | Pre-audit via Convex. Invest in image editing (background removal, upscaling) for top SKUs. |
| **Return handling complexity** with CJ | Medium | Medium | Full-refund policy for items under $50 (cheaper than return shipping). US returns address for higher-value items. |
| **Google feed disapprovals** at scale | Medium | Low | Start with small batch, iterate on data quality, fix common issues before full catalog. |
| **Etsy policy enforcement** on non-handmade goods | Low | Medium | Position as "curated collection." Only list genuinely distinctive pieces. Monitor policy updates. |
| **Marketplace account suspension** (Amazon) | Low | Very High | Start small. Conservative metrics management. Keep separate business identity per channel if needed. |

---

## Appendix — Marketplace Requirements Checklist

### Amazon US

| Requirement | Status | Notes |
|---|---|---|
| Professional Seller account | Not started | $39.99/mo, US tax info required |
| UPC/GTIN per SKU | Not started | Need GS1 or exemption |
| UL/ETL certification | **Unknown — audit required** | Gate-blocking |
| Images >=1000x1000px white BG | Partial (CJ images) | Audit needed |
| Titles <=200 chars (Amazon style) | Not started | Generate per-product |
| 5 bullet points per listing | Not started | Generate from description |
| Parent-child variant setup | Not started | Map from Convex variant data |
| Handling time configured (10-14 days) | Not started | |
| Brand Registry (optional) | Not started | Requires trademark |

### eBay

| Requirement | Status | Notes |
|---|---|---|
| Seller account + Managed Payments | Not started | Free |
| Photos >=500px (1600 recommended) | Likely OK | CJ images usually sufficient |
| Titles <=80 chars | Not started | Generate per-product |
| Item specifics (brand, MPN, finish, bulb type) | Not started | Map from Convex |
| Multi-variation listings | Not started | Map from variant data |
| Shipping policy (calculated/flat) | Not started | Use CJ freight data |
| Return policy | Not started | 30-day recommended |

### Etsy

| Requirement | Status | Notes |
|---|---|---|
| Shop account | Not started | Free |
| Original product photos | **Risk** | CJ images may be shared across resellers |
| Title + 13 tags per listing | Not started | Generate from facet data |
| Materials + style attributes | Available | Already extracted in Meilisearch facets |
| Processing time (10-15 days) | Not started | |
| `who_made_it: someone_else` | Not started | Required for resale items |

### Google Shopping

| Requirement | Status | Notes |
|---|---|---|
| Merchant Center account | Not started | Free |
| Product feed (XML/CSV) | Not started | Build from Convex |
| All required attributes listed | Not started | id, title, description, link, image_link, price, availability, brand |
| `identifier_exists: false` for unbranded | Not started | |
| Shipping rates configured | Not started | |
| Tax configuration | Not started | State-level US sales tax |
| Website verified | Not started | elvato.shop |

### Walmart (Deferred)

| Requirement | Status | Notes |
|---|---|---|
| US Business EIN | Unknown | Required for application |
| GTIN/UPC mandatory | Not started | Same as Amazon |
| Images >=1500x1500px white BG | Audit needed | Higher bar than Amazon |
| Titles <=150 chars | Not started | |
| Description >=150 words + 3-10 bullets | Not started | |
| WFS or self-fulfill | Deferred | Needs US warehouse |
| Price parity compliance | N/A | Must not exceed other channel prices |

### Wayfair (Deferred)

| Requirement | Status | Notes |
|---|---|---|
| Partner Home application | Not started | |
| Drop-ship agreement | Blocked | Requires US fulfillment capability |
| >=3 images >=1000x1000px | Audit needed | |
| Wholesale pricing submission | Not started | Wayfair sets retail |
| Packing/label standards | Blocked | Requires warehouse ops |
