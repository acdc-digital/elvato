#!/usr/bin/env npx tsx
/**
 * Get a product from Medusa and display its details
 * Usage: npx tsx scripts/get-medusa-product.ts <medusa-product-id>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

async function main() {
  const productId = process.argv[2];
  
  if (!productId) {
    console.error('Usage: npx tsx scripts/get-medusa-product.ts <medusa-product-id>');
    process.exit(1);
  }
  
  // Get auth token
  const authRes = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: MEDUSA_ADMIN_EMAIL, 
      password: MEDUSA_ADMIN_PASSWORD 
    })
  });
  
  const { token } = await authRes.json();
  
  // Get product with variants
  const productRes = await fetch(
    `${MEDUSA_BACKEND_URL}/admin/products/${productId}?fields=*variants`, 
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  if (!productRes.ok) {
    console.error('Failed to get product:', await productRes.text());
    process.exit(1);
  }
  
  const { product } = await productRes.json();
  
  console.log('\n📦 Product Details:');
  console.log('═══════════════════════════════════════════');
  console.log('ID:            ', product.id);
  console.log('Title:         ', product.title);
  console.log('Material:      ', product.material || '(not set)');
  console.log('Origin Country:', product.origin_country || '(not set)');
  console.log('External ID:   ', product.external_id || '(not set)');
  console.log('Weight:        ', product.weight || '(not set)');
  console.log('Length:        ', product.length || '(not set)');
  console.log('Width:         ', product.width || '(not set)');
  console.log('Height:        ', product.height || '(not set)');
  
  console.log('\n📊 Variants:');
  console.log('═══════════════════════════════════════════');
  
  for (const variant of product.variants || []) {
    console.log(`\n  ${variant.title} (${variant.sku})`);
    console.log('    Weight:', variant.weight ?? '(not set)');
    console.log('    Length:', variant.length ?? '(not set)');
    console.log('    Width: ', variant.width ?? '(not set)');
    console.log('    Height:', variant.height ?? '(not set)');
  }
}

main().catch(console.error);
