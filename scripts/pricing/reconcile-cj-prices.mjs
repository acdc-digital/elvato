#!/usr/bin/env node

/**
 * Reconcile CJ Per-Variant Pricing → Storefront Variant Prices
 *
 * This script:
 *   1. Fetches a product's variants from Medusa (our storefront)
 *   2. Fetches the same product's variants from CJ (supplier) by CJ SKU
 *   3. Parses CJ variant names to extract option dimensions (heads, finish, etc.)
 *   4. Maps CJ per-variant pricing to storefront variants by matching shared options
 *   5. (Dry-run) Shows planned price changes
 *   6. (Live) Updates variant prices in Medusa
 *
 * Usage:
 *   # Dry-run for a single product (default 100% markup)
 *   node scripts/reconcile-cj-prices.mjs --sku CJSN1587842 --medusa-url URL --dry-run
 *
 *   # Dry-run with custom markup
 *   node scripts/reconcile-cj-prices.mjs --sku CJSN1587842 --medusa-url URL --dry-run --markup 80
 *
 *   # Live update
 *   node scripts/reconcile-cj-prices.mjs --sku CJSN1587842 --medusa-url URL
 *
 *   # Scan all products (dry-run)
 *   node scripts/reconcile-cj-prices.mjs --all --limit 5 --medusa-url URL --dry-run
 *
 *   # Save report
 *   node scripts/reconcile-cj-prices.mjs --sku CJSN1587842 --medusa-url URL --dry-run --out reports/reconcile.json
 *
 * Env vars (auto-loaded from admin/.env, .agents/product-listing-analyst/.env):
 *   MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD, CJ_API_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// =============================================================================
// ENV LOADING
// =============================================================================

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".agents", "product-listing-analyst", ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
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

loadEnv();

// =============================================================================
// CLI ARGS
// =============================================================================

function parseArgs(argv) {
  const args = {
    sku: null,
    productId: null,
    all: false,
    limit: 10,
    medusaUrl: null,
    dryRun: false,
    markup: 100, // Default 100% markup
    out: null,
    pricingStrategy: "min", // min|max|avg — when multiple CJ variants match, how to pick cost
    fromReport: null, // Path to a saved fetch-cj-variant-prices report JSON
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--sku") { args.sku = argv[++i]; continue; }
    if (arg === "--product-id") { args.productId = argv[++i]; continue; }
    if (arg === "--all") { args.all = true; continue; }
    if (arg === "--limit") { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--medusa-url") { args.medusaUrl = argv[++i]; continue; }
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--markup") { args.markup = parseFloat(argv[++i]); continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--pricing-strategy") { args.pricingStrategy = argv[++i]; continue; }
    if (arg === "--from-report") { args.fromReport = argv[++i]; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.sku && !args.productId && !args.all && !args.fromReport) {
    throw new Error("Provide --sku <CJ_SKU>, --product-id <MEDUSA_ID>, --all, or --from-report <path>");
  }
  return args;
}

// =============================================================================
// MEDUSA ADMIN API
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getMedusaAdminJwt(medusaUrl, email, password) {
  const res = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Admin login failed (${res.status}): ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function adminFetch(medusaUrl, jwt, endpoint, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(new URL(endpoint, medusaUrl), {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...options.headers,
        },
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${body.substring(0, 200)}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries) {
        console.log(`   ⟳ ${err.message} — retry ${attempt}/${retries}`);
        await sleep(2000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

async function fetchMedusaProduct(medusaUrl, jwt, productId) {
  const data = await adminFetch(medusaUrl, jwt,
    `/admin/products/${productId}?fields=title,metadata,*variants,*variants.prices,*variants.options,*variants.options.option`
  );
  return data.product;
}

async function findMedusaProductBySku(medusaUrl, jwt, cjSku) {
  let offset = 0;
  const limit = 50;
  while (true) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=title,metadata,*variants,*variants.prices,*variants.options,*variants.options.option`
    );
    const products = data.products || [];
    for (const p of products) {
      const meta = p.metadata || {};
      if (meta.cjSku === cjSku || p.external_id === cjSku) {
        return p;
      }
    }
    if (products.length < limit) break;
    offset += limit;
    await sleep(200);
  }
  return null;
}

async function fetchAllMedusaProductsWithCjMeta(medusaUrl, jwt, maxProducts) {
  const results = [];
  let offset = 0;
  const limit = 50;
  while (results.length < maxProducts) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=title,metadata,*variants,*variants.prices,*variants.options,*variants.options.option`
    );
    const products = data.products || [];
    for (const p of products) {
      if (results.length >= maxProducts) break;
      const meta = p.metadata || {};
      if (meta.cjProductId || meta.cjSku) results.push(p);
    }
    if (products.length < limit) break;
    offset += limit;
    process.stdout.write(`  Fetched ${offset} products from Medusa...\r`);
    await sleep(200);
  }
  return results;
}

// =============================================================================
// CJ DROPSHIPPING API
// =============================================================================

const CJ_BASE = "https://developers.cjdropshipping.com";
const __script_dir = path.dirname(fileURLToPath(import.meta.url));
const CJ_TOKEN_CACHE = path.join(__script_dir, ".cj-token-cache.json");
let cjAccessToken = null;

function loadCachedCjToken() {
  try {
    if (!fs.existsSync(CJ_TOKEN_CACHE)) return null;
    const cached = JSON.parse(fs.readFileSync(CJ_TOKEN_CACHE, "utf-8"));
    // Tokens are valid for ~24h, but cache for 23h to be safe
    if (Date.now() - cached.ts < 23 * 60 * 60 * 1000) return cached.token;
  } catch { /* ignore */ }
  return null;
}

function saveCjTokenCache(token) {
  try { fs.writeFileSync(CJ_TOKEN_CACHE, JSON.stringify({ token, ts: Date.now() })); } catch { /* ignore */ }
}

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;
  // Try file-cached token first (avoids 300s rate limit on auth endpoint)
  const cached = loadCachedCjToken();
  if (cached) { cjAccessToken = cached; return cached; }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY not set.");
  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed (code ${data.code}): ${data.message || "No token"}`);
  }
  cjAccessToken = data.data.accessToken;
  saveCjTokenCache(cjAccessToken);
  return cjAccessToken;
}

async function cjFetch(endpoint) {
  const token = await ensureCjToken();
  const res = await fetch(`${CJ_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
  });
  const data = await res.json();
  if (data.code === 1600001 || data.code === 1600002) {
    cjAccessToken = null;
    const newToken = await ensureCjToken();
    const retryRes = await fetch(`${CJ_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", "CJ-Access-Token": newToken },
    });
    return retryRes.json();
  }
  return data;
}

async function fetchCjVariants(productSku) {
  const data = await cjFetch(
    `/api2.0/v1/product/variant/query?productSku=${encodeURIComponent(productSku)}`
  );
  if (!data.result || !data.data) return [];
  return Array.isArray(data.data) ? data.data : [];
}

// =============================================================================
// CJ VARIANT NAME PARSER
// =============================================================================

/**
 * Parse a CJ variant name to extract structured option dimensions.
 *
 * CJ variant names typically follow this pattern:
 *   "{Product Title} {N}heads {finish} {light_type}"
 *   "{Product Title} {color} {size}"
 *   etc.
 *
 * We extract known dimensions from the variant name.
 */
function parseCjVariantName(name) {
  const lc = (name || "").toLowerCase();
  const parsed = {};

  // ── Heads / Number of Lights ──
  const headsMatch = lc.match(/(\d+)\s*heads?/);
  if (headsMatch) {
    parsed.heads = parseInt(headsMatch[1], 10);
  }

  // ── Finish / Color ──
  const finishes = [
    "black", "gold", "white", "silver", "bronze", "brass",
    "chrome", "nickel", "copper", "rose gold", "matte black",
    "matte white", "matte gold", "satin", "antique",
  ];
  for (const f of finishes) {
    // Match as whole word to avoid false positives
    const re = new RegExp(`\\b${f}\\b`);
    if (re.test(lc)) {
      parsed.finish = f;
      break;
    }
  }

  // ── Light Type / Dimming ──
  if (lc.includes("stepless dimming") || lc.includes("stepless")) {
    parsed.lightType = "stepless dimming";
  } else if (lc.includes("3 color") || lc.includes("3-color") || lc.includes("three color")) {
    parsed.lightType = "3 color";
  } else if (lc.includes("warm light") || lc.includes("warm white")) {
    parsed.lightType = "warm light";
  } else if (lc.includes("cool light") || lc.includes("cool white")) {
    parsed.lightType = "cool light";
  } else if (lc.includes("neutral") || lc.includes("natural")) {
    parsed.lightType = "neutral";
  }

  // ── Size ──
  const sizeMatch = lc.match(/(\d+)\s*cm/);
  if (sizeMatch) {
    parsed.sizeCm = parseInt(sizeMatch[1], 10);
  }

  // ── Voltage ──
  const voltMatch = lc.match(/(\d+)\s*v\b/);
  if (voltMatch) {
    parsed.voltage = parseInt(voltMatch[1], 10);
  }

  // ── Wattage ──
  const wattMatch = lc.match(/(\d+)\s*w\b/);
  if (wattMatch) {
    parsed.wattage = parseInt(wattMatch[1], 10);
  }

  return parsed;
}

/**
 * Parse a storefront variant's options into a normalized structure.
 * Medusa returns options as an array of { value, option: { title } }
 */
function parseStorefrontOptions(variant) {
  const opts = {};
  for (const optVal of variant.options || []) {
    const title = optVal.option?.title || "";
    const value = optVal.value || "";

    if (title === "Finish" || title === "Color") {
      opts.finish = value.toLowerCase();
    } else if (title === "Number of Lights") {
      const m = value.match(/(\d+)/);
      if (m) opts.heads = parseInt(m[1], 10);
    } else if (title === "Size" || title === "Diameter") {
      const m = value.match(/(\d+)/);
      if (m) opts.sizeCm = parseInt(m[1], 10);
    } else if (title === "Voltage") {
      const m = value.match(/(\d+)/);
      if (m) opts.voltage = parseInt(m[1], 10);
    } else if (title === "Color Temperature") {
      opts.lightType = value.toLowerCase();
    } else if (title === "Wattage") {
      const m = value.match(/(\d+)/);
      if (m) opts.wattage = parseInt(m[1], 10);
    }
  }
  return opts;
}

// =============================================================================
// MAPPING LOGIC
// =============================================================================

/**
 * Build a mapping from CJ variant options → CJ sell price.
 *
 * Returns a structure like:
 *   {
 *     sharedDimensions: ["heads", "finish"],   // dimensions present in BOTH CJ and storefront
 *     costLookup: Map<string, number[]>,        // "7|black" → [86.81]
 *     cjOnlyDimensions: ["lightType"],          // dimensions unique to CJ
 *   }
 */
function buildCjPriceLookup(cjVariants, storefrontOptionNames) {
  // Parse all CJ variants
  const cjParsed = cjVariants.map((cv) => ({
    parsed: parseCjVariantName(cv.variantNameEn || cv.variantName),
    price: cv.variantSellPrice,
    sugPrice: cv.variantSugSellPrice,
    sku: cv.variantSku,
    name: cv.variantNameEn || cv.variantName,
    vid: cv.vid,
  }));

  // Determine which dimensions exist in CJ variants
  const cjDimensions = new Set();
  for (const { parsed } of cjParsed) {
    for (const key of Object.keys(parsed)) {
      cjDimensions.add(key);
    }
  }

  // Determine which dimensions exist in storefront
  const sfDimensions = new Set();
  const titleToKey = {
    "Finish": "finish", "Color": "finish",
    "Number of Lights": "heads",
    "Size": "sizeCm", "Diameter": "sizeCm",
    "Voltage": "voltage",
    "Color Temperature": "lightType",
    "Wattage": "wattage",
  };
  for (const title of storefrontOptionNames) {
    const key = titleToKey[title];
    if (key) sfDimensions.add(key);
  }

  // Shared dimensions = exist in both CJ and storefront
  const shared = [...cjDimensions].filter((d) => sfDimensions.has(d));
  const cjOnly = [...cjDimensions].filter((d) => !sfDimensions.has(d));

  // Build cost lookup keyed by shared dimensions only
  const costLookup = new Map();
  for (const { parsed, price } of cjParsed) {
    if (price == null) continue;
    const key = shared.map((d) => String(parsed[d] ?? "*")).join("|");
    if (!costLookup.has(key)) costLookup.set(key, []);
    costLookup.get(key).push(price);
  }

  return { sharedDimensions: shared, cjOnlyDimensions: cjOnly, costLookup, cjParsed };
}

/**
 * For a storefront variant, find matching CJ cost using shared dimensions.
 */
function findCjCost(sfParsed, sharedDimensions, costLookup, strategy) {
  const key = sharedDimensions.map((d) => String(sfParsed[d] ?? "*")).join("|");
  const prices = costLookup.get(key);

  if (!prices || prices.length === 0) return null;

  if (strategy === "min") return Math.min(...prices);
  if (strategy === "max") return Math.max(...prices);
  if (strategy === "avg") return prices.reduce((a, b) => a + b, 0) / prices.length;
  return Math.min(...prices);
}

// =============================================================================
// RECONCILIATION
// =============================================================================

function reconcileProduct(medusaProduct, cjVariants, markupPercent, pricingStrategy) {
  const meta = medusaProduct.metadata || {};
  const cjSku = meta.cjSku || medusaProduct.external_id;

  // Get storefront option names
  const optionNames = new Set();
  for (const v of medusaProduct.variants || []) {
    for (const optVal of v.options || []) {
      if (optVal.option?.title) optionNames.add(optVal.option.title);
    }
  }

  // Build CJ price lookup
  const { sharedDimensions, cjOnlyDimensions, costLookup, cjParsed } =
    buildCjPriceLookup(cjVariants, [...optionNames]);

  // Map each storefront variant
  const changes = [];
  let matched = 0;
  let unmatched = 0;

  for (const variant of medusaProduct.variants || []) {
    const sfParsed = parseStorefrontOptions(variant);
    const cjCost = findCjCost(sfParsed, sharedDimensions, costLookup, pricingStrategy);

    // Current price (in cents from Medusa)
    const currentPrice = variant.prices?.find((p) => p.currency_code === "usd");
    const currentAmountCents = currentPrice ? currentPrice.amount : null;

    if (cjCost == null) {
      unmatched++;
      changes.push({
        variantId: variant.id,
        variantTitle: variant.title,
        sku: variant.sku,
        sfOptions: sfParsed,
        currentPriceCents: currentAmountCents,
        cjCostUsd: null,
        newPriceCents: null,
        priceId: currentPrice?.id || null,
        status: "unmatched",
        reason: "No matching CJ variant found",
      });
      continue;
    }

    matched++;
    // CJ cost is in USD dollars. Convert to cents and apply markup.
    const cjCostCents = Math.round(cjCost * 100);
    const newPriceCents = Math.round(cjCostCents * (1 + markupPercent / 100));

    const changed = currentAmountCents !== newPriceCents;

    changes.push({
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku,
      sfOptions: sfParsed,
      currentPriceCents: currentAmountCents,
      cjCostUsd: cjCost,
      cjCostCents,
      newPriceCents,
      priceId: currentPrice?.id || null,
      status: changed ? "update" : "unchanged",
      delta: changed ? newPriceCents - (currentAmountCents || 0) : 0,
    });
  }

  return {
    medusaProductId: medusaProduct.id,
    title: medusaProduct.title,
    cjSku,
    markupPercent,
    pricingStrategy,
    storefrontVariantCount: (medusaProduct.variants || []).length,
    cjVariantCount: cjVariants.length,
    storefrontOptionNames: [...optionNames],
    sharedDimensions,
    cjOnlyDimensions,
    matched,
    unmatched,
    toUpdate: changes.filter((c) => c.status === "update").length,
    unchanged: changes.filter((c) => c.status === "unchanged").length,
    changes,
    cjVariantSummary: cjParsed.map((c) => ({
      name: c.name,
      sku: c.sku,
      price: c.price,
      parsed: c.parsed,
    })),
  };
}

// =============================================================================
// PRICE UPDATE (LIVE MODE)
// =============================================================================

async function applyPriceUpdates(medusaUrl, jwt, reconciliation) {
  const updates = reconciliation.changes.filter((c) => c.status === "update");
  if (updates.length === 0) {
    console.log("  No price updates needed.");
    return { updated: 0, errors: [] };
  }

  console.log(`  Applying ${updates.length} price updates...`);

  let updated = 0;
  const errors = [];

  // Update variant prices one at a time via the product update endpoint
  // Group by product for efficiency
  const variantPayload = updates.map((u) => ({
    id: u.variantId,
    prices: [{ amount: u.newPriceCents, currency_code: "usd" }],
  }));

  // Update the product with new variant prices
  try {
    await adminFetch(medusaUrl, jwt,
      `/admin/products/${reconciliation.medusaProductId}`,
      {
        method: "POST",
        body: JSON.stringify({ variants: variantPayload }),
      }
    );
    updated = updates.length;
    console.log(`  ✓ Updated ${updated} variant prices`);
  } catch (err) {
    console.error(`  ✗ Bulk update failed: ${err.message}`);
    console.log("  Falling back to individual variant updates...");

    // Fall back to individual variant updates
    for (const u of updates) {
      try {
        await adminFetch(medusaUrl, jwt,
          `/admin/products/${reconciliation.medusaProductId}/variants/${u.variantId}`,
          {
            method: "POST",
            body: JSON.stringify({
              prices: [{ amount: u.newPriceCents, currency_code: "usd" }],
            }),
          }
        );
        updated++;
        process.stdout.write(`    Updated ${updated}/${updates.length}\r`);
        await sleep(200);
      } catch (variantErr) {
        errors.push({ variantId: u.variantId, error: variantErr.message });
      }
    }
    console.log(`  ✓ Updated ${updated}/${updates.length} variants (${errors.length} errors)`);
  }

  return { updated, errors };
}

// =============================================================================
// REPORTING
// =============================================================================

function printReconciliation(rec) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  ${rec.title}`);
  console.log(`${"═".repeat(72)}`);
  console.log(`  Medusa ID:            ${rec.medusaProductId}`);
  console.log(`  CJ SKU:               ${rec.cjSku}`);
  console.log(`  Markup:               ${rec.markupPercent}%`);
  console.log(`  Pricing strategy:     ${rec.pricingStrategy} (for multi-match CJ variants)`);
  console.log(`  Shared dimensions:    ${rec.sharedDimensions.join(", ") || "none"}`);
  console.log(`  CJ-only dimensions:   ${rec.cjOnlyDimensions.join(", ") || "none"}`);
  console.log(`  Storefront variants:  ${rec.storefrontVariantCount}`);
  console.log(`  CJ variants:          ${rec.cjVariantCount}`);
  console.log(`  Matched:              ${rec.matched}`);
  console.log(`  Unmatched:            ${rec.unmatched}`);
  console.log(`  To update:            ${rec.toUpdate}`);
  console.log(`  Already correct:      ${rec.unchanged}`);

  // CJ variant price tiers
  console.log(`\n  ── CJ Variant Tiers ──`);
  for (const cv of rec.cjVariantSummary) {
    const dims = Object.entries(cv.parsed).map(([k, v]) => `${k}=${v}`).join(", ");
    console.log(`    $${cv.price.toFixed(2).padEnd(8)} → ${dims}`);
  }

  // Price change plan
  const updates = rec.changes.filter((c) => c.status === "update");
  if (updates.length > 0) {
    console.log(`\n  ── Planned Price Changes (${updates.length}) ──`);
    console.log(`  ${"Title".padEnd(42)} ${"Current".padEnd(10)} ${"CJ Cost".padEnd(10)} ${"New".padEnd(10)} Delta`);
    console.log(`  ${"─".repeat(85)}`);

    for (const u of updates.slice(0, 30)) {
      const title = u.variantTitle.substring(0, 40);
      const cur = u.currentPriceCents != null ? `$${(u.currentPriceCents / 100).toFixed(2)}` : "N/A";
      const cost = u.cjCostUsd != null ? `$${u.cjCostUsd.toFixed(2)}` : "N/A";
      const newP = `$${(u.newPriceCents / 100).toFixed(2)}`;
      const delta = u.delta > 0 ? `+$${(u.delta / 100).toFixed(2)}` : `-$${(Math.abs(u.delta) / 100).toFixed(2)}`;
      console.log(`  ${title.padEnd(42)} ${cur.padEnd(10)} ${cost.padEnd(10)} ${newP.padEnd(10)} ${delta}`);
    }
    if (updates.length > 30) {
      console.log(`  ... and ${updates.length - 30} more`);
    }
  }

  // Unmatched variants
  const unmatched = rec.changes.filter((c) => c.status === "unmatched");
  if (unmatched.length > 0) {
    console.log(`\n  ⚠ Unmatched Variants (${unmatched.length}):`);
    for (const u of unmatched.slice(0, 10)) {
      const dims = Object.entries(u.sfOptions).map(([k, v]) => `${k}=${v}`).join(", ");
      console.log(`    ${u.variantTitle} — ${dims}`);
    }
    if (unmatched.length > 10) {
      console.log(`    ... and ${unmatched.length - 10} more`);
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);

  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL
    || "https://medusa-backend-production-d681.up.railway.app";
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  const mode = args.dryRun ? "DRY-RUN" : "LIVE";
  console.log(`Mode: ${mode} | Markup: ${args.markup}% | Strategy: ${args.pricingStrategy}\n`);

  // ── FROM-REPORT MODE ──
  // Uses a previously saved fetch-cj-variant-prices report to avoid CJ API calls.
  // Storefront data is re-fetched from Medusa for fresh prices.
  if (args.fromReport) {
    if (!email || !password) throw new Error("MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set");
    console.log(`Loading CJ data from report: ${args.fromReport}`);
    const reportData = JSON.parse(fs.readFileSync(args.fromReport, "utf-8"));
    const reports = reportData.reports || [];

    console.log("Authenticating with Medusa Admin...");
    const jwt = await getMedusaAdminJwt(medusaUrl, email, password);
    console.log("✓ Authenticated\n");

    const results = [];
    for (const rep of reports) {
      // Re-fetch the product from Medusa to get fresh variant/price data
      console.log(`  Fetching fresh variant data for ${rep.title}...`);
      const product = await fetchMedusaProduct(medusaUrl, jwt, rep.medusaProductId);
      if (!product) {
        console.log(`  ⚠ Product ${rep.medusaProductId} not found in Medusa`);
        continue;
      }

      const rec = reconcileProduct(product, rep.cjVariants, args.markup, args.pricingStrategy);
      printReconciliation(rec);

      if (!args.dryRun && rec.toUpdate > 0) {
        const { updated, errors } = await applyPriceUpdates(medusaUrl, jwt, rec);
        rec.applied = { updated, errors };
      }
      results.push(rec);
    }

    printSummary(results, mode, args);
    return;
  }

  // ── LIVE API MODE ──
  if (!email || !password) throw new Error("MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set");

  console.log("Authenticating with Medusa Admin...");
  const jwt = await getMedusaAdminJwt(medusaUrl, email, password);
  console.log("✓ Authenticated");

  console.log("Authenticating with CJ API...");
  await ensureCjToken();
  console.log("✓ CJ token acquired\n");

  // Gather products
  const productsToScan = [];

  if (args.sku) {
    console.log(`Looking up product by CJ SKU: ${args.sku}...`);
    const product = await findMedusaProductBySku(medusaUrl, jwt, args.sku);
    if (!product) { console.error(`Product not found in Medusa for SKU ${args.sku}`); process.exit(1); }
    productsToScan.push(product);
  } else if (args.productId) {
    const product = await fetchMedusaProduct(medusaUrl, jwt, args.productId);
    productsToScan.push(product);
  } else if (args.all) {
    console.log(`Fetching up to ${args.limit} products with CJ metadata...`);
    const products = await fetchAllMedusaProductsWithCjMeta(medusaUrl, jwt, args.limit);
    productsToScan.push(...products);
    console.log(`Found ${products.length} products\n`);
  }

  // Process each product
  const results = [];

  for (let i = 0; i < productsToScan.length; i++) {
    const product = productsToScan[i];
    const meta = product.metadata || {};
    const cjSku = meta.cjSku || product.external_id;

    if (!cjSku) {
      console.log(`  Skipping ${product.title} — no CJ SKU`);
      continue;
    }

    process.stdout.write(`  [${i + 1}/${productsToScan.length}] ${product.title}...\r`);

    // Fetch CJ variants
    const cjVariants = await fetchCjVariants(cjSku);
    if (cjVariants.length === 0) {
      console.log(`\n  ⚠ No CJ variants found for ${cjSku}`);
      results.push({ medusaProductId: product.id, title: product.title, cjSku, error: "No CJ variants" });
      continue;
    }

    // Reconcile pricing
    const rec = reconcileProduct(product, cjVariants, args.markup, args.pricingStrategy);
    printReconciliation(rec);

    // Apply updates in live mode
    if (!args.dryRun && rec.toUpdate > 0) {
      const { updated, errors } = await applyPriceUpdates(medusaUrl, jwt, rec);
      rec.applied = { updated, errors };
    }

    results.push(rec);
    await sleep(500); // CJ rate limit
  }

  printSummary(results, mode, args);
}

function printSummary(results, mode, args) {
  console.log(`\n\n${"═".repeat(72)}`);
  console.log(`  SUMMARY — ${mode}`);
  console.log(`${"═".repeat(72)}`);
  console.log(`  Products processed:    ${results.length}`);
  console.log(`  Total variants:        ${results.reduce((s, r) => s + (r.storefrontVariantCount || 0), 0)}`);
  console.log(`  Price updates:         ${results.reduce((s, r) => s + (r.toUpdate || 0), 0)}`);
  console.log(`  Already correct:       ${results.reduce((s, r) => s + (r.unchanged || 0), 0)}`);
  console.log(`  Unmatched:             ${results.reduce((s, r) => s + (r.unmatched || 0), 0)}`);

  const withUpdates = results.filter((r) => (r.toUpdate || 0) > 0);
  if (withUpdates.length > 0 && args.dryRun) {
    console.log(`\n  To apply these changes, re-run without --dry-run`);
  }

  // Save report
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify({
      mode,
      markup: args.markup,
      pricingStrategy: args.pricingStrategy,
      results,
      summary: {
        products: results.length,
        totalVariants: results.reduce((s, r) => s + (r.storefrontVariantCount || 0), 0),
        updates: results.reduce((s, r) => s + (r.toUpdate || 0), 0),
        unchanged: results.reduce((s, r) => s + (r.unchanged || 0), 0),
        unmatched: results.reduce((s, r) => s + (r.unmatched || 0), 0),
      },
    }, null, 2));
    console.log(`\n✓ Report saved to ${args.out}`);
  }
}

main().catch((err) => {
  console.error(`\n✗ Fatal: ${err.message}`);
  process.exit(1);
});
