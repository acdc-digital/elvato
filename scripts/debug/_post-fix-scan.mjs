#!/usr/bin/env node

/**
 * Post-fix scan: check ALL 803 products for remaining inventory issues.
 * Now that sales channel is fixed, find products still showing out of stock.
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

const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

async function main() {
  // Get region
  const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
    headers: { "x-publishable-api-key": PK },
  });
  const regData = await regRes.json();
  const usRegion = (regData.regions || []).find(r => r.currency_code === "usd");
  console.log(`Region: ${usRegion?.name} (${usRegion?.id})\n`);

  // Scan ALL products via Store API
  console.log("Scanning all products via Store API...\n");

  let offset = 0;
  const limit = 50;
  let totalProducts = 0;
  let totalVariants = 0;
  let productsNoVariants = [];
  let productsOos = [];
  let variantsNullQty = [];
  let variantsZeroQty = [];
  let storeCount = 0;

  while (true) {
    const res = await fetch(
      `${MEDUSA_URL}/store/products?limit=${limit}&offset=${offset}&fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder&region_id=${usRegion.id}`,
      { headers: { "x-publishable-api-key": PK } }
    );
    const data = await res.json();
    storeCount = data.count || storeCount;
    const products = data.products || [];
    
    if (products.length === 0) break;

    for (const p of products) {
      totalProducts++;
      const variants = p.variants || [];

      if (variants.length === 0) {
        productsNoVariants.push({ id: p.id, title: p.title, handle: p.handle });
        continue;
      }

      let allOos = true;
      for (const v of variants) {
        totalVariants++;
        const inStock = !v.manage_inventory || v.allow_backorder || (v.inventory_quantity || 0) > 0;
        
        if (!inStock) {
          if (v.inventory_quantity === null || v.inventory_quantity === undefined) {
            variantsNullQty.push({ product: p.title, variant: v.title, id: v.id });
          } else {
            variantsZeroQty.push({ product: p.title, variant: v.title, qty: v.inventory_quantity });
          }
        } else {
          allOos = false;
        }
      }

      if (allOos) {
        productsOos.push({ id: p.id, title: p.title, variantCount: variants.length });
      }
    }

    if (products.length < limit) break;
    offset += limit;
    process.stdout.write(`  Scanned ${totalProducts}/${storeCount} products...\r`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n${"═".repeat(70)}`);
  console.log("  POST-FIX SCAN RESULTS");
  console.log("═".repeat(70));
  console.log(`  Store product count:          ${storeCount}`);
  console.log(`  Products scanned:             ${totalProducts}`);
  console.log(`  Total variants:               ${totalVariants}`);
  console.log();
  console.log(`  Products with 0 variants:     ${productsNoVariants.length}`);
  console.log(`  Products fully out-of-stock:  ${productsOos.length}`);
  console.log(`  Variants with null qty:       ${variantsNullQty.length}`);
  console.log(`  Variants with qty=0:          ${variantsZeroQty.length}`);

  if (productsNoVariants.length > 0) {
    console.log(`\n  Products with 0 variants (first 20):`);
    for (const p of productsNoVariants.slice(0, 20)) {
      console.log(`    - ${p.title} (${p.id})`);
    }
    if (productsNoVariants.length > 20) console.log(`    ... and ${productsNoVariants.length - 20} more`);
  }

  if (productsOos.length > 0) {
    console.log(`\n  Fully OOS products (first 20):`);
    for (const p of productsOos.slice(0, 20)) {
      console.log(`    - ${p.title} (${p.variantCount} variants)`);
    }
    if (productsOos.length > 20) console.log(`    ... and ${productsOos.length - 20} more`);
  }

  if (variantsNullQty.length > 0) {
    console.log(`\n  Variants with null inventory_quantity (first 20):`);
    for (const v of variantsNullQty.slice(0, 20)) {
      console.log(`    - ${v.product} / ${v.variant}`);
    }
    if (variantsNullQty.length > 20) console.log(`    ... and ${variantsNullQty.length - 20} more`);
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      storeCount,
      scanned: totalProducts,
      totalVariants,
      noVariants: productsNoVariants.length,
      fullyOos: productsOos.length,
      nullQtyVariants: variantsNullQty.length,
      zeroQtyVariants: variantsZeroQty.length,
    },
    productsNoVariants,
    productsOos,
    variantsNullQty: variantsNullQty.slice(0, 100),
    variantsZeroQty: variantsZeroQty.slice(0, 100),
  };
  fs.writeFileSync("reports/post-fix-scan.json", JSON.stringify(report, null, 2));
  console.log(`\n📄 Report: reports/post-fix-scan.json`);
}

main().catch(console.error);
