#!/usr/bin/env node

/**
 * Bulk Inventory Level Fix
 *
 * Creates missing inventory_level records for all variants that have
 * inventory_items but no inventory_levels. This is the root cause of
 * products showing "out of stock" on the storefront.
 *
 * Usage:
 *   node scripts/bulk-fix-inventory-levels.mjs [--dry-run] [--batch-size N]
 */

import fs from "node:fs";
import path from "node:path";

// ─── Config ──────────────────────────────────────────────────────

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB"; // European Warehouse
const DEFAULT_STOCK_QUANTITY = 1_000_000; // dropshipping: effectively unlimited

// ─── Args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const batchIdx = args.indexOf("--batch-size");
const BATCH_SIZE = batchIdx !== -1 ? Number(args[batchIdx + 1]) || 50 : 50;

// ─── Env ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

// ─── Medusa Auth ──────────────────────────────────────────────────

async function getMedusaJwt() {
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD");

  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function medusaFetch(jwt, endpoint, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(new URL(endpoint, MEDUSA_URL), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        ...options.headers,
      },
    });
    const body = await res.text();
    let json;
    try { json = JSON.parse(body); } catch { json = null; }
    if (!res.ok) {
      const msg = json?.message || json?.error || body.slice(0, 300);
      // Retry on transient server errors
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        const wait = attempt * 2000;
        console.log(`      ⏳ ${res.status} on ${endpoint.slice(0, 60)}... retry ${attempt}/${retries} in ${wait/1000}s`);
        await sleep(wait);
        continue;
      }
      throw new Error(`Medusa ${res.status}: ${msg}`);
    }
    return json;
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       Bulk Inventory Level Fix                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Medusa:          ${MEDUSA_URL}`);
  console.log(`  Stock Location:  ${STOCK_LOCATION_ID}`);
  console.log(`  Quantity:        ${DEFAULT_STOCK_QUANTITY.toLocaleString()}`);
  console.log(`  Batch Size:      ${BATCH_SIZE}`);
  console.log(`  Dry Run:         ${DRY_RUN}`);
  console.log();

  // 1. Authenticate
  console.log("🔐 Authenticating...");
  const jwt = await getMedusaJwt();
  console.log("   ✓ Authenticated\n");

  // 2. Fetch ALL products with their variants + inventory items
  console.log("📦 Fetching products with inventory data...");
  let allProducts = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const data = await medusaFetch(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,status,*variants,*variants.inventory_items`
    );
    const products = data.products || [];
    allProducts.push(...products);
    console.log(`   Fetched ${allProducts.length} products...`);
    if (products.length < limit) break;
    offset += limit;
    await sleep(200); // gentle rate limiting
  }

  console.log(`   ✓ ${allProducts.length} products loaded\n`);

  // 3. Find all inventory_items that need levels created
  const itemsToFix = [];
  let productsWithIssues = 0;
  let productsAlreadyOk = 0;
  let productsNoVariants = 0;

  for (const product of allProducts) {
    const variants = product.variants || [];
    if (variants.length === 0) {
      productsNoVariants++;
      continue;
    }

    let productHasIssue = false;
    for (const variant of variants) {
      const invItems = variant.inventory_items || [];
      for (const link of invItems) {
        const itemId = link.inventory_item_id || link.inventory?.id;
        if (!itemId) continue;

        // We need to check if this inventory_item already has a level at our location
        // We'll batch-check this via the API
        itemsToFix.push({
          inventory_item_id: itemId,
          product_id: product.id,
          product_title: product.title,
          variant_id: variant.id,
          variant_title: variant.title,
          sku: variant.sku,
        });
        productHasIssue = true;
      }
    }

    if (productHasIssue) productsWithIssues++;
    else productsAlreadyOk++;
  }

  console.log(`  📊 ${itemsToFix.length} inventory items to check`);
  console.log(`     ${productsWithIssues} products with inventory items`);
  console.log(`     ${productsNoVariants} products with no variants`);
  console.log(`     ${productsAlreadyOk} products already OK\n`);

  // 4. Check each inventory item for existing levels and create missing ones
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  console.log("🔧 Processing inventory items...\n");

  for (let i = 0; i < itemsToFix.length; i += BATCH_SIZE) {
    const batch = itemsToFix.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(itemsToFix.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} (items ${i + 1}-${Math.min(i + BATCH_SIZE, itemsToFix.length)} of ${itemsToFix.length})`);

    for (const item of batch) {
      try {
        // Check if level already exists
        const invData = await medusaFetch(
          jwt,
          `/admin/inventory-items/${item.inventory_item_id}?fields=*location_levels`
        );

        const levels = invData.inventory_item?.location_levels || [];
        const hasLevel = levels.some((l) => l.location_id === STOCK_LOCATION_ID);

        if (hasLevel) {
          skipped++;
          continue;
        }

        if (DRY_RUN) {
          created++;
          continue;
        }

        // Create the missing level
        await medusaFetch(
          jwt,
          `/admin/inventory-items/${item.inventory_item_id}/location-levels`,
          {
            method: "POST",
            body: JSON.stringify({
              location_id: STOCK_LOCATION_ID,
              stocked_quantity: DEFAULT_STOCK_QUANTITY,
            }),
          }
        );
        created++;
      } catch (err) {
        failed++;
        errors.push({
          inventory_item_id: item.inventory_item_id,
          product: item.product_title,
          sku: item.sku,
          error: err.message?.slice(0, 150),
        });
      }
    }

    const progress = Math.round(((i + batch.length) / itemsToFix.length) * 100);
    console.log(`    ✓ Progress: ${progress}% | Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
    
    // Small delay between batches
    if (i + BATCH_SIZE < itemsToFix.length) await sleep(300);
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════════════════");
  console.log("  INVENTORY FIX SUMMARY");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total items checked:   ${itemsToFix.length}`);
  console.log(`  Levels created:        ${created}${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`  Already had levels:    ${skipped}`);
  console.log(`  Failed:                ${failed}`);
  console.log("═══════════════════════════════════════════════");

  if (errors.length > 0) {
    console.log(`\n⚠ Errors (${errors.length}):`);
    for (const e of errors.slice(0, 20)) {
      console.log(`  - ${e.sku || e.inventory_item_id}: ${e.error}`);
    }
    if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  }

  // Write report
  const reportPath = path.join("reports", `bulk-inventory-fix-${new Date().toISOString().slice(0, 10)}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { medusaUrl: MEDUSA_URL, stockLocationId: STOCK_LOCATION_ID, quantity: DEFAULT_STOCK_QUANTITY, dryRun: DRY_RUN },
    summary: { total: itemsToFix.length, created, skipped, failed },
    errors: errors.length > 0 ? errors : undefined,
  }, null, 2));
  console.log(`\n📄 Report: ${reportPath}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
