/**
 * Create Product Types and Tags in Medusa
 * 
 * Creates:
 * - 7 Product Types: Chandeliers, Pendants, Wall, Ceiling, Table & Floor, Outdoor, Accessories
 * - 1 Product Tag: LED
 * 
 * Usage:
 *   npx tsx scripts/create-medusa-types.ts --dry-run   # Preview what will be created
 *   npx tsx scripts/create-medusa-types.ts             # Create in Medusa
 */

import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
  console.error("❌ MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set in .env.local");
  process.exit(1);
}

// The 7 main product types
const MAIN_TYPES = [
  { value: "Chandeliers", description: "Hanging multi-light fixtures with decorative arms or branches" },
  { value: "Pendants", description: "Single or multi-light fixtures that hang from the ceiling by a cord, chain, or rod" },
  { value: "Wall", description: "Wall-mounted sconces, wall lights, and wall lamps" },
  { value: "Ceiling", description: "Flush mount and semi-flush mount ceiling fixtures" },
  { value: "Table & Floor", description: "Table lamps, desk lamps, and floor lamps" },
  { value: "Outdoor", description: "Outdoor and garden lighting fixtures" },
  { value: "Accessories", description: "LED strips, night lights, smart bulbs, mirrors, and specialty lighting" },
];

// Tags to create
const TAGS = [
  { value: "LED", description: "LED light source or LED-compatible fixture" },
];

interface MedusaProductType {
  id: string;
  value: string;
  metadata?: Record<string, unknown>;
}

interface MedusaProductTag {
  id: string;
  value: string;
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
    const text = await response.text();
    throw new Error(`Auth failed: ${response.status} - ${text}`);
  }
  
  const data = await response.json();
  authToken = data.token;
  return authToken!;
}

async function medusaFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const url = `${MEDUSA_BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
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

async function getExistingProductTypes(): Promise<MedusaProductType[]> {
  try {
    const data = await medusaFetch("/admin/product-types?limit=100");
    return data.product_types || [];
  } catch (error) {
    console.error("Error fetching product types:", error);
    return [];
  }
}

async function getExistingProductTags(): Promise<MedusaProductTag[]> {
  try {
    const data = await medusaFetch("/admin/product-tags?limit=100");
    return data.product_tags || [];
  } catch (error) {
    console.error("Error fetching product tags:", error);
    return [];
  }
}

async function createProductType(value: string, metadata?: Record<string, unknown>): Promise<MedusaProductType | null> {
  try {
    const data = await medusaFetch("/admin/product-types", {
      method: "POST",
      body: JSON.stringify({ value, metadata }),
    });
    return data.product_type;
  } catch (error) {
    console.error(`Error creating product type "${value}":`, error);
    return null;
  }
}

async function createProductTag(value: string): Promise<MedusaProductTag | null> {
  try {
    const data = await medusaFetch("/admin/product-tags", {
      method: "POST",
      body: JSON.stringify({ value }),
    });
    return data.product_tag;
  } catch (error) {
    console.error(`Error creating product tag "${value}":`, error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  
  console.log("🏷️  Create Medusa Product Types & Tags");
  console.log("═".repeat(60) + "\n");
  
  if (dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be made\n");
  }
  
  // Check existing types
  console.log("🔍 Checking existing product types in Medusa...");
  const existingTypes = await getExistingProductTypes();
  console.log(`   Found ${existingTypes.length} existing types`);
  
  if (existingTypes.length > 0) {
    console.log("   Existing types:");
    for (const type of existingTypes) {
      console.log(`     • ${type.value} (${type.id})`);
    }
  }
  
  // Check existing tags
  console.log("\n🔍 Checking existing product tags in Medusa...");
  const existingTags = await getExistingProductTags();
  console.log(`   Found ${existingTags.length} existing tags`);
  
  if (existingTags.length > 0) {
    console.log("   Existing tags:");
    for (const tag of existingTags) {
      console.log(`     • ${tag.value} (${tag.id})`);
    }
  }
  
  // Determine what to create
  const existingTypeValues = new Set(existingTypes.map(t => t.value));
  const existingTagValues = new Set(existingTags.map(t => t.value));
  
  const typesToCreate = MAIN_TYPES.filter(t => !existingTypeValues.has(t.value));
  const tagsToCreate = TAGS.filter(t => !existingTagValues.has(t.value));
  
  console.log("\n" + "─".repeat(60));
  console.log("📊 Summary");
  console.log("─".repeat(60));
  console.log(`   Product Types to create: ${typesToCreate.length}`);
  for (const t of typesToCreate) {
    console.log(`     + ${t.value}`);
  }
  console.log(`   Product Tags to create: ${tagsToCreate.length}`);
  for (const t of tagsToCreate) {
    console.log(`     + ${t.value}`);
  }
  
  if (typesToCreate.length === 0 && tagsToCreate.length === 0) {
    console.log("\n✅ All types and tags already exist in Medusa!");
    return;
  }
  
  if (dryRun) {
    console.log("\n💡 Run without --dry-run to create these in Medusa");
    return;
  }
  
  // Create types
  console.log("\n🚀 Creating product types...");
  const createdTypes: MedusaProductType[] = [];
  
  for (const type of typesToCreate) {
    const created = await createProductType(type.value, { description: type.description });
    if (created) {
      createdTypes.push(created);
      console.log(`   ✅ Created: ${created.value} (${created.id})`);
    }
  }
  
  // Create tags
  console.log("\n🚀 Creating product tags...");
  const createdTags: MedusaProductTag[] = [];
  
  for (const tag of tagsToCreate) {
    const created = await createProductTag(tag.value);
    if (created) {
      createdTags.push(created);
      console.log(`   ✅ Created: ${created.value} (${created.id})`);
    }
  }
  
  // Output mapping for reference
  console.log("\n" + "═".repeat(60));
  console.log("📋 Type ID Mapping (for push-to-medusa.ts):");
  console.log("─".repeat(60));
  
  const allTypes = [...existingTypes, ...createdTypes];
  console.log("const PRODUCT_TYPE_IDS = {");
  for (const type of allTypes) {
    const key = type.value.replace(/\s+/g, "_").replace(/&/g, "and").toUpperCase();
    console.log(`  "${type.value}": "${type.id}",`);
  }
  console.log("};");
  
  console.log("\n📋 Tag ID Mapping:");
  console.log("─".repeat(60));
  
  const allTags = [...existingTags, ...createdTags];
  console.log("const PRODUCT_TAG_IDS = {");
  for (const tag of allTags) {
    console.log(`  "${tag.value}": "${tag.id}",`);
  }
  console.log("};");
  
  console.log("\n" + "═".repeat(60));
  console.log(`✅ Created ${createdTypes.length} types and ${createdTags.length} tags`);
}

main().catch(console.error);
