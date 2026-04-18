#!/usr/bin/env node

/**
 * CJ → Convex → Medusa End-to-End Product Onboarding Orchestrator
 *
 * Takes a single CJ SKU and walks it through every step required to put it
 * live on the storefront — idempotent at each stage so it's safe to re-run.
 *
 * Steps:
 *   1.  Fetch full product detail from CJ Open API by SKU
 *   2.  Upsert into Convex `cjMyProducts`
 *   3.  Stage into Convex `medusaProducts` (draft, with default variant + price)
 *   4.  Mark the staging row ready to sync
 *   5.  Push the draft to Medusa via sync-convex-to-medusa.mjs --external-id
 *   6.  Fetch real CJ per-variant prices into Medusa (--sku flag on price script)
 *   7.  Normalize SKUs from CJJT… → ELV… on the Medusa product
 *   8.  Print remaining manual steps (variant expansion, shipping surcharge,
 *       category/collection assignment, optional thumbnail enhancement,
 *       and final publish).
 *
 * Usage:
 *   node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ
 *   node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ --markup 100
 *   node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ --skip-prices --skip-normalize
 *   node scripts/catalog/onboard-cj-product.mjs --cj-sku CJJT138697601AZ --dry-run
 *
 * Flags:
 *   --cj-sku SKU      Required. CJ product SKU (e.g. CJJT138697601AZ)
 *   --markup N        Markup percent for the default variant price (default 100 = 2x cost)
 *   --title TITLE     Override product title (default: CJ nameEn)
 *   --description STR Override product description (default: CJ description, stripped of <img>)
 *   --skip-prices     Don't run fetch-cj-variant-prices after sync
 *   --skip-normalize  Don't run normalize-elv-skus after sync
 *   --dry-run         Print what would happen, but don't write to Convex/Medusa
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

// =============================================================================
// CONFIG
// =============================================================================

const CJ_BASE = "https://developers.cjdropshipping.com";
const __script_dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__script_dir, "..", "..");
const CJ_TOKEN_CACHE = path.join(REPO_ROOT, "scripts", ".cj-token-cache.json");

const DEFAULTS = {
  CONVEX_URL: "https://superb-dotterel-37.convex.cloud",
  MARKUP_PERCENT: 100,
};

// =============================================================================
// ARG PARSING
// =============================================================================

function parseArgs(argv) {
  const args = {
    cjSku: null,
    markup: DEFAULTS.MARKUP_PERCENT,
    title: null,
    description: null,
    skipPrices: false,
    skipNormalize: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cj-sku") { args.cjSku = argv[++i]; continue; }
    if (a === "--markup") { args.markup = Number(argv[++i]); continue; }
    if (a === "--title") { args.title = argv[++i]; continue; }
    if (a === "--description") { args.description = argv[++i]; continue; }
    if (a === "--skip-prices") { args.skipPrices = true; continue; }
    if (a === "--skip-normalize") { args.skipNormalize = true; continue; }
    if (a === "--dry-run") { args.dryRun = true; continue; }
    if (a === "--help" || a === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${a}`);
  }

  if (!args.cjSku) {
    printUsage();
    throw new Error("--cj-sku is required");
  }
  if (!Number.isFinite(args.markup) || args.markup < 0) {
    throw new Error("--markup must be a non-negative number (percent)");
  }

  return args;
}

function printUsage() {
  console.log(
    "Usage: node scripts/catalog/onboard-cj-product.mjs --cj-sku <CJ_SKU> [options]\n" +
    "  --markup N         Markup percent (default 100)\n" +
    "  --title STR        Override product title\n" +
    "  --description STR  Override description\n" +
    "  --skip-prices      Skip fetch-cj-variant-prices step\n" +
    "  --skip-normalize   Skip normalize-elv-skus step\n" +
    "  --dry-run          Print plan only, no writes",
  );
}

// =============================================================================
// ENV LOADING (matches sync-convex-to-medusa.mjs pattern)
// =============================================================================

function loadEnv() {
  const envPaths = [
    path.join(REPO_ROOT, "admin", ".env"),
    path.join(REPO_ROOT, "admin", ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, "storefront", ".env.local"),
    path.join(REPO_ROOT, ".agents", "product-listing-analyst", ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
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

// =============================================================================
// CJ OPEN API
// =============================================================================

let cjAccessToken = null;

function loadCachedCjToken() {
  try {
    if (!fs.existsSync(CJ_TOKEN_CACHE)) return null;
    const cached = JSON.parse(fs.readFileSync(CJ_TOKEN_CACHE, "utf-8"));
    if (Date.now() - cached.ts < 23 * 60 * 60 * 1000) return cached.token;
  } catch { /* ignore */ }
  return null;
}

function saveCjTokenCache(token) {
  try {
    fs.writeFileSync(CJ_TOKEN_CACHE, JSON.stringify({ token, ts: Date.now() }));
  } catch { /* ignore */ }
}

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;
  const cached = loadCachedCjToken();
  if (cached) { cjAccessToken = cached; return cached; }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY not set in environment");
  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed (code ${data.code}): ${data.message || "no token"}`);
  }
  cjAccessToken = data.data.accessToken;
  saveCjTokenCache(cjAccessToken);
  return cjAccessToken;
}

async function cjGet(endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const token = await ensureCjToken();
    const res = await fetch(`${CJ_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json();
    if (data.code === 1600001 || data.code === 1600002) {
      cjAccessToken = null;
      continue;
    }
    return data;
  }
  throw new Error(`CJ GET ${endpoint} failed after ${retries} attempts`);
}

async function fetchCjProductBySku(productSku) {
  const data = await cjGet(
    `/api2.0/v1/product/query?productSku=${encodeURIComponent(productSku)}&features=enable_inventory`,
  );
  if (!data.result || !data.data) {
    throw new Error(`CJ product/query failed for SKU ${productSku}: ${data.message || data.code}`);
  }
  return data.data;
}

// =============================================================================
// CJ PAYLOAD → CONVEX MUTATION ARGS
// =============================================================================

/**
 * Map a CJ product detail object to the args expected by
 * api.cj.myProducts.upsert. CJ field names vary slightly across endpoints —
 * we accept the most common shapes from /product/query.
 */
function buildCjUpsertArgs(cj) {
  const cjProductId = String(cj.pid ?? cj.productId ?? "").trim();
  const sku = String(cj.productSku ?? cj.sku ?? "").trim();
  const nameEn = String(cj.productNameEn ?? cj.nameEn ?? cj.productName ?? "").trim();

  if (!cjProductId) throw new Error("CJ payload missing pid/productId");
  if (!sku) throw new Error("CJ payload missing productSku");
  if (!nameEn) throw new Error("CJ payload missing productNameEn");

  const productNames = Array.isArray(cj.productNames)
    ? cj.productNames
    : [nameEn];

  const bigImage =
    cj.productImage ||
    cj.bigImage ||
    (Array.isArray(cj.productImageSet) ? cj.productImageSet[0] : "") ||
    "";

  // sellPrice on /product/query is often a "min-max" string; fall back to
  // smallest variant price if needed.
  let priceUsd = 0;
  const sellPrice = cj.sellPrice ?? cj.productPrice ?? "0";
  if (typeof sellPrice === "number") {
    priceUsd = sellPrice;
  } else if (typeof sellPrice === "string") {
    const first = sellPrice.split(/[-~/]/)[0]?.trim();
    const n = Number(first);
    priceUsd = Number.isFinite(n) ? n : 0;
  }
  if (!priceUsd && Array.isArray(cj.variants) && cj.variants.length) {
    const prices = cj.variants
      .map((v) => Number(v.variantSellPrice ?? v.sellPrice ?? 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length) priceUsd = Math.min(...prices);
  }

  const productType = Number(cj.productType ?? 1);
  const cjCreatedAt = cj.createrTime ?? cj.createTime ?? Date.now();

  return {
    cjProductId,
    sku,
    nameEn,
    productNames,
    bigImage,
    price: priceUsd,
    productType,
    listedShopNum: cj.listedNum != null ? String(cj.listedNum) : undefined,
    cjCreatedAt,
    description: cj.description || undefined,
    categoryId: cj.categoryId || undefined,
    categoryName: cj.categoryName || undefined,
    supplierName: cj.supplierName || cj.sellerName || undefined,
    inventory:
      typeof cj.totalInventory === "number" ? cj.totalInventory : undefined,
    isRemovedFromShelves: cj.statusType === 0 ? true : undefined,
    cjStatusMessage: cj.statusMessage || undefined,
  };
}

// =============================================================================
// CHILD-PROCESS HELPERS
// =============================================================================

function runNode(scriptRelPath, scriptArgs, opts = {}) {
  const scriptAbs = path.join(REPO_ROOT, scriptRelPath);
  const allArgs = [scriptAbs, ...scriptArgs];
  const label = `node ${scriptRelPath} ${scriptArgs.join(" ")}`;
  console.log(`\n$ ${label}`);
  if (opts.dryRun) {
    console.log("   (dry-run: not executed)");
    return { status: 0, dryRun: true };
  }
  const result = spawnSync(process.execPath, allArgs, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  return { status: result.status ?? 0 };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  loadEnv();
  const args = parseArgs(process.argv);

  const banner = "═".repeat(64);
  console.log(banner);
  console.log(`  CJ Product Onboarding Orchestrator`);
  console.log(`  CJ SKU:    ${args.cjSku}`);
  console.log(`  Markup:    ${args.markup}%`);
  console.log(`  Dry-run:   ${args.dryRun}`);
  console.log(banner);

  const convexUrl = process.env.CONVEX_URL || DEFAULTS.CONVEX_URL;
  const convex = new ConvexHttpClient(convexUrl);

  // ---------------------------------------------------------------------------
  // Step 1: Fetch CJ detail
  // ---------------------------------------------------------------------------
  console.log("\n[1/7] Fetching CJ product detail...");
  const cjDetail = await fetchCjProductBySku(args.cjSku);
  const upsertArgs = buildCjUpsertArgs(cjDetail);
  console.log(`      ✓ CJ pid=${upsertArgs.cjProductId} "${upsertArgs.nameEn}"`);
  console.log(`        priceUsd=${upsertArgs.price}  variants=${(cjDetail.variants || []).length}`);

  // ---------------------------------------------------------------------------
  // Step 2: Upsert into Convex cjMyProducts
  // ---------------------------------------------------------------------------
  console.log("\n[2/7] Upserting into Convex cjMyProducts...");
  let cjMyProductId;
  if (args.dryRun) {
    console.log("      (dry-run) would call api.cj.myProducts.upsert with:", JSON.stringify(upsertArgs, null, 2).slice(0, 600));
  } else {
    const upsertRes = await convex.mutation(api.cj.myProducts.upsert, upsertArgs);
    cjMyProductId = upsertRes.id;
    console.log(`      ✓ ${upsertRes.action} cjMyProducts/${cjMyProductId}`);
  }

  // ---------------------------------------------------------------------------
  // Step 3: Stage into medusaProducts (idempotent — returns existing if staged)
  // ---------------------------------------------------------------------------
  console.log("\n[3/7] Staging into Convex medusaProducts...");
  let medusaProductId;
  if (args.dryRun) {
    console.log("      (dry-run) would call api.medusa.staging.stageCjProduct");
  } else {
    const stageRes = await convex.mutation(api.medusa.staging.stageCjProduct, {
      cjMyProductId,
      title: args.title || undefined,
      description: args.description || undefined,
      markupPercent: args.markup,
    });
    if (stageRes.success) {
      medusaProductId = stageRes.medusaProductId;
      console.log(`      ✓ created medusaProducts/${medusaProductId} handle="${stageRes.handle}"`);
    } else {
      medusaProductId = stageRes.medusaProductId;
      console.log(`      ↻ already staged: medusaProducts/${medusaProductId} (${stageRes.error})`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4: Mark ready to sync
  // ---------------------------------------------------------------------------
  console.log("\n[4/7] Marking staging row ready to sync...");
  if (args.dryRun) {
    console.log("      (dry-run) would call api.medusa.staging.markReadyToSync");
  } else {
    try {
      await convex.mutation(api.medusa.staging.markReadyToSync, {
        medusaProductId,
      });
      console.log("      ✓ marked ready");
    } catch (err) {
      // markReadyToSync may already have been applied / signature may differ —
      // surface the error but continue, sync step will reveal real state.
      console.log(`      ⚠ markReadyToSync warning: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: Push to Medusa via existing sync script (targeted by external-id)
  // ---------------------------------------------------------------------------
  console.log("\n[5/7] Syncing to Medusa (targeted)...");
  const syncRes = runNode(
    "scripts/sync/sync-convex-to-medusa.mjs",
    ["--external-id", upsertArgs.cjProductId, "--batch-size", "1"],
    { dryRun: args.dryRun },
  );
  if (!args.dryRun && syncRes.status !== 0) {
    throw new Error(`sync-convex-to-medusa.mjs exited with code ${syncRes.status}`);
  }

  // ---------------------------------------------------------------------------
  // Step 6: Pull real per-variant CJ prices into Medusa
  // ---------------------------------------------------------------------------
  if (args.skipPrices) {
    console.log("\n[6/7] Skipping fetch-cj-variant-prices (--skip-prices)");
  } else {
    console.log("\n[6/7] Fetching per-variant CJ prices into Medusa...");
    const priceRes = runNode(
      "scripts/pricing/fetch-cj-variant-prices.mjs",
      ["--sku", args.cjSku, "--apply"],
      { dryRun: args.dryRun },
    );
    if (!args.dryRun && priceRes.status !== 0) {
      console.log(`      ⚠ fetch-cj-variant-prices exited ${priceRes.status} (continuing)`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 7: Normalize CJJT… → ELV… SKUs on the new product
  // ---------------------------------------------------------------------------
  if (args.skipNormalize) {
    console.log("\n[7/7] Skipping normalize-elv-skus (--skip-normalize)");
  } else {
    console.log("\n[7/7] Normalizing variant SKUs to ELV format...");
    const normRes = runNode(
      "scripts/catalog/normalize-elv-skus.mjs",
      [args.cjSku, "--apply"],
      { dryRun: args.dryRun },
    );
    if (!args.dryRun && normRes.status !== 0) {
      console.log(`      ⚠ normalize-elv-skus exited ${normRes.status} (continuing)`);
    }
  }

  // ---------------------------------------------------------------------------
  // Done — print remaining manual steps
  // ---------------------------------------------------------------------------
  console.log(`\n${banner}`);
  console.log("✅ Automated onboarding complete.");
  console.log(banner);
  console.log("\nRemaining manual / human-review steps:\n");
  console.log(`  1. Expand variants (review option labels):`);
  console.log(`       node scripts/catalog/expand-cj-variants.mjs ${args.cjSku}`);
  console.log(`       node scripts/catalog/expand-cj-variants.mjs ${args.cjSku} --apply\n`);
  console.log(`  2. Backfill expedited shipping surcharges per variant:`);
  console.log(`       (parameterize scripts/pricing/backfill-shipping-CJJT1386169.mjs for ${args.cjSku})\n`);
  console.log(`  3. Assign category + collection:`);
  console.log(`       node scripts/catalog/assign-product-categories.mjs`);
  console.log(`       node admin/scripts/map-products-to-collections.cjs\n`);
  console.log(`  4. (Optional) Enhance thumbnails via FLUX:`);
  console.log(`       node scripts/catalog/enhance-thumbnails-flux.mjs\n`);
  console.log(`  5. Publish the draft:`);
  console.log(`       node scripts/sync/publish-medusa-drafts.mjs\n`);
  console.log(`  6. (Optional) Set metadata.packageSize and metadata.comparisonTable via a one-off _tmp script.\n`);
}

main().catch((err) => {
  console.error(`\n❌ Fatal: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
