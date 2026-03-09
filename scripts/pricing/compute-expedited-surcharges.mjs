#!/usr/bin/env node

/**
 * Compute Expedited Shipping Surcharges from CJ Freight Data
 *
 * Reads the freight report (from fetch-cj-freight.mjs) and for each variant:
 *   1. Finds the base shipping method cost (CJPacket Ordinary — already baked into price)
 *   2. Finds Tier 1 expedited cost (USPS Remote → fallbacks)
 *   3. Finds Tier 2 express cost (DHL Official → fallbacks)
 *   4. Computes surcharge = expedited_buffered - base_buffered
 *   5. Stores surcharge data in Medusa variant metadata
 *
 * Usage:
 *   # Dry-run (show what would change, no updates)
 *   node scripts/pricing/compute-expedited-surcharges.mjs --dry-run
 *
 *   # Dry-run limited to N products
 *   node scripts/pricing/compute-expedited-surcharges.mjs --dry-run --limit 10
 *
 *   # Live run
 *   node scripts/pricing/compute-expedited-surcharges.mjs
 *
 *   # Custom buffer (default 15%)
 *   node scripts/pricing/compute-expedited-surcharges.mjs --buffer 15
 *
 *   # Save report
 *   node scripts/pricing/compute-expedited-surcharges.mjs --dry-run --out reports/pricing/expedited-surcharges-dry.json
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

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: Infinity,
    buffer: 15,
    freightReport: path.join(process.cwd(), "reports", "pricing", "freight-all.json"),
    out: null,
    medusaUrl: null,
    resume: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--limit") { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--buffer") { args.buffer = parseFloat(argv[++i]); continue; }
    if (arg === "--freight-report") { args.freightReport = argv[++i]; continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--medusa-url") { args.medusaUrl = argv[++i]; continue; }
    if (arg === "--resume") { args.resume = true; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

// =============================================================================
// CONSTANTS — Method Fallback Chains
// =============================================================================

const BASE_METHOD = "CJPacket Ordinary";
const SEA_FREIGHT_MAX_DAYS = 20;

// Tier 1: "USPS Priority" — 7-14 business days
const TIER1_FALLBACK_CHAIN = [
  "CJPacket USPS Remote",
  "USPS",
  "USPS Ordinary",
  "CJPacket Fast Ordinary",
  "CJPacket Sensitive Pro+",
];
const TIER1_DISPLAY_NAME = "USPS Priority";
const TIER1_DISPLAY_DAYS = "7-14 business days";

// Tier 2: "DHL Express" — 3-7 business days
const TIER2_FALLBACK_CHAIN = [
  "DHL Official",
  "DHL Express",
  "CJPacket Fast Line",
];
const TIER2_DISPLAY_NAME = "DHL Express";
const TIER2_DISPLAY_DAYS = "3-7 business days";

// =============================================================================
// HELPERS
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

let _currentJwt = null;
let _medusaUrl = null;

async function refreshJwt() {
  console.log("  🔑 Refreshing admin JWT...");
  _currentJwt = await getMedusaAdminJwt(_medusaUrl);
  return _currentJwt;
}

async function adminFetch(medusaUrl, jwt, endpoint, options = {}, retries = 3) {
  let currentJwt = jwt;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(new URL(endpoint, medusaUrl), {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentJwt}`,
          ...options.headers,
        },
      });
      clearTimeout(timeout);
      if (res.status === 401) {
        // JWT expired — refresh and retry
        currentJwt = await refreshJwt();
        continue;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body.substring(0, 300)}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries) {
        const backoff = 2000 * attempt;
        console.log(`  ⏳ Retry ${attempt}/${retries} in ${backoff/1000}s — ${err.message}`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
}

// =============================================================================
// METHOD SELECTION
// =============================================================================

/**
 * Pick the base shipping method from freight data (same logic as apply-shipping-to-prices).
 */
function pickBaseMethod(freightForDest) {
  if (!freightForDest?.allMethods?.length) return null;
  const methods = freightForDest.allMethods;

  // 1. Preferred: CJPacket Ordinary
  const preferred = methods.find((m) => m.method === BASE_METHOD);
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
 * Pick an expedited method from a fallback chain.
 * Returns the first match found in the methods list, then
 * falls back to the next-fastest method that's faster than the base.
 */
function pickExpeditedMethod(freightForDest, fallbackChain, baseMethod) {
  if (!freightForDest?.allMethods?.length) return null;
  const methods = freightForDest.allMethods;

  // 1. Try each method in the fallback chain
  for (const methodName of fallbackChain) {
    const found = methods.find((m) => m.method === methodName);
    if (found) return found;
  }

  // 2. Fallback: find the fastest method that's faster than base but not sea freight
  if (!baseMethod) return null;
  const baseMaxDays = parseInt(baseMethod.days?.split("-")[1]) || 999;
  const faster = methods
    .filter((m) => {
      const maxDays = parseInt(m.days?.split("-")[1]) || 999;
      return maxDays < baseMaxDays && m.method !== baseMethod.method;
    })
    .sort((a, b) => {
      // Sort by max days ascending (fastest first)
      const aDays = parseInt(a.days?.split("-")[1]) || 999;
      const bDays = parseInt(b.days?.split("-")[1]) || 999;
      return aDays - bDays;
    });

  return faster[0] || null;
}

/**
 * Compute the buffered cost for a method across both destinations.
 * Returns max(CA, US) × (1 + buffer%) in dollars.
 */
function bufferedCost(caMethod, usMethod, bufferPercent) {
  const caPrice = caMethod?.price || 0;
  const usPrice = usMethod?.price || 0;
  const rawCost = Math.max(caPrice, usPrice);
  return rawCost * (1 + bufferPercent / 100);
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
  console.log("║     Compute Expedited Shipping Surcharges                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Mode:           ${mode}`);
  console.log(`  Buffer:         ${args.buffer}%`);
  console.log(`  Resume:         ${args.resume ? 'YES — skipping already-done variants' : 'no'}`);
  console.log(`  Freight report: ${args.freightReport}`);
  console.log(`  Medusa:         ${medusaUrl}`);
  console.log(`  Limit:          ${args.limit === Infinity ? "ALL" : args.limit}`);
  console.log();

  // 1. Load freight report
  if (!fs.existsSync(args.freightReport)) {
    throw new Error(
      `Freight report not found: ${args.freightReport}\n` +
      `Run: node scripts/pricing/fetch-cj-freight.mjs --all --out ${args.freightReport}`
    );
  }
  const freightData = JSON.parse(fs.readFileSync(args.freightReport, "utf-8"));
  const freightResults = freightData.results || [];
  console.log(`📦 Loaded freight data for ${freightResults.length} products\n`);

  // 2. Auth with Medusa
  console.log("🔐 Authenticating with Medusa Admin...");
  _medusaUrl = medusaUrl;
  let jwt = await getMedusaAdminJwt(medusaUrl);
  _currentJwt = jwt;
  console.log("   ✓ Authenticated\n");

  // 3. Process each product's variants
  const results = [];
  let productsProcessed = 0;
  let variantsUpdated = 0;
  let variantsSkipped = 0;
  let tier1Available = 0;
  let tier2Available = 0;

  const productsToProcess = freightResults.slice(0, args.limit);
  const totalProducts = productsToProcess.length;
  const totalVariants = productsToProcess.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
  console.log(`🚀 Processing ${totalProducts} products (${totalVariants} variants)...\n`);
  const startTime = Date.now();
  let apiCalls = 0;
  let errors = 0;
  let resumeSkipped = 0;

  for (const productEntry of productsToProcess) {
    const { medusaProductId, cjSku, variants: freightVariants } = productEntry;
    if (!medusaProductId || !freightVariants?.length) {
      variantsSkipped += freightVariants?.length || 0;
      productsProcessed++;
      continue;
    }

    // --resume: check if first variant already has metadata, skip entire product
    if (args.resume && !args.dryRun) {
      try {
        jwt = _currentJwt; // use latest JWT in case it was refreshed
        const checkRes = await adminFetch(medusaUrl, jwt,
          `/admin/products/${medusaProductId}?fields=variants.metadata`,
          { method: "GET" }
        );
        const existingVariants = checkRes?.product?.variants || [];
        const alreadyDone = existingVariants.some(
          (v) => v.metadata?.expeditedSurchargesUpdatedAt
        );
        if (alreadyDone) {
          resumeSkipped++;
          productsProcessed++;
          // Count tiers from existing metadata for accurate totals
          for (const v of existingVariants) {
            if (v.metadata?.expeditedTier1Surcharge != null) tier1Available++;
            if (v.metadata?.expeditedTier2Surcharge != null) tier2Available++;
            variantsUpdated++;
          }
          if (resumeSkipped % 50 === 0 || resumeSkipped <= 5) {
            const pct = ((productsProcessed / totalProducts) * 100).toFixed(1);
            console.log(`  ⏭ [${productsProcessed}/${totalProducts}] ${pct}% | ${cjSku} — skipped (already done) | ${resumeSkipped} skipped so far`);
          }
          continue;
        }
        apiCalls++;
      } catch (err) {
        // If check fails, just process it normally
        console.log(`  ⚠ Resume check failed for ${cjSku}, processing anyway: ${err.message}`);
      }
    }

    const productResult = {
      medusaProductId,
      cjSku,
      variants: [],
    };

    for (const fv of freightVariants) {
      const { medusaVariantId, sku, variantTitle, freight } = fv;
      if (!medusaVariantId || !freight) {
        variantsSkipped++;
        continue;
      }

      // Find base method for each destination
      const caBase = pickBaseMethod(freight.CA);
      const usBase = pickBaseMethod(freight.US);
      const baseCost = bufferedCost(caBase, usBase, args.buffer);

      // Find Tier 1 (USPS Priority)
      const caTier1 = pickExpeditedMethod(freight.CA, TIER1_FALLBACK_CHAIN, caBase);
      const usTier1 = pickExpeditedMethod(freight.US, TIER1_FALLBACK_CHAIN, usBase);
      const tier1Cost = bufferedCost(caTier1, usTier1, args.buffer);

      // Find Tier 2 (DHL Express)
      const caTier2 = pickExpeditedMethod(freight.CA, TIER2_FALLBACK_CHAIN, caBase);
      const usTier2 = pickExpeditedMethod(freight.US, TIER2_FALLBACK_CHAIN, usBase);
      const tier2Cost = bufferedCost(caTier2, usTier2, args.buffer);

      // Compute surcharges (rounded to nearest dollar for clean display)
      const tier1Surcharge = (caTier1 || usTier1)
        ? Math.max(0, Math.round(tier1Cost - baseCost))
        : null;
      const tier2Surcharge = (caTier2 || usTier2)
        ? Math.max(0, Math.round(tier2Cost - baseCost))
        : null;

      // Ensure tier2 > tier1 (skip tier2 if not meaningfully faster/more expensive)
      const finalTier2Surcharge =
        tier2Surcharge !== null && tier1Surcharge !== null && tier2Surcharge <= tier1Surcharge
          ? null
          : tier2Surcharge;

      const variantResult = {
        medusaVariantId,
        sku,
        variantTitle,
        baseCost: Math.round(baseCost * 100) / 100,
        baseMethodCA: caBase?.method || null,
        baseMethodUS: usBase?.method || null,
        baseDaysCA: caBase?.days || null,
        baseDaysUS: usBase?.days || null,
        tier1: tier1Surcharge !== null ? {
          surcharge: tier1Surcharge,
          displayName: TIER1_DISPLAY_NAME,
          displayDays: TIER1_DISPLAY_DAYS,
          methodCA: caTier1?.method || null,
          methodUS: usTier1?.method || null,
          rawCostCA: caTier1?.price || null,
          rawCostUS: usTier1?.price || null,
        } : null,
        tier2: finalTier2Surcharge !== null ? {
          surcharge: finalTier2Surcharge,
          displayName: TIER2_DISPLAY_NAME,
          displayDays: TIER2_DISPLAY_DAYS,
          methodCA: caTier2?.method || null,
          methodUS: usTier2?.method || null,
          rawCostCA: caTier2?.price || null,
          rawCostUS: usTier2?.price || null,
        } : null,
      };

      if (tier1Surcharge !== null) tier1Available++;
      if (finalTier2Surcharge !== null) tier2Available++;

      // Write to Medusa variant metadata
      const metadataUpdate = {
        expeditedTier1Method: variantResult.tier1?.methodCA || variantResult.tier1?.methodUS || null,
        expeditedTier1Surcharge: variantResult.tier1?.surcharge ?? null,
        expeditedTier1Days: variantResult.tier1?.displayDays || null,
        expeditedTier1DisplayName: variantResult.tier1?.displayName || null,
        expeditedTier2Method: variantResult.tier2?.methodCA || variantResult.tier2?.methodUS || null,
        expeditedTier2Surcharge: variantResult.tier2?.surcharge ?? null,
        expeditedTier2Days: variantResult.tier2?.displayDays || null,
        expeditedTier2DisplayName: variantResult.tier2?.displayName || null,
        expeditedSurchargesUpdatedAt: new Date().toISOString(),
      };

      if (!args.dryRun) {
        try {
          jwt = _currentJwt; // use latest JWT in case it was refreshed
          await adminFetch(medusaUrl, jwt,
            `/admin/products/${medusaProductId}/variants/${medusaVariantId}`,
            {
              method: "POST",
              body: JSON.stringify({ metadata: metadataUpdate }),
            }
          );
          variantsUpdated++;
          apiCalls++;
        } catch (err) {
          errors++;
          console.error(`  ❌ Failed to update ${sku} (${medusaVariantId}): ${err.message}`);
          variantsSkipped++;
          continue;
        }
      } else {
        variantsUpdated++;
      }

      productResult.variants.push(variantResult);
    }

    results.push(productResult);
    productsProcessed++;

    // Per-product progress line
    const pct = ((productsProcessed / totalProducts) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = productsProcessed / ((Date.now() - startTime) / 1000) || 0;
    const remaining = rate > 0 ? Math.round((totalProducts - productsProcessed) / rate) : "?";
    const t1Count = productResult.variants.filter(v => v.tier1).length;
    const t2Count = productResult.variants.filter(v => v.tier2).length;
    const tierInfo = `T1=${t1Count} T2=${t2Count}`;

    console.log(
      `  [${productsProcessed}/${totalProducts}] ${pct}% | ` +
      `${cjSku} — ${productResult.variants.length} variants (${tierInfo}) | ` +
      `${elapsed}s elapsed, ~${remaining}s left | ` +
      `API: ${apiCalls} calls, ${errors} errors`
    );

    // Milestone summaries every 100 products
    if (productsProcessed % 100 === 0) {
      console.log(`\n  ── Milestone: ${productsProcessed}/${totalProducts} ──`);
      console.log(`     Variants updated: ${variantsUpdated} | Skipped: ${variantsSkipped}`);
      console.log(`     Tier 1: ${tier1Available} | Tier 2: ${tier2Available}`);
      console.log(`     Rate: ${rate.toFixed(1)} products/s | ETA: ~${remaining}s\n`);
    }

    // Rate-limit API calls
    if (!args.dryRun && productResult.variants.length > 0) {
      await sleep(100);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                      Final Results                         ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`   Products processed: ${productsProcessed}/${totalProducts}`);
  console.log(`   Variants updated:   ${variantsUpdated}`);
  console.log(`   Variants skipped:   ${variantsSkipped}`);
  console.log(`   Tier 1 available:   ${tier1Available} variants (${TIER1_DISPLAY_NAME})`);
  console.log(`   Tier 2 available:   ${tier2Available} variants (${TIER2_DISPLAY_NAME})`);
  console.log(`   API calls:          ${apiCalls}`);
  console.log(`   Errors:             ${errors}`);
  console.log(`   Resume-skipped:     ${resumeSkipped}`);
  console.log(`   Total time:         ${totalElapsed}s`);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    mode,
    buffer: args.buffer,
    summary: {
      productsProcessed,
      variantsUpdated,
      variantsSkipped,
      tier1Available,
      tier2Available,
    },
    results,
  };

  if (args.out) {
    const outDir = path.dirname(args.out);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to ${args.out}`);
  }

  console.log(`\n✅ Done!`);
}

main().catch((err) => {
  console.error("\n❌ Failed:", err.message);
  process.exit(1);
});
