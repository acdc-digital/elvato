#!/usr/bin/env node

/**
 * Check what Store API returns for specific out-of-stock products
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";

// Load env
for (const p of ["admin/.env", "storefront/.env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// Sample of reported OOS products
const SAMPLE_TITLES = [
  "Modern Gold Wall Sconce - Luxury Minimalist Design",
  "Motion Sensor LED Night Light",
  "Modern Bedroom Pendant Light with Geometric Design",
  "Nordic Style Minimalist Floor Lamp for Living Room",
  "Creative Art Sculptural Chandelier",
  "Modern Minimalist Bedside Table Lamp",
  "Solar LED Garden Light with Motion Sensor",
];

async function main() {
  // Auth for admin
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token: jwt } = await authRes.json();

  // Get region
  const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
    headers: { "x-publishable-api-key": PK },
  });
  const regData = await regRes.json();
  const usRegion = (regData.regions || []).find(
    (r) => r.currency_code === "usd"
  );
  console.log(`Region: ${usRegion?.name} (${usRegion?.id})\n`);

  // Search for each product via Admin API to get its ID/handle
  for (const title of SAMPLE_TITLES) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`📦 "${title}"`);
    console.log("═".repeat(70));

    // Search by title via admin
    const searchRes = await fetch(
      `${MEDUSA_URL}/admin/products?q=${encodeURIComponent(title)}&limit=1&fields=id,title,handle,status`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const searchData = await searchRes.json();
    const product = searchData.products?.[0];

    if (!product) {
      console.log("  ⚠ Not found in admin");
      continue;
    }

    console.log(`  Admin: id=${product.id}, status=${product.status}, handle=${product.handle}`);

    // Get full product from Admin with variant + inventory details
    const adminDetailRes = await fetch(
      `${MEDUSA_URL}/admin/products/${product.id}?fields=id,title,status,*variants.id,*variants.title,*variants.manage_inventory,*variants.allow_backorder,*variants.inventory_quantity`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const adminDetail = await adminDetailRes.json();
    const adminVariants = adminDetail.product?.variants || [];

    console.log(`\n  ADMIN API variants (${adminVariants.length}):`);
    for (const v of adminVariants) {
      console.log(
        `    "${v.title}" → qty=${v.inventory_quantity}, manage=${v.manage_inventory}, backorder=${v.allow_backorder}`
      );
    }

    // Now check via Store API (what the storefront actually sees)
    const storeRes = await fetch(
      `${MEDUSA_URL}/store/products/${product.id}?fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder&region_id=${usRegion?.id || ""}`,
      { headers: { "x-publishable-api-key": PK } }
    );

    if (!storeRes.ok) {
      const errText = await storeRes.text();
      console.log(`\n  STORE API: ❌ ${storeRes.status} — ${errText.slice(0, 200)}`);
      continue;
    }

    const storeData = await storeRes.json();
    const storeVariants = storeData.product?.variants || [];

    console.log(`\n  STORE API variants (${storeVariants.length}):`);
    for (const v of storeVariants) {
      const inStock =
        !v.manage_inventory ||
        v.allow_backorder ||
        (v.inventory_quantity || 0) > 0;
      console.log(
        `    "${v.title}" → qty=${v.inventory_quantity}, manage=${v.manage_inventory}, backorder=${v.allow_backorder} → ${inStock ? "✓ IN STOCK" : "❌ OUT OF STOCK"}`
      );
    }

    // If OOS, check the inventory item levels
    for (const v of adminVariants) {
      if (v.manage_inventory && (v.inventory_quantity ?? 0) <= 0) {
        // Get inventory items for this variant
        const iiRes = await fetch(
          `${MEDUSA_URL}/admin/products/${product.id}/variants/${v.id}/inventory-items`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        if (iiRes.ok) {
          const iiData = await iiRes.json();
          console.log(`\n  Inventory items for variant "${v.title}":`);
          console.log(`    ${JSON.stringify(iiData).slice(0, 500)}`);
        }
      }
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Broader stats: sample 50 published products
  console.log(`\n\n${"═".repeat(70)}`);
  console.log("BROADER STORE API SCAN (first 50 published products)");
  console.log("═".repeat(70));

  const broadRes = await fetch(
    `${MEDUSA_URL}/store/products?limit=50&fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory&region_id=${usRegion?.id || ""}`,
    { headers: { "x-publishable-api-key": PK } }
  );
  const broadData = await broadRes.json();
  const products = broadData.products || [];
  const count = broadData.count || 0;

  let totalV = 0;
  let oosV = 0;
  let oosProducts = [];

  for (const p of products) {
    let productOos = true;
    for (const v of p.variants || []) {
      totalV++;
      const inStock =
        !v.manage_inventory ||
        v.allow_backorder ||
        (v.inventory_quantity || 0) > 0;
      if (!inStock) {
        oosV++;
      } else {
        productOos = false;
      }
    }
    if (productOos && (p.variants || []).length > 0) {
      oosProducts.push(p.title);
    }
  }

  console.log(`  Total products in store: ${count}`);
  console.log(`  Checked: ${products.length} products, ${totalV} variants`);
  console.log(`  Out-of-stock variants: ${oosV}/${totalV}`);
  console.log(`  Fully OOS products: ${oosProducts.length}/${products.length}`);

  if (oosProducts.length > 0) {
    console.log(`\n  OOS products in sample:`);
    for (const t of oosProducts.slice(0, 10)) console.log(`    - ${t}`);
    if (oosProducts.length > 10) console.log(`    ... and ${oosProducts.length - 10} more`);
  }
}

main().catch(console.error);
