/**
 * Create Product Categories in Medusa
 * 
 * Creates hierarchical categories:
 * - Top level: 7 Main Types (Chandeliers, Pendants, Wall, Ceiling, Table & Floor, Outdoor, Accessories)
 * - Sub level: All subcategories from AI classification
 * 
 * Usage:
 *   npx tsx scripts/create-medusa-categories.ts --dry-run   # Preview
 *   npx tsx scripts/create-medusa-categories.ts             # Create
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
  console.error("❌ MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set in .env.local");
  process.exit(1);
}

// The 7 main types
const MAIN_TYPES = [
  "Chandeliers",
  "Pendants",
  "Wall",
  "Ceiling",
  "Table & Floor",
  "Outdoor",
  "Accessories",
];

interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string;
  is_active: boolean;
  is_internal: boolean;
  rank: number;
}

let authToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (authToken) return authToken;
  
  const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: MEDUSA_ADMIN_EMAIL,
      password: MEDUSA_ADMIN_PASSWORD,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }
  
  const data = await response.json();
  authToken = data.token;
  return authToken!;
}

async function medusaFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const response = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Medusa API error: ${response.status} - ${text}`);
  }
  
  return response.json();
}

function generateHandle(name: string, parentHandle?: string): string {
  const handle = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return parentHandle ? `${parentHandle}-${handle}` : handle;
}

async function getExistingCategories(): Promise<MedusaCategory[]> {
  try {
    const data = await medusaFetch("/admin/product-categories?limit=500&include_descendants_tree=true");
    return data.product_categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function createCategory(
  name: string,
  handle: string,
  parentCategoryId?: string,
  rank: number = 0
): Promise<MedusaCategory | null> {
  try {
    const body: Record<string, unknown> = {
      name,
      handle,
      is_active: true,
      is_internal: false,
      rank,
    };
    
    if (parentCategoryId) {
      body.parent_category_id = parentCategoryId;
    }
    
    const data = await medusaFetch("/admin/product-categories", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.product_category;
  } catch (error) {
    console.error(`Error creating category "${name}":`, error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  
  console.log("📂 Create Medusa Product Categories");
  console.log("═".repeat(60) + "\n");
  
  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }
  
  // Get classified products from Convex
  console.log("📦 Fetching products from Convex...");
  const client = new ConvexHttpClient("http://127.0.0.1:3210");
  const products = await client.query(api.medusaStaging.getAllProducts, { limit: 1000 });
  console.log(`   Found ${products.length} products\n`);
  
  // Build subcategory map by main type
  const subcatsByType: Record<string, Set<string>> = {};
  for (const type of MAIN_TYPES) {
    subcatsByType[type] = new Set();
  }
  
  for (const product of products) {
    const classification = (product.metadata as any)?.classification;
    if (classification?.mainType && classification?.subcategories) {
      const mainType = classification.mainType as string;
      for (const subcat of classification.subcategories) {
        subcatsByType[mainType]?.add(subcat);
      }
    }
  }
  
  // Print summary
  console.log("📊 Categories to Create:");
  console.log("─".repeat(60));
  
  let totalSubcats = 0;
  for (const type of MAIN_TYPES) {
    const count = subcatsByType[type].size;
    totalSubcats += count;
    console.log(`   ${type}: ${count} subcategories`);
  }
  console.log("─".repeat(60));
  console.log(`   Total: 7 main categories + ${totalSubcats} subcategories\n`);
  
  // Check existing categories
  console.log("🔍 Checking existing categories in Medusa...");
  const existingCategories = await getExistingCategories();
  console.log(`   Found ${existingCategories.length} existing categories`);
  
  // Build lookup of existing categories by handle
  const existingByHandle = new Map<string, MedusaCategory>();
  function addToLookup(cats: MedusaCategory[]) {
    for (const cat of cats) {
      existingByHandle.set(cat.handle, cat);
      if ((cat as any).category_children) {
        addToLookup((cat as any).category_children);
      }
    }
  }
  addToLookup(existingCategories);
  
  if (dryRun) {
    console.log("\n📝 Preview of categories to create:\n");
    
    for (const type of MAIN_TYPES) {
      const handle = generateHandle(type);
      const exists = existingByHandle.has(handle);
      console.log(`${exists ? "⏭️" : "+"} ${type} (${handle})${exists ? " - exists" : ""}`);
      
      const subcats = Array.from(subcatsByType[type]).sort();
      for (const subcat of subcats.slice(0, 5)) {
        const subHandle = generateHandle(subcat, handle);
        const subExists = existingByHandle.has(subHandle);
        console.log(`  ${subExists ? "⏭️" : "+"} ${subcat}${subExists ? " - exists" : ""}`);
      }
      if (subcats.length > 5) {
        console.log(`  ... and ${subcats.length - 5} more`);
      }
    }
    
    console.log("\n💡 Run without --dry-run to create these categories");
    return;
  }
  
  // Create categories
  console.log("\n🚀 Creating categories...\n");
  
  const createdCategories: { type: string; id: string; handle: string }[] = [];
  let createdCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < MAIN_TYPES.length; i++) {
    const type = MAIN_TYPES[i];
    const handle = generateHandle(type);
    
    let parentCategory: MedusaCategory | null = null;
    
    // Check if main category exists
    if (existingByHandle.has(handle)) {
      parentCategory = existingByHandle.get(handle)!;
      console.log(`⏭️  ${type} already exists (${parentCategory.id})`);
      skippedCount++;
    } else {
      parentCategory = await createCategory(type, handle, undefined, i);
      if (parentCategory) {
        console.log(`✅ Created: ${type} (${parentCategory.id})`);
        existingByHandle.set(handle, parentCategory);
        createdCount++;
      }
    }
    
    if (!parentCategory) continue;
    
    createdCategories.push({ type, id: parentCategory.id, handle: parentCategory.handle });
    
    // Create subcategories
    const subcats = Array.from(subcatsByType[type]).sort();
    let subcatCreated = 0;
    let subcatSkipped = 0;
    
    for (let j = 0; j < subcats.length; j++) {
      const subcat = subcats[j];
      const subHandle = generateHandle(subcat, handle);
      
      if (existingByHandle.has(subHandle)) {
        subcatSkipped++;
        continue;
      }
      
      const created = await createCategory(subcat, subHandle, parentCategory.id, j);
      if (created) {
        existingByHandle.set(subHandle, created);
        subcatCreated++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`   └─ Created ${subcatCreated} subcategories (${subcatSkipped} already existed)`);
    createdCount += subcatCreated;
    skippedCount += subcatSkipped;
  }
  
  console.log("\n" + "═".repeat(60));
  console.log(`✅ Created ${createdCount} categories, skipped ${skippedCount} existing`);
  
  // Output category ID mapping
  console.log("\n📋 Main Category IDs:");
  console.log("─".repeat(60));
  console.log("const CATEGORY_IDS = {");
  for (const cat of createdCategories) {
    console.log(`  "${cat.type}": "${cat.id}",`);
  }
  console.log("};");
}

main().catch(console.error);
