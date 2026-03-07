#!/usr/bin/env node

/**
 * Assign Products to Categories Based on Product Type
 *
 * Every product in Medusa has a product_type correctly set (Chandeliers, Pendants,
 * Wall, Ceiling, Table & Floor, Outdoor, Accessories) but NO category assigned.
 * This script maps each product's type → the matching top-level category and
 * assigns it.
 *
 * Usage:
 *   node scripts/assign-product-categories.mjs --dry-run
 *   node scripts/assign-product-categories.mjs --dry-run --out reports/assign-cats-dry.json
 *   node scripts/assign-product-categories.mjs --out reports/assign-cats-live.json
 *
 * Env vars (auto-loaded from admin/.env, .env.local):
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// TYPE → CATEGORY MAPPING
// =============================================================================

// Product Type ID → Top-Level Category ID
const TYPE_TO_CATEGORY = {
  "ptyp_01KF7331ET11VZXEDJ16AP9S40": "pcat_01KF736S869NMN0XA35AA07XPM", // Chandeliers
  "ptyp_01KF7331F53JWM7232WC1GB87S": "pcat_01KF73711R8NF7FV7BKB96PWA6", // Pendants
  "ptyp_01KF7331FBRP67VBZN868BDSRJ": "pcat_01KF7375B8QDW6HP07AHYCKZQ8", // Wall
  "ptyp_01KF7331FGT6NGBQJ6YYJ3TN20": "pcat_01KF737B8B0SPRD4DV9W2RGTM8", // Ceiling
  "ptyp_01KF7331FNH30XX3P0WW8NAJSP": "pcat_01KF737DY59JFQDPA35FTCZ7HM", // Table & Floor
  "ptyp_01KF7331FT3ET088R4KFRASG9X": "pcat_01KF737MPK7JZFATG1DBV0RBC8", // Outdoor
  "ptyp_01KF7331FZJJ0ZM6WHWB6GD7T5": "pcat_01KF737PCZPCQ39EMRNTJHQT9B", // Accessories
};

// Human-readable names for logging
const TYPE_NAMES = {
  "ptyp_01KF7331ET11VZXEDJ16AP9S40": "Chandeliers",
  "ptyp_01KF7331F53JWM7232WC1GB87S": "Pendants",
  "ptyp_01KF7331FBRP67VBZN868BDSRJ": "Wall",
  "ptyp_01KF7331FGT6NGBQJ6YYJ3TN20": "Ceiling",
  "ptyp_01KF7331FNH30XX3P0WW8NAJSP": "Table & Floor",
  "ptyp_01KF7331FT3ET088R4KFRASG9X": "Outdoor",
  "ptyp_01KF7331FZJJ0ZM6WHWB6GD7T5": "Accessories",
};

const CATEGORY_NAMES = {
  "pcat_01KF736S869NMN0XA35AA07XPM": "Chandeliers",
  "pcat_01KF73711R8NF7FV7BKB96PWA6": "Pendants",
  "pcat_01KF7375B8QDW6HP07AHYCKZQ8": "Wall",
  "pcat_01KF737B8B0SPRD4DV9W2RGTM8": "Ceiling",
  "pcat_01KF737DY59JFQDPA35FTCZ7HM": "Table & Floor",
  "pcat_01KF737MPK7JZFATG1DBV0RBC8": "Outdoor",
  "pcat_01KF737PCZPCQ39EMRNTJHQT9B": "Accessories",
};

// mainType string → top-level category ID (for products without type_id)
const MAIN_TYPE_TO_CATEGORY = {
  "chandeliers": "pcat_01KF736S869NMN0XA35AA07XPM",
  "pendants": "pcat_01KF73711R8NF7FV7BKB96PWA6",
  "wall": "pcat_01KF7375B8QDW6HP07AHYCKZQ8",
  "ceiling": "pcat_01KF737B8B0SPRD4DV9W2RGTM8",
  "table & floor": "pcat_01KF737DY59JFQDPA35FTCZ7HM",
  "outdoor": "pcat_01KF737MPK7JZFATG1DBV0RBC8",
  "accessories": "pcat_01KF737PCZPCQ39EMRNTJHQT9B",
};

// =============================================================================
// API HELPERS
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getMedusaAdminJwt(medusaUrl, email, password) {
  const response = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Admin login failed (${response.status}): ${await response.text()}`);
  }
  const { token } = await response.json();
  return token;
}

async function adminFetch(medusaUrl, jwt, endpoint, options = {}, retries = 3) {
  const url = typeof endpoint === "string" && endpoint.startsWith("/")
    ? new URL(endpoint, medusaUrl)
    : endpoint;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let res;
    try {
      res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...options.headers,
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries) {
        const backoff = 3000 * attempt;
        console.log(`   ⟳ ${err.name === "AbortError" ? "timeout" : err.message} — retry ${attempt}/${retries} in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      throw new Error(`Fetch failed after ${retries} attempts: ${err.message}`);
    }
    clearTimeout(timeout);

    const body = await res.text();
    let json;
    try { json = JSON.parse(body); } catch { json = null; }

    if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
      const backoff = 3000 * attempt;
      console.log(`   ⟳ ${res.status} — retry ${attempt}/${retries} in ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    if (!res.ok) {
      const msg = json?.message || json?.error || body.slice(0, 300);
      throw new Error(`Medusa API ${res.status}: ${msg}`);
    }
    return json;
  }
}

async function paginateAllProducts(medusaUrl, jwt) {
  const all = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const url = new URL("/admin/products", medusaUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,title,handle,status,type_id,categories,metadata");

    const data = await adminFetch(medusaUrl, jwt, url.toString());
    const batch = data.products || [];
    all.push(...batch);
    if (all.length >= (data.count || batch.length) || batch.length === 0) break;
    offset += batch.length;
  }
  return all;
}

async function paginateAllCategories(medusaUrl, jwt) {
  const all = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const url = new URL("/admin/product-categories", medusaUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,name,handle,parent_category_id");

    const data = await adminFetch(medusaUrl, jwt, url.toString());
    const batch = data.product_categories || [];
    all.push(...batch);
    if (all.length >= (data.count || batch.length) || batch.length === 0) break;
    offset += batch.length;
  }
  return all;
}

/**
 * Resolve category IDs for a product based on type_id + metadata.classification.
 * Returns an array of category IDs: [topLevelCatId, ...subcategoryIds]
 */
function resolveCategories(product, subcatLookup) {
  const typeId = product.type_id;
  const classification = product.metadata?.classification;
  const mainType = classification?.mainType;

  // Determine top-level category
  let topLevelCatId = null;
  let typeName = null;

  if (typeId && TYPE_TO_CATEGORY[typeId]) {
    topLevelCatId = TYPE_TO_CATEGORY[typeId];
    typeName = TYPE_NAMES[typeId];
  } else if (mainType) {
    topLevelCatId = MAIN_TYPE_TO_CATEGORY[mainType.toLowerCase()];
    typeName = mainType;
  }

  if (!topLevelCatId) return null;

  const categoryIds = [topLevelCatId];
  const categoryNames = [CATEGORY_NAMES[topLevelCatId]];

  // Resolve subcategories from metadata.classification.subcategories
  const subcategories = classification?.subcategories || [];
  const parentHandle = CATEGORY_NAMES[topLevelCatId].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  for (const subName of subcategories) {
    const subHandle = parentHandle + "-" + subName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const subCat = subcatLookup.get(subHandle);
    if (subCat && subCat.parent_category_id === topLevelCatId) {
      categoryIds.push(subCat.id);
      categoryNames.push(subCat.name);
    }
  }

  return { categoryIds, categoryNames, typeName };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  loadEnv();
  const args = parseArgs(process.argv);

  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL || "https://medusa-backend-production-d681.up.railway.app";
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD env vars");
  }

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║      ASSIGN PRODUCTS TO CATEGORIES" + (args.dryRun ? " (DRY RUN)" : "") + "          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // 1. Auth
  console.log("1. Authenticating...");
  const jwt = await getMedusaAdminJwt(medusaUrl, email, password);
  console.log("   ✓ Authenticated\n");

  // 2. Fetch all products and categories
  console.log("2. Fetching all products and categories...");
  const [products, allCategories] = await Promise.all([
    paginateAllProducts(medusaUrl, jwt),
    paginateAllCategories(medusaUrl, jwt),
  ]);
  console.log(`   ✓ ${products.length} products, ${allCategories.length} categories fetched\n`);

  // Build subcategory lookup: handle → category
  const subcatLookup = new Map();
  for (const cat of allCategories) {
    subcatLookup.set(cat.handle, cat);
  }

  // 3. Analyze assignments needed
  const needsAssignment = [];
  const alreadyAssigned = [];
  const unresolvable = [];

  for (const p of products) {
    const hasCats = p.categories && p.categories.length > 0;

    if (hasCats) {
      alreadyAssigned.push(p);
      continue;
    }

    const resolved = resolveCategories(p, subcatLookup);
    if (!resolved) {
      unresolvable.push(p);
      continue;
    }

    needsAssignment.push({
      product: p,
      categoryIds: resolved.categoryIds,
      categoryNames: resolved.categoryNames,
      typeName: resolved.typeName,
    });
  }

  console.log("3. Analysis:");
  console.log(`   Products needing assignment:   ${needsAssignment.length}`);
  console.log(`   Already have categories:       ${alreadyAssigned.length}`);
  console.log(`   Unresolvable (no type/class):  ${unresolvable.length}`);
  console.log();

  // Breakdown by type
  const byType = {};
  let totalSubcats = 0;
  for (const item of needsAssignment) {
    byType[item.typeName] = (byType[item.typeName] || 0) + 1;
    totalSubcats += item.categoryIds.length - 1; // subtract top-level
  }
  console.log("   Breakdown by type:");
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${type.padEnd(15)} (${count} products)`);
  }
  console.log(`\n   Total subcategory assignments:  ${totalSubcats}`);
  console.log();

  if (needsAssignment.length === 0) {
    console.log("   Nothing to do.");
    return;
  }

  // 4. Execute assignments
  if (args.dryRun) {
    console.log("4. DRY RUN — no changes will be made.\n");
  } else {
    console.log("4. Assigning categories...\n");
  }

  const results = [];
  let success = 0;
  let errors = 0;

  for (let i = 0; i < needsAssignment.length; i++) {
    const { product, categoryIds, categoryNames, typeName } = needsAssignment[i];
    const label = `[${i + 1}/${needsAssignment.length}]`;
    const catSummary = categoryNames.join(" + ");

    try {
      if (!args.dryRun) {
        await adminFetch(medusaUrl, jwt, `/admin/products/${product.id}`, {
          method: "POST",
          body: JSON.stringify({
            categories: categoryIds.map((id) => ({ id })),
          }),
        });
        // Rate limit protection — 200ms between each request
        await sleep(200);
      }

      success++;
      results.push({
        productId: product.id,
        title: product.title,
        type: typeName,
        categoriesAssigned: categoryNames,
        categoryIds,
        status: args.dryRun ? "dry-run" : "assigned",
      });

      console.log(`   ${label} ${args.dryRun ? "would assign" : "✓"} ${product.title?.slice(0, 40)}  → ${catSummary}`);
    } catch (err) {
      errors++;
      results.push({
        productId: product.id,
        title: product.title,
        type: typeName,
        status: "error",
        error: err.message,
      });
      console.log(`   ${label} ✗ ${product.title?.slice(0, 45)}: ${err.message}`);
    }
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Products processed:     ${needsAssignment.length}`);
  console.log(`  Successfully assigned:  ${success}`);
  if (errors > 0) console.log(`  Errors:                 ${errors}`);
  if (unresolvable.length > 0) console.log(`  Skipped (unresolvable): ${unresolvable.length}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Write report
  if (args.out) {
    const report = {
      timestamp: new Date().toISOString(),
      mode: args.dryRun ? "dry-run" : "live",
      totalProducts: products.length,
      assigned: success,
      errors,
      skippedUnresolvable: unresolvable.length,
      alreadyAssigned: alreadyAssigned.length,
      totalSubcategoryAssignments: totalSubcats,
      byType,
      results,
    };
    const outPath = path.resolve(args.out);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`Report written to: ${outPath}\n`);
  }
}

// =============================================================================
// ARGS & ENV
// =============================================================================

function parseArgs(argv) {
  const args = { dryRun: false, out: null, medusaUrl: null };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--out") { args.out = argv[++i]; continue; }
    if (arg === "--medusa-url") { args.medusaUrl = argv[++i]; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
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
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
