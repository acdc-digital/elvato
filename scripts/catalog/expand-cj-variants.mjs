#!/usr/bin/env node
/**
 * Expand any CJ-sourced Medusa product from a single "Default" variant into
 * the full variant matrix that CJ exposes for the SKU.
 *
 * USAGE
 * ─────
 *   # Step 1 — generate an editable plan (no DB writes):
 *   node scripts/catalog/expand-cj-variants.mjs CJJT1386169
 *
 *   # Step 2 — open the generated plan, fix option labels / values / prices:
 *   $EDITOR reports/sync/expand-CJJT1386169-plan.json
 *
 *   # Step 3 — apply the plan to Medusa:
 *   node scripts/catalog/expand-cj-variants.mjs CJJT1386169 --apply
 *
 * WHY two steps?
 *   CJ does NOT return structured option metadata for most products — just
 *   free-form `variantKey` strings ("A Warm light", "B three color light").
 *   We auto-parse what we can, write a plan file with sensible defaults, and
 *   let you tweak labels (e.g. "A" → "Large (590mm)") before applying.
 *
 * BEHAVIOUR
 *   - Reuses the existing Medusa variant ID for the FIRST CJ variant, so cart
 *     lines / orders / inventory / metadata are preserved.
 *   - Renames the existing "Default" option to the first detected option name,
 *     creates additional options if CJ has a multi-axis matrix.
 *   - Pricing: keeps the existing variant price unchanged, then scales the
 *     other variants by the same markup ratio off CJ's per-variant cost.
 *   - Stores CJ's `variantImage` URL on each Medusa variant as
 *     `metadata.image` so the storefront can hoist it into the gallery when
 *     the variant is selected (see app/products/[handle]/page.tsx).
 *   - New variants inherit `manage_inventory: false, allow_backorder: true`.
 *
 * ENV (auto-loaded from admin/.env, .env.local, .agents/product-listing-analyst/.env)
 *   MEDUSA_BACKEND_URL (default: Railway prod)
 *   MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 *   CJ_API_KEY
 */

import fs from "node:fs";
import path from "node:path";

// ─── env ───────────────────────────────────────────────────────────────────────
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

// ─── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const cjSku = args.find((a) => !a.startsWith("--"));
if (!cjSku) {
  console.error(
    "Usage: node scripts/catalog/expand-cj-variants.mjs <CJ_SKU> [--apply]",
  );
  process.exit(1);
}

const PLAN_PATH = path.join(
  process.cwd(),
  "reports",
  "sync",
  `expand-${cjSku}-plan.json`,
);

// ─── HTTP helpers ──────────────────────────────────────────────────────────────
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
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(
      `${init.method || "GET"} ${endpoint} → ${res.status}: ${detail.slice(0, 400)}`,
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

// ─── CJ API ────────────────────────────────────────────────────────────────────
const CJ_BASE = "https://developers.cjdropshipping.com";
let cjToken = null;
async function cjLogin() {
  if (cjToken) return cjToken;
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CJ_API_KEY not set (expected in .agents/product-listing-analyst/.env)",
    );
  }
  const res = await fetch(
    `${CJ_BASE}/api2.0/v1/authentication/getAccessToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    },
  );
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed: ${data.message || data.code}`);
  }
  cjToken = data.data.accessToken;
  return cjToken;
}

async function cjFetchProduct(productSku) {
  const token = await cjLogin();
  const url = `${CJ_BASE}/api2.0/v1/product/query?productSku=${encodeURIComponent(productSku)}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
  });
  const data = await res.json();
  if (!data.result || !data.data) {
    throw new Error(`CJ product/query failed: ${data.message || data.code}`);
  }
  return data.data;
}

// ─── option auto-detection ─────────────────────────────────────────────────────
/**
 * Heuristic: try to derive a 1-D or 2-D option matrix from CJ variants.
 *
 * CJ rarely returns structured option name/value pairs (variantProperty is
 * usually "[]"). The only signal is `variantKey` (and `variantNameEn`).
 *
 * Strategy:
 *   1. Collect the variantKey for every variant.
 *   2. Try splitting each key on common delimiters: "/", "-", ",", "|", " ".
 *   3. Look for a tokenization that yields a consistent dimension count where
 *      each dimension's value-set fully partitions the variants.
 *   4. If nothing clean is found, fall back to a single "Variant" option whose
 *      values are the raw variantKey strings (user can rename in the plan).
 */
function detectOptions(variants) {
  const keys = variants.map((v) => (v.variantKey || v.variantNameEn || "").trim());

  // Try common explicit delimiters first.
  for (const delim of ["/", "|", ",", " - "]) {
    if (keys.every((k) => k.includes(delim))) {
      const parts = keys.map((k) =>
        k.split(delim).map((s) => s.trim()).filter(Boolean),
      );
      const dimCount = parts[0].length;
      if (parts.every((p) => p.length === dimCount) && dimCount >= 1) {
        return buildDimensions(parts, dimCount);
      }
    }
  }

  // Whitespace heuristic — try splitting into 2 dimensions using prefix tokens.
  // For "A Warm light" / "B Three color light" → ["A","B"] × ["Warm light","Three color light"]
  if (keys.every((k) => k.includes(" "))) {
    const firstTokens = keys.map((k) => k.split(/\s+/)[0]);
    const rest = keys.map((k) => k.split(/\s+/).slice(1).join(" ").trim());
    const uniqFirst = [...new Set(firstTokens)];
    const uniqRest = [...new Set(rest.map((s) => s.toLowerCase()))];
    if (
      uniqFirst.length >= 2 &&
      uniqRest.length >= 2 &&
      uniqFirst.length * uniqRest.length === variants.length
    ) {
      const parts = keys.map((k) => {
        const toks = k.split(/\s+/);
        return [toks[0], toks.slice(1).join(" ")];
      });
      return buildDimensions(parts, 2);
    }
  }

  // Fallback: single dimension, raw values.
  return buildDimensions(
    keys.map((k) => [k || "Variant"]),
    1,
  );
}

function buildDimensions(parts, dimCount) {
  const titles = [];
  const values = [];
  for (let d = 0; d < dimCount; d++) {
    titles.push(d === 0 ? "Option 1" : `Option ${d + 1}`);
    const seen = new Set();
    const vals = [];
    for (const p of parts) {
      const v = normalizeValue(p[d]);
      if (!seen.has(v.toLowerCase())) {
        seen.add(v.toLowerCase());
        vals.push(v);
      }
    }
    values.push(vals);
  }
  // Per-variant assignment uses the canonicalized values.
  const assignments = parts.map((p) =>
    p.map((v, d) => {
      const canonical = values[d].find(
        (vv) => vv.toLowerCase() === normalizeValue(v).toLowerCase(),
      );
      return canonical ?? normalizeValue(v);
    }),
  );
  return { titles, values, assignments };
}

function normalizeValue(s) {
  // Title-case lightly, collapse whitespace.
  const trimmed = (s ?? "").toString().replace(/\s+/g, " ").trim();
  if (!trimmed) return "Default";
  // Capitalize first letter of each word.
  return trimmed
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ─── plan generation ──────────────────────────────────────────────────────────
async function generatePlan() {
  console.log(`\n══ Generating plan for CJ SKU ${cjSku} ══\n`);

  const jwt = await medusaLogin();

  // 1. Find Medusa product by metadata.cjSku
  console.log("→ Looking up Medusa product by metadata.cjSku…");
  const product = await findMedusaProductByCjSku(jwt, cjSku);
  if (!product) {
    throw new Error(
      `No Medusa product found with metadata.cjSku=${cjSku} (or external_id=${cjSku}).`,
    );
  }
  console.log(`   Found: ${product.id} — "${product.title}"`);
  console.log(
    `   Current options: ${(product.options || []).map((o) => o.title).join(", ") || "(none)"}`,
  );
  console.log(`   Current variants: ${product.variants?.length || 0}`);

  if ((product.variants?.length || 0) > 1) {
    console.warn(
      `\n⚠  Product already has ${product.variants.length} variants. This script ` +
        `is designed for products that currently have a single "Default" variant. ` +
        `Aborting to avoid clobbering existing structure.`,
    );
    process.exit(2);
  }
  const currentVariant = product.variants?.[0];
  if (!currentVariant) {
    throw new Error("Product has no variants — cannot derive markup ratio.");
  }
  const currentUsd = (currentVariant.prices || []).find(
    (p) => p.currency_code === "usd",
  );
  if (!currentUsd) {
    throw new Error("Existing variant has no USD price — cannot derive markup ratio.");
  }

  // 2. Fetch CJ data
  console.log(`\n→ Fetching CJ product data…`);
  const cj = await cjFetchProduct(cjSku);
  const cjVariants = cj.variants || [];
  if (cjVariants.length === 0) {
    throw new Error(`CJ returned no variants for SKU ${cjSku}.`);
  }
  console.log(`   CJ variants: ${cjVariants.length}`);
  for (const v of cjVariants) {
    console.log(
      `     - ${v.variantSku}  "${v.variantKey || v.variantNameEn}"  $${v.variantSellPrice}`,
    );
  }

  // 3. Derive markup ratio from the existing variant.
  // Find the CJ variant that matches the existing SKU (or default to first).
  const matchedCjIndex = Math.max(
    0,
    cjVariants.findIndex((v) => v.variantSku === currentVariant.sku),
  );
  const baseCj = cjVariants[matchedCjIndex];
  const baseCjCostUsd = Number(baseCj.variantSellPrice);
  const ratio = currentUsd.amount / 100 / baseCjCostUsd;
  console.log(
    `\n→ Markup ratio: ${ratio.toFixed(4)}× (existing $${(currentUsd.amount / 100).toFixed(2)} ÷ CJ cost $${baseCjCostUsd.toFixed(2)} from ${baseCj.variantSku})`,
  );

  // 4. Auto-detect options.
  const { titles, values, assignments } = detectOptions(cjVariants);
  console.log(`\n→ Detected ${titles.length} option dimension(s):`);
  for (let d = 0; d < titles.length; d++) {
    console.log(`     ${titles[d]}: [${values[d].join(", ")}]`);
  }

  // 5. Build plan: 1 variantUpdate (reuse) + N-1 variantCreates.
  const reuseIdx = matchedCjIndex; // align reuse with the matched CJ variant
  const variantUpdates = [];
  const variantCreates = [];
  for (let i = 0; i < cjVariants.length; i++) {
    const cv = cjVariants[i];
    const opts = {};
    for (let d = 0; d < titles.length; d++) {
      opts[titles[d]] = assignments[i][d];
    }
    const target = {
      sku: cv.variantSku,
      title: assignments[i].join(" / "),
      options: opts,
      cjCostUsd: Number(cv.variantSellPrice),
      weightGrams: cv.variantWeight ?? null,
      dimensionsMm: {
        length: cv.variantLength ?? null,
        width: cv.variantWidth ?? null,
        height: cv.variantHeight ?? null,
      },
      image: cv.variantImage || null,
    };
    if (i === reuseIdx) {
      variantUpdates.push({
        existingVariantId: currentVariant.id,
        ...target,
        keepPriceCents: currentUsd.amount,
        _note: "Reuse existing variant — preserves price, cart history, inventory.",
      });
    } else {
      variantCreates.push({
        ...target,
        priceCents: Math.round(target.cjCostUsd * 100 * ratio),
      });
    }
  }

  // 6. Build option ops: rename existing → first detected; create rest.
  const optionUpdates = [];
  const optionCreates = [];
  const existingOptions = product.options || [];
  for (let d = 0; d < titles.length; d++) {
    const existing = existingOptions[d];
    if (existing) {
      optionUpdates.push({
        id: existing.id,
        title: titles[d],
        values: values[d],
        _note:
          existing.title === titles[d]
            ? undefined
            : `Renaming existing option "${existing.title}" → "${titles[d]}"`,
      });
    } else {
      optionCreates.push({ title: titles[d], values: values[d] });
    }
  }

  const plan = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cjSku,
    medusa: {
      productId: product.id,
      title: product.title,
      handle: product.handle,
    },
    pricing: {
      strategy: "preserve-existing-markup",
      markupRatio: ratio,
      baseCjCostUsd,
      baseCjVariantSku: baseCj.variantSku,
      basePriceCents: currentUsd.amount,
      _note:
        "All variant prices = round(cjCostUsd * 100 * markupRatio). " +
        "The existing variant keeps its current price exactly. " +
        "Edit `priceCents` per variant below to override.",
    },
    optionUpdates,
    optionCreates,
    variantUpdates,
    variantCreates,
    // Keep the raw CJ data so reviewers can sanity-check the parse.
    _cjVariants: cjVariants.map((v) => ({
      variantSku: v.variantSku,
      variantKey: v.variantKey,
      variantNameEn: v.variantNameEn,
      variantSellPrice: v.variantSellPrice,
      variantImage: v.variantImage,
    })),
  };

  fs.mkdirSync(path.dirname(PLAN_PATH), { recursive: true });
  fs.writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2));
  console.log(`\n✅ Plan written: ${PLAN_PATH}`);
  console.log(`\nReview it, edit option titles/values/prices if needed, then run:`);
  console.log(`   node scripts/catalog/expand-cj-variants.mjs ${cjSku} --apply\n`);
}

async function findMedusaProductByCjSku(jwt, sku) {
  // Page through products and match metadata.cjSku or external_id.
  let offset = 0;
  const limit = 100;
  while (true) {
    const data = await api(
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,external_id,metadata`,
    );
    for (const p of data.products || []) {
      const meta = p.metadata || {};
      if (meta.cjSku === sku || p.external_id === sku) {
        // Re-fetch with the full structure we need.
        const full = await api(
          jwt,
          `/admin/products/${p.id}?fields=id,title,handle,external_id,metadata,*options,*options.values,*variants,*variants.options,*variants.options.option,*variants.prices`,
        );
        return full.product;
      }
    }
    if ((data.products || []).length < limit) return null;
    offset += limit;
  }
}

// ─── plan application ─────────────────────────────────────────────────────────
async function applyPlan() {
  if (!fs.existsSync(PLAN_PATH)) {
    throw new Error(
      `No plan found at ${PLAN_PATH}. Run without --apply first to generate one.`,
    );
  }
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, "utf-8"));
  console.log(`\n══ Applying plan ${PLAN_PATH} ══\n`);
  console.log(`Product: ${plan.medusa.productId} — ${plan.medusa.title}`);
  console.log(
    `  ${plan.optionUpdates.length} option update(s), ${plan.optionCreates.length} new option(s)`,
  );
  console.log(
    `  ${plan.variantUpdates.length} variant update(s), ${plan.variantCreates.length} new variant(s)\n`,
  );

  const jwt = await medusaLogin();
  const productId = plan.medusa.productId;

  // 1. Option updates
  for (const u of plan.optionUpdates) {
    await api(jwt, `/admin/products/${productId}/options/${u.id}`, {
      method: "POST",
      body: JSON.stringify({ title: u.title, values: u.values }),
    });
    console.log(`  ✓ Updated option ${u.id} → "${u.title}" (${u.values.join(", ")})`);
  }

  // 2. Option creates
  for (const c of plan.optionCreates) {
    await api(jwt, `/admin/products/${productId}/options`, {
      method: "POST",
      body: JSON.stringify({ title: c.title, values: c.values }),
    });
    console.log(`  ✓ Created option "${c.title}" (${c.values.join(", ")})`);
  }

  // 3. Variant updates (reuse existing)
  for (const u of plan.variantUpdates) {
    const payload = {
      title: u.title,
      sku: u.sku,
      options: u.options,
      metadata: { image: u.image },
    };
    await api(jwt, `/admin/products/${productId}/variants/${u.existingVariantId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log(
      `  ✓ Updated variant ${u.existingVariantId} → "${u.title}" sku=${u.sku} (price preserved)`,
    );
  }

  // 4. Variant creates
  for (const c of plan.variantCreates) {
    const payload = {
      title: c.title,
      sku: c.sku,
      manage_inventory: false,
      allow_backorder: true,
      ...(c.weightGrams ? { weight: c.weightGrams } : {}),
      ...(c.dimensionsMm?.length ? { length: c.dimensionsMm.length } : {}),
      ...(c.dimensionsMm?.width ? { width: c.dimensionsMm.width } : {}),
      ...(c.dimensionsMm?.height ? { height: c.dimensionsMm.height } : {}),
      options: c.options,
      prices: [{ amount: c.priceCents, currency_code: "usd" }],
      metadata: { image: c.image },
    };
    const { product_variant } = await api(
      jwt,
      `/admin/products/${productId}/variants`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    console.log(
      `  ✓ Created variant ${product_variant?.id} "${c.title}" sku=${c.sku} $${(c.priceCents / 100).toFixed(2)}`,
    );
  }

  console.log(`\n✅ Done.\n`);
}

// ─── main ─────────────────────────────────────────────────────────────────────
(APPLY ? applyPlan() : generatePlan()).catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
