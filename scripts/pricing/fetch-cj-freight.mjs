#!/usr/bin/env node

/**
 * Fetch CJ Freight (Shipping) Costs for All Products
 *
 * For each Medusa product with a CJ SKU in metadata:
 *   1. Queries CJ variant API to get vid(s) + weights
 *   2. Groups variants by weight (same weight = same shipping cost)
 *   3. Calls CJ freight API for each unique weight × destination (CA, US)
 *   4. Records cheapest & fastest shipping method per variant per destination
 *
 * Output: JSON report mapping every Medusa variant to its shipping costs.
 *
 * Usage:
 *   # Dry-run — scan 5 products
 *   node scripts/pricing/fetch-cj-freight.mjs --limit 5
 *
 *   # Full catalog
 *   node scripts/pricing/fetch-cj-freight.mjs --all
 *
 *   # Save report
 *   node scripts/pricing/fetch-cj-freight.mjs --all --out reports/pricing/freight-all.json
 *
 *   # Specific product by Medusa ID
 *   node scripts/pricing/fetch-cj-freight.mjs --product-id prod_01KF76EYPNPZS396SN4A1NVJDB
 *
 * Env vars (auto-loaded from admin/.env, .agents/product-listing-analyst/.env):
 *   MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD, CJ_API_KEY
 */

import fs from "node:fs";
import path from "node:path";

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

const DESTINATIONS = ["CA", "US"];

function parseArgs(argv) {
  const args = {
    all: false,
    limit: 5,
    productId: null,
    out: null,
    destinations: DESTINATIONS,
    delayMs: 350,   // delay between CJ API calls
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") { args.all = true; args.limit = Infinity; continue; }
    if (arg === "--limit") { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--product-id") { args.productId = argv[++i]; continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--delay") { args.delayMs = parseInt(argv[++i], 10); continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

// =============================================================================
// COMMON HELPERS
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
// MEDUSA ADMIN API
// =============================================================================

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

async function adminFetch(medusaUrl, jwt, endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(new URL(endpoint, medusaUrl), {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body.substring(0, 200)}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries) {
        await sleep(2000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Fetch ALL Medusa products (paginated), returning those with CJ metadata.
 * Only fetches fields needed: id, title, handle, metadata, variant ids/skus.
 */
async function fetchMedusaProducts(medusaUrl, jwt, maxProducts) {
  const results = [];
  let offset = 0;
  const limit = 100;
  while (results.length < maxProducts) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,metadata,*variants`
    );
    const products = data.products || [];
    for (const p of products) {
      if (results.length >= maxProducts) break;
      const meta = p.metadata || {};
      if (meta.cjSku || meta.cjProductId) {
        results.push(p);
      }
    }
    if (products.length < limit) break;
    offset += limit;
    process.stdout.write(`   Fetched ${offset} products from Medusa (${results.length} with CJ data)...\r`);
    await sleep(150);
  }
  return results;
}

// =============================================================================
// CJ DROPSHIPPING API
// =============================================================================

const CJ_BASE = "https://developers.cjdropshipping.com";
const CJ_TOKEN_CACHE = path.join(process.cwd(), ".cj-token-cache.json");
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

/**
 * Generic CJ API GET with auto-refresh on token expiry.
 */
async function cjGet(endpoint, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const token = await ensureCjToken();
    try {
      const res = await fetch(`${CJ_BASE}${endpoint}`, {
        headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
        signal: AbortSignal.timeout(20_000),
      });
      const data = await res.json();
      // Token expired — clear and retry
      if (data.code === 1600001 || data.code === 1600002) {
        cjAccessToken = null;
        continue;
      }
      return data;
    } catch (err) {
      if (attempt < retries) { await sleep(2000 * attempt); continue; }
      throw err;
    }
  }
}

/**
 * CJ POST request (for freight).
 */
async function cjPost(endpoint, body, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const token = await ensureCjToken();
    try {
      const res = await fetch(`${CJ_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      const data = await res.json();
      if (data.code === 1600001 || data.code === 1600002) {
        cjAccessToken = null;
        continue;
      }
      return data;
    } catch (err) {
      if (attempt < retries) { await sleep(2000 * attempt); continue; }
      throw err;
    }
  }
}

/**
 * Get CJ variants for a product SKU. Returns array of variant objects.
 */
async function fetchCjVariants(productSku) {
  const data = await cjGet(`/api2.0/v1/product/variant/query?productSku=${encodeURIComponent(productSku)}`);
  if (!data.result || !data.data) return [];
  return Array.isArray(data.data) ? data.data : [];
}

/**
 * Get freight options for a specific variant vid to a destination country.
 * Returns sorted array of shipping methods.
 */
async function fetchFreight(vid, destCountry) {
  const data = await cjPost("/api2.0/v1/logistic/freightCalculate", {
    startCountryCode: "CN",
    endCountryCode: destCountry,
    products: [{ vid, quantity: 1 }],
  });
  if (!data.result || !data.data) return [];
  return (data.data || []).sort((a, b) => a.logisticPrice - b.logisticPrice);
}

// =============================================================================
// CORE — PROCESS ONE PRODUCT
// =============================================================================

/**
 * Process a single Medusa product:
 *  1. Look up CJ variants by metadata.cjSku
 *  2. Group by weight to minimize freight API calls
 *  3. Fetch freight for each weight group × destination
 *  4. Return per-variant freight data
 */
async function processProduct(product, destinations, delayMs) {
  const meta = product.metadata || {};
  const cjSku = meta.cjSku;

  if (!cjSku) {
    return {
      medusaProductId: product.id,
      title: product.title,
      handle: product.handle,
      cjSku: null,
      status: "no_cj_sku",
      variants: [],
    };
  }

  // 1. Fetch CJ variants
  const cjVariants = await fetchCjVariants(cjSku);
  if (cjVariants.length === 0) {
    return {
      medusaProductId: product.id,
      title: product.title,
      handle: product.handle,
      cjSku,
      status: "no_cj_variants",
      variants: [],
    };
  }

  // 2. Group CJ variants by weight (same weight → same shipping cost)
  //    Key: weight in grams, Value: first vid with that weight
  const weightToVid = new Map();
  for (const cv of cjVariants) {
    const w = cv.variantWeight || 0;
    if (!weightToVid.has(w)) {
      weightToVid.set(w, cv.vid);
    }
  }

  // 3. Fetch freight for each unique weight × destination
  //    Key: `${weight}|${dest}`, Value: sorted methods array
  const freightCache = new Map();

  for (const [weight, vid] of weightToVid) {
    for (const dest of destinations) {
      const cacheKey = `${weight}|${dest}`;
      const methods = await fetchFreight(vid, dest);
      freightCache.set(cacheKey, methods);
      await sleep(delayMs);
    }
  }

  // 4. Map CJ variants → Medusa variants and attach freight data
  //    We match CJ variants to Medusa variants by index (same order from sync)
  const medusaVariants = product.variants || [];
  const variantResults = [];

  for (let i = 0; i < medusaVariants.length; i++) {
    const mv = medusaVariants[i];
    // Match to CJ variant by index (if available)
    const cv = i < cjVariants.length ? cjVariants[i] : cjVariants[0];
    const weight = cv?.variantWeight || 0;

    const freightByDest = {};
    for (const dest of destinations) {
      const cacheKey = `${weight}|${dest}`;
      const methods = freightCache.get(cacheKey) || [];

      // Pick cheapest standard method (exclude extremely slow sea freight > 20 days)
      const standardMethods = methods.filter((m) => {
        const minDays = parseInt(m.logisticAging) || 0;
        return minDays <= 20; // exclude sea freight
      });
      const cheapest = standardMethods[0] || methods[0] || null;
      const fastest = [...methods].sort((a, b) => {
        const aMin = parseInt(a.logisticAging) || 999;
        const bMin = parseInt(b.logisticAging) || 999;
        return aMin - bMin;
      })[0] || null;

      freightByDest[dest] = {
        methodCount: methods.length,
        cheapest: cheapest ? {
          method: cheapest.logisticName,
          price: cheapest.logisticPrice,
          days: cheapest.logisticAging,
        } : null,
        fastest: fastest ? {
          method: fastest.logisticName,
          price: fastest.logisticPrice,
          days: fastest.logisticAging,
        } : null,
        allMethods: methods.map((m) => ({
          method: m.logisticName,
          price: m.logisticPrice,
          days: m.logisticAging,
        })),
      };
    }

    variantResults.push({
      medusaVariantId: mv.id,
      sku: mv.sku,
      variantTitle: mv.title,
      cjVid: cv?.vid || null,
      cjVariantName: cv?.variantNameEn || cv?.variantName || null,
      weightGrams: weight,
      freight: freightByDest,
    });
  }

  return {
    medusaProductId: product.id,
    title: product.title,
    handle: product.handle,
    cjSku,
    cjVariantCount: cjVariants.length,
    medusaVariantCount: medusaVariants.length,
    uniqueWeights: weightToVid.size,
    freightCallsMade: weightToVid.size * destinations.length,
    status: "ok",
    variants: variantResults,
  };
}

// =============================================================================
// SUMMARY + OUTPUT
// =============================================================================

function printProductSummary(result, index, total) {
  const progress = `[${index}/${total}]`;
  if (result.status !== "ok") {
    console.log(`  ${progress} ⏭  ${result.title?.slice(0, 55)} — ${result.status}`);
    return;
  }

  // Show first variant's cheapest shipping for each destination
  const v0 = result.variants[0];
  if (!v0) return;
  const parts = [];
  for (const dest of DESTINATIONS) {
    const f = v0.freight[dest];
    if (f?.cheapest) {
      parts.push(`${dest}: $${f.cheapest.price} (${f.cheapest.days}d)`);
    }
  }
  console.log(`  ${progress} ✅ ${result.title?.slice(0, 45)} — ${parts.join(" | ")}`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const medusaUrl = process.env.MEDUSA_BACKEND_URL || "https://medusa-backend-production-d681.up.railway.app";

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          CJ Freight / Shipping Cost Scanner                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Medusa:       ${medusaUrl}`);
  console.log(`  Destinations: ${args.destinations.join(", ")}`);
  console.log(`  Limit:        ${args.limit === Infinity ? "ALL" : args.limit}`);
  console.log(`  Delay:        ${args.delayMs}ms between CJ calls`);
  console.log();

  // Auth
  console.log("🔐 Authenticating...");
  const jwt = await getMedusaAdminJwt(medusaUrl);
  console.log("   ✓ Medusa authenticated");
  await ensureCjToken();
  console.log("   ✓ CJ token acquired\n");

  // Gather products
  let products = [];
  if (args.productId) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products/${args.productId}?fields=id,title,handle,metadata,*variants`
    );
    if (data.product) products.push(data.product);
    else { console.error(`Product ${args.productId} not found`); process.exit(1); }
  } else {
    console.log("📦 Fetching products from Medusa...");
    products = await fetchMedusaProducts(medusaUrl, jwt, args.limit);
    console.log(`\n   ✓ Found ${products.length} products with CJ metadata\n`);
  }

  // Process
  console.log("🚚 Scanning freight costs...\n");
  const results = [];
  let okCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let totalFreightCalls = 0;
  const startTime = Date.now();

  for (let i = 0; i < products.length; i++) {
    try {
      const result = await processProduct(products[i], args.destinations, args.delayMs);
      results.push(result);

      if (result.status === "ok") {
        okCount++;
        totalFreightCalls += result.freightCallsMade;
      } else {
        skipCount++;
      }

      printProductSummary(result, i + 1, products.length);
    } catch (err) {
      errorCount++;
      console.log(`  [${i + 1}/${products.length}] ❌ ${products[i].title?.slice(0, 45)} — ${err.message?.slice(0, 80)}`);
      results.push({
        medusaProductId: products[i].id,
        title: products[i].title,
        status: "error",
        error: err.message?.slice(0, 200),
        variants: [],
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log("\n" + "═".repeat(62));
  console.log("  SUMMARY");
  console.log("═".repeat(62));
  console.log(`  Products scanned:  ${results.length}`);
  console.log(`  With freight data: ${okCount}`);
  console.log(`  Skipped (no CJ):   ${skipCount}`);
  console.log(`  Errors:            ${errorCount}`);
  console.log(`  Freight API calls: ${totalFreightCalls}`);
  console.log(`  Elapsed:           ${elapsed}s`);

  // Compute overall shipping cost stats
  const allCheapestCA = [];
  const allCheapestUS = [];
  for (const r of results) {
    for (const v of r.variants) {
      if (v.freight.CA?.cheapest) allCheapestCA.push(v.freight.CA.cheapest.price);
      if (v.freight.US?.cheapest) allCheapestUS.push(v.freight.US.cheapest.price);
    }
  }
  if (allCheapestCA.length > 0) {
    allCheapestCA.sort((a, b) => a - b);
    console.log(`\n  CA shipping (cheapest standard, excl. sea):`);
    console.log(`    Min:    $${allCheapestCA[0]}`);
    console.log(`    Median: $${allCheapestCA[Math.floor(allCheapestCA.length / 2)]}`);
    console.log(`    Max:    $${allCheapestCA[allCheapestCA.length - 1]}`);
  }
  if (allCheapestUS.length > 0) {
    allCheapestUS.sort((a, b) => a - b);
    console.log(`\n  US shipping (cheapest standard, excl. sea):`);
    console.log(`    Min:    $${allCheapestUS[0]}`);
    console.log(`    Median: $${allCheapestUS[Math.floor(allCheapestUS.length / 2)]}`);
    console.log(`    Max:    $${allCheapestUS[allCheapestUS.length - 1]}`);
  }

  // Save report
  if (args.out) {
    const report = {
      timestamp: new Date().toISOString(),
      destinations: args.destinations,
      summary: {
        productsScanned: results.length,
        withFreight: okCount,
        skipped: skipCount,
        errors: errorCount,
        freightApiCalls: totalFreightCalls,
        elapsedSeconds: parseFloat(elapsed),
      },
      shippingStats: {
        CA: allCheapestCA.length > 0 ? {
          min: allCheapestCA[0],
          median: allCheapestCA[Math.floor(allCheapestCA.length / 2)],
          max: allCheapestCA[allCheapestCA.length - 1],
          sampleSize: allCheapestCA.length,
        } : null,
        US: allCheapestUS.length > 0 ? {
          min: allCheapestUS[0],
          median: allCheapestUS[Math.floor(allCheapestUS.length / 2)],
          max: allCheapestUS[allCheapestUS.length - 1],
          sampleSize: allCheapestUS.length,
        } : null,
      },
      results,
    };

    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
    console.log(`\n✓ Report saved to ${args.out}`);
  }

  console.log();
}

main().catch((err) => {
  console.error(`\n💥 Fatal: ${err.message}`);
  process.exit(1);
});
