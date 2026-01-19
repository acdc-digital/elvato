# Image Assignment Workflow

This document outlines the step-by-step process for assigning images to physical variant groups in the Elvato catalogue.

---

## Objective

Map product images to physical variant groups so that each unique visual appearance has a corresponding image. Multiple non-physical variants (Size, Wattage, Color Temperature) will share the same image within each group.

---

## Prerequisites

Before starting:

1. **Variant mapping analysis complete** - Run `npx tsx scripts/analyze-variant-images.ts` to ensure `variantMapping` table is populated
2. **Access to Convex Dashboard** - For viewing and updating variant group data
3. **Product images available** - From CJ Dropshipping or custom photography
4. **Understanding of physical options** - Finish/Color and Number of Lights are the only physical options requiring unique images

---

## Workflow Steps

### Step 1: Identify Products Needing Images

Query products with incomplete image coverage:

```bash
cd catalogue
npx tsx scripts/export-image-report.ts
```

This outputs products sorted by missing images (highest first). Focus on:
- **Critical (10+)**: 9 products needing 231 images
- **High (5-9)**: 7 products needing 43 images

Alternatively, query directly in Convex:

```typescript
// Get products needing images
const products = await ctx.db
  .query("variantMapping")
  .withIndex("by_status", q => q.eq("status", "partial"))
  .collect();

// Sort by missing images descending
products.sort((a, b) => b.missingImages - a.missingImages);
```

---

### Step 2: Retrieve Physical Variant Groups for a Product

For each product, get its physical variant groups:

```typescript
// Get variant mapping for specific product
const mapping = await ctx.db
  .query("variantMapping")
  .withIndex("by_productId", q => q.eq("productId", productId))
  .first();

// mapping.physicalVariantGroups contains:
// [
//   {
//     groupKey: "Finish:Black|Number of Lights:3 Lights",
//     physicalOptionValues: { "Finish": "Black", "Number of Lights": "3 Lights" },
//     variantIds: ["variant1", "variant2", ...],
//     variantCount: 4,
//     assignedImageUrl: null  // <- needs image
//   },
//   ...
// ]
```

Each group represents a unique physical appearance. The `variantCount` shows how many variants share this appearance.

---

### Step 3: Source Images for Each Physical Group

For each physical variant group without an assigned image:

#### Option A: Use Existing CJ Images
1. Check the product's `medusaImages` table for available images
2. Match images to physical groups by visual inspection
3. CJ typically provides images sorted by variant (first image = first variant)

```typescript
// Get product images
const images = await ctx.db
  .query("medusaImages")
  .withIndex("by_medusaProductId", q => q.eq("medusaProductId", productId))
  .collect();

// images[0].url, images[1].url, etc.
```

#### Option B: Request from CJ Variant Details API
For products with multiple Finish options, CJ variant details may include variant-specific images:

```typescript
// Fetch variant details from CJ API
// GET /api/product/variant/detail?variantId={cjVariantId}
// Response includes variant-specific images
```

#### Option C: Manual Photography
For high-value products, request samples and photograph each finish/configuration.

---

### Step 4: Assign Images to Physical Variant Groups

Use the `assignImageToGroup` mutation to link images:

```typescript
import { api } from "../convex/_generated/api";

// Assign image to a specific physical variant group
await client.mutation(api.variantMapping.assignImageToGroup, {
  mappingId: mapping._id,          // variantMapping document ID
  groupKey: "Finish:Black",        // The group to assign to
  imageUrl: "https://example.com/product-black.jpg"
});
```

This updates:
- The group's `assignedImageUrl` field
- The product's `imageCoverage` percentage
- The product's `status` (complete/partial/missing)

---

### Step 5: Bulk Assignment (Batch Processing)

For products with many groups, create a mapping file:

```json
// product-image-assignments.json
{
  "productId": "k579exmjn3cdhrdyz8qm3q5ew57z54w4",
  "assignments": [
    { "groupKey": "Finish:Black", "imageUrl": "https://..." },
    { "groupKey": "Finish:Gold", "imageUrl": "https://..." },
    { "groupKey": "Finish:White", "imageUrl": "https://..." }
  ]
}
```

Process with a script:

```typescript
// scripts/bulk-assign-images.ts
import assignments from "./product-image-assignments.json";

for (const { groupKey, imageUrl } of assignments.assignments) {
  await client.mutation(api.variantMapping.assignImageToGroup, {
    mappingId,
    groupKey,
    imageUrl
  });
}
```

---

### Step 6: Verify Assignment

After assignment, verify coverage:

```bash
npx tsx scripts/analyze-variant-images.ts --summary
```

Check the product's status changed from `partial` to `complete`:

```typescript
const mapping = await ctx.db.get(mappingId);
console.log(mapping.status);         // "complete"
console.log(mapping.imageCoverage);  // 100
console.log(mapping.missingImages);  // 0
```

---

### Step 7: Sync to Medusa Variants

Once images are assigned in Convex, update Medusa variants to use the correct images:

```typescript
// For each variant in a physical group, set the thumbnail
for (const variantId of group.variantIds) {
  await ctx.db.patch(variantId, {
    thumbnail: group.assignedImageUrl
  });
}
```

Then sync to Medusa with `push-to-medusa.ts` or via Medusa Admin API.

---

## Physical Option Reference

Only these options affect visual appearance and require unique images:

| Physical Option | Example Values | Why Physical |
|----------------|----------------|--------------|
| **Finish** | Black, Gold, White, Chrome, Bronze | Changes visible color/material |
| **Color** | Same as Finish | Alternative naming |
| **Number of Lights** | 1 Light, 3 Lights, 5 Lights | Changes fixture shape/size |

All other options (Size, Wattage, Color Temperature, Voltage, etc.) are non-physical and share images.

---

## Group Key Format

The `groupKey` uniquely identifies a physical combination:

```
Finish:Black                           # Single option
Finish:Black|Number of Lights:3 Lights  # Multiple options
default                                  # No physical options (all variants identical)
```

Sort order: Options are alphabetically sorted by name.

---

## Common Patterns

### Pattern 1: Single Finish Option
**Product:** Wall sconce with 5 colors  
**Groups:** 5 (one per color)  
**Strategy:** Assign one image per color

### Pattern 2: Multi-Head Chandelier
**Product:** Chandelier with 3 colors × 4 head counts  
**Groups:** 12 (3 × 4 combinations)  
**Strategy:** May need 12 unique images, or use same color image for all head counts if appearance similar

### Pattern 3: No Physical Options
**Product:** Lamp with only size/wattage variants  
**Groups:** 1 ("default")  
**Strategy:** Single image covers all variants

---

## Troubleshooting

### Issue: Finish values contain descriptions instead of colors
**Example:** "Finish: Bright and soft light" instead of "Finish: Black"  
**Cause:** Poor data extraction from CJ descriptions  
**Solution:** Manually correct the `options` field in `medusaProductVariants` before re-running analysis

### Issue: Too many physical variant groups
**Example:** 50 groups when only 5 colors exist  
**Cause:** Finish values include non-color data  
**Solution:** Clean variant options, then run `npx tsx scripts/analyze-variant-images.ts --clear`

### Issue: Images not matching variants
**Cause:** CJ image order doesn't match variant order  
**Solution:** Manually match by visual inspection, or request variant-specific images from CJ API

---

## Available Mutations

```typescript
// Analyze single product
api.variantMapping.analyzeProduct({ productId })

// Assign image to group
api.variantMapping.assignImageToGroup({ mappingId, groupKey, imageUrl })

// Clear all mappings (for re-analysis)
api.variantMapping.clearAllMappings({})
```

---

## Available Queries

```typescript
// Get all mappings
api.variantMapping.getVariantMappings({ limit?, status? })

// Get products needing images
api.variantMapping.getProductsNeedingImages({ minMissingImages?, limit? })

// Get mapping for specific product
api.variantMapping.getProductVariantMapping({ productId })

// Get summary statistics
api.variantMapping.getVariantMappingSummary({})
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `analyze-variant-images.ts` | Populate/refresh variantMapping table |
| `export-image-report.ts` | Export products needing images |
| `push-to-medusa.ts` | Sync products with images to Medusa |

---

*Last Updated: January 18, 2026*
