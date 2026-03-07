#!/usr/bin/env node

/**
 * Debug: check stock location link API behavior in Medusa v2
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB";
const SALES_CHANNEL_ID = "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z";

function loadEnv() {
  for (const p of ["admin/.env", ".env"]) {
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
}

loadEnv();

async function main() {
  // Auth
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token } = await authRes.json();
  console.log("Authenticated\n");

  // Check current stock location with expanded fields
  const slRes = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*sales_channels,*fulfillment_sets`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const sl = await slRes.json();
  console.log("Stock location (before):");
  console.log("  sales_channels:", JSON.stringify(sl.stock_location?.sales_channels));
  console.log("  fulfillment_sets:", JSON.stringify(sl.stock_location?.fulfillment_sets));

  // Try linking via POST /admin/stock-locations/:id/sales-channels
  console.log("\n--- Trying POST .../sales-channels with {add: [...]} ---");
  const link1 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}/sales-channels`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ add: [SALES_CHANNEL_ID] }),
    }
  );
  console.log("  Status:", link1.status);
  const link1Body = await link1.text();
  console.log("  Body:", link1Body.slice(0, 500));

  // Check after
  const sl2 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*sales_channels`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const sl2Data = await sl2.json();
  console.log("\nAfter POST - sales_channels:", JSON.stringify(sl2Data.stock_location?.sales_channels));

  // If that didn't work, check if there's a different route convention
  // Medusa v2 might use POST /admin/stock-locations/:id/sales-channels/batch
  console.log("\n--- Trying POST .../sales-channels/batch with {add: [...]} ---");
  const link2 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}/sales-channels/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ add: [SALES_CHANNEL_ID] }),
    }
  );
  console.log("  Status:", link2.status);
  const link2Body = await link2.text();
  console.log("  Body:", link2Body.slice(0, 500));

  // Check after
  const sl3 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*sales_channels`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const sl3Data = await sl3.json();
  console.log("\nAfter batch POST - sales_channels:", JSON.stringify(sl3Data.stock_location?.sales_channels));

  // Also try the remote link approach via /admin/stock-locations/:id with update
  console.log("\n--- Trying POST update on stock location itself ---");
  const link3 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sales_channels: [{ id: SALES_CHANNEL_ID }],
      }),
    }
  );
  console.log("  Status:", link3.status);
  const link3Body = await link3.text();
  console.log("  Body:", link3Body.slice(0, 500));

  // Check after
  const sl4 = await fetch(
    `${MEDUSA_URL}/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*sales_channels`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const sl4Data = await sl4.json();
  console.log("\nAfter update POST - sales_channels:", JSON.stringify(sl4Data.stock_location?.sales_channels));

  // Also try: POST /admin/stock-locations/:id/fulfillment-sets
  console.log("\n--- Checking fulfillment provider availability ---");
  const fpRes = await fetch(
    `${MEDUSA_URL}/admin/fulfillment-providers?limit=10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("  Fulfillment providers status:", fpRes.status);
  const fpData = await fpRes.json();
  console.log("  Providers:", JSON.stringify(fpData?.fulfillment_providers?.map(p => ({id: p.id, is_enabled: p.is_enabled}))));

  // Check Store API for a product
  console.log("\n--- Store API product check ---");
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (pk) {
    const storeRes = await fetch(
      `${MEDUSA_URL}/store/products?limit=3&fields=*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory`,
      { headers: { "x-publishable-api-key": pk } }
    );
    const storeData = await storeRes.json();
    for (const p of storeData.products || []) {
      console.log(`\n  ${p.title}:`);
      for (const v of p.variants || []) {
        console.log(`    ${v.title}: inventory_quantity=${v.inventory_quantity}, manage_inventory=${v.manage_inventory}`);
      }
    }
  }
}

main().catch(console.error);
