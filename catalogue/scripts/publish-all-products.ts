/**
 * Publish All Products in Medusa
 * 
 * Changes status from 'draft' to 'published' for all products.
 * Products must be published to appear on the storefront.
 * 
 * Usage: npx tsx scripts/publish-all-products.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

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

interface Product {
  id: string;
  title: string;
  status: string;
}

async function getAllProducts(): Promise<Product[]> {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products?fields=id,title,status&limit=100`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch products');
    return [];
  }

  const data = await response.json();
  return data.products || [];
}

async function publishProduct(productId: string): Promise<boolean> {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'published' }),
  });

  return response.ok;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Publish All Products');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!await authenticate()) {
    process.exit(1);
  }

  const products = await getAllProducts();
  console.log(`📦 Found ${products.length} products\n`);

  const draftProducts = products.filter(p => p.status === 'draft');
  console.log(`📝 ${draftProducts.length} products in draft status\n`);

  if (draftProducts.length === 0) {
    console.log('✅ All products are already published!');
    return;
  }

  let published = 0;
  let failed = 0;

  for (const product of draftProducts) {
    const success = await publishProduct(product.id);
    if (success) {
      console.log(`✅ Published: ${product.title}`);
      published++;
    } else {
      console.log(`❌ Failed: ${product.title}`);
      failed++;
    }
    // Small delay
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   Done! Published: ${published}, Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
