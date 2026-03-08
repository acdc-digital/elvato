#!/usr/bin/env node

/**
 * Set up North America fulfillment in Medusa.
 *
 * Creates:
 *   1. Fulfillment set "North America delivery" (type: shipping) on existing stock location
 *   2. Service zone "North America" with geo zones: US, CA, MX
 *   3. Shipping option "Free Shipping" — flat $0 USD, linked to default shipping profile
 *
 * This enables checkout for North American customers. Shipping costs are already
 * baked into product prices, so the shipping option is $0 (free).
 *
 * Usage:
 *   node scripts/admin/setup-na-fulfillment.mjs --dry-run   # preview only
 *   node scripts/admin/setup-na-fulfillment.mjs              # create resources
 */

import fs from "node:fs";
import path from "node:path";

// -- env loading --
const envPaths = [
  path.join(process.cwd(), "admin", ".env"),
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".agents", "product-listing-analyst", ".env"),
];
for (const ep of envPaths) {
  if (!fs.existsSync(ep)) continue;
  for (const line of fs.readFileSync(ep, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

// =============================================================================
// CONFIG
// =============================================================================

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const DRY_RUN = process.argv.includes("--dry-run");

// Existing resource IDs (from Medusa)
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB";
const NA_REGION_ID = "reg_01KHKWETVP6ASC7ASMX6BKQX4G";
const SHIPPING_PROFILE_ID = "sp_01KDPCN9M6FWK309G054X4RKQ6";
const PROVIDER_ID = "manual_manual";

// =============================================================================
// HELPERS
// =============================================================================

async function getToken() {
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const { token } = await res.json();
  return token;
}

async function adminGet(token, path) {
  const res = await fetch(new URL(path, MEDUSA_URL), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function adminPost(token, path, body) {
  const res = await fetch(new URL(path, MEDUSA_URL), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`\n=== North America Fulfillment Setup ===`);
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (no changes)" : "LIVE"}\n`);

  const token = await getToken();

  // ── Step 0: Check if NA fulfillment already exists ──────────────────────
  console.log("Step 0: Checking existing fulfillment sets...");
  const slData = await adminGet(
    token,
    `/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.geo_zones`
  );
  const existingNA = slData.stock_location.fulfillment_sets?.find(
    (fs) => fs.name === "North America delivery"
  );

  if (existingNA) {
    console.log(`  ⚠ Fulfillment set "North America delivery" already exists (${existingNA.id})`);
    let existingZone = existingNA.service_zones?.[0];

    if (!existingZone) {
      // Set exists but no zone — create the zone
      console.log("  No service zone found — will create one.\n");
      console.log("Step 2: Adding service zone 'North America' with US, CA, MX...");
      const szResult = await adminPost(
        token,
        `/admin/fulfillment-sets/${existingNA.id}/service-zones`,
        {
          name: "North America",
          geo_zones: [
            { type: "country", country_code: "us" },
            { type: "country", country_code: "ca" },
            { type: "country", country_code: "mx" },
          ],
        }
      );
      existingZone = szResult.fulfillment_set?.service_zones?.find(
        (z) => z.name === "North America"
      );
      if (!existingZone) throw new Error("Service zone not found after creation");
      console.log(`  ✅ Created service zone: ${existingZone.id}`);
      console.log(`  Geo zones: ${existingZone.geo_zones?.map((g) => g.country_code).join(", ")}`);
    } else {
      console.log(`  Service zone: ${existingZone.name} (${existingZone.id})`);
      console.log(`  Geo zones: ${existingZone.geo_zones?.map((g) => g.country_code).join(", ")}`);
    }

    // Check for existing shipping option on this zone
    const soData = await adminGet(token, "/admin/shipping-options?fields=id,name,service_zone_id,price_type,prices.*");
    const naOptions = soData.shipping_options.filter(
      (o) => o.service_zone_id === existingZone?.id
    );
    if (naOptions.length > 0) {
      console.log(`  Shipping options already exist:`);
      for (const o of naOptions) {
        console.log(`    - ${o.name} (${o.id}), price_type: ${o.price_type}`);
      }
      console.log("\n✅ North America fulfillment is already fully configured. Nothing to do.");
      return;
    }

    console.log("");
    await createShippingOption(token, existingZone.id);
    console.log("\n✅ North America fulfillment setup complete!");
    return;
  }

  console.log("  No existing NA fulfillment set found. Will create.\n");

  // ── Step 1: Create fulfillment set on stock location ────────────────────
  console.log("Step 1: Creating fulfillment set 'North America delivery'...");
  if (DRY_RUN) {
    console.log(`  [dry] POST /admin/stock-locations/${STOCK_LOCATION_ID}/fulfillment-sets`);
    console.log(`  [dry] Body: { name: "North America delivery", type: "shipping" }`);
  } else {
    await adminPost(
      token,
      `/admin/stock-locations/${STOCK_LOCATION_ID}/fulfillment-sets`,
      { name: "North America delivery", type: "shipping" }
    );
    // Re-fetch stock location to get the new fulfillment set ID
    const refreshed = await adminGet(
      token,
      `/admin/stock-locations/${STOCK_LOCATION_ID}?fields=*fulfillment_sets`
    );
    const newFSet = refreshed.stock_location.fulfillment_sets?.find(
      (f) => f.name === "North America delivery"
    );
    if (!newFSet) throw new Error("Fulfillment set not found after creation");
    console.log(`  ✅ Created fulfillment set: ${newFSet.id}`);

    // ── Step 2: Add service zone with CA, US, MX geo zones ──────────────
    console.log("\nStep 2: Adding service zone 'North America' with US, CA, MX...");
    const szResult = await adminPost(
      token,
      `/admin/fulfillment-sets/${newFSet.id}/service-zones`,
      {
        name: "North America",
        geo_zones: [
          { type: "country", country_code: "us" },
          { type: "country", country_code: "ca" },
          { type: "country", country_code: "mx" },
        ],
      }
    );
    const newZone = szResult.fulfillment_set?.service_zones?.find(
      (z) => z.name === "North America"
    );
    if (!newZone) throw new Error("Service zone was not returned in response");
    console.log(`  ✅ Created service zone: ${newZone.id}`);
    console.log(`  Geo zones: ${newZone.geo_zones?.map((g) => g.country_code).join(", ")}`);

    // ── Step 3: Create Free Shipping option ─────────────────────────────
    console.log("");
    await createShippingOption(token, newZone.id);
  }

  if (DRY_RUN) {
    console.log("\nStep 2: [dry] Would add service zone 'North America' with geo zones: us, ca, mx");
    console.log("\nStep 3: [dry] Would create shipping option 'Free Shipping' at $0.00 USD");
    console.log(`  [dry] service_zone_id: <new zone>`);
    console.log(`  [dry] provider_id: ${PROVIDER_ID}`);
    console.log(`  [dry] shipping_profile_id: ${SHIPPING_PROFILE_ID}`);
    console.log(`  [dry] prices: [{ currency_code: "usd", amount: 0 }]`);
    console.log(`  [dry] rules: enabled_in_store=true, is_return=false`);
  }

  console.log("\n✅ North America fulfillment setup complete!");
}

async function createShippingOption(token, serviceZoneId) {
  console.log("Step 3: Creating shipping option 'Free Shipping' ($0.00)...");
  const soResult = await adminPost(token, "/admin/shipping-options", {
    name: "Free Shipping",
    price_type: "flat",
    service_zone_id: serviceZoneId,
    shipping_profile_id: SHIPPING_PROFILE_ID,
    provider_id: PROVIDER_ID,
    type: {
      label: "Free",
      description: "Shipping included in product price",
      code: "free-shipping",
    },
    prices: [
      { currency_code: "usd", amount: 0 },
      { region_id: NA_REGION_ID, amount: 0 },
    ],
    rules: [
      { attribute: "enabled_in_store", operator: "eq", value: "true" },
      { attribute: "is_return", operator: "eq", value: "false" },
    ],
  });
  console.log(`  ✅ Created shipping option: ${soResult.shipping_option?.id}`);
  console.log(`  Name: ${soResult.shipping_option?.name}`);
  console.log(`  Price: $0.00 (free)`);
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
