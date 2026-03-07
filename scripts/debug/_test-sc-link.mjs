#!/usr/bin/env node

/**
 * Test different Medusa v2 endpoints to add a product to a sales channel
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const SALES_CHANNEL_ID = "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z";
// A known product missing the sales channel
const TEST_PRODUCT_ID = "prod_01KJK5WG6WWRHXSQX9VF2M0KMD";

for (const p of ["admin/.env", "storefront/.env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq).trim()]) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

async function main() {
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token } = await authRes.json();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Check current state
  const before = await fetch(
    `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
    { headers }
  ).then(r => r.json());
  console.log("Before:", JSON.stringify(before.product?.sales_channels?.map(sc => sc.id)));

  // Approach 1: POST /admin/sales-channels/:sc_id/products with {add: [product_id]}
  console.log("\n--- Approach 1: POST /admin/sales-channels/:id/products {add:[...]} ---");
  const r1 = await fetch(
    `${MEDUSA_URL}/admin/sales-channels/${SALES_CHANNEL_ID}/products`,
    { method: "POST", headers, body: JSON.stringify({ add: [TEST_PRODUCT_ID] }) }
  );
  console.log("  Status:", r1.status);
  const b1 = await r1.text();
  console.log("  Body:", b1.slice(0, 300));

  // Check
  const after1 = await fetch(
    `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
    { headers }
  ).then(r => r.json());
  console.log("  After:", JSON.stringify(after1.product?.sales_channels?.map(sc => sc.id)));

  // If still empty, try Approach 2: POST /admin/sales-channels/:sc_id/products/batch with {add: [{id: product_id}]}
  if (!(after1.product?.sales_channels || []).length) {
    console.log("\n--- Approach 2: POST .../products/batch {add:[{id:...}]} ---");
    const r2 = await fetch(
      `${MEDUSA_URL}/admin/sales-channels/${SALES_CHANNEL_ID}/products/batch`,
      { method: "POST", headers, body: JSON.stringify({ add: [{ id: TEST_PRODUCT_ID }] }) }
    );
    console.log("  Status:", r2.status);
    const b2 = await r2.text();
    console.log("  Body:", b2.slice(0, 300));

    const after2 = await fetch(
      `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
      { headers }
    ).then(r => r.json());
    console.log("  After:", JSON.stringify(after2.product?.sales_channels?.map(sc => sc.id)));
  }

  // If still empty, try Approach 3: Use the product update with sales_channels
  const after2check = await fetch(
    `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
    { headers }
  ).then(r => r.json());
  
  if (!(after2check.product?.sales_channels || []).length) {
    console.log("\n--- Approach 3: POST /admin/products/:id {sales_channels:[{id:...}]} ---");
    const r3 = await fetch(
      `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}`,
      { method: "POST", headers, body: JSON.stringify({ sales_channels: [{ id: SALES_CHANNEL_ID }] }) }
    );
    console.log("  Status:", r3.status);
    const b3 = await r3.text();
    console.log("  Body:", b3.slice(0, 300));
  }

  // Final approach 4: POST /admin/products/:id/sales-channels but with correct body
  const after3check = await fetch(
    `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
    { headers }
  ).then(r => r.json());
  
  if (!(after3check.product?.sales_channels || []).length) {
    console.log("\n--- Approach 4: Try link-style batch ---");
    // Try POST to /admin/sales-channels/:id/products with body {product_ids: [...]}
    const r4 = await fetch(
      `${MEDUSA_URL}/admin/sales-channels/${SALES_CHANNEL_ID}/products`,
      { method: "POST", headers, body: JSON.stringify({ product_ids: [TEST_PRODUCT_ID] }) }
    );
    console.log("  Status:", r4.status);
    const b4 = await r4.text();
    console.log("  Body:", b4.slice(0, 300));
  }

  // Check Store API
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  const storeCheck = await fetch(
    `${MEDUSA_URL}/store/products/${TEST_PRODUCT_ID}?fields=id,title`,
    { headers: { "x-publishable-api-key": pk } }
  );
  console.log("\nStore API status:", storeCheck.status);

  // Final state
  const finalCheck = await fetch(
    `${MEDUSA_URL}/admin/products/${TEST_PRODUCT_ID}?fields=id,title,*sales_channels`,
    { headers }
  ).then(r => r.json());
  console.log("\nFinal sales_channels:", JSON.stringify(finalCheck.product?.sales_channels?.map(sc => ({id: sc.id, name: sc.name}))));
}

main().catch(console.error);
