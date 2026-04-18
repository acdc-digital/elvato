#!/usr/bin/env node
/**
 * One-off: backfill expedited shipping surcharge metadata on the 4 variants
 * of prod_01KJK5WG6WWRHXSQX9VF2M0KMD (Modern Gold Wall Sconce).
 *
 * Original surcharge data from reports/pricing/expedited-surcharges-live.json
 * was computed against the pre-expansion "Default" variant (CJJT1386169).
 * We propagate those same tier1/tier2 surcharges to all 4 expanded variants.
 *
 * Usage:
 *   node scripts/pricing/backfill-shipping-CJJT1386169.mjs           # dry-run
 *   node scripts/pricing/backfill-shipping-CJJT1386169.mjs --apply
 */

import { existsSync, readFileSync } from "node:fs";

for (const p of [
  "admin/.env",
  ".env.local",
  "storefront/.env.local",
  ".agents/product-listing-analyst/.env",
]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const APPLY = process.argv.includes("--apply");
const BASE = process.env.MEDUSA_BACKEND_URL || "https://medusa-backend-production-d681.up.railway.app";
const PRODUCT_ID = "prod_01KJK5WG6WWRHXSQX9VF2M0KMD";

const SURCHARGE = {
  expeditedTier1Method: "CJPacket USPS Remote",
  expeditedTier1Surcharge: 55,
  expeditedTier1Days: "7-14 business days",
  expeditedTier1DisplayName: "USPS Priority",
  expeditedTier2Method: "DHL Official",
  expeditedTier2Surcharge: 73,
  expeditedTier2Days: "3-7 business days",
  expeditedTier2DisplayName: "DHL Express",
};

async function login() {
  const r = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  if (!r.ok) throw new Error(`login failed ${r.status}`);
  return (await r.json()).token;
}

const token = await login();
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

const r = await fetch(
  `${BASE}/admin/products/${PRODUCT_ID}?fields=*variants.id,*variants.sku,*variants.metadata`,
  { headers }
);
const { product } = await r.json();

console.log(`${product.title} — ${product.variants.length} variants`);
console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`Surcharges: tier1=$${SURCHARGE.expeditedTier1Surcharge} tier2=$${SURCHARGE.expeditedTier2Surcharge}\n`);

for (const v of product.variants) {
  const merged = {
    ...(v.metadata || {}),
    ...SURCHARGE,
    expeditedSurchargesUpdatedAt: new Date().toISOString(),
  };
  console.log(`  ${v.sku}  (${v.id})`);
  if (!APPLY) continue;
  const upd = await fetch(`${BASE}/admin/products/${PRODUCT_ID}/variants/${v.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ metadata: merged }),
  });
  if (!upd.ok) {
    console.error(`    ✗ ${upd.status} ${await upd.text()}`);
  } else {
    console.log(`    ✓ updated`);
  }
}

console.log(APPLY ? "\nDone." : "\nDry-run only. Re-run with --apply to write.");
