#!/usr/bin/env node

/**
 * Apply CJ Shipping Costs to Variant Prices
 *
 * Reads the freight report (from fetch-cj-freight.mjs) and for each variant:
 *   1. Finds CJPacket Ordinary shipping price for CA and US
 *      (falls back to cheapest standard method excl. sea freight if unavailable)
 *   2. Computes: shippingCost = max(CA, US) × buffer (default 1.15)
 *   3. Stores shipping data in variant metadata (Neon DB)
 *   4. Adds shipping cost to variant's USD price
 *
 * Usage:
 *   # Dry-run (show what would change, no updates)
 *   node scripts/pricing/apply-shipping-to-prices.mjs --dry-run
 *
 *   # Dry-run limited to N products
 *   node scripts/pricing/apply-shipping-to-prices.mjs --dry-run --limit 5
 *
 *   # Live run
 *   node scripts/pricing/apply-shipping-to-prices.mjs
 *
 *   # Custom buffer (default 15%)
 *   node scripts/pricing/apply-shipping-to-prices.mjs --buffer 20 --dry-run
 *
 *   # Custom freight report path
 *   node scripts/pricing/apply-shipping-to-prices.mjs --freight-report reports/pricing/freight-all.json
 *
 *   # Save report
 *   node scripts/pricing/apply-shipping-to-prices.mjs --dry-run --out reports/pricing/shipping-bake-dry.json
 *
 * Env vars (auto-loaded from admin/.env, .agents/product-listing-analyst/.env):
 *   MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
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

const PREFERRED_METHOD = "CJPacket Ordinary";
const SEA_FREIGHT_MAX_DAYS = 20; // exclude methods slower than this

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: Infinity,
    buffer: 15,          // % buffer on shipping cost
    freightReport: path.join(process.cwd(), "reports", "pricing", "freight-all.json"),
    out: null,
    medusaUrl: null,
    skipProducts: new Set(), // product IDs to skip
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--limit") { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--buffer") { args.buffer = parseFloat(argv[++i]); continue; }
    if (arg === "--freight-report") { args.freightReport = argv[++i]; continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--medusa-url") { args.medusaUrl = argv[++i]; continue; }
    if (arg === "--skip-products") { argv[++i].split(",").forEach((id) => args.skipProducts.add(id.trim())); continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

// =============================================================================
// HELPERS
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
        throw new Error(`${res.status}: ${body.substring(0, 300)}`);
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

// =============================================================================
// FREIGHT DATA -> SHIPPING COST EXTRACTION
// =============================================================================

/**
 * Pick the shipping cost for a variant from the freight data.
 *
 * Priority:
 *   1. CJPacket Ordinary (preferred method)
 *   2. Cheapest standard method (excl. sea freight >20 days)
 *   3. Absolute cheapest if no standard methods
 *
 * Returns: { price, method, days } or null
 */
function pickShippingMethod(freightForDest) {
  if (!freightForDest?.allMethods?.length) return null;

  const methods = freightForDest.allMethods;

  // 1. Preferred: CJPacket Ordinary
  const preferred = methods.find((m) => m.method === PREFERRED_METHOD);
  if (preferred) return preferred;

  // 2. Cheapest standard (excl. slow sea freight)
  const standard = methods
    .filter((m) => {
      const minDays = parseInt(m.days) || 0;
      return minDays <= SEA_FREIGHT_MAX_DAYS;
    })
    .sort((a, b) => a.price - b.price);
  if (standard.length > 0) return standard[0];

  // 3. Absolute cheapest
  const sorted = [...methods].sort((a, b) => a.price - b.price);
  return sorted[0] || null;
}

/**
 * Compute the buffered shipping cost for a variant.
 * Uses max(CA, US) × (1 + buffer%).
 *
 * Returns: {
 *   shippingCostUsd: number (dollars, rounded to cents),
 *   shippingCostCA: number,
 *   shippingCostUS: number,
 *   shippingMethodCA: string,
 *   shippingMethodUS: string,
 *   shippingCostCents: number (ready to add to price),
 * }
 */
function computeShippingCost(variantFreight, bufferPercent) {
  const caMethod = pickShippingMethod(variantFreight.CA);
  const usMethod = pickShippingMethod(variantFreight.US);

  if (!caMethod && !usMethod) return null;

  const caPrice = caMethod?.price || 0;
  const usPrice = usMethod?.price || 0;
  const rawCost = Math.max(caPrice, usPrice);
  const bufferedCost = rawCost * (1 + bufferPercent / 100);
  // Round to nearest cent
  const costCents = Math.round(bufferedCost * 100);

  return {
    shippingCostUsd: costCents / 100,
    shippingCostCents: costCents,
    shippingCostCA: caPrice,
    shippingCostUS: usPrice,
    shippingMethodCA: caMethod?.method || null,
    shippingMethodUS: usMethod?.method || null,
    shippingDaysCA: caMethod?.days || null,
    shippingDaysUS: usMethod?.days || null,
    usedPreferredMethod: (caMethod?.method === PREFERRED_METHOD) || (usMethod?.method === PREFERRED_METHOD),
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL
    || "https://medusa-backend-production-d681.up.railway.app";
  const mode = args.dryRun ? "DRY-RUN" : "LIVE";

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       Apply CJ Shipping Costs to Variant Prices            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Mode:           ${mode}`);
  console.log(`  Buffer:         ${args.buffer}%`);
  console.log(`  Preferred:      ${PREFERRED_METHOD}`);
  console.log(`  Freight report: ${args.freightReport}`);
  console.log(`  Medusa:         ${medusaUrl}`);
  console.log(`  Limit:          ${args.limit === Infinity ? "ALL" : args.limit}`);
  console.log();

  // 1. Load freight report
  if (!fs.existsSync(args.freightReport)) {
    throw new Error(`Freight report not found: ${args.freightReport}\nRun: node scripts/pricing/fetch-cj-freight.mjs --all --out ${args.freightReport}`);
  }
  const freightData = JSON.parse(fs.readFileSync(args.freightReport, "utf-8"));
  const freightResults = freightData.results || [];
  console.log(`📦 Loaded freight data for ${freightResults.length} products\n`);

  // 2. Auth with Medusa
  console.log("🔐 Authenticating with Medusa Admin...");
  const jwt = await getMedusaAdminJwt(medusaUrl);
  console.log("   ✓ Authenticated\n");

  // 3. Fetch current prices from Medusa (we need these to compute new price)
  console.log("💰 Fetching current variant prices from Medusa...");
  const priceMap = new Map(); // variantId → { usdAmountCents, priceId, ... }
  const productMetaMap = new Map(); // productId → metadata
  let offset = 0;
  const pageSize = 100;
  let totalFetched = 0;

  while (true) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${pageSize}&offset=${offset}&fields=id,metadata,*variants,*variants.prices`
    );
    const products = data.products || [];
    if (products.length === 0) break;

    for (const p of products) {
      productMetaMap.set(p.id, p.metadata || {});
      for (const v of p.variants || []) {
        const usdPrice = (v.prices || []).find((pr) => pr.currency_code === "usd");
        priceMap.set(v.id, {
          productId: p.id,
          productTitle: p.title,
          usdAmountCents: usdPrice?.amount ?? null,
          priceId: usdPrice?.id ?? null,
          existingMeta: p.metadata || {},
        });
      }
    }

    totalFetched += products.length;
    offset += pageSize;
    process.stdout.write(`   Fetched ${totalFetched} products...\r`);
    await sleep(150);
  }
  console.log(`\n   ✓ Loaded prices for ${priceMap.size} variants across ${totalFetched} products\n`);

  // 3b. For all products, fetch variant metadata to detect already-baked variants
  console.log("🔍 Checking variant metadata for baked variants...");
  const variantMetaMap = new Map(); // variantId → metadata
  let metaCheckCount = 0;
  const productIds = [...new Set([...priceMap.values()].map((v) => v.productId))];

  for (const productId of productIds) {
    metaCheckCount++;
    try {
      const data = await adminFetch(medusaUrl, jwt,
        `/admin/products/${productId}?fields=id,*variants.id,*variants.metadata`
      );
      const p = data.product;
      for (const v of p?.variants || []) {
        if (v.metadata) variantMetaMap.set(v.id, v.metadata);
      }
    } catch {
      // If fetch fails, we'll just re-process these variants
    }
    if (metaCheckCount % 50 === 0) {
      process.stdout.write(`   Checked ${metaCheckCount}/${productIds.length} products...\r`);
      await sleep(100);
    }
  }
  console.log(`   ✓ Checked ${metaCheckCount} products for variant metadata\n`);

  // 4. Process each product from freight report
  console.log("🚚 Computing shipping cost adjustments...\n");

  const results = [];
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let preferredMethodCount = 0;
  let fallbackMethodCount = 0;
  let alreadyBakedCount = 0;
  let noFreightCount = 0;
  let noPriceCount = 0;
  const productsToProcess = args.limit === Infinity
    ? freightResults
    : freightResults.slice(0, args.limit);

  for (let pi = 0; pi < productsToProcess.length; pi++) {
    const product = productsToProcess[pi];
    const progress = `[${pi + 1}/${productsToProcess.length}]`;

    if (product.status !== "ok" || !product.variants?.length) {
      skippedCount++;
      results.push({
        medusaProductId: product.medusaProductId,
        title: product.title,
        status: "skipped",
        reason: product.status,
      });
      continue;
    }

    // Skip explicitly excluded products
    if (args.skipProducts.has(product.medusaProductId)) {
      console.log(`  ${progress} ⏭  ${product.title?.slice(0, 50)} — explicitly skipped`);
      results.push({
        medusaProductId: product.medusaProductId,
        title: product.title,
        status: "skipped_explicit",
      });
      continue;
    }

    // Get product-level info for metadata merging
    const sampleVariantInfo = priceMap.get(product.variants[0]?.medusaVariantId);

    const variantChanges = [];
    let productHasUpdates = false;

    for (const v of product.variants) {
      const priceInfo = priceMap.get(v.medusaVariantId);
      if (!priceInfo || priceInfo.usdAmountCents == null) {
        noPriceCount++;
        variantChanges.push({
          variantId: v.medusaVariantId,
          sku: v.sku,
          status: "no_price",
        });
        continue;
      }

      // Skip variants that already have shipping baked in (prevents double-bake)
      const vMeta = variantMetaMap.get(v.medusaVariantId);
      if (vMeta?.priceBeforeShipping != null) {
        alreadyBakedCount++;
        variantChanges.push({
          variantId: v.medusaVariantId,
          sku: v.sku,
          status: "already_baked_variant",
        });
        continue;
      }

      // Also skip if variant has shippingCostUsd metadata (another bake marker)
      if (vMeta?.shippingCostUsd != null) {
        alreadyBakedCount++;
        variantChanges.push({
          variantId: v.medusaVariantId,
          sku: v.sku,
          status: "already_baked_variant",
        });
        continue;
      }

      const shipping = computeShippingCost(v.freight, args.buffer);
      if (!shipping) {
        noFreightCount++;
        variantChanges.push({
          variantId: v.medusaVariantId,
          sku: v.sku,
          status: "no_freight",
        });
        continue;
      }

      if (shipping.usedPreferredMethod) preferredMethodCount++;
      else fallbackMethodCount++;

      const currentPriceCents = priceInfo.usdAmountCents;
      const newPriceCents = currentPriceCents + shipping.shippingCostCents;

      variantChanges.push({
        variantId: v.medusaVariantId,
        sku: v.sku,
        variantTitle: v.variantTitle,
        weightGrams: v.weightGrams,
        currentPriceCents,
        shippingCostCents: shipping.shippingCostCents,
        newPriceCents,
        shippingCostUsd: shipping.shippingCostUsd,
        shippingCostCA: shipping.shippingCostCA,
        shippingCostUS: shipping.shippingCostUS,
        shippingMethodCA: shipping.shippingMethodCA,
        shippingMethodUS: shipping.shippingMethodUS,
        shippingDaysCA: shipping.shippingDaysCA,
        shippingDaysUS: shipping.shippingDaysUS,
        status: "update",
      });
      productHasUpdates = true;
    }

    if (!productHasUpdates) {
      skippedCount++;
      results.push({
        medusaProductId: product.medusaProductId,
        title: product.title,
        status: "no_updates",
        variants: variantChanges,
      });
      continue;
    }

    const updates = variantChanges.filter((vc) => vc.status === "update");

    // Print summary for this product
    const avgShip = (updates.reduce((s, u) => s + u.shippingCostUsd, 0) / updates.length).toFixed(2);
    const firstU = updates[0];
    console.log(
      `  ${progress} ${args.dryRun ? "📋" : "✅"} ${product.title?.slice(0, 42).padEnd(42)} ` +
      `+$${avgShip} avg ship | $${(firstU.currentPriceCents / 100).toFixed(2)} → $${(firstU.newPriceCents / 100).toFixed(2)}`
    );

    if (!args.dryRun) {
      // LIVE — batch all variants in a single POST (chunked for large products)
      const CHUNK_SIZE = 40;
      let productFailed = 0;
      let productUpdated = 0;

      const chunks = [];
      for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        chunks.push(updates.slice(i, i + CHUNK_SIZE));
      }

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const variantPayload = chunk.map((u) => ({
          id: u.variantId,
          prices: [{ amount: u.newPriceCents, currency_code: "usd" }],
          metadata: {
            shippingCostUsd: u.shippingCostUsd,
            shippingCostCA: u.shippingCostCA,
            shippingCostUS: u.shippingCostUS,
            shippingMethodCA: u.shippingMethodCA,
            shippingMethodUS: u.shippingMethodUS,
            shippingDaysCA: u.shippingDaysCA,
            shippingDaysUS: u.shippingDaysUS,
            priceBeforeShipping: u.currentPriceCents,
            shippingUpdatedAt: new Date().toISOString(),
          },
        }));

        try {
          await adminFetch(medusaUrl, jwt,
            `/admin/products/${product.medusaProductId}`,
            {
              method: "POST",
              body: JSON.stringify({ variants: variantPayload }),
            },
            3 // retries
          );
          productUpdated += chunk.length;
          updatedCount += chunk.length;
          if (chunks.length > 1) {
            process.stdout.write(`    chunk ${ci + 1}/${chunks.length} ✓ (${chunk.length} variants)\n`);
          }
        } catch (batchErr) {
          console.log(`    ❌ chunk ${ci + 1}/${chunks.length} failed (${chunk.length} variants): ${batchErr.message?.slice(0, 100)}`);
          // Fallback: try smaller sub-chunks of 10
          const SUB_CHUNK = 10;
          for (let si = 0; si < chunk.length; si += SUB_CHUNK) {
            const sub = chunk.slice(si, si + SUB_CHUNK);
            const subPayload = sub.map((u) => ({
              id: u.variantId,
              prices: [{ amount: u.newPriceCents, currency_code: "usd" }],
              metadata: {
                shippingCostUsd: u.shippingCostUsd,
                shippingCostCA: u.shippingCostCA,
                shippingCostUS: u.shippingCostUS,
                shippingMethodCA: u.shippingMethodCA,
                shippingMethodUS: u.shippingMethodUS,
                shippingDaysCA: u.shippingDaysCA,
                shippingDaysUS: u.shippingDaysUS,
                priceBeforeShipping: u.currentPriceCents,
                shippingUpdatedAt: new Date().toISOString(),
              },
            }));
            try {
              await adminFetch(medusaUrl, jwt,
                `/admin/products/${product.medusaProductId}`,
                {
                  method: "POST",
                  body: JSON.stringify({ variants: subPayload }),
                },
                3
              );
              productUpdated += sub.length;
              updatedCount += sub.length;
            } catch (subErr) {
              productFailed += sub.length;
              failedCount += sub.length;
              sub.forEach((u) => { u.status = "failed"; u.error = subErr.message?.slice(0, 200); });
              console.log(`    ❌ sub-chunk failed (${sub.length} variants): ${subErr.message?.slice(0, 80)}`);
            }
            await sleep(3000); // longer delay between sub-chunks
          }
        }
        // Delay between chunks (5s for multi-chunk products)
        if (ci < chunks.length - 1) {
          await sleep(5000);
        }
      }

      if (chunks.length > 1) {
        console.log(`    ✓ ${productUpdated}/${updates.length} variants updated${productFailed ? `, ${productFailed} failed` : ""}`);
      }

      // Only set shippingBakedIn if ALL variants succeeded
      if (productFailed === 0) {
        try {
          await adminFetch(medusaUrl, jwt,
            `/admin/products/${product.medusaProductId}`,
            {
              method: "POST",
              body: JSON.stringify({
                metadata: {
                  ...(sampleVariantInfo?.existingMeta || {}),
                  shippingBakedIn: true,
                  shippingBuffer: args.buffer,
                  shippingUpdatedAt: new Date().toISOString(),
                },
              }),
            }
          );
        } catch { /* product metadata update not critical */ }
      }

      // Throttle between products
      await sleep(500);

    } else {
      updatedCount += updates.length;
    }

    results.push({
      medusaProductId: product.medusaProductId,
      title: product.title,
      cjSku: product.cjSku,
      status: "updated",
      variantCount: updates.length,
      variants: variantChanges,
    });
  }

  // Summary
  console.log("\n" + "═".repeat(62));
  console.log(`  SUMMARY (${mode})`);
  console.log("═".repeat(62));
  console.log(`  Products processed:     ${productsToProcess.length}`);
  console.log(`  Variants updated:       ${updatedCount}`);
  console.log(`  Variants skipped:       ${skippedCount}`);
  console.log(`  Variants failed:        ${failedCount}`);
  console.log(`  Already baked in:       ${alreadyBakedCount}`);
  console.log(`  No freight data:        ${noFreightCount}`);
  console.log(`  No USD price:           ${noPriceCount}`);
  console.log(`  Used CJPacket Ordinary: ${preferredMethodCount}`);
  console.log(`  Used fallback method:   ${fallbackMethodCount}`);
  console.log(`  Buffer:                 ${args.buffer}%`);

  // Price impact stats
  const allUpdates = results
    .flatMap((r) => r.variants || [])
    .filter((v) => v.status === "update");

  if (allUpdates.length > 0) {
    const shippingAmounts = allUpdates.map((u) => u.shippingCostUsd).sort((a, b) => a - b);
    const priceBefore = allUpdates.map((u) => u.currentPriceCents / 100).sort((a, b) => a - b);
    const priceAfter = allUpdates.map((u) => u.newPriceCents / 100).sort((a, b) => a - b);

    const pct = (arr, p) => arr[Math.floor(arr.length * p / 100)];

    console.log(`\n  ── Shipping Cost Added (buffered ${args.buffer}%) ──`);
    console.log(`    Min:    $${shippingAmounts[0].toFixed(2)}`);
    console.log(`    Median: $${pct(shippingAmounts, 50).toFixed(2)}`);
    console.log(`    Avg:    $${(shippingAmounts.reduce((s, v) => s + v, 0) / shippingAmounts.length).toFixed(2)}`);
    console.log(`    Max:    $${shippingAmounts[shippingAmounts.length - 1].toFixed(2)}`);

    console.log(`\n  ── Price Impact ──`);
    console.log(`    Before: $${pct(priceBefore, 25).toFixed(2)} – $${pct(priceBefore, 50).toFixed(2)} – $${pct(priceBefore, 75).toFixed(2)} (25th/med/75th)`);
    console.log(`    After:  $${pct(priceAfter, 25).toFixed(2)} – $${pct(priceAfter, 50).toFixed(2)} – $${pct(priceAfter, 75).toFixed(2)} (25th/med/75th)`);
  }

  // Save report
  if (args.out) {
    const report = {
      timestamp: new Date().toISOString(),
      mode,
      buffer: args.buffer,
      preferredMethod: PREFERRED_METHOD,
      freightReport: args.freightReport,
      summary: {
        productsProcessed: productsToProcess.length,
        variantsUpdated: updatedCount,
        variantsSkipped: skippedCount,
        variantsFailed: failedCount,
        alreadyBaked: alreadyBakedCount,
        noFreight: noFreightCount,
        noPrice: noPriceCount,
        usedPreferred: preferredMethodCount,
        usedFallback: fallbackMethodCount,
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
