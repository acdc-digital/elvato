#!/usr/bin/env npx tsx
/**
 * Delete a product from Medusa
 * Usage: npx tsx scripts/delete-medusa-product.ts <medusa-product-id>
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
    console.error('Usage: npx tsx scripts/delete-medusa-product.ts <medusa-product-id>');
    console.error('Example: npx tsx scripts/delete-medusa-product.ts prod_01KF3YR9WK4S2638FNRM1SJW94');
    process.exit(1);
  }
  
  if (!MEDUSA_ADMIN_EMAIL || !MEDUSA_ADMIN_PASSWORD) {
    console.error('MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set');
    process.exit(1);
  }
  
  console.log(`\n🔑 Authenticating with Medusa...`);
  
  // Get auth token
  const authRes = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: MEDUSA_ADMIN_EMAIL, 
      password: MEDUSA_ADMIN_PASSWORD 
    })
  });
  
  if (!authRes.ok) {
    console.error('❌ Authentication failed:', await authRes.text());
    process.exit(1);
  }
  
  const { token } = await authRes.json();
  console.log('✅ Authenticated');
  
  console.log(`\n🗑️  Deleting product ${productId}...`);
  
  // Delete product
  const deleteRes = await fetch(`${MEDUSA_BACKEND_URL}/admin/products/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (deleteRes.ok) {
    console.log('✅ Product deleted successfully');
  } else {
    const body = await deleteRes.text();
    console.error(`❌ Failed to delete: ${deleteRes.status}`);
    console.error(body);
    process.exit(1);
  }
}

main().catch(console.error);
