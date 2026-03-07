#!/usr/bin/env node

/**
 * Check the 45 OOS products + 37 no-variant products to understand
 * their admin-side state (variants, inventory items, manage_inventory)
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";

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
  const { token: jwt } = await authRes.json();
  const headers = { Authorization: `Bearer ${jwt}` };

  // Load report
  const report = JSON.parse(fs.readFileSync("reports/post-fix-scan.json", "utf-8"));

  // Check a sample of OOS products (variants with null qty)
  const oosProducts = report.productsOos || [];
  const noVarProducts = report.productsNoVariants || [];

  console.log("═══════════════════════════════════════════════════");
  console.log("  Checking OOS products via Admin API");
  console.log("═══════════════════════════════════════════════════\n");

  // Check first 5 OOS products
  for (const p of oosProducts.slice(0, 5)) {
    console.log(`\n📦 "${p.title}" (${p.id})`);
    
    // Fetch product with variants
    const res = await fetch(
      `${MEDUSA_URL}/admin/products/${p.id}?fields=id,title,status`,
      { headers }
    );
    const data = await res.json();
    console.log(`  Status: ${data.product?.status}`);

    // Fetch variants separately
    const vRes = await fetch(
      `${MEDUSA_URL}/admin/products/${p.id}/variants?fields=id,title,manage_inventory,allow_backorder,inventory_quantity,*inventory_items`,
      { headers }
    );
    if (!vRes.ok) {
      console.log(`  Variants: error ${vRes.status}`);
      // Try without inventory_items
      const vRes2 = await fetch(
        `${MEDUSA_URL}/admin/products/${p.id}/variants?fields=id,title,manage_inventory,allow_backorder,inventory_quantity`,
        { headers }
      );
      const vData2 = await vRes2.json();
      const variants = vData2.variants || [];
      console.log(`  Variants: ${variants.length}`);
      for (const v of variants.slice(0, 3)) {
        console.log(`    "${v.title}" - manage=${v.manage_inventory}, qty=${v.inventory_quantity}, backorder=${v.allow_backorder}`);
        
        // Check inventory items for this variant
        const iiRes = await fetch(
          `${MEDUSA_URL}/admin/inventory-items?variant_id=${v.id}&limit=5`,
          { headers }
        );
        if (iiRes.ok) {
          const iiData = await iiRes.json();
          console.log(`      inventory_items: ${iiData.inventory_items?.length || 0}`);
          for (const ii of (iiData.inventory_items || []).slice(0, 2)) {
            console.log(`        ${ii.id} - stocked=${ii.stocked_quantity}, reserved=${ii.reserved_quantity}`);
          }
        }
      }
    } else {
      const vData = await vRes.json();
      const variants = vData.variants || [];
      console.log(`  Variants: ${variants.length}`);
      for (const v of variants.slice(0, 3)) {
        console.log(`    "${v.title}" - manage=${v.manage_inventory}, qty=${v.inventory_quantity}, backorder=${v.allow_backorder}`);
        console.log(`      inventory_items: ${JSON.stringify(v.inventory_items?.length)}`);
      }
    }
  }

  // Also check first 3 no-variant products
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("  Checking NO-VARIANT products via Admin API");
  console.log("═══════════════════════════════════════════════════\n");

  for (const p of noVarProducts.slice(0, 5)) {
    console.log(`\n📦 "${p.title}" (${p.id})`);
    
    const res = await fetch(
      `${MEDUSA_URL}/admin/products/${p.id}?fields=id,title,status`,
      { headers }
    );
    const data = await res.json();
    console.log(`  Status: ${data.product?.status}`);

    const vRes = await fetch(
      `${MEDUSA_URL}/admin/products/${p.id}/variants?fields=id,title,manage_inventory,inventory_quantity`,
      { headers }
    );
    if (vRes.ok) {
      const vData = await vRes.json();
      console.log(`  Variants: ${vData.variants?.length || 0}`);
      for (const v of (vData.variants || []).slice(0, 3)) {
        console.log(`    "${v.title}" - manage=${v.manage_inventory}, qty=${v.inventory_quantity}`);
      }
    } else {
      console.log(`  Variants endpoint: ${vRes.status}`);
      // Try different approach - get product with variant expansion
      const pRes = await fetch(
        `${MEDUSA_URL}/admin/products/${p.id}`,
        { headers }
      );
      const pData = await pRes.json();
      console.log(`  Default fetch variants: ${pData.product?.variants?.length || 0}`);
      for (const v of (pData.product?.variants || []).slice(0, 3)) {
        console.log(`    "${v.title}" - manage=${v.manage_inventory}, qty=${v.inventory_quantity}`);
      }
    }
  }
}

main().catch(console.error);
