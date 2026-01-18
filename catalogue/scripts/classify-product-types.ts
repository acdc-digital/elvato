/**
 * Product Type Classification Script
 * 
 * Maps products to 7 main types and tags LED products
 * 
 * Main Types:
 * 1. Chandeliers
 * 2. Pendants
 * 3. Wall
 * 4. Ceiling
 * 5. Table & Floor
 * 6. Outdoor
 * 7. Accessories
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mapping rules: current category type -> main type
const TYPE_MAPPINGS: Record<string, string> = {
  // Chandeliers
  "Chandeliers": "Chandeliers",
  "Chandelier": "Chandeliers",
  
  // Pendants
  "Pendant Lights": "Pendants",
  "Pendant Light": "Pendants",
  "Pendants": "Pendants",
  
  // Wall
  "Wall Sconces": "Wall",
  "Wall Lights": "Wall",
  "Wall Sconce": "Wall",
  "Wall Light": "Wall",
  "Wall Lamps": "Wall",
  
  // Ceiling
  "Ceiling Lights": "Ceiling",
  "Ceiling Light": "Ceiling",
  "Ceiling Lamps": "Ceiling",
  
  // Table & Floor
  "Table Lamps": "Table & Floor",
  "Table Lamp": "Table & Floor",
  "Floor Lamps": "Table & Floor",
  "Floor Lamp": "Table & Floor",
  "Desk Lamps": "Table & Floor",
  "Desk Lamp": "Table & Floor",
  
  // Outdoor
  "Outdoor Lighting": "Outdoor",
  "Outdoor Lights": "Outdoor",
  "Outdoor Light": "Outdoor",
  "Outdoor Lamps": "Outdoor",
  "Garden Lights": "Outdoor",
  "Patio Lights": "Outdoor",
  
  // Accessories
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

// All valid main types
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

interface ClassificationResult {
  productId: string;
  title: string;
  originalType: string;
  mainType: MainType;
  isLED: boolean;
}

function classifyProduct(product: any): ClassificationResult | null {
  const aiContent = (product.metadata as any)?.aiContent;
  if (!aiContent?.suggestedCategories?.length) {
    return null;
  }

  const title = product.title || product.productName || "Unknown";
  
  // Get the second level of the first category (the product type)
  const firstCat = aiContent.suggestedCategories[0];
  const parts = firstCat.split(" > ");
  const originalType = parts.length >= 2 ? parts[1] : parts[0];
  
  // Map to main type
  let mainType: MainType = "Accessories"; // Default fallback
  
  if (TYPE_MAPPINGS[originalType]) {
    mainType = TYPE_MAPPINGS[originalType] as MainType;
  } else {
    // Try to match by checking if any key is contained in the type
    for (const [key, value] of Object.entries(TYPE_MAPPINGS)) {
      if (originalType.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(originalType.toLowerCase())) {
        mainType = value as MainType;
        break;
      }
    }
  }
  
  // Check if any category mentions LED
  const isLED = aiContent.suggestedCategories.some((cat: string) =>
    cat.toLowerCase().includes("led")
  );
  
  return {
    productId: product._id,
    title,
    originalType,
    mainType,
    isLED
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const showAll = args.includes("--show-all");
  
  console.log("🏷️  Product Type Classification Script");
  console.log("=====================================\n");
  
  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }
  
  const client = new ConvexHttpClient("http://127.0.0.1:3210");
  const products = await client.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  
  console.log(`📦 Found ${products.length} products\n`);
  
  // Classify all products
  const results: ClassificationResult[] = [];
  const unclassified: any[] = [];
  
  for (const product of products) {
    const result = classifyProduct(product);
    if (result) {
      results.push(result);
    } else {
      unclassified.push(product);
    }
  }
  
  // Summary by main type
  const typeSummary: Record<MainType, { total: number; led: number }> = {} as any;
  for (const type of MAIN_TYPES) {
    typeSummary[type] = { total: 0, led: 0 };
  }
  
  for (const result of results) {
    typeSummary[result.mainType].total++;
    if (result.isLED) {
      typeSummary[result.mainType].led++;
    }
  }
  
  // Print summary
  console.log("📊 Classification Summary");
  console.log("─".repeat(50));
  console.log(`${"Main Type".padEnd(20)} ${"Count".padStart(8)} ${"LED".padStart(8)}`);
  console.log("─".repeat(50));
  
  let totalLED = 0;
  for (const type of MAIN_TYPES) {
    const { total, led } = typeSummary[type];
    totalLED += led;
    const ledStr = led > 0 ? `${led}` : "-";
    console.log(`${type.padEnd(20)} ${total.toString().padStart(8)} ${ledStr.padStart(8)}`);
  }
  
  console.log("─".repeat(50));
  console.log(`${"TOTAL".padEnd(20)} ${results.length.toString().padStart(8)} ${totalLED.toString().padStart(8)}`);
  
  if (unclassified.length > 0) {
    console.log(`\n⚠️  ${unclassified.length} products could not be classified (no AI content)`);
  }
  
  // Show samples for each type
  if (showAll) {
    console.log("\n\n📝 Sample Products by Type");
    console.log("═".repeat(70));
    
    for (const type of MAIN_TYPES) {
      const typeProducts = results.filter(r => r.mainType === type);
      if (typeProducts.length === 0) continue;
      
      console.log(`\n🏷️  ${type} (${typeProducts.length} products)`);
      console.log("─".repeat(70));
      
      // Show up to 3 samples
      for (const p of typeProducts.slice(0, 3)) {
        const ledBadge = p.isLED ? " [LED]" : "";
        console.log(`  • ${p.title.substring(0, 50)}${ledBadge}`);
        console.log(`    Original: ${p.originalType}`);
      }
    }
  }
  
  // Show unmapped original types
  const originalTypeCounts: Record<string, number> = {};
  for (const result of results) {
    originalTypeCounts[result.originalType] = (originalTypeCounts[result.originalType] || 0) + 1;
  }
  
  console.log("\n\n📋 Original Type Mappings");
  console.log("─".repeat(60));
  const sortedOriginal = Object.entries(originalTypeCounts).sort((a, b) => b[1] - a[1]);
  for (const [original, count] of sortedOriginal) {
    const mapped = TYPE_MAPPINGS[original] || "Accessories (default)";
    console.log(`  ${original.padEnd(25)} → ${mapped.padEnd(20)} (${count})`);
  }
  
  if (!dryRun) {
    console.log("\n\n🚀 Ready to update products!");
    console.log("Run with --dry-run to preview without changes");
    console.log("Use --show-all to see sample products for each type");
  }
}

main().catch(console.error);
