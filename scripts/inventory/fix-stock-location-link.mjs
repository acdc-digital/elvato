#!/usr/bin/env node

/**
 * Fix: Link stock location to the default sales channel and (optionally)
 * create a fulfillment set so the Store API can resolve inventory.
 *
 * Root cause: stock location "European Warehouse" is not linked to any
 * sales channel, so the Medusa Store API does not include inventory from
 * that location and every product appears "out of stock".
 *
 * Usage:
 *   node scripts/fix-stock-location-link.mjs [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB";
const SALES_CHANNEL_ID = "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z";

const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env"),
  ];
  for (const p of envPaths) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
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

async function getJwt() {
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD");
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status})`);
  const { token } = await res.json();
  return token;
}

async function adminFetch(jwt, endpoint, options = {}) {
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
  if (!res.ok) throw new Error(`Medusa ${res.status}: ${json?.message || body.slice(0, 300)}`);
  return json;
}

async function main() {
  loadEnv();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Fix Stock Location → Sales Channel Link                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Stock Location:  ${STOCK_LOCATION_ID}`);
  console.log(`  Sales Channel:   ${SALES_CHANNEL_ID}`);
  console.log(`  Dry Run:         ${DRY_RUN}`);
  console.log();

  const jwt = await getJwt();
  console.log("🔐 Authenticated\n");

  // 1. Check current state
  console.log("📍 Current stock location state:");
  const slData = await adminFetch(jwt, `/admin/stock-locations/${STOCK_LOCATION_ID}`);
  const sl = slData.stock_location;
  console.log(`  Name: ${sl.name}`);
  console.log(`  Sales channels: ${(sl.sales_channels || []).length}`);
  console.log(`  Fulfillment sets: ${(sl.fulfillment_sets || []).length}`);

  const alreadyLinked = (sl.sales_channels || []).some(sc => sc.id === SALES_CHANNEL_ID);
  if (alreadyLinked) {
    console.log(`\n  ✓ Stock location is already linked to sales channel ${SALES_CHANNEL_ID}`);
  }

  // 2. Link stock location to sales channel
  if (!alreadyLinked) {
    console.log(`\n🔗 Linking stock location to sales channel...`);
    if (DRY_RUN) {
      console.log("   (dry run — would POST to link endpoint)");
    } else {
      // Use the Medusa Admin API to associate sales channel with stock location
      await adminFetch(jwt, `/admin/stock-locations/${STOCK_LOCATION_ID}/sales-channels`, {
        method: "POST",
        body: JSON.stringify({ add: [SALES_CHANNEL_ID] }),
      });
      console.log("   ✓ Stock location linked to sales channel!");
    }
  }

  // 3. Verify the link
  if (!DRY_RUN) {
    console.log("\n🔍 Verifying...");
    const verify = await adminFetch(jwt, `/admin/stock-locations/${STOCK_LOCATION_ID}`);
    const vsl = verify.stock_location;
    const linked = (vsl.sales_channels || []).some(sc => sc.id === SALES_CHANNEL_ID);
    console.log(`  Sales channels: ${JSON.stringify((vsl.sales_channels || []).map(sc => ({ id: sc.id, name: sc.name })))}`);
    console.log(`  ${linked ? "✓ LINKED" : "❌ NOT LINKED"}`);

    // 4. Quick Store API check — pick a random product and see if inventory_quantity changes
    console.log("\n🏪 Quick Store API verification...");
    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    if (pubKey) {
      // Get region
      const regData = await adminFetch(jwt, `/admin/regions?limit=10`);
      const usRegion = (regData.regions || []).find(r => (r.countries || []).some(c => c.iso_2 === "us")) || regData.regions?.[0];
      
      // Fetch a published product via Store API
      const storeRes = await fetch(
        new URL(`/store/products?limit=5&fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory&region_id=${usRegion?.id || ""}`, MEDUSA_URL),
        { headers: { "x-publishable-api-key": pubKey } }
      );
      const storeData = await storeRes.json();
      const products = storeData.products || [];
      
      let inStockCount = 0;
      let totalVariants = 0;
      for (const p of products) {
        for (const v of p.variants || []) {
          totalVariants++;
          if (!v.manage_inventory || (v.inventory_quantity || 0) > 0) inStockCount++;
        }
      }
      
      console.log(`  Checked ${products.length} products, ${totalVariants} variants → ${inStockCount} in stock`);
      if (inStockCount >= totalVariants && totalVariants > 0) {
        console.log("  ✓ Store API now returns inventory! Products should be in stock.");
      } else if (inStockCount < totalVariants) {
        console.log("  ⚠ Some variants still show out of stock. May need fulfillment set setup.");
      }
    }
  }

  console.log("\n✅ Done!");
}

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
