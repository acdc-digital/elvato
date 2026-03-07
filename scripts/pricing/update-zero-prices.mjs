#!/usr/bin/env node

/**
 * Update $0 Placeholder Prices from Convex/CJ
 *
 * Scans ALL Medusa products for variants with $0 prices. For each:
 *
 *   1. Looks up the Convex medusaProducts record via metadata.external_id
 *   2. Reads staged prices from Convex medusaPrices table
 *   3. If Convex has real prices (> 0), uses those
 *   4. If not, falls back to CJ API (variantSellPrice × markup)
 *   5. Updates variant prices in Medusa Admin API
 *
 * Prices are stored in CENTS (e.g. 1999 = $19.99).
 *
 * Usage:
 *   # Dry-run — shows what would change
 *   node scripts/pricing/update-zero-prices.mjs --dry-run
 *
 *   # Live — apply updates
 *   node scripts/pricing/update-zero-prices.mjs
 *
 *   # Custom markup for CJ fallback (default: 100%)
 *   node scripts/pricing/update-zero-prices.mjs --markup 80
 *
 *   # Limit scan to N products (for testing)
 *   node scripts/pricing/update-zero-prices.mjs --limit 5 --dry-run
 *
 *   # Save report
 *   node scripts/pricing/update-zero-prices.mjs --out reports/zero-price-fix.json
 */

import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

// =============================================================================
// CONFIG
// =============================================================================

const DEFAULTS = {
  CONVEX_URL: "https://superb-dotterel-37.convex.cloud",
  MEDUSA_URL: "https://medusa-backend-production-d681.up.railway.app",
  MARKUP_PERCENT: 100,
};

const CJ_BASE = "https://developers.cjdropshipping.com";
const CJ_TOKEN_CACHE = path.join(process.cwd(), ".cj-token-cache.json");

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
    dryRun: false,
    markup: DEFAULTS.MARKUP_PERCENT,
    limit: Infinity,
    out: null,
    medusaUrl: null,
    convexUrl: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--markup") { args.markup = parseFloat(argv[++i]); continue; }
    if (arg === "--limit") { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--medusa-url") { args.medusaUrl = argv[++i]; continue; }
    if (arg === "--convex-url") { args.convexUrl = argv[++i]; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

// =============================================================================
// MEDUSA ADMIN API
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getMedusaAdminJwt(medusaUrl) {
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD");

  const res = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Admin login failed (${res.status}): ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function adminFetch(medusaUrl, jwt, endpoint, options = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(new URL(endpoint, medusaUrl), {
        ...options,
        signal: AbortSignal.timeout(30_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...options.headers,
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body.substring(0, 300)}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt < 3) {
        await sleep(2000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

// =============================================================================
// CJ DROPSHIPPING API (FALLBACK)
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
  try { fs.writeFileSync(CJ_TOKEN_CACHE, JSON.stringify({ token, ts: Date.now() })); } catch { /* ignore */ }
}

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;
  const cached = loadCachedCjToken();
  if (cached) { cjAccessToken = cached; return cached; }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return null; // CJ not configured — skip fallback
  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) return null;
  cjAccessToken = data.data.accessToken;
  saveCjTokenCache(cjAccessToken);
  return cjAccessToken;
}

async function fetchCjProductPrice(cjSku) {
  const token = await ensureCjToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `${CJ_BASE}/api2.0/v1/product/query?productSku=${encodeURIComponent(cjSku)}`,
      { headers: { "Content-Type": "application/json", "CJ-Access-Token": token } }
    );
    const data = await res.json();
    if (!data.result || !data.data) return null;

    // Get the product's sell price (in USD)
    const product = data.data;
    if (product.sellPrice) return product.sellPrice;

    // Try variants
    const variants = product.variants || [];
    if (variants.length > 0) {
      // Use the minimum sell price across variants
      const prices = variants
        .map((v) => v.variantSellPrice)
        .filter((p) => p != null && p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }

    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// MAIN LOGIC
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL || DEFAULTS.MEDUSA_URL;
  const convexUrl = args.convexUrl || process.env.CONVEX_URL || DEFAULTS.CONVEX_URL;

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║         Update $0 Placeholder Prices from Convex/CJ        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Medusa:   ${medusaUrl}`);
  console.log(`  Convex:   ${convexUrl}`);
  console.log(`  Mode:     ${args.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Markup:   ${args.markup}%`);
  console.log(`  Limit:    ${args.limit === Infinity ? "none" : args.limit}`);
  console.log();

  // --- 1. Auth ---
  console.log("🔐 Authenticating...");
  const jwt = await getMedusaAdminJwt(medusaUrl);
  console.log("   ✓ Medusa authenticated");

  const convex = new ConvexHttpClient(convexUrl);
  console.log("   ✓ Convex client ready\n");

  // --- 2. Scan Medusa for products with $0 variant prices ---
  console.log("🔍 Scanning ALL Medusa products for $0 variants...");
  const zeroPriceProducts = [];
  let offset = 0;
  let totalScanned = 0;
  const pageSize = 50;

  while (zeroPriceProducts.length < args.limit) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${pageSize}&offset=${offset}&fields=id,title,handle,metadata,*variants,*variants.prices`
    );
    const products = data.products || [];
    if (products.length === 0) break;
    totalScanned += products.length;

    for (const product of products) {
      if (zeroPriceProducts.length >= args.limit) break;

      const zeroVariants = (product.variants || []).filter((v) => {
        const prices = v.prices || [];
        return prices.length > 0 && prices.some((p) => p.amount === 0);
      });
      if (zeroVariants.length > 0) {
        zeroPriceProducts.push({ ...product, _zeroVariants: zeroVariants });
      }
    }

    offset += pageSize;
    process.stdout.write(`   Scanned ${totalScanned} products (found ${zeroPriceProducts.length} with $0 prices)...\r`);
    await sleep(200);
  }

  console.log(`\n   ✓ Scanned ${totalScanned} products, found ${zeroPriceProducts.length} with $0 variant prices\n`);

  if (zeroPriceProducts.length === 0) {
    console.log("✅ No products with $0 prices found. Nothing to do.");
    return;
  }

  // --- 3. For each product, look up real prices in Convex, then CJ ---
  console.log("💰 Looking up real prices from Convex & CJ...\n");

  let updated = 0;
  let convexPriced = 0;
  let cjPriced = 0;
  let noPrice = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < zeroPriceProducts.length; i++) {
    const product = zeroPriceProducts[i];
    const progress = `[${i + 1}/${zeroPriceProducts.length}]`;
    const meta = product.metadata || {};
    const externalId = meta.external_id || meta.cjProductId;
    const cjSku = meta.cjSku;
    const title = product.title?.slice(0, 55) || product.id;

    // --- 3a. Try Convex staging prices (product-level lookup, cached) ---
    let convexPriceMap = null; // variantIndex → { usd, eur }
    if (externalId) {
      try {
        const convexProduct = await convex.query(
          api.medusa.staging.getProductByExternalId,
          { externalId }
        );
        if (convexProduct) {
          const fullProduct = await convex.query(
            api.medusa.staging.getProductWithChildren,
            { productId: convexProduct._id }
          );
          if (fullProduct?.variants?.length > 0) {
            convexPriceMap = new Map();
            for (let vi = 0; vi < fullProduct.variants.length; vi++) {
              const cv = fullProduct.variants[vi];
              const prices = cv.prices || [];
              const usd = prices.find((p) => p.currencyCode === "usd");
              const eur = prices.find((p) => p.currencyCode === "eur");
              if ((usd && usd.amount > 0) || (eur && eur.amount > 0)) {
                convexPriceMap.set(vi, {
                  usd: usd?.amount > 0 ? usd.amount : null,
                  eur: eur?.amount > 0 ? eur.amount : null,
                });
              }
            }
            if (convexPriceMap.size === 0) convexPriceMap = null;
          }
        }
      } catch {
        // Convex lookup failed — will fall back to CJ
      }
    }

    // --- 3b. CJ fallback price (product-level, used for all variants) ---
    let cjFallbackCentsUsd = null;
    if (!convexPriceMap) {
      const sku = cjSku || (externalId !== cjSku ? externalId : null);
      if (sku) {
        const cjPriceUsd = await fetchCjProductPrice(sku);
        if (cjPriceUsd && cjPriceUsd > 0) {
          const costCents = Math.round(cjPriceUsd * 100);
          cjFallbackCentsUsd = Math.round(costCents * (1 + args.markup / 100));
        }
        await sleep(500);
      }
    }

    // Determine price source for this product
    const priceSource = convexPriceMap ? "convex" : cjFallbackCentsUsd ? "cj" : null;

    if (!priceSource) {
      console.log(`  ${progress} ⏭️  "${title}" — no price found in Convex or CJ`);
      noPrice++;
      results.push({
        id: product.id,
        title: product.title,
        externalId,
        cjSku,
        zeroVariants: product._zeroVariants.length,
        status: "no_price_found",
      });
      continue;
    }

    // --- 4. Apply price updates to ALL zero-price variants ---
    for (let vi = 0; vi < product._zeroVariants.length; vi++) {
      const variant = product._zeroVariants[vi];
      const currentUsd = variant.prices?.find((p) => p.currency_code === "usd")?.amount ?? 0;
      const currentEur = variant.prices?.find((p) => p.currency_code === "eur")?.amount ?? 0;

      let newPriceCentsUsd = null;
      let newPriceCentsEur = null;

      if (convexPriceMap) {
        // Try matching by variant index
        const cp = convexPriceMap.get(vi) || convexPriceMap.get(0);
        if (cp) {
          newPriceCentsUsd = cp.usd;
          newPriceCentsEur = cp.eur;
        }
      } else if (cjFallbackCentsUsd) {
        newPriceCentsUsd = cjFallbackCentsUsd;
        newPriceCentsEur = cjFallbackCentsUsd; // approximate EUR = USD
      }

      if (newPriceCentsUsd == null && newPriceCentsEur == null) continue;

      const newPrices = [];
      if (newPriceCentsUsd != null) newPrices.push({ amount: newPriceCentsUsd, currency_code: "usd" });
      if (newPriceCentsEur != null) newPrices.push({ amount: newPriceCentsEur, currency_code: "eur" });

      const usdDisplay = newPriceCentsUsd != null ? `$${(newPriceCentsUsd / 100).toFixed(2)}` : "—";
      const eurDisplay = newPriceCentsEur != null ? `€${(newPriceCentsEur / 100).toFixed(2)}` : "—";
      const varLabel = product._zeroVariants.length > 1 ? ` [v${vi + 1}]` : "";

      if (args.dryRun) {
        console.log(`  ${progress} 💰 "${title}"${varLabel} — ${priceSource}: USD ${usdDisplay}, EUR ${eurDisplay}`);
        if (priceSource === "convex") convexPriced++;
        else cjPriced++;
        updated++;
        results.push({
          id: product.id,
          title: product.title,
          externalId,
          cjSku,
          variantId: variant.id,
          status: "would_update",
          priceSource,
          currentUsd,
          currentEur,
          newUsd: newPriceCentsUsd,
          newEur: newPriceCentsEur,
        });
        continue;
      }

      // LIVE: update variant prices
      try {
        await adminFetch(medusaUrl, jwt,
          `/admin/products/${product.id}/variants/${variant.id}`,
          {
            method: "POST",
            body: JSON.stringify({ prices: newPrices }),
          }
        );
        console.log(`  ${progress} ✅ "${title}"${varLabel} — ${priceSource}: USD ${usdDisplay}, EUR ${eurDisplay}`);
        updated++;
        if (priceSource === "convex") convexPriced++;
        else cjPriced++;
        results.push({
          id: product.id,
          title: product.title,
          externalId,
          cjSku,
          variantId: variant.id,
          status: "updated",
          priceSource,
          currentUsd,
          currentEur,
          newUsd: newPriceCentsUsd,
          newEur: newPriceCentsEur,
        });
      } catch (err) {
        console.log(`  ${progress} ❌ "${title}"${varLabel} — update failed: ${err.message?.slice(0, 100)}`);
        failed++;
        results.push({
          id: product.id,
          title: product.title,
          variantId: variant.id,
          status: "failed",
          error: err.message?.slice(0, 200),
        });
      }

      await sleep(300);
    }
  }

  // --- 5. Summary ---
  console.log("\n════════════════════════════════════════");
  console.log(`  Mode:           ${args.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Total scanned:  ${totalScanned}`);
  console.log(`  Products w/$0:  ${zeroPriceProducts.length}`);
  console.log(`  Updated:        ${updated}`);
  console.log(`    from Convex:  ${convexPriced}`);
  console.log(`    from CJ:     ${cjPriced}`);
  console.log(`  No price found: ${noPrice}`);
  console.log(`  Failed:         ${failed}`);
  console.log("════════════════════════════════════════");

  // --- 6. Save report ---
  const reportData = {
    timestamp: new Date().toISOString(),
    mode: args.dryRun ? "dry" : "live",
    markup: args.markup,
    summary: { total: zeroPriceProducts.length, updated, convexPriced, cjPriced, noPrice, failed },
    results,
  };

  const outPath = args.out || `reports/zero-price-fix-${args.dryRun ? "dry" : "live"}.json`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Report saved to ${outPath}`);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
