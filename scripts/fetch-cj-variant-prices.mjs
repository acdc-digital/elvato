#!/usr/bin/env node

/**
 * Fetch CJ Variant Prices — Compare CJ per-variant pricing vs our storefront variants.
 *
 * For each product (or a specific SKU), this script:
 *   1. Fetches the product from Medusa Admin to get metadata.cjProductId + our variants/prices
 *   2. Calls CJ API (product/query) to get CJ's variant list with per-variant pricing
 *   3. Outputs a comparison report showing CJ variants vs storefront variants
 *
 * Usage:
 *   # Single product by CJ SKU
 *   node scripts/fetch-cj-variant-prices.mjs --sku CJSN1587842
 *
 *   # Single product by Medusa product ID
 *   node scripts/fetch-cj-variant-prices.mjs --product-id prod_01ABC123
 *
 *   # Scan all products (first N)
 *   node scripts/fetch-cj-variant-prices.mjs --all --limit 10
 *
 *   # Save report
 *   node scripts/fetch-cj-variant-prices.mjs --sku CJSN1587842 --out reports/cj-variant-prices.json
 *
 * Env vars (auto-loaded from admin/.env, .env.local, .agents/product-listing-analyst/.env):
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD, CJ_API_KEY
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

function parseArgs(argv) {
  const args = {
    sku: null,
    productId: null,
    all: false,
    limit: 10,
    medusaUrl: null,
    out: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--sku") {
      args.sku = argv[++i];
      if (!args.sku) throw new Error("--sku requires a value (e.g., CJSN1587842)");
      continue;
    }
    if (arg === "--product-id") {
      args.productId = argv[++i];
      if (!args.productId) throw new Error("--product-id requires a value");
      continue;
    }
    if (arg === "--all") {
      args.all = true;
      continue;
    }
    if (arg === "--limit") {
      args.limit = parseInt(argv[++i], 10);
      if (!Number.isFinite(args.limit) || args.limit < 1) throw new Error("--limit requires a positive integer");
      continue;
    }
    if (arg === "--medusa-url") {
      args.medusaUrl = argv[++i];
      if (!args.medusaUrl) throw new Error("--medusa-url requires a URL");
      continue;
    }
    if (arg === "--out") {
      args.out = argv[++i];
      if (!args.out) throw new Error("--out requires a file path");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.sku && !args.productId && !args.all) {
    throw new Error("Provide --sku <CJ_SKU>, --product-id <MEDUSA_ID>, or --all");
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
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
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

/**
 * Fetch a single product with all variants + prices from Medusa Admin API.
 */
async function fetchMedusaProduct(medusaUrl, jwt, productId) {
  const data = await adminFetch(
    medusaUrl,
    jwt,
    `/admin/products/${productId}?fields=*variants,*variants.prices`
  );
  return data.product;
}

/**
 * Search Medusa products by metadata.cjSku (external_id field).
 * The cjProductId is stored as external_id in Medusa.
 */
async function findMedusaProductBySku(medusaUrl, jwt, cjSku) {
  // Search products and filter by metadata
  let offset = 0;
  const limit = 50;

  while (true) {
    const data = await adminFetch(
      medusaUrl,
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=*variants,*variants.prices,metadata`
    );

    const products = data.products || [];
    for (const p of products) {
      const meta = p.metadata || {};
      if (meta.cjSku === cjSku || p.external_id === cjSku) {
        // Re-fetch with full variant details
        return fetchMedusaProduct(medusaUrl, jwt, p.id);
      }
    }

    if (products.length < limit) break;
    offset += limit;
    await sleep(200);
  }

  return null;
}

/**
 * Fetch all Medusa products that have CJ metadata.
 */
async function fetchAllMedusaProductsWithCjMeta(medusaUrl, jwt, maxProducts) {
  const results = [];
  let offset = 0;
  const limit = 50;

  while (results.length < maxProducts) {
    const data = await adminFetch(
      medusaUrl,
      jwt,
      `/admin/products?limit=${limit}&offset=${offset}&fields=*variants,*variants.prices,metadata`
    );

    const products = data.products || [];
    for (const p of products) {
      if (results.length >= maxProducts) break;
      const meta = p.metadata || {};
      if (meta.cjProductId || meta.cjSku) {
        results.push(p);
      }
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
let cjAccessToken = null;

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CJ_API_KEY not set. Add it to .agents/product-listing-analyst/.env or set it in the environment."
    );
  }

  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  const data = await res.json();

  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed (code ${data.code}): ${data.message || "No access token"}`);
  }

  cjAccessToken = data.data.accessToken;
  return cjAccessToken;
}

async function cjFetch(endpoint) {
  const token = await ensureCjToken();

  const res = await fetch(`${CJ_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
  });

  const data = await res.json();

  // Token expired — refresh and retry once
  if (data.code === 1600001 || data.code === 1600002) {
    cjAccessToken = null;
    const newToken = await ensureCjToken();
    const retryRes = await fetch(`${CJ_BASE}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": newToken,
      },
    });
    return retryRes.json();
  }

  return data;
}

/**
 * Fetch full product detail from CJ including variants with per-variant pricing.
 * Uses productSku (e.g., CJSN1587842) to query.
 * Returns the product object with `variants` array.
 */
async function fetchCjProductDetail(productSku) {
  const data = await cjFetch(
    `/api2.0/v1/product/query?productSku=${encodeURIComponent(productSku)}&features=enable_inventory`
  );

  if (!data.result || !data.data) {
    return { error: data.message || "Product not found", data: null };
  }

  return { error: null, data: data.data };
}

/**
 * Fetch all variants for a CJ product by product SKU.
 * Alternative endpoint — returns just variants.
 */
async function fetchCjVariants(productSku) {
  const data = await cjFetch(
    `/api2.0/v1/product/variant/query?productSku=${encodeURIComponent(productSku)}`
  );

  if (!data.result || !data.data) {
    return { error: data.message || "Variants not found", variants: [] };
  }

  return { error: null, variants: Array.isArray(data.data) ? data.data : [] };
}

// =============================================================================
// COMPARISON / ANALYSIS
// =============================================================================

function analyzeProduct(medusaProduct, cjVariants) {
  const meta = medusaProduct.metadata || {};

  // Our storefront variants
  const ourVariants = (medusaProduct.variants || []).map((v) => {
    const prices = (v.prices || []).map((p) => ({
      currency: p.currency_code,
      amount: p.amount,
    }));
    const usdPrice = prices.find((p) => p.currency === "usd");

    return {
      id: v.id,
      title: v.title,
      sku: v.sku,
      options: v.options?.reduce((acc, o) => {
        acc[o.option?.title || o.id] = o.value;
        return acc;
      }, {}) || {},
      priceUsd: usdPrice ? usdPrice.amount : null,
      allPrices: prices,
    };
  });

  // CJ variants
  const cjMapped = cjVariants.map((cv) => ({
    vid: cv.vid,
    variantNameEn: cv.variantNameEn || cv.variantName,
    variantSku: cv.variantSku,
    variantSellPrice: cv.variantSellPrice,
    variantSugSellPrice: cv.variantSugSellPrice,
    variantStandard: cv.variantStandard,
    variantProperty: cv.variantProperty,
    variantImage: cv.variantImage,
    variantWeight: cv.variantWeight,
    dimensions: {
      length: cv.variantLength,
      width: cv.variantWidth,
      height: cv.variantHeight,
    },
  }));

  // Price analysis
  const cjPrices = cjMapped.map((c) => c.variantSellPrice).filter(Boolean);
  const ourPrices = ourVariants.map((v) => v.priceUsd).filter((p) => p != null);

  const cjPriceRange = cjPrices.length
    ? { min: Math.min(...cjPrices), max: Math.max(...cjPrices), unique: [...new Set(cjPrices)].sort((a, b) => a - b) }
    : null;

  const ourPriceRange = ourPrices.length
    ? { min: Math.min(...ourPrices), max: Math.max(...ourPrices), unique: [...new Set(ourPrices)].sort((a, b) => a - b) }
    : null;

  // Extract unique option names from our variants
  const optionNames = new Set();
  for (const v of ourVariants) {
    for (const key of Object.keys(v.options)) {
      optionNames.add(key);
    }
  }

  return {
    medusaProductId: medusaProduct.id,
    title: medusaProduct.title,
    cjSku: meta.cjSku || medusaProduct.external_id,
    cjProductId: meta.cjProductId,
    storefrontVariantCount: ourVariants.length,
    cjVariantCount: cjMapped.length,
    storefrontOptionNames: [...optionNames],
    storefrontPriceRange: ourPriceRange,
    cjPriceRange,
    priceDiscrepancy: !!(cjPriceRange && cjPriceRange.unique.length > 1),
    allSameStorefrontPrice: ourPriceRange ? ourPriceRange.unique.length === 1 : true,
    storefrontVariants: ourVariants,
    cjVariants: cjMapped,
  };
}

// =============================================================================
// REPORT OUTPUT
// =============================================================================

function printProductReport(report) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${report.title}`);
  console.log(`${"═".repeat(70)}`);
  console.log(`  Medusa ID:           ${report.medusaProductId}`);
  console.log(`  CJ SKU:              ${report.cjSku}`);
  console.log(`  CJ Product ID:       ${report.cjProductId || "N/A"}`);
  console.log(`  Storefront variants: ${report.storefrontVariantCount}`);
  console.log(`  CJ variants:         ${report.cjVariantCount}`);
  console.log(`  Storefront options:  ${report.storefrontOptionNames.join(", ") || "None"}`);

  if (report.storefrontPriceRange) {
    const sp = report.storefrontPriceRange;
    console.log(`  Storefront prices:   $${sp.min} – $${sp.max} (${sp.unique.length} unique)`);
  }

  if (report.cjPriceRange) {
    const cp = report.cjPriceRange;
    console.log(`  CJ sell prices:      $${cp.min} – $${cp.max} (${cp.unique.length} unique)`);
  }

  if (report.priceDiscrepancy && report.allSameStorefrontPrice) {
    console.log(`\n  ⚠  CJ has ${report.cjPriceRange.unique.length} different prices but storefront has 1 flat price!`);
  }

  // CJ Variants detail
  console.log(`\n  ── CJ Variants ──`);
  console.log(`  ${"#".padEnd(3)} ${"Name".padEnd(40)} ${"SKU".padEnd(20)} ${"Cost ($)".padEnd(12)} Suggested ($)`);
  console.log(`  ${"─".repeat(95)}`);
  for (let i = 0; i < report.cjVariants.length; i++) {
    const cv = report.cjVariants[i];
    const name = (cv.variantNameEn || "").substring(0, 38);
    const sku = (cv.variantSku || "").substring(0, 18);
    const sell = cv.variantSellPrice != null ? `$${cv.variantSellPrice}` : "N/A";
    const sug = cv.variantSugSellPrice != null ? `$${cv.variantSugSellPrice}` : "N/A";
    console.log(`  ${String(i + 1).padEnd(3)} ${name.padEnd(40)} ${sku.padEnd(20)} ${sell.padEnd(12)} ${sug}`);
  }

  // Storefront Variants detail (show first 20)
  const showLimit = 20;
  console.log(`\n  ── Storefront Variants (showing ${Math.min(showLimit, report.storefrontVariants.length)}/${report.storefrontVariantCount}) ──`);
  console.log(`  ${"#".padEnd(3)} ${"Title".padEnd(45)} ${"SKU".padEnd(25)} Price ($)`);
  console.log(`  ${"─".repeat(85)}`);
  for (let i = 0; i < Math.min(showLimit, report.storefrontVariants.length); i++) {
    const sv = report.storefrontVariants[i];
    const title = (sv.title || "").substring(0, 43);
    const sku = (sv.sku || "").substring(0, 23);
    const price = sv.priceUsd != null ? `$${sv.priceUsd}` : "N/A";
    console.log(`  ${String(i + 1).padEnd(3)} ${title.padEnd(45)} ${sku.padEnd(25)} ${price}`);
  }
  if (report.storefrontVariantCount > showLimit) {
    console.log(`  ... and ${report.storefrontVariantCount - showLimit} more variants`);
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);

  const medusaUrl =
    args.medusaUrl ||
    process.env.MEDUSA_BACKEND_URL ||
    "https://medusa-backend-production-d681.up.railway.app";

  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD must be set (admin/.env)");
  }

  console.log("Authenticating with Medusa Admin...");
  const jwt = await getMedusaAdminJwt(medusaUrl, email, password);
  console.log("✓ Authenticated\n");

  console.log("Authenticating with CJ API...");
  await ensureCjToken();
  console.log("✓ CJ token acquired\n");

  // Determine which products to scan
  const productsToScan = [];

  if (args.sku) {
    console.log(`Looking up product by CJ SKU: ${args.sku}...`);
    const product = await findMedusaProductBySku(medusaUrl, jwt, args.sku);
    if (!product) {
      // Try to find by searching external_id pattern
      console.log("  Not found by metadata.cjSku — trying broader search...");
      // Fall through to fetch from CJ directly
      console.log("  Fetching CJ product detail for standalone analysis...");
      const { error, data: cjProduct } = await fetchCjProductDetail(args.sku);
      if (error) {
        console.error(`  ✗ CJ API error: ${error}`);
        process.exit(1);
      }

      console.log(`\n  CJ Product: ${cjProduct.productNameEn}`);
      console.log(`  CJ PID:     ${cjProduct.pid}`);
      console.log(`  CJ SKU:     ${cjProduct.productSku}`);
      console.log(`  CJ Price:   $${cjProduct.sellPrice}`);
      console.log(`  Variants:   ${(cjProduct.variants || []).length}`);

      const standaloneReport = {
        medusaProductId: null,
        title: cjProduct.productNameEn,
        cjSku: cjProduct.productSku,
        cjProductId: cjProduct.pid,
        storefrontVariantCount: 0,
        cjVariantCount: (cjProduct.variants || []).length,
        storefrontOptionNames: [],
        storefrontPriceRange: null,
        cjPriceRange: null,
        priceDiscrepancy: false,
        allSameStorefrontPrice: true,
        storefrontVariants: [],
        cjVariants: (cjProduct.variants || []).map((cv) => ({
          vid: cv.vid,
          variantNameEn: cv.variantNameEn || cv.variantName,
          variantSku: cv.variantSku,
          variantSellPrice: cv.variantSellPrice,
          variantSugSellPrice: cv.variantSugSellPrice,
          variantStandard: cv.variantStandard,
          variantProperty: cv.variantProperty,
          variantImage: cv.variantImage,
          variantWeight: cv.variantWeight,
          dimensions: {
            length: cv.variantLength,
            width: cv.variantWidth,
            height: cv.variantHeight,
          },
        })),
        note: "Product not found in Medusa — showing CJ data only",
      };

      const prices = standaloneReport.cjVariants.map((c) => c.variantSellPrice).filter(Boolean);
      if (prices.length) {
        standaloneReport.cjPriceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          unique: [...new Set(prices)].sort((a, b) => a - b),
        };
        standaloneReport.priceDiscrepancy = standaloneReport.cjPriceRange.unique.length > 1;
      }

      printProductReport(standaloneReport);

      if (args.out) {
        fs.mkdirSync(path.dirname(args.out), { recursive: true });
        fs.writeFileSync(args.out, JSON.stringify({ reports: [standaloneReport] }, null, 2));
        console.log(`\n✓ Report saved to ${args.out}`);
      }
      return;
    }

    productsToScan.push(product);
  } else if (args.productId) {
    console.log(`Fetching Medusa product ${args.productId}...`);
    const product = await fetchMedusaProduct(medusaUrl, jwt, args.productId);
    productsToScan.push(product);
  } else if (args.all) {
    console.log(`Fetching up to ${args.limit} products with CJ metadata from Medusa...`);
    const products = await fetchAllMedusaProductsWithCjMeta(medusaUrl, jwt, args.limit);
    productsToScan.push(...products);
    console.log(`Found ${products.length} products with CJ metadata\n`);
  }

  // Process each product
  const reports = [];
  let processed = 0;

  for (const product of productsToScan) {
    processed++;
    const meta = product.metadata || {};
    const cjSku = meta.cjSku || product.external_id;

    if (!cjSku) {
      console.log(`  Skipping ${product.title} — no CJ SKU in metadata`);
      continue;
    }

    process.stdout.write(`  [${processed}/${productsToScan.length}] ${product.title} (${cjSku})...\r`);

    // Fetch CJ variants
    const { error, variants: cjVariants } = await fetchCjVariants(cjSku);

    if (error) {
      console.log(`\n  ✗ CJ error for ${cjSku}: ${error}`);
      reports.push({
        medusaProductId: product.id,
        title: product.title,
        cjSku,
        error,
      });
      continue;
    }

    const report = analyzeProduct(product, cjVariants);
    reports.push(report);
    printProductReport(report);

    // Rate limit: CJ allows 1-6 req/sec depending on tier
    await sleep(500);
  }

  // Summary
  console.log(`\n\n${"═".repeat(70)}`);
  console.log("  SUMMARY");
  console.log(`${"═".repeat(70)}`);
  console.log(`  Products scanned:          ${reports.length}`);

  const withDiscrepancy = reports.filter((r) => r.priceDiscrepancy && r.allSameStorefrontPrice);
  console.log(`  With price discrepancy:    ${withDiscrepancy.length}`);
  console.log(`    (CJ has multiple prices but storefront has one flat price)`);

  const errors = reports.filter((r) => r.error);
  if (errors.length) {
    console.log(`  Errors:                    ${errors.length}`);
  }

  if (withDiscrepancy.length > 0) {
    console.log(`\n  Products needing per-variant pricing:`);
    for (const r of withDiscrepancy) {
      const cp = r.cjPriceRange;
      console.log(`    • ${r.title} (${r.cjSku}) — CJ: $${cp.min}–$${cp.max} (${cp.unique.length} tiers)`);
    }
  }

  // Save report
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify({ reports, summary: { total: reports.length, withDiscrepancy: withDiscrepancy.length, errors: errors.length } }, null, 2));
    console.log(`\n✓ Report saved to ${args.out}`);
  }
}

main().catch((err) => {
  console.error(`\n✗ Fatal: ${err.message}`);
  process.exit(1);
});
