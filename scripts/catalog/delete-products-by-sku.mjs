#!/usr/bin/env node

/**
 * Delete products from Medusa by SKU (variant SKU lookup).
 *
 * For each SKU:
 *   1. Fetches variants matching the SKU.
 *   2. Resolves the parent product.
 *   3. In dry-run mode, logs what would be deleted.
 *   4. In live mode, calls DELETE /admin/products/{id}.
 *
 * Usage:
 *   node scripts/catalog/delete-products-by-sku.mjs --dry-run
 *   node scripts/catalog/delete-products-by-sku.mjs
 *
 * Env vars (auto-loaded from admin/.env):
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";

// ─── SKUs to remove ───────────────────────────────────────────────────────────
const TARGET_SKUS = [
  "ELV851738",
  "ELV671585",
  "ELV577425",
  "ELV409669",
  "ELV140186",
  "ELV635686",
  "ELV348704",
  "CJSN1133364",
  "CJJT1383123",
  "ELV288855",
  "ELV148912",
  "ELV946947",
  "ELV120420",
  "ELV806483",
  "ELV102747",
  "ELV368654",
  "ELV219757",
  "ELV603582",
  "ELV653206",
  "ELV826441",
  "CJJT1429783",
  "CJJZSNSN01185",
  "CJTH1122911",
  "ELV186799",
  "ELV361672",
  "ELV936762",
  "ELV441179",
  "ELV990988",
  "CJJJJTJT52794",
  "CJJZSNSN00603",
  "CJSN1419979",
  "CJSN1390898",
  "ELV987883",
  "ELV705090",
  "ELV752252",
  "ELV858750",
  "CJJT1593005",
  "CJJJJTJT51290",
  "ELV139576",
  "CJTH1414349",
  "CJZS1149797",
  "ELV320775",
  "ELV636049",
  "ELV997977",
  "CJJZSNSN00732",
  "ELV543103",
  "ELV246427",
  "CJSN1170591",
  "CJJT1001474",
  "CJJZSNSN00789",
  "CJJT1033018",
  "ELV110501",
  "ELV911604",
  "CJJZSNSN00685",
  "CJLE1540424",
  "CJSN1276476",
];

// ─── Config ───────────────────────────────────────────────────────────────────
const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Load .env files ──────────────────────────────────────────────────────────
for (const p of ["admin/.env", "storefront/.env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(30000),
  });
  return res;
}

async function authenticate() {
  const res = await apiFetch("/auth/user/emailpass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth failed (${res.status}): ${body}`);
  }
  const { token } = await res.json();
  if (!token) throw new Error("No token returned from auth");
  return token;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nMode: ${DRY_RUN ? "DRY RUN (no changes)" : "⚠️  LIVE — products will be DELETED"}`);
  console.log(`SKUs to look up: ${TARGET_SKUS.length}\n`);

  const jwt = await authenticate();
  const headers = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  const toDelete = [];   // { sku, productId, productTitle, variantCount }
  const notFound = [];

  // ── Full catalog scan to find products by variant SKU ──────────────────────
  // NOTE: The Medusa API variants.sku[] filter silently returns all products
  // when no match exists, so we paginate the full catalog instead.
  const skuToProduct = {};
  let offset = 0;
  const PAGE = 100;
  let total = null;
  let scanned = 0;

  console.log("Scanning catalog for target SKUs...");
  while (true) {
    const res = await apiFetch(
      `/admin/products?fields=id,title,status,*variants&limit=${PAGE}&offset=${offset}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Failed to list products (${res.status})`);
    const { products, count } = await res.json();
    if (total === null) {
      total = count;
      console.log(`  Total products in DB: ${total}`);
    }

    for (const p of products) {
      for (const v of p.variants || []) {
        if (TARGET_SKUS.includes(v.sku)) {
          skuToProduct[v.sku] = { productId: p.id, productTitle: p.title, status: p.status, variantCount: (p.variants || []).length };
        }
      }
    }

    scanned += products.length;
    process.stdout.write(`\r  Scanned ${scanned}/${total}...`);
    if (scanned >= total || products.length < PAGE) break;
    offset += PAGE;
  }
  console.log("");

  // Build toDelete / notFound lists
  const seenProductIds = new Set();
  for (const sku of TARGET_SKUS) {
    const info = skuToProduct[sku];
    if (!info) {
      notFound.push(sku);
      continue;
    }
    if (!seenProductIds.has(info.productId)) {
      seenProductIds.add(info.productId);
      toDelete.push({ sku, ...info });
    } else {
      console.log(`  ℹ️  ${sku} → same product as a previous SKU (already queued)`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(70)}`);
  console.log(`Products resolved:  ${toDelete.length}`);
  console.log(`SKUs not found:     ${notFound.length}`);
  if (notFound.length) console.log(`  Missing: ${notFound.join(", ")}`);
  console.log(`${"─".repeat(70)}\n`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  console.log("Products queued for deletion:");
  for (const item of toDelete) {
    console.log(`  [${item.status}] ${item.productTitle} (${item.sku}) — ${item.variantCount} variant(s)`);
    console.log(`         id: ${item.productId}`);
  }

  if (DRY_RUN) {
    console.log("\n✅ Dry run complete — no changes made.");
    const outPath = "reports/catalog/delete-by-sku-dry-run.json";
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(
      outPath,
      JSON.stringify({ toDelete, notFound, generatedAt: new Date().toISOString() }, null, 2)
    );
    console.log(`   Report written to ${outPath}`);
    return;
  }

  // ── Live deletion ────────────────────────────────────────────────────────────
  console.log("\nDeleting products...\n");
  let deleted = 0;
  let failed = 0;
  const results = [];

  for (const item of toDelete) {
    const delRes = await apiFetch(`/admin/products/${item.productId}`, {
      method: "DELETE",
      headers,
    });

    if (delRes.ok) {
      console.log(`  ✅ Deleted: "${item.productTitle}" (${item.sku})`);
      deleted++;
      results.push({ ...item, deleted: true });
    } else {
      const body = await delRes.text();
      console.log(`  ❌ Failed to delete "${item.productTitle}" (${item.sku}): ${delRes.status} — ${body}`);
      failed++;
      results.push({ ...item, deleted: false, error: body });
    }
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`Deleted:  ${deleted}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Not found (no-op): ${notFound.length}`);
  console.log(`${"─".repeat(70)}`);

  const outPath = "reports/catalog/delete-by-sku-live.json";
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ results, notFound, generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`\nReport written to ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
