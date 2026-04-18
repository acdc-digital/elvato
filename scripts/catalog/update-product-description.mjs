#!/usr/bin/env node
/**
 * Update a Medusa product's description by CJ SKU (matched on metadata.cjSku
 * or external_id). Reads the new description from a file, stdin, or a literal
 * string. Defaults to a dry-run; pass --apply to write.
 *
 * USAGE
 *   node scripts/catalog/update-product-description.mjs <CJ_SKU> --file path/to/copy.md
 *   node scripts/catalog/update-product-description.mjs <CJ_SKU> --text "Single line copy"
 *   cat copy.md | node scripts/catalog/update-product-description.mjs <CJ_SKU> --stdin
 *
 *   add --apply to PATCH the product. Without it, prints the planned change.
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
const positional = args.filter((a) => !a.startsWith("--"));
const cjSku = positional[0];
if (!cjSku) {
  console.error(
    "Usage: node scripts/catalog/update-product-description.mjs <CJ_SKU> [--file path | --text str | --stdin] [--apply]",
  );
  process.exit(1);
}

function readNewDescription() {
  const fileIdx = args.indexOf("--file");
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    return fs.readFileSync(args[fileIdx + 1], "utf-8").trim();
  }
  const textIdx = args.indexOf("--text");
  if (textIdx !== -1 && args[textIdx + 1]) {
    return args[textIdx + 1];
  }
  if (args.includes("--stdin")) {
    return fs.readFileSync(0, "utf-8").trim();
  }
  throw new Error("Provide --file <path>, --text <str>, or --stdin");
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
    throw new Error(`${init.method || "GET"} ${endpoint} → ${res.status}: ${text.slice(0, 400)}`);
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

async function findProductByCjSku(jwt, sku) {
  // Page through products and match metadata.cjSku, external_id, title, or
  // any variant SKU that starts with the supplied identifier.
  let offset = 0;
  const limit = 100;
  const skuLower = sku.toLowerCase();
  while (true) {
    const data = await api(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,external_id,description,metadata,*variants.sku`,
    );
    for (const p of data.products || []) {
      const meta = p.metadata || {};
      const variantMatch = (p.variants || []).some(
        (v) => v.sku && v.sku.toLowerCase().startsWith(skuLower),
      );
      if (
        p.external_id === sku ||
        meta.cjSku === sku ||
        meta.cj_sku === sku ||
        meta.sku === sku ||
        p.handle === sku.toLowerCase() ||
        (p.title && p.title.toLowerCase() === skuLower) ||
        variantMatch
      ) {
        return p;
      }
    }
    if ((data.products || []).length < limit) return null;
    offset += limit;
  }
}

(async () => {
  const newDescription = readNewDescription();
  const jwt = await medusaLogin();
  const product = await findProductByCjSku(jwt, cjSku);
  if (!product) {
    console.error(`No Medusa product found for CJ SKU ${cjSku}`);
    process.exit(2);
  }

  console.log(`Product: ${product.title}`);
  console.log(`  id:     ${product.id}`);
  console.log(`  handle: ${product.handle}`);
  console.log("───── current description ─────");
  console.log(product.description || "(empty)");
  console.log("───── new description ─────");
  console.log(newDescription);
  console.log("───────────────────────────");

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  await api(jwt, `/admin/products/${product.id}`, {
    method: "POST",
    body: JSON.stringify({ description: newDescription }),
  });
  console.log("✓ Description updated.");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
