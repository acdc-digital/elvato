#!/usr/bin/env node
/**
 * Normalize Medusa variant SKUs from CJ format → Elvato format.
 *
 *   CJJT<digits><trailing-letters>   →   ELV<digits>
 *
 * Examples:
 *   CJJT138616901AZ  → ELV138616901
 *   CJJT138616904DW  → ELV138616904
 *
 * USAGE
 *   # Dry run, single product (by handle / title / external_id / any variant SKU prefix):
 *   node scripts/catalog/normalize-elv-skus.mjs CJJT138616901AZ
 *
 *   # Apply to one product:
 *   node scripts/catalog/normalize-elv-skus.mjs CJJT138616901AZ --apply
 *
 *   # Dry run across the entire catalog:
 *   node scripts/catalog/normalize-elv-skus.mjs --all
 *
 *   # Apply across the entire catalog:
 *   node scripts/catalog/normalize-elv-skus.mjs --all --apply
 *
 * NOTES
 *   - The original CJ SKU is stashed at variant.metadata.cj_sku so we keep
 *     the supplier reference for purchasing / tracking.
 *   - Skips variants whose SKU is already in ELV format (or doesn't match
 *     the CJJT pattern).
 */

import fs from "node:fs";

function loadEnv() {
  const paths = [
    "admin/.env",
    ".env.local",
    "storefront/.env.local",
    ".agents/product-listing-analyst/.env",
  ];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
    }
  }
}
loadEnv();

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ||
  "https://medusa-backend-production-d681.up.railway.app";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ALL = args.includes("--all");
const positional = args.filter((a) => !a.startsWith("--"));
const target = positional[0];

if (!ALL && !target) {
  console.error(
    "Usage: node scripts/catalog/normalize-elv-skus.mjs <CJ_SKU|handle|title> [--apply]\n" +
      "       node scripts/catalog/normalize-elv-skus.mjs --all [--apply]",
  );
  process.exit(1);
}

// CJJT<digits><letters>  →  ELV<digits>
const CJ_SKU_RE = /^CJJT(\d+)[A-Z]+$/i;

function toElvSku(cjSku) {
  const m = CJ_SKU_RE.exec(cjSku || "");
  if (!m) return null;
  return `ELV${m[1]}`;
}

async function api(jwt, endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(
      `${init.method || "GET"} ${endpoint} → ${res.status}: ${text.slice(0, 400)}`,
    );
  }
  return body;
}

async function medusaLogin() {
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Medusa admin login failed (${res.status})`);
  const { token } = await res.json();
  return token;
}

async function findOneProduct(jwt, key) {
  const lower = key.toLowerCase();
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await api(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,external_id,metadata,*variants.id,*variants.sku,*variants.metadata`,
    );
    for (const p of data.products || []) {
      const meta = p.metadata || {};
      const variantMatch = (p.variants || []).some(
        (v) => v.sku && v.sku.toLowerCase().startsWith(lower),
      );
      if (
        p.external_id === key ||
        meta.cjSku === key ||
        meta.cj_sku === key ||
        meta.sku === key ||
        p.handle === lower ||
        (p.title && p.title.toLowerCase() === lower) ||
        variantMatch
      ) {
        return p;
      }
    }
    if ((data.products || []).length < limit) return null;
    offset += limit;
  }
}

async function* iterateProducts(jwt) {
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await api(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,*variants.id,*variants.sku,*variants.metadata`,
    );
    const batch = data.products || [];
    for (const p of batch) yield p;
    if (batch.length < limit) return;
    offset += limit;
  }
}

function planForProduct(p) {
  const updates = [];
  for (const v of p.variants || []) {
    const newSku = toElvSku(v.sku);
    if (!newSku || newSku === v.sku) continue;
    updates.push({
      variantId: v.id,
      from: v.sku,
      to: newSku,
      meta: { ...(v.metadata || {}), cj_sku: v.sku },
    });
  }
  return updates;
}

async function applyForProduct(jwt, productId, updates) {
  for (const u of updates) {
    await api(jwt, `/admin/products/${productId}/variants/${u.variantId}`, {
      method: "POST",
      body: JSON.stringify({ sku: u.to, metadata: u.meta }),
    });
  }
}

(async () => {
  const jwt = await medusaLogin();

  const products = [];
  if (ALL) {
    for await (const p of iterateProducts(jwt)) products.push(p);
  } else {
    const p = await findOneProduct(jwt, target);
    if (!p) {
      console.error(`No product found for "${target}"`);
      process.exit(2);
    }
    products.push(p);
  }

  let totalChanges = 0;
  let touchedProducts = 0;

  for (const p of products) {
    const updates = planForProduct(p);
    if (updates.length === 0) continue;
    touchedProducts += 1;
    totalChanges += updates.length;

    console.log(`\n${p.title}`);
    console.log(`  id: ${p.id}  handle: ${p.handle}`);
    for (const u of updates) {
      console.log(`  ${u.from}  →  ${u.to}`);
    }

    if (APPLY) {
      await applyForProduct(jwt, p.id, updates);
      console.log("  ✓ applied");
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "Planned"}: ${totalChanges} variant SKU rename(s) across ${touchedProducts} product(s).`,
  );
  if (!APPLY && totalChanges > 0) {
    console.log("Re-run with --apply to write.");
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
