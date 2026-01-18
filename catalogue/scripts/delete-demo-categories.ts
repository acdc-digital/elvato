/**
 * Delete Demo Categories from Medusa
 *
 * Removes the demo/sample categories that came with Medusa starter:
 * - Shirts, Sweatshirts, Pants, Merch, etc.
 *
 * Usage:
 *   npx tsx scripts/delete-demo-categories.ts --dry-run   # Preview what will be deleted
 *   npx tsx scripts/delete-demo-categories.ts             # Delete demo categories
 */

import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
  console.error(
    "❌ MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set in .env.local"
  );
  process.exit(1);
}

// Demo category names/handles to delete (exact matches only)
const DEMO_CATEGORIES_TO_DELETE = [
  "shirts",
  "sweatshirts",
  "pants",
  "merch",
  "merchandise",
  "hoodies",
  "t-shirts",
  "tshirts",
  "shorts",
  "jackets",
  "men",
  "women",
  "unisex",
  "sale",
  "new-arrivals",
  "featured",
  "best-sellers",
  "gift-cards",
];

// Your lighting categories to ALWAYS keep (and their subcategories)
const LIGHTING_CATEGORY_PREFIXES = [
  "chandeliers",
  "pendants",
  "wall",
  "ceiling",
  "table-floor",
  "outdoor",
  "accessories", // Your lighting accessories
];

interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string;
  category_children?: MedusaCategory[];
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
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Medusa API error: ${response.status} - ${text}`);
  }

  return response.json();
}

async function getAllCategories(): Promise<MedusaCategory[]> {
  try {
    const data = await medusaFetch(
      "/admin/product-categories?limit=500&include_descendants_tree=true"
    );
    return data.product_categories || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

function flattenCategories(categories: MedusaCategory[]): MedusaCategory[] {
  const flat: MedusaCategory[] = [];

  function traverse(cats: MedusaCategory[]) {
    for (const cat of cats) {
      flat.push(cat);
      if (cat.category_children && cat.category_children.length > 0) {
        traverse(cat.category_children);
      }
    }
  }

  traverse(categories);
  return flat;
}

function isDemoCategory(category: MedusaCategory): boolean {
  const nameLower = category.name.toLowerCase();
  const handleLower = category.handle.toLowerCase();

  // First check if it's a lighting category (always keep these)
  for (const prefix of LIGHTING_CATEGORY_PREFIXES) {
    if (handleLower === prefix || handleLower.startsWith(`${prefix}-`)) {
      return false; // Keep this category
    }
  }

  // Check if it's a demo category to delete (exact match on handle or name)
  for (const demo of DEMO_CATEGORIES_TO_DELETE) {
    if (nameLower === demo || handleLower === demo) {
      return true; // Delete this category
    }
  }

  return false;
}

async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    await medusaFetch(`/admin/product-categories/${categoryId}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to delete ${categoryId}:`, error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("🗑️  Delete Demo Categories from Medusa");
  console.log("═".repeat(60) + "\n");

  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }

  // Fetch all categories
  console.log("📦 Fetching categories from Medusa...");
  const categories = await getAllCategories();
  const flatCategories = flattenCategories(categories);
  console.log(`   Found ${flatCategories.length} total categories\n`);

  // Identify demo categories
  const demoCategories = flatCategories.filter(isDemoCategory);
  const keepCategories = flatCategories.filter((c) => !isDemoCategory(c));

  console.log("📊 Category Analysis:");
  console.log("─".repeat(60));
  console.log(`   Demo categories to delete: ${demoCategories.length}`);
  console.log(`   Categories to keep: ${keepCategories.length}\n`);

  if (demoCategories.length === 0) {
    console.log("✅ No demo categories found - nothing to delete!");
    return;
  }

  console.log("🗑️  Categories to DELETE:");
  console.log("─".repeat(60));
  for (const cat of demoCategories) {
    console.log(`   - ${cat.name} (${cat.handle}) [${cat.id}]`);
  }

  console.log("\n✅ Categories to KEEP:");
  console.log("─".repeat(60));
  for (const cat of keepCategories) {
    console.log(`   + ${cat.name} (${cat.handle})`);
  }

  if (dryRun) {
    console.log(
      "\n💡 Run without --dry-run to delete these demo categories"
    );
    return;
  }

  // Confirm deletion
  console.log("\n⚠️  This will permanently delete the demo categories.");
  console.log("   Press Ctrl+C now to cancel, or wait 3 seconds to continue...\n");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Delete categories (children first, then parents)
  // Sort by depth (deepest first) to avoid parent deletion issues
  const sortedForDeletion = [...demoCategories].sort((a, b) => {
    const aDepth = a.handle.split("-").length;
    const bDepth = b.handle.split("-").length;
    return bDepth - aDepth; // Deeper categories first
  });

  console.log("🚀 Deleting demo categories...\n");

  let deletedCount = 0;
  let failedCount = 0;

  for (const cat of sortedForDeletion) {
    process.stdout.write(`   Deleting: ${cat.name}...`);
    const success = await deleteCategory(cat.id);
    if (success) {
      console.log(" ✅");
      deletedCount++;
    } else {
      console.log(" ❌");
      failedCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n" + "═".repeat(60));
  console.log(`✅ Deleted ${deletedCount} demo categories`);
  if (failedCount > 0) {
    console.log(`❌ Failed to delete ${failedCount} categories`);
    console.log("   (These may have products assigned - remove products first)");
  }
}

main().catch(console.error);
