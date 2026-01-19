#!/usr/bin/env npx tsx
/// <reference types="node" />
/**
 * Analyze Variant Images
 * 
 * This script analyzes all products to categorize their variants into
 * physical (require unique images) vs. non-physical (share images) options.
 * 
 * Usage:
 *   npx tsx scripts/analyze-variant-images.ts           # Analyze all products
 *   npx tsx scripts/analyze-variant-images.ts --summary # Just show current summary
 *   npx tsx scripts/analyze-variant-images.ts --clear   # Clear and re-analyze
 * 
 * Physical Options (Require unique images):
 *   - Finish/Color (Black, Gold, White, etc.)
 *   - Number of Lights (1-head, 3-head, 5-head)
 * 
 * Non-Physical Options (Share images):
 *   - Size, Color Temperature, Wattage, Voltage, Dimmable, Bulb Type,
 *     Material, Style, Cord Length
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set in environment");
}

const client = new ConvexHttpClient(CONVEX_URL);

const BATCH_SIZE = 25; // Process products in batches

async function main() {
  const args = process.argv.slice(2);
  const summaryOnly = args.includes("--summary");
  const clearFirst = args.includes("--clear");

  console.log("\n📊 Variant Image Mapping Analysis");
  console.log("═".repeat(60));

  // Show current summary first
  if (summaryOnly) {
    await showSummary();
    return;
  }

  // Clear existing mappings if requested
  if (clearFirst) {
    console.log("\n🗑️  Clearing existing mappings...");
    const result = await client.mutation(api.variantMapping.clearAllMappings, {});
    console.log(`   Deleted ${result.deleted} existing mappings`);
  }

  // Get all products
  console.log("\n📦 Fetching products...");
  
  // Fetch all products at once (limit 2000 should cover our ~835 products)
  const products = await client.query(api.medusaStaging.getAllProducts, {
    limit: 2000,
  });
  
  const allProducts = products.map(p => ({ _id: p._id, title: p.title }));

  console.log(`   Found ${allProducts.length} products to analyze`);

  // Process in batches
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: { productId: string; title: string; error: string }[] = [];

  console.log("\n⚙️  Analyzing variants...\n");

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allProducts.length / BATCH_SIZE);
    
    process.stdout.write(`   Batch ${batchNum}/${totalBatches}...`);
    
    // Process each product in the batch
    for (const product of batch) {
      try {
        await client.mutation(api.variantMapping.analyzeProduct, {
          productId: product._id,
        });
        succeeded++;
      } catch (error) {
        failed++;
        errors.push({
          productId: product._id,
          title: product.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      processed++;
    }
    
    console.log(` ✅ (${processed}/${allProducts.length})`);
  }

  console.log("\n" + "─".repeat(60));
  console.log(`✅ Processed: ${processed} products`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);

  if (errors.length > 0 && errors.length <= 10) {
    console.log("\n⚠️  Errors:");
    for (const err of errors) {
      console.log(`   - ${err.title}: ${err.error}`);
    }
  } else if (errors.length > 10) {
    console.log(`\n⚠️  ${errors.length} errors (showing first 10):`);
    for (const err of errors.slice(0, 10)) {
      console.log(`   - ${err.title}: ${err.error}`);
    }
  }

  // Show summary
  await showSummary();
}

async function showSummary() {
  console.log("\n📈 Summary");
  console.log("─".repeat(60));

  try {
    const summary = await client.query(api.variantMapping.getVariantMappingSummary, {});

    console.log(`\n   Total Products Analyzed: ${summary.totalProducts}`);
    console.log(`\n   Status Breakdown:`);
    console.log(`   ├─ ✅ Complete (all images): ${summary.byStatus.complete}`);
    console.log(`   ├─ ⚠️  Partial (some missing): ${summary.byStatus.partial}`);
    console.log(`   └─ ❌ Missing (no images):   ${summary.byStatus.missing}`);

    console.log(`\n   Variant Analysis:`);
    console.log(`   ├─ Total Variants:        ${summary.totalVariants.toLocaleString()}`);
    console.log(`   ├─ Physical Variants:     ${summary.totalPhysicalVariants.toLocaleString()} (need unique images)`);
    console.log(`   └─ Non-Physical Variants: ${summary.totalNonPhysicalVariants.toLocaleString()} (share images)`);

    console.log(`\n   Image Requirements:`);
    console.log(`   ├─ Required Images:       ${summary.totalRequiredImages.toLocaleString()}`);
    console.log(`   ├─ Current Images:        ${summary.totalCurrentImages.toLocaleString()}`);
    console.log(`   ├─ Missing Images:        ${summary.totalMissingImages.toLocaleString()}`);
    console.log(`   └─ Average Coverage:      ${summary.averageImageCoverage}%`);

    // Calculate reduction
    if (summary.totalVariants > 0 && summary.totalRequiredImages > 0) {
      const reduction = ((summary.totalVariants - summary.totalRequiredImages) / summary.totalVariants * 100).toFixed(1);
      console.log(`\n   💡 Image Requirement Reduction: ${reduction}%`);
      console.log(`      (${summary.totalVariants.toLocaleString()} variants → ${summary.totalRequiredImages.toLocaleString()} unique images needed)`);
    }

    // Show top products needing images
    console.log("\n   Products Needing Most Images:");
    const needingImages = await client.query(api.variantMapping.getProductsNeedingImages, {
      limit: 10,
    });

    if (needingImages.length === 0) {
      console.log("   (None - all products have sufficient images!)");
    } else {
      for (let i = 0; i < needingImages.length; i++) {
        const p = needingImages[i];
        console.log(`   ${i + 1}. ${p.title.substring(0, 40)}... - needs ${p.missingImages} images (${p.imageCoverage}% covered)`);
      }
    }

    console.log("\n" + "═".repeat(60));
    console.log("✅ Analysis complete!\n");
  } catch (error) {
    console.error("\n❌ Error fetching summary:", error);
    console.log("   (Run analysis first if no data exists)\n");
  }
}

main().catch(console.error);
