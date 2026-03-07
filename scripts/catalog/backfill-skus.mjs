#!/usr/bin/env node

/**
 * Backfill Missing SKUs from Convex/CJ
 *
 * Scans ALL Medusa products for variants with null/empty SKU. For each:
 *
 *   1. Looks up the Convex medusaProducts record via metadata.external_id
 *   2. Reads variant SKU from Convex medusaProductVariants table
 *   3. If Convex has a SKU, uses it
 *   4. If not, falls back to CJ product SKU from cjMyProducts table
 *   5. If neither, generates a fallback: ELV-<first8 of externalId>
 *   6. Updates variant SKU in Medusa Admin API
 *
 * Usage:
 *   # Dry-run — shows what would change
 *   node scripts/catalog/backfill-skus.mjs --dry-run
 *
 *   # Live — apply updates
 *   node scripts/catalog/backfill-skus.mjs
 *
 *   # Limit scan to N products (for testing)
 *   node scripts/catalog/backfill-skus.mjs --limit 5 --dry-run
 *
 *   # Save report
 *   node scripts/catalog/backfill-skus.mjs --out reports/sku-backfill.json
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
};

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
    out: null,
    medusaUrl: null,
    convexUrl: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
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
// MAIN LOGIC
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL || DEFAULTS.MEDUSA_URL;
  const convexUrl = args.convexUrl || process.env.CONVEX_URL || DEFAULTS.CONVEX_URL;

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║            Backfill Missing SKUs from Convex/CJ            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Medusa:   ${medusaUrl}`);
  console.log(`  Convex:   ${convexUrl}`);
  console.log(`  Mode:     ${args.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Limit:    ${args.limit === Infinity ? "none" : args.limit}`);
  console.log();

  // --- 1. Auth ---
  console.log("🔐 Authenticating...");
  const jwt = await getMedusaAdminJwt(medusaUrl);
  console.log("   ✓ Medusa authenticated");

  const convex = new ConvexHttpClient(convexUrl);
  console.log("   ✓ Convex client ready\n");

  // --- 2. Scan Medusa for products with null SKU variants ---
  console.log("🔍 Scanning ALL Medusa products for variants missing SKU...");
  const missingSkuProducts = [];
  let offset = 0;
  let totalScanned = 0;
  let totalVariantsScanned = 0;
  let totalMissing = 0;
  const pageSize = 50;

  while (missingSkuProducts.length < args.limit) {
    const data = await adminFetch(medusaUrl, jwt,
      `/admin/products?limit=${pageSize}&offset=${offset}&fields=id,title,handle,metadata,*variants`
    );
    const products = data.products || [];
    if (products.length === 0) break;
    totalScanned += products.length;

    for (const product of products) {
      if (missingSkuProducts.length >= args.limit) break;

      const noSkuVariants = (product.variants || []).filter(
        (v) => !v.sku || v.sku.trim() === ""
      );
      totalVariantsScanned += (product.variants || []).length;

      if (noSkuVariants.length > 0) {
        totalMissing += noSkuVariants.length;
        missingSkuProducts.push({ ...product, _noSkuVariants: noSkuVariants });
      }
    }

    offset += pageSize;
    process.stdout.write(
      `   Scanned ${totalScanned} products (${totalMissing} variants missing SKU)...\r`
    );
    await sleep(200);
  }

  console.log(
    `\n   ✓ Scanned ${totalScanned} products / ${totalVariantsScanned} variants — ${missingSkuProducts.length} products with ${totalMissing} variants missing SKU\n`
  );

  if (missingSkuProducts.length === 0) {
    console.log("✅ All variants have SKUs. Nothing to do.");
    return;
  }

  // --- 3. For each product, look up SKU from Convex / CJ ---
  console.log("🏷️  Looking up SKUs from Convex & CJ...\n");

  let updated = 0;
  let convexResolved = 0;
  let cjResolved = 0;
  let fallbackGenerated = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < missingSkuProducts.length; i++) {
    const product = missingSkuProducts[i];
    const progress = `[${i + 1}/${missingSkuProducts.length}]`;
    const meta = product.metadata || {};
    const externalId = meta.external_id || meta.cjProductId;
    const title = product.title?.slice(0, 55) || product.id;

    // --- 3a. Try Convex staging data ---
    let convexSkuMap = null; // variantIndex → sku
    let cjSku = null;

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

          // Extract SKUs from Convex variants
          if (fullProduct?.variants?.length > 0) {
            convexSkuMap = new Map();
            for (let vi = 0; vi < fullProduct.variants.length; vi++) {
              const cv = fullProduct.variants[vi];
              if (cv.sku && cv.sku.trim() !== "") {
                convexSkuMap.set(vi, cv.sku);
              }
            }
            if (convexSkuMap.size === 0) convexSkuMap = null;
          }

          // Also grab metadata cjSku as potential CJ fallback
          if (fullProduct?.metadata?.cjSku) {
            cjSku = fullProduct.metadata.cjSku;
          }
        }
      } catch {
        // Convex lookup failed — will try other sources
      }
    }

    // --- 3b. Try CJ product SKU from cjMyProducts ---
    if (!convexSkuMap && !cjSku && externalId) {
      try {
        const cjProduct = await convex.query(
          api.cj.myProducts.getByCjProductId,
          { cjProductId: externalId }
        );
        if (cjProduct?.sku) {
          cjSku = cjProduct.sku;
        }
      } catch {
        // CJ lookup failed
      }
    }

    // Also check product metadata for cjSku
    if (!cjSku && meta.cjSku) {
      cjSku = meta.cjSku;
    }

    // --- 4. Apply SKU updates to all missing-SKU variants ---
    for (let vi = 0; vi < product._noSkuVariants.length; vi++) {
      const variant = product._noSkuVariants[vi];
      let newSku = null;
      let source = null;

      // Priority: Convex variant SKU → CJ product SKU → generated fallback
      if (convexSkuMap) {
        newSku = convexSkuMap.get(vi) || convexSkuMap.get(0);
        if (newSku) source = "convex";
      }

      if (!newSku && cjSku) {
        // For multi-variant: append variant index to CJ SKU
        newSku = product._noSkuVariants.length > 1
          ? `${cjSku}-V${vi + 1}`
          : cjSku;
        source = "cj";
      }

      if (!newSku && externalId) {
        // Generate fallback: ELV-<first8 of externalId>[-V<n>]
        const stub = externalId.slice(0, 8);
        newSku = product._noSkuVariants.length > 1
          ? `ELV-${stub}-V${vi + 1}`
          : `ELV-${stub}`;
        source = "generated";
      }

      if (!newSku) {
        // Last resort: use Medusa product ID
        newSku = `ELV-${product.id.replace("prod_", "").slice(0, 8)}`;
        source = "generated";
      }

      const varLabel =
        product._noSkuVariants.length > 1 ? ` [v${vi + 1}]` : "";

      if (args.dryRun) {
        console.log(
          `  ${progress} 🏷️  "${title}"${varLabel} — ${source}: ${newSku}`
        );
        updated++;
        if (source === "convex") convexResolved++;
        else if (source === "cj") cjResolved++;
        else fallbackGenerated++;
        results.push({
          id: product.id,
          title: product.title,
          externalId,
          variantId: variant.id,
          status: "would_update",
          source,
          newSku,
        });
        continue;
      }

      // LIVE: update variant SKU
      try {
        await adminFetch(
          medusaUrl,
          jwt,
          `/admin/products/${product.id}/variants/${variant.id}`,
          {
            method: "POST",
            body: JSON.stringify({ sku: newSku }),
          }
        );
        console.log(
          `  ${progress} ✅ "${title}"${varLabel} — ${source}: ${newSku}`
        );
        updated++;
        if (source === "convex") convexResolved++;
        else if (source === "cj") cjResolved++;
        else fallbackGenerated++;
        results.push({
          id: product.id,
          title: product.title,
          externalId,
          variantId: variant.id,
          status: "updated",
          source,
          newSku,
        });
      } catch (err) {
        console.log(
          `  ${progress} ❌ "${title}"${varLabel} — FAILED: ${err.message?.slice(0, 100)}`
        );
        failed++;
        results.push({
          id: product.id,
          title: product.title,
          externalId,
          variantId: variant.id,
          status: "failed",
          error: err.message,
        });
      }

      await sleep(300);
    }
  }

  // --- 5. Summary ---
  console.log("\n" + "═".repeat(62));
  console.log("  SUMMARY");
  console.log("═".repeat(62));
  console.log(`  Products scanned:    ${totalScanned}`);
  console.log(`  Variants scanned:    ${totalVariantsScanned}`);
  console.log(`  Variants missing SKU: ${totalMissing}`);
  console.log(`  Updated:             ${updated}`);
  console.log(`    from Convex:       ${convexResolved}`);
  console.log(`    from CJ:           ${cjResolved}`);
  console.log(`    generated:         ${fallbackGenerated}`);
  console.log(`  Failed:              ${failed}`);
  console.log("═".repeat(62));

  // --- 6. Save report ---
  if (args.out) {
    const reportDir = path.dirname(args.out);
    if (reportDir && !fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    const report = {
      timestamp: new Date().toISOString(),
      mode: args.dryRun ? "dry-run" : "live",
      summary: {
        productsScanned: totalScanned,
        variantsScanned: totalVariantsScanned,
        variantsMissingSku: totalMissing,
        updated,
        convexResolved,
        cjResolved,
        fallbackGenerated,
        failed,
      },
      results,
    };
    fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to ${args.out}`);
  }

  if (args.dryRun) {
    console.log("\n⚠️  DRY RUN — no changes were made. Re-run without --dry-run to apply.");
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
