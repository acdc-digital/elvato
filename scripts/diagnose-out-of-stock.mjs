#!/usr/bin/env node

/**
 * Diagnose why specific products show "out of stock" on the storefront.
 *
 * Checks each product through both Admin and Store APIs to find the gap:
 *   - Does the variant have an inventory_item?
 *   - Does the inventory_item have a location_level at the right stock location?
 *   - Does the location_level have stocked_quantity > 0?
 *   - Does the Store API return inventory_quantity > 0?
 *   - Is the product published (status = "published")?
 *   - Is it assigned to the correct sales channel?
 *
 * Usage:
 *   node scripts/diagnose-out-of-stock.mjs
 */

import fs from "node:fs";
import path from "node:path";

// ─── Config ──────────────────────────────────────────────────────

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB";

// Sample of products reported as out-of-stock (by title)
const SAMPLE_TITLES = [
  "Modern Gold Wall Sconce - Luxury Minimalist Design",
  "Motion Sensor LED Night Light",
  "Modern Bedroom Pendant Light with Geometric Design",
  "Nordic Style Minimalist Floor Lamp for Living Room",
  "Creative Art Sculptural Chandelier",
  "Industrial Bar Retro Chandelier with Vintage Edison Bulbs",
  "Creative Minimalist Planet Table Lamp",
  "Modern Flush Mount Ceiling Light for Hallways",
  "LED Grid Panel Light for Auto Detailing Workshop",
  "Modern Crystal Staircase Chandelier for Duplex Homes",
  "European Baroque Crystal Chandelier - Vintage Elegance",
  "Solar LED Garden Light with Motion Sensor",
  "Wrought Iron LED Pendant Light - Industrial Design",
  "Modern Minimalist Bedside Table Lamp",
];

// ─── Env ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), "storefront", ".env.local"),
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

// ─── Helpers ──────────────────────────────────────────────────────

async function medusaFetch(jwt, endpoint) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  });
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  if (!res.ok) throw new Error(`Medusa ${res.status}: ${json?.message || body.slice(0, 200)}`);
  return json;
}

async function storeFetch(endpoint, pubKey, regionId) {
  const url = new URL(endpoint, MEDUSA_URL);
  if (regionId) url.searchParams.set("region_id", regionId);
  const res = await fetch(url, {
    headers: {
      "x-publishable-api-key": pubKey,
    },
  });
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  if (!res.ok) return { _error: res.status, _message: json?.message || body.slice(0, 200) };
  return json;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD in admin/.env");
  if (!pubKey) throw new Error("Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in storefront/.env.local");

  // 1. Authenticate
  console.log("🔐 Authenticating...");
  const authRes = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!authRes.ok) throw new Error(`Auth failed (${authRes.status})`);
  const { token: jwt } = await authRes.json();
  console.log("   ✓ Authenticated\n");

  // 2. Check stock location <-> sales channel link
  console.log("🏭 Checking infrastructure...\n");
  const slData = await medusaFetch(jwt, `/admin/stock-locations?limit=10`);
  const scData = await medusaFetch(jwt, `/admin/sales-channels?limit=10`);
  const regData = await medusaFetch(jwt, `/admin/regions?limit=10`);

  for (const sl of slData.stock_locations || []) {
    const scLinks = sl.sales_channels || [];
    const ffSets = sl.fulfillment_sets || [];
    console.log(`  Stock Location: ${sl.name} (${sl.id})`);
    console.log(`    Sales channels: ${scLinks.length > 0 ? scLinks.map(s => s.name || s.id).join(", ") : "⚠ NONE"}`);
    console.log(`    Fulfillment sets: ${ffSets.length > 0 ? ffSets.map(f => f.name || f.id).join(", ") : "⚠ NONE"}`);
    if (sl.id === STOCK_LOCATION_ID && scLinks.length === 0) {
      console.log("    ❌ This stock location is NOT linked to any sales channel!");
    }
  }

  console.log();
  for (const sc of scData.sales_channels || []) {
    console.log(`  Sales Channel: ${sc.name} (${sc.id}) | disabled=${sc.is_disabled}`);
  }
  
  console.log();
  for (const r of regData.regions || []) {
    console.log(`  Region: ${r.name} (${r.id}) | currency=${r.currency_code}`);
  }

  // Get the first US region for Store API calls
  const regions = regData.regions || [];
  const usRegion = regions.find(r => (r.countries || []).some(c => c.iso_2 === "us")) || regions[0];
  console.log(`\n  Using region for Store API: ${usRegion?.name} (${usRegion?.id})\n`);

  // 3. Check the publishable key <-> sales channel linkage
  console.log("🔑 Checking publishable API key...");
  const keysData = await medusaFetch(jwt, `/admin/api-keys?limit=10`);
  const pubKeyRecord = keysData.api_keys?.find(k => k.type === "publishable");
  if (pubKeyRecord) {
    // Check what sales channels are linked to this key
    const keyDetail = await medusaFetch(jwt, `/admin/api-keys/${pubKeyRecord.id}`);
    console.log(`  Key: ${pubKeyRecord.title || pubKeyRecord.id}`);
    console.log(`  Token starts with: ${pubKeyRecord.token?.slice(0, 20)}...`);
    // Note: sales_channels might be in keyDetail
  }
  console.log();

  // 4. Now check the specific out-of-stock products
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  DIAGNOSING OUT-OF-STOCK PRODUCTS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // First, fetch ALL products from admin to find matches by title
  console.log("📦 Fetching all products from Admin API...");
  let allProducts = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await medusaFetch(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,status,*variants.id,*variants.title,*variants.manage_inventory,*variants.allow_backorder,*variants.inventory_quantity,*variants.inventory_items`
    );
    allProducts.push(...(data.products || []));
    if ((data.products || []).length < limit) break;
    offset += limit;
    await sleep(200);
  }
  console.log(`   ✓ ${allProducts.length} products loaded\n`);

  // Find the reported OOS products by title
  const matchedProducts = [];
  for (const title of SAMPLE_TITLES) {
    const found = allProducts.find(p => p.title === title);
    if (found) matchedProducts.push(found);
    else console.log(`  ⚠ Not found in admin: "${title}"`);
  }

  console.log(`\n  Found ${matchedProducts.length} of ${SAMPLE_TITLES.length} reported products\n`);

  // Analyze each matched product
  const issues = {
    noVariants: [],
    noInventoryItems: [],
    noLocationLevel: [],
    zeroStockedQty: [],
    notPublished: [],
    storeApiReturnsZero: [],
    storeApiError: [],
    ok: [],
  };

  // Also do a broad scan: check ALL products for the same issues
  let broadNoLevel = 0;
  let broadZeroQty = 0;
  let broadNotPublished = 0;
  let broadTotal = 0;

  console.log("🔍 Deep-scanning ALL products for inventory issues...\n");

  for (let idx = 0; idx < allProducts.length; idx++) {
    const p = allProducts[idx];
    broadTotal++;
    
    if (p.status !== "published") {
      broadNotPublished++;
      continue;
    }

    for (const v of p.variants || []) {
      if (!v.manage_inventory) continue;
      
      const invItems = v.inventory_items || [];
      if (invItems.length === 0) continue;
      
      for (const link of invItems) {
        const itemId = link.inventory_item_id || link.inventory?.id;
        if (!itemId) continue;
        
        try {
          const invData = await medusaFetch(jwt, `/admin/inventory-items/${itemId}?fields=*location_levels`);
          const levels = invData.inventory_item?.location_levels || [];
          const level = levels.find(l => l.location_id === STOCK_LOCATION_ID);
          
          if (!level) {
            broadNoLevel++;
          } else if (level.stocked_quantity <= 0) {
            broadZeroQty++;
          }
        } catch {
          // skip errors for broad scan
        }
      }
    }

    // Progress indicator every 100 products
    if ((idx + 1) % 100 === 0) {
      process.stdout.write(`  Scanned ${idx + 1}/${allProducts.length} products...\r`);
      await sleep(50);
    }
  }

  console.log(`\n\n  📊 BROAD SCAN RESULTS (${broadTotal} total products):`);
  console.log(`     Not published:         ${broadNotPublished}`);
  console.log(`     Missing location level: ${broadNoLevel} variants`);
  console.log(`     Zero stocked qty:       ${broadZeroQty} variants`);

  // Now deep-check the sample products
  console.log("\n\n───────────────────────────────────────────────────────────────");
  console.log("  DETAILED CHECK ON REPORTED OUT-OF-STOCK PRODUCTS");
  console.log("───────────────────────────────────────────────────────────────\n");

  for (const p of matchedProducts) {
    console.log(`\n📦 "${p.title}"`);
    console.log(`   ID: ${p.id} | Status: ${p.status} | Handle: ${p.handle}`);

    if (p.status !== "published") {
      console.log("   ❌ Product is NOT published (status != 'published')");
      issues.notPublished.push(p.title);
    }

    const variants = p.variants || [];
    if (variants.length === 0) {
      console.log("   ❌ No variants!");
      issues.noVariants.push(p.title);
      continue;
    }

    for (const v of variants) {
      console.log(`\n   Variant: "${v.title}" (${v.id})`);
      console.log(`     manage_inventory: ${v.manage_inventory}`);
      console.log(`     allow_backorder: ${v.allow_backorder}`);
      console.log(`     inventory_quantity (admin): ${v.inventory_quantity}`);

      if (!v.manage_inventory) {
        console.log("     ✓ manage_inventory=false → should always be in stock");
        continue;
      }

      const invItems = v.inventory_items || [];
      if (invItems.length === 0) {
        console.log("     ❌ No inventory_items linked");
        issues.noInventoryItems.push(`${p.title} / ${v.title}`);
        continue;
      }

      for (const link of invItems) {
        const itemId = link.inventory_item_id || link.inventory?.id;
        if (!itemId) {
          console.log("     ❌ inventory_item link has no ID");
          continue;
        }

        try {
          const invData = await medusaFetch(jwt, `/admin/inventory-items/${itemId}?fields=*location_levels`);
          const ii = invData.inventory_item;
          const levels = ii?.location_levels || [];

          console.log(`     Inventory Item: ${itemId}`);
          console.log(`       location_levels: ${levels.length}`);

          const level = levels.find(l => l.location_id === STOCK_LOCATION_ID);
          if (!level) {
            console.log(`       ❌ No level at stock location ${STOCK_LOCATION_ID}`);
            if (!levels.length) {
              console.log("       ❌ No location_levels at ALL");
            } else {
              console.log(`       Existing levels at: ${levels.map(l => l.location_id).join(", ")}`);
            }
            issues.noLocationLevel.push(`${p.title} / ${v.title}`);
          } else {
            console.log(`       ✓ Level found: stocked=${level.stocked_quantity}, reserved=${level.reserved_quantity}, available=${level.available_quantity}`);
            if (level.stocked_quantity <= 0) {
              console.log("       ❌ stocked_quantity is 0!");
              issues.zeroStockedQty.push(`${p.title} / ${v.title}`);
            }
          }
        } catch (err) {
          console.log(`     ❌ Failed to fetch inventory item: ${err.message}`);
        }
      }
    }

    // Also check via Store API
    if (p.handle && usRegion?.id) {
      try {
        const storeData = await storeFetch(
          `/store/products/${p.id}?fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory`,
          pubKey,
          usRegion.id
        );

        if (storeData._error) {
          console.log(`\n   🏪 Store API: ❌ Error ${storeData._error}: ${storeData._message}`);
          issues.storeApiError.push(p.title);
        } else {
          const sv = storeData.product?.variants || [];
          console.log(`\n   🏪 Store API returned ${sv.length} variant(s):`);
          for (const v of sv) {
            const qty = v.inventory_quantity ?? "null";
            const mi = v.manage_inventory ?? "null";
            const inStock = !mi || (qty > 0);
            console.log(`     "${v.title}" → inventory_quantity=${qty}, manage_inventory=${mi} → ${inStock ? "✓ IN STOCK" : "❌ OUT OF STOCK"}`);
            if (!inStock) {
              issues.storeApiReturnsZero.push(`${p.title} / ${v.title}`);
            }
          }
        }
      } catch (err) {
        console.log(`\n   🏪 Store API: ❌ ${err.message}`);
      }
    }
    
    await sleep(100);
  }

  // Summary
  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("  DIAGNOSIS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const printIssue = (label, arr) => {
    if (arr.length > 0) {
      console.log(`  ❌ ${label}: ${arr.length}`);
      for (const item of arr.slice(0, 5)) console.log(`     - ${item}`);
      if (arr.length > 5) console.log(`     ... and ${arr.length - 5} more`);
    } else {
      console.log(`  ✓ ${label}: 0`);
    }
  };

  printIssue("Not published", issues.notPublished);
  printIssue("No variants", issues.noVariants);
  printIssue("No inventory items", issues.noInventoryItems);
  printIssue("Missing location level", issues.noLocationLevel);
  printIssue("Zero stocked quantity", issues.zeroStockedQty);
  printIssue("Store API returns 0/null qty", issues.storeApiReturnsZero);
  printIssue("Store API errors", issues.storeApiError);

  // Write report
  const reportPath = path.join("reports", `diagnose-oos-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    broadScan: { total: broadTotal, notPublished: broadNotPublished, missingLevel: broadNoLevel, zeroQty: broadZeroQty },
    sampleProducts: { checked: matchedProducts.length, issues },
  }, null, 2));
  console.log(`\n📄 Report: ${reportPath}`);
}

main().catch(err => {
  console.error(`\n❌ Fatal: ${err.message}`);
  process.exit(1);
});
