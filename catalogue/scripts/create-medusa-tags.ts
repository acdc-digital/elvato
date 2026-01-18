#!/usr/bin/env npx tsx
/**
 * Create Product Tags in Medusa for all subcategories + LED
 * 
 * This creates 295 tags:
 * - 294 subcategory tags (e.g., "Modern", "Nordic Style", "Crystal", etc.)
 * - 1 LED tag (already exists, will be preserved)
 * 
 * Usage: npx tsx scripts/create-medusa-tags.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@medusa-test.com';
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'supersecret';

// LED tag ID from previous creation
const LED_TAG_ID = 'ptag_01KF7331G5EQDVAC94SFNADA62';

// All unique subcategories from our products
const SUBCATEGORIES = [
  "Accent", "Accent Lamps", "Accent Lighting", "Accent Lights", "Acrylic", 
  "Acrylic Fixtures", "Adjustable", "Adjustable Lamps", "Ambient", "Ambient Lighting",
  "American Style", "Animal", "Animal Themed", "Antler Fixtures", "Arc Lamps",
  "Aromatherapy", "Art Deco", "Art Glass", "Artisan", "Artistic",
  "Asian Inspired", "Asian Style", "Asian-Inspired", "Atmosphere Lamps", "Automotive",
  "Balcony", "Bamboo", "Bamboo Accessories", "Bamboo Fixtures", "Bar Lighting",
  "Bathroom", "Bathroom Mirrors", "Battery Operated", "Bedroom", "Bedroom Lights",
  "Bedside", "Bedside Lamps", "Bedside Lighting", "Bedside Lights", "Bedside Pendants",
  "Black Metal", "Bluetooth Speakers", "Bohemian", "Bohemian Style", "Boho",
  "Boho Style", "Botanical", "Bowl Style", "Brass", "Brass Fixtures",
  "Bronze", "Butterfly", "Cafe & Restaurant", "Cartoon", "Ceiling",
  "Ceiling Fans", "Ceiling Fixtures", "Ceiling Lights", "Ceiling Mount", "Ceiling Mounted",
  "Ceramic", "Chandeliers", "Classic", "Classical", "Coastal",
  "Colonial Style", "Color Changing", "Colored Fixtures", "Colored Glass", "Colorful",
  "Commercial", "Concrete", "Connected Lighting", "Contemporary", "Contemporary Sconces",
  "Copper", "Copper Accents", "Copper Fixtures", "Copper/Brass", "Corner Lamps",
  "Corridor", "Corridor Lights", "Country Style", "Covered Areas", "Creative",
  "Creative Design", "Crystal", "Crystal Fixtures", "Custom", "Decorative",
  "Decorative Lamps", "Designer", "Desk Lamps", "Dimmable", "Dining Room",
  "Downlights", "Edison Style", "Ethnic", "European Style", "Exterior",
  "Eye Care", "Fabric", "Fairy Lights", "Farmhouse", "Farmhouse Style",
  "Feather", "Festive", "Fire/Flame Effect", "Flameless", "Floor Lamps",
  "Floral", "Flush Mount", "Folding", "French Country", "French Style",
  "Frosted Glass", "Functional", "Futuristic", "Garden", "Garden Decor",
  "Garden Lighting", "Geometric", "Gift Items", "Glass", "Glass Fixtures",
  "Globe Style", "Gold Finish", "Gothic", "Ground Lights", "Hallway",
  "Hallway Lights", "Hanging", "Hanging Decor", "Himalayan Salt", "Holiday",
  "Holiday Lighting", "Home Decor", "Home Office", "Hotel Style", "Industrial",
  "Island Lights", "Japanese Style", "Kids Room", "Kitchen", "Kitchen Pendants",
  "Lamp Bases", "Landscape", "Lantern Style", "Lanterns", "Large",
  "Laundry Room", "LED", "LED Fixtures", "LED Strip", "Lighting",
  "Linear", "Living Room", "Loft Style", "Long Pendants", "Luxury",
  "Luxury Fixtures", "Macrame", "Marble", "Mediterranean", "Metal",
  "Metal Fixtures", "Mid-Century", "Mid-Century Modern", "Minimalist", "Modern",
  "Moroccan", "Motion Sensor", "Multi-Head", "Multi-Light", "Music Sync",
  "Natural", "Natural Materials", "Nautical", "Neon Signs", "Night Lights",
  "Nordic", "Nordic Style", "Novelty", "Nursery", "Office",
  "Ornate", "Outdoor", "Outdoor Decor", "Outdoor Living", "Outdoor Walls",
  "Paper", "Party Lights", "Pathway", "Pathway Lights", "Patio",
  "Pendant", "Pendant Lights", "Picture Lights", "Plug-In", "Pool Area",
  "Porch", "Portable", "Post Lights", "Postmodern", "Projection",
  "Rattan", "Reading Lamps", "Rechargeable", "Reclaimed Materials", "Remote Control",
  "Restaurant", "Retro", "Ring Style", "Romantic", "Rope",
  "Rustic", "Rustic Style", "Scandinavian", "Sconces", "Sculptural",
  "Semi-Flush", "Sensor Lights", "Shabby Chic", "Shades", "Simple",
  "Single Pendant", "Smart", "Smart Home", "Smart Lighting", "Solar",
  "Solar Lights", "Solar Powered", "Specialty", "Spiral", "Spotlights",
  "Stained Glass", "Staircase", "Staircase Lights", "Stairway", "Steampunk",
  "String Lights", "Study", "Study Lamps", "Swing Arm", "Table Lamps",
  "Task Lighting", "Task Lights", "Themed", "Tiffany Style", "Touch Control",
  "Traditional", "Traditional Style", "Tree Lights", "Tripod Lamps", "Tropical",
  "Tube Lights", "Underwater", "Unique", "Uplights", "Urban",
  "USB Powered", "Vanity", "Vanity Lighting", "Vanity Lights", "Vanity Mirrors",
  "Victorian", "Village Style", "Vintage", "Vintage Style", "Wall",
  "Wall Art", "Wall Decor", "Wall Fixtures", "Wall Lamps", "Wall Mounted",
  "Wall Sconces", "Waterproof", "Weatherproof", "Wedding", "Wedding Decor",
  "Wireless", "Wood", "Wood Fixtures", "Wooden", "Wrought Iron"
];

let authToken = '';

async function authenticate(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!response.ok) {
      console.error(`Authentication failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Authenticated with Medusa Admin API');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

async function getExistingTags(): Promise<Map<string, string>> {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/product-tags?limit=500`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
  });
  
  if (!response.ok) {
    console.error('Failed to fetch existing tags');
    return new Map();
  }
  
  const data = await response.json();
  const tagMap = new Map<string, string>();
  
  for (const tag of data.product_tags || []) {
    tagMap.set(tag.value, tag.id);
  }
  
  console.log(`📋 Found ${tagMap.size} existing tags`);
  return tagMap;
}

async function createTag(value: string): Promise<{ id: string; value: string } | null> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/product-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Failed to create tag "${value}": ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();
    return { id: data.product_tag.id, value: data.product_tag.value };
  } catch (error) {
    console.error(`   ❌ Error creating tag "${value}":`, error);
    return null;
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Create Medusa Product Tags for Subcategories');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const authenticated = await authenticate();
  if (!authenticated) {
    process.exit(1);
  }
  
  // Get existing tags to avoid duplicates
  const existingTags = await getExistingTags();
  
  // Track all tags (existing + new)
  const allTags = new Map<string, string>(existingTags);
  
  // Create missing tags
  const tagsToCreate = SUBCATEGORIES.filter(sub => !existingTags.has(sub));
  
  console.log(`\n📝 Need to create ${tagsToCreate.length} new tags`);
  console.log(`   (${existingTags.size} already exist, including LED)`);
  console.log('');
  
  let created = 0;
  let failed = 0;
  
  for (let i = 0; i < tagsToCreate.length; i++) {
    const tagValue = tagsToCreate[i];
    
    // Progress every 20 tags
    if (i % 20 === 0 && i > 0) {
      console.log(`   Progress: ${i}/${tagsToCreate.length} tags processed...`);
    }
    
    const result = await createTag(tagValue);
    if (result) {
      allTags.set(result.value, result.id);
      created++;
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Done! Created: ${created}, Failed: ${failed}`);
  console.log(`   Total tags: ${allTags.size}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Output tag IDs for use in push script
  console.log('// Tag IDs for push-to-medusa.ts:');
  console.log('const SUBCATEGORY_TAG_IDS: Record<string, string> = {');
  for (const [value, id] of allTags.entries()) {
    console.log(`  "${value}": "${id}",`);
  }
  console.log('};');
}

main().catch(console.error);
