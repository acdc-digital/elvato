#!/usr/bin/env node

/**
 * Fix missing shippingBakedIn product-level metadata flags.
 *
 * All 3,695 USD-priced variants already have shipping baked into their prices,
 * but ~47 products are missing the product-level `shippingBakedIn: true` flag
 * due to partial failures during the initial live run. This script patches them.
 *
 * Usage:
 *   node scripts/pricing/fix-shipping-baked-flags.mjs --dry-run
 *   node scripts/pricing/fix-shipping-baked-flags.mjs
 */

import fs from "node:fs";
import path from "node:path";

// -- env loading --
const envPaths = [
  path.join(process.cwd(), "admin", ".env"),
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".agents", "product-listing-analyst", ".env"),
];
for (const envPath of envPaths) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const DRY_RUN = process.argv.includes("--dry-run");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function fetchAllProducts(token) {
  const products = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = new URL("/admin/products", MEDUSA_URL);
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);
    url.searchParams.set("fields", "id,title,metadata");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
    const data = await res.json();
    products.push(...data.products);
    if (data.products.length < limit) break;
    offset += limit;
  }
  return products;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"}`);
  const token = await getToken();

  console.log("Fetching all products...");
  const products = await fetchAllProducts(token);
  console.log(`Total products: ${products.length}`);

  const missing = products.filter((p) => !p.metadata?.shippingBakedIn);
  console.log(`Products missing shippingBakedIn flag: ${missing.length}`);

  if (missing.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const product of missing) {
    if (DRY_RUN) {
      console.log(`  [dry] Would set flag on ${product.id} (${product.title})`);
      updated++;
      continue;
    }

    try {
      const res = await fetch(new URL(`/admin/products/${product.id}`, MEDUSA_URL), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: { ...product.metadata, shippingBakedIn: true },
        }),
      });
      if (!res.ok) {
        console.error(`  FAIL ${product.id}: ${res.status}`);
        failed++;
      } else {
        console.log(`  OK ${product.id} (${product.title})`);
        updated++;
      }
      await sleep(200);
    } catch (err) {
      console.error(`  ERROR ${product.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
