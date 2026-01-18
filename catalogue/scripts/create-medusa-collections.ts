/**
 * Create Medusa Product Collections
 * 
 * Creates 7 collections that mirror our main product categories:
 * - Chandeliers
 * - Pendants
 * - Wall
 * - Ceiling
 * - Table & Floor
 * - Outdoor
 * - Accessories
 * 
 * Usage: npx tsx scripts/create-medusa-collections.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

// The 7 main product types/categories to create as collections
const COLLECTIONS = [
  { title: "Chandeliers", handle: "chandeliers" },
  { title: "Pendants", handle: "pendants" },
  { title: "Wall", handle: "wall" },
  { title: "Ceiling", handle: "ceiling" },
  { title: "Table & Floor", handle: "table-floor" },
  { title: "Outdoor", handle: "outdoor" },
  { title: "Accessories", handle: "accessories" },
];

let authToken: string | null = null;

async function authenticate(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: MEDUSA_ADMIN_EMAIL,
        password: MEDUSA_ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      console.error('❌ Authentication failed:', response.status);
      return false;
    }

    const result = await response.json();
    authToken = result.token;
    console.log('✅ Authenticated with Medusa Admin API\n');
    return true;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return false;
  }
}

async function getExistingCollections(): Promise<Map<string, string>> {
  const existingCollections = new Map<string, string>();
  
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/collections?limit=100`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      for (const collection of data.collections || []) {
        existingCollections.set(collection.title, collection.id);
      }
    }
  } catch (error) {
    console.error('Error fetching existing collections:', error);
  }

  return existingCollections;
}

async function createCollection(title: string, handle: string): Promise<string | null> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        handle,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create collection "${title}": ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.collection.id;
  } catch (error) {
    console.error(`❌ Error creating collection "${title}":`, error);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Create Medusa Product Collections');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Authenticate
  if (!await authenticate()) {
    process.exit(1);
  }

  // Get existing collections to avoid duplicates
  const existingCollections = await getExistingCollections();
  console.log(`📦 Found ${existingCollections.size} existing collections\n`);

  const collectionIds: Record<string, string> = {};
  let created = 0;
  let skipped = 0;

  for (const { title, handle } of COLLECTIONS) {
    if (existingCollections.has(title)) {
      const existingId = existingCollections.get(title)!;
      console.log(`⏭️  Skipping "${title}" - already exists (${existingId})`);
      collectionIds[title] = existingId;
      skipped++;
    } else {
      const collectionId = await createCollection(title, handle);
      if (collectionId) {
        console.log(`✅ Created "${title}" collection (${collectionId})`);
        collectionIds[title] = collectionId;
        created++;
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   Done! Created: ${created}, Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Output the collection IDs for use in push-to-medusa.ts
  console.log('// Collection IDs for push-to-medusa.ts:');
  console.log('const COLLECTION_IDS: Record<string, string> = {');
  for (const [title, id] of Object.entries(collectionIds)) {
    console.log(`  "${title}": "${id}",`);
  }
  console.log('};');
}

main().catch(console.error);
