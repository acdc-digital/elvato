/**
 * Update Product Classification Script
 * 
 * Updates Convex products with:
 * - mainType (one of 7 types)
 * - isLED (boolean)
 * - subcategories (preserved from AI-generated categories)
 * 
 * Usage:
 *   npx tsx scripts/update-product-classification.ts --dry-run   # Preview changes
 *   npx tsx scripts/update-product-classification.ts             # Apply changes
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mapping rules: current category type -> main type
const TYPE_MAPPINGS: Record<string, string> = {
  "Chandeliers": "Chandeliers",
  "Chandelier": "Chandeliers",
  "Pendant Lights": "Pendants",
  "Pendant Light": "Pendants",
  "Pendants": "Pendants",
  "Wall Sconces": "Wall",
  "Wall Lights": "Wall",
  "Wall Sconce": "Wall",
  "Wall Light": "Wall",
  "Wall Lamps": "Wall",
  "Ceiling Lights": "Ceiling",
  "Ceiling Light": "Ceiling",
  "Ceiling Lamps": "Ceiling",
  "Table Lamps": "Table & Floor",
  "Table Lamp": "Table & Floor",
  "Floor Lamps": "Table & Floor",
  "Floor Lamp": "Table & Floor",
  "Desk Lamps": "Table & Floor",
  "Desk Lamp": "Table & Floor",
  "Outdoor Lighting": "Outdoor",
  "Outdoor Lights": "Outdoor",
  "Outdoor Light": "Outdoor",
  "Outdoor Lamps": "Outdoor",
  "Garden Lights": "Outdoor",
  "Patio Lights": "Outdoor",
  "LED Strips": "Accessories",
  "LED Strip": "Accessories",
  "Night Lights": "Accessories",
  "Night Light": "Accessories",
  "Smart Bulbs": "Accessories",
  "Smart Bulb": "Accessories",
  "Specialty Lights": "Accessories",
  "Specialty Light": "Accessories",
  "LED Lights": "Accessories",
  "LED Light": "Accessories",
  "Mirrors": "Accessories",
  "Mirror": "Accessories",
};

const MAIN_TYPES = [
  "Chandeliers",
  "Pendants", 
  "Wall",
  "Ceiling",
  "Table & Floor",
  "Outdoor",
  "Accessories"
] as const;

type MainType = typeof MAIN_TYPES[number];

interface Classification {
  mainType: MainType;
  isLED: boolean;
  subcategories: string[];
  originalCategories: string[]; // Preserve the full original categories
}

function getMainType(originalType: string): MainType {
  if (TYPE_MAPPINGS[originalType]) {
    return TYPE_MAPPINGS[originalType] as MainType;
  }
  for (const [key, value] of Object.entries(TYPE_MAPPINGS)) {
    if (originalType.toLowerCase().includes(key.toLowerCase())) {
      return value as MainType;
    }
  }
  return "Accessories";
}

function classifyProduct(product: any): Classification | null {
  const aiContent = (product.metadata as any)?.aiContent;
  if (!aiContent?.suggestedCategories?.length) {
    return null;
  }

  // Get main type from first category's second level
  const firstCat = aiContent.suggestedCategories[0];
  const parts = firstCat.split(" > ");
  const originalType = parts.length >= 2 ? parts[1] : parts[0];
  const mainType = getMainType(originalType);
  
  // Check if any category mentions LED
  const isLED = aiContent.suggestedCategories.some((cat: string) =>
    cat.toLowerCase().includes("led")
  );
  
  // Extract ALL unique subcategories from ALL suggested categories
  const subcategorySet = new Set<string>();
  for (const cat of aiContent.suggestedCategories) {
    const catParts = cat.split(" > ");
    // Get everything after level 2 (the product type)
    if (catParts.length >= 3) {
      // Add each subcategory level individually
      for (let i = 2; i < catParts.length; i++) {
        subcategorySet.add(catParts[i].trim());
      }
    }
  }
  
  return {
    mainType,
    isLED,
    subcategories: Array.from(subcategorySet).sort(),
    originalCategories: aiContent.suggestedCategories
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  
  console.log("🏷️  Update Product Classification");
  console.log("══════════════════════════════════════════════════════════\n");
  
  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }
  
  const client = new ConvexHttpClient("http://127.0.0.1:3210");
  const products = await client.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  
  console.log(`📦 Found ${products.length} products\n`);
  
  // Classify all products
  const updates: { product: any; classification: Classification }[] = [];
  const skipped: any[] = [];
  
  for (const product of products) {
    const classification = classifyProduct(product);
    if (classification) {
      updates.push({ product, classification });
    } else {
      skipped.push(product);
    }
  }
  
  // Summary by type
  const typeSummary: Record<MainType, { total: number; led: number; subcats: Set<string> }> = {} as any;
  for (const type of MAIN_TYPES) {
    typeSummary[type] = { total: 0, led: 0, subcats: new Set() };
  }
  
  for (const { classification } of updates) {
    typeSummary[classification.mainType].total++;
    if (classification.isLED) {
      typeSummary[classification.mainType].led++;
    }
    for (const subcat of classification.subcategories) {
      typeSummary[classification.mainType].subcats.add(subcat);
    }
  }
  
  // Print summary
  console.log("📊 Classification Summary");
  console.log("─".repeat(60));
  console.log(`${"Main Type".padEnd(20)} ${"Count".padStart(8)} ${"LED".padStart(8)} ${"Subcats".padStart(10)}`);
  console.log("─".repeat(60));
  
  let totalLED = 0;
  let totalSubcats = 0;
  for (const type of MAIN_TYPES) {
    const { total, led, subcats } = typeSummary[type];
    totalLED += led;
    totalSubcats += subcats.size;
    const ledStr = led > 0 ? `${led}` : "-";
    console.log(`${type.padEnd(20)} ${total.toString().padStart(8)} ${ledStr.padStart(8)} ${subcats.size.toString().padStart(10)}`);
  }
  
  console.log("─".repeat(60));
  console.log(`${"TOTAL".padEnd(20)} ${updates.length.toString().padStart(8)} ${totalLED.toString().padStart(8)} ${totalSubcats.toString().padStart(10)}`);
  
  if (skipped.length > 0) {
    console.log(`\n⚠️  ${skipped.length} products skipped (no AI content)`);
  }
  
  // Show sample updates
  console.log("\n\n📝 Sample Updates (first 3)");
  console.log("─".repeat(60));
  
  for (const { product, classification } of updates.slice(0, 3)) {
    const title = product.title || product.productName || "Unknown";
    console.log(`\n  📦 ${title.substring(0, 50)}`);
    console.log(`     Main Type: ${classification.mainType}`);
    console.log(`     LED: ${classification.isLED ? "Yes" : "No"}`);
    console.log(`     Subcategories: ${classification.subcategories.slice(0, 5).join(", ")}${classification.subcategories.length > 5 ? "..." : ""}`);
  }
  
  if (!dryRun) {
    console.log("\n\n🚀 Applying updates to Convex...\n");
    
    let updated = 0;
    let errors = 0;
    
    for (const { product, classification } of updates) {
      try {
        // Get existing metadata
        const existingMetadata = product.metadata || {};
        
        // Add classification to metadata
        const newMetadata = {
          ...existingMetadata,
          classification: {
            mainType: classification.mainType,
            isLED: classification.isLED,
            subcategories: classification.subcategories,
            originalCategories: classification.originalCategories,
            classifiedAt: new Date().toISOString()
          }
        };
        
        // Update the product
        await client.mutation(api.medusaStaging.updateProduct, {
          id: product._id,
          updates: {
            metadata: newMetadata
          }
        });
        
        updated++;
        
        // Progress indicator
        if (updated % 100 === 0) {
          console.log(`  ✅ Updated ${updated}/${updates.length} products...`);
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Error updating product ${product._id}:`, error);
      }
    }
    
    console.log("\n" + "═".repeat(60));
    console.log(`✅ Successfully updated ${updated} products`);
    if (errors > 0) {
      console.log(`❌ ${errors} errors occurred`);
    }
  } else {
    console.log("\n\n💡 Run without --dry-run to apply these changes");
  }
}

main().catch(console.error);
