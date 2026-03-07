#!/usr/bin/env node
// Quick check: what does the Store API return for the gold wall sconce AFTER the price update?
import fs from "node:fs";

const MEDUSA = "https://medusa-backend-production-d681.up.railway.app";
const PK = "pk_42863ea186480a26525362f5366cbb32c22d60bb4fa5d5465b2506b643b11b35";
const HANDLE = "modern-gold-wall-sconce-luxury-minimalist-design-75931392";

// Load env
for (const p of ["admin/.env"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq).trim()])
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

async function main() {
  // 1. Get region
  const regRes = await fetch(`${MEDUSA}/store/regions`, {
    headers: { "x-publishable-api-key": PK },
  });
  const regions = (await regRes.json()).regions || [];
  const usdRegion = regions.find(r => r.currency_code === "usd");
  console.log("USD Region:", usdRegion?.id, usdRegion?.currency_code);

  // 2. Store API — product by handle
  const storeRes = await fetch(
    `${MEDUSA}/store/products?handle=${HANDLE}&region_id=${usdRegion.id}&fields=*variants,*variants.calculated_price,*variants.options,*options,title,handle`,
    { headers: { "x-publishable-api-key": PK } }
  );
  const storeData = await storeRes.json();
  const product = storeData.products?.[0];
  if (!product) { console.log("Product not found"); return; }

  console.log("\n=== STORE API PRODUCT ===");
  console.log("Title:", product.title);
  console.log("Options:", JSON.stringify(product.options?.map(o => ({ title: o.title, values: o.values?.map(v => v.value) })), null, 2));
  console.log("Variants:", product.variants?.length);

  for (const v of product.variants || []) {
    console.log(`\n  Variant: "${v.title}" (${v.id})`);
    console.log("    sku:", v.sku);
    console.log("    manage_inventory:", v.manage_inventory);
    console.log("    allow_backorder:", v.allow_backorder);
    console.log("    inventory_quantity:", v.inventory_quantity);
    console.log("    options:", JSON.stringify(v.options?.map(o => ({ title: o.option?.title, value: o.value }))));
    console.log("    calculated_price:", JSON.stringify(v.calculated_price, null, 2));
  }

  // 3. Admin API — check variant prices directly
  const authRes = await fetch(`${MEDUSA}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.MEDUSA_ADMIN_EMAIL, password: process.env.MEDUSA_ADMIN_PASSWORD }),
  });
  const { token: jwt } = await authRes.json();

  const adminRes = await fetch(
    `${MEDUSA}/admin/products?handle=${HANDLE}&fields=id,title,*variants,*variants.prices`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  const adminData = await adminRes.json();
  const adminProduct = adminData.products?.[0];

  console.log("\n=== ADMIN API PRICES ===");
  for (const v of adminProduct?.variants || []) {
    console.log(`  Variant "${v.title}" (${v.id}):`);
    console.log("    sku:", v.sku);
    console.log("    prices:", JSON.stringify(v.prices, null, 2));
  }
}

main().catch(console.error);
