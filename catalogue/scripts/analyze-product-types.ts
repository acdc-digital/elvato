import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const client = new ConvexHttpClient("http://127.0.0.1:3210");
  const products = await client.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  
  // Check the product-level fields (not aiContent)
  let sample = 0;
  for (const product of products) {
    if (sample < 2) {
      console.log(`\n=== Product ${sample + 1} ===`);
      console.log("productName:", product.productName);
      console.log("productTitle:", (product as any).productTitle);
      console.log("productType:", (product as any).productType);
      console.log("title:", (product as any).title);
      console.log("subtitle:", (product as any).subtitle);
      console.log("description:", (product as any).description?.substring(0, 100));
      sample++;
    }
  }
  
  // Count the SECOND level of categories (the actual type)
  // Format: "Lighting > Wall Sconces > Bedside" -> "Wall Sconces"
  const typeCount: Record<string, number> = {};
  const ledCount: Record<string, number> = {};
  
  for (const product of products) {
    const aiContent = (product.metadata as any)?.aiContent;
    if (aiContent?.suggestedCategories?.length > 0) {
      const firstCat = aiContent.suggestedCategories[0];
      const parts = firstCat.split(" > ");
      
      if (parts.length >= 2) {
        const productType = parts[1]; // "Wall Sconces", "Chandeliers", etc.
        typeCount[productType] = (typeCount[productType] || 0) + 1;
        
        // Check if any category mentions LED
        const hasLED = aiContent.suggestedCategories.some((cat: string) => 
          cat.toLowerCase().includes("led")
        );
        if (hasLED) {
          ledCount[productType] = (ledCount[productType] || 0) + 1;
        }
      }
    }
  }
  
  console.log("\n\n=== Product Types (2nd level of category) ===");
  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const ledNum = ledCount[type] || 0;
    const ledStr = ledNum > 0 ? ` (${ledNum} LED)` : "";
    console.log(`  ${type}: ${count}${ledStr}`);
  }
  
  console.log(`\nTotal products: ${products.length}`);
  console.log(`Total unique types: ${sortedTypes.length}`);
}

main().catch(console.error);
