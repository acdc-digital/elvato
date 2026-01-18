/**
 * Subcategory Analysis Script
 * 
 * Shows all subcategories (3rd level and beyond) for each main type
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
];

function getMainType(originalType: string): string {
  if (TYPE_MAPPINGS[originalType]) {
    return TYPE_MAPPINGS[originalType];
  }
  for (const [key, value] of Object.entries(TYPE_MAPPINGS)) {
    if (originalType.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return "Accessories";
}

async function main() {
  const client = new ConvexHttpClient("http://127.0.0.1:3210");
  const products = await client.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  
  console.log("📂 Subcategory Analysis");
  console.log("═".repeat(70));
  console.log("\nStructure: Main Type > Subcategory (count)\n");
  
  // Collect subcategories by main type
  const subcatsByType: Record<string, Record<string, number>> = {};
  for (const type of MAIN_TYPES) {
    subcatsByType[type] = {};
  }
  
  for (const product of products) {
    const aiContent = (product.metadata as any)?.aiContent;
    if (!aiContent?.suggestedCategories?.length) continue;
    
    // Get main type from first category
    const firstCat = aiContent.suggestedCategories[0];
    const parts = firstCat.split(" > ");
    const originalType = parts.length >= 2 ? parts[1] : parts[0];
    const mainType = getMainType(originalType);
    
    // Collect ALL subcategories from ALL suggested categories
    for (const cat of aiContent.suggestedCategories) {
      const catParts = cat.split(" > ");
      // Get everything after the product type (level 2)
      if (catParts.length >= 3) {
        const subcat = catParts.slice(2).join(" > ");
        subcatsByType[mainType][subcat] = (subcatsByType[mainType][subcat] || 0) + 1;
      }
    }
  }
  
  // Print subcategories for each main type
  let totalSubcats = 0;
  
  for (const type of MAIN_TYPES) {
    const subcats = subcatsByType[type];
    const sorted = Object.entries(subcats).sort((a, b) => b[1] - a[1]);
    totalSubcats += sorted.length;
    
    console.log(`\n🏷️  ${type} (${sorted.length} subcategories)`);
    console.log("─".repeat(60));
    
    // Group subcategories by first word for readability
    const groups: Record<string, string[]> = {};
    for (const [subcat, count] of sorted) {
      const firstWord = subcat.split(" ")[0].replace(">", "").trim();
      if (!groups[firstWord]) groups[firstWord] = [];
      groups[firstWord].push(`${subcat} (${count})`);
    }
    
    // Show top subcategories
    for (const [subcat, count] of sorted.slice(0, 15)) {
      console.log(`  • ${subcat} (${count})`);
    }
    if (sorted.length > 15) {
      console.log(`  ... and ${sorted.length - 15} more`);
    }
  }
  
  console.log("\n" + "═".repeat(70));
  console.log(`📊 Total unique subcategories: ${totalSubcats}`);
  console.log("\nThese subcategories will be preserved when we update products.");
}

main().catch(console.error);
