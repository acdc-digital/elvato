#!/usr/bin/env node

/**
 * Category Deduplication Script
 *
 * Scans all Medusa subcategories, identifies semantic duplicates (e.g.
 * "brass" vs "brass-fixtures", "bohemian" vs "boho-style"), and merges
 * them by:
 *   1. Reassigning every product from the duplicate category → canonical category
 *   2. Deleting the now-empty duplicate category
 *
 * Usage:
 *   node scripts/dedup-categories.mjs --dry-run          # preview only
 *   node scripts/dedup-categories.mjs --dry-run --out report.json
 *   node scripts/dedup-categories.mjs                    # live merge
 *
 * Env vars (auto-loaded from admin/.env):
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 */

import fs from "node:fs";
import path from "node:path";

// =============================================================================
// MERGE RULES
// =============================================================================
// Each rule: { canonical: "suffix for canonical handle", dupes: ["suffixes to merge into it"] }
// These are applied per-parent. E.g. under "chandeliers", "chandeliers-brass"
// is canonical and "chandeliers-brass-fixtures" is a dupe.

const MERGE_RULES = [
  // --- Material / finish duplicates ---
  { canonical: "brass", dupes: ["brass-fixtures"] },
  { canonical: "copper", dupes: ["copper-fixtures", "copper-accents"] },
  { canonical: "acrylic", dupes: ["acrylic-fixtures"] },
  { canonical: "bamboo", dupes: ["bamboo-fixtures", "bamboo-accessories"] },
  { canonical: "crystal", dupes: ["crystal-fixtures"] },
  { canonical: "glass", dupes: ["glass-fixtures"] },
  { canonical: "wood", dupes: ["wooden", "wood-fixtures"] },
  { canonical: "metal", dupes: ["metal-fixtures"] },

  // --- Style duplicates ---
  { canonical: "bohemian", dupes: ["bohemian-style", "boho", "boho-style"] },
  { canonical: "vintage", dupes: ["vintage-retro", "vintage-style"] },
  { canonical: "retro", dupes: [] },  // keep retro separate from vintage — they overlap but aren't identical
  { canonical: "rustic", dupes: ["rustic-style", "rustic-modern"] },
  { canonical: "nordic", dupes: ["nordic-style"] },
  { canonical: "scandinavian", dupes: [] }, // keep separate from nordic — distinct design movement
  { canonical: "japanese", dupes: ["japanese-style"] },
  { canonical: "asian-inspired", dupes: ["asian-style"] },
  { canonical: "industrial", dupes: ["industrial-style"] },
  { canonical: "modern", dupes: ["modern-chandeliers", "modern-fixtures", "modern-sconces"] },
  { canonical: "contemporary", dupes: ["contemporary-sconces"] },
  { canonical: "classic", dupes: ["classical"] },
  { canonical: "european-style", dupes: [] },
  { canonical: "colonial-style", dupes: [] },

  // --- Size duplicates ---
  { canonical: "small", dupes: ["small-compact", "small-chandeliers", "smallmini"] },
  { canonical: "mini", dupes: ["mini-chandeliers", "mini-fixtures"] },

  // --- Statement duplicates ---
  { canonical: "statement", dupes: ["statement-chandeliers", "statement-fixtures", "statement-pieces"] },

  // --- LED duplicates ---
  { canonical: "led", dupes: ["led-fixtures", "led-lamps", "led-lights"] },

  // --- Linear duplicates ---
  { canonical: "linear", dupes: ["linear-chandeliers", "linear-lights"] },

  // --- Island duplicates ---
  { canonical: "island-lights", dupes: ["island-pendants"] },

  // --- Solar duplicates ---
  { canonical: "solar", dupes: ["solar-lights", "solar-powered", "solar-led"] },

  // --- Smart duplicates ---
  { canonical: "smart", dupes: ["smart-lighting", "smart-lamps", "smart-lights"] },

  // --- Bedside duplicates ---
  { canonical: "bedside", dupes: ["bedside-lamps", "bedside-lights", "bedside-lighting", "bedside-pendants"] },

  // --- Reading duplicates ---
  { canonical: "reading-lamps", dupes: ["reading-lights"] },

  // --- Decorative duplicates ---
  { canonical: "decorative", dupes: ["decorative-lamps"] },

  // --- Accent duplicates ---
  { canonical: "accent", dupes: ["accent-lamps", "accent-lighting", "accent-lights"] },

  // --- Natural duplicates ---
  { canonical: "natural-materials", dupes: ["natural", "natural-design", "natural-wood"] },

  // --- Corridor / Hallway duplicates ---
  { canonical: "corridor", dupes: ["corridor-lights"] },
  { canonical: "hallway", dupes: ["hallway-lights"] },

  // --- Vanity duplicates ---
  { canonical: "vanity", dupes: ["vanity-lights"] },

  // --- LED strips duplicates ---
  { canonical: "led-strips", dupes: ["led-strip-lights"] },

  // --- Touch duplicates ---
  { canonical: "touch-control", dupes: ["touch-lamps"] },

  // --- Minimalist duplicates ---
  { canonical: "minimalist", dupes: ["minimalist-fixtures", "minimalist-lighting"] },

  // --- Indoor/Interior duplicates ---
  { canonical: "indoor", dupes: ["interior", "indoor-wall-lights"] },

  // --- Exterior/Outdoor under Wall ---
  { canonical: "outdoor", dupes: ["exterior", "outdoor-accents", "outdoor-led"] },

  // --- Path duplicates ---
  { canonical: "pathway-lights", dupes: ["path-lights"] },

  // --- Motion/Sensor duplicates ---
  { canonical: "motion-sensor", dupes: ["motion-lights", "sensor-lights"] },

  // --- Lamps duplicates ---
  { canonical: "table-lamps", dupes: ["lamps"] },

  // --- Ceiling self-refs ---
  { canonical: "ceiling-fixtures", dupes: ["ceiling-mount", "ceiling-mounted"] },

  // --- Wall self-refs ---
  { canonical: "sconces", dupes: ["wall-sconces"] },
  { canonical: "wall-mounted", dupes: ["wall-mount"] },
  { canonical: "wall-lights", dupes: ["wall-fixtures", "wall-accents"] },

  // --- Pendant self-refs (under Pendants parent) ---
  { canonical: "pendant-lights", dupes: ["pendant", "pendant-fixtures", "pendants"] },

  // --- Self-referencing categories (same name as parent) ---
  // These get handled by the SELF_REF_HANDLES list below

  // --- Copper+Brass combo ---
  { canonical: "copper", dupes: ["copperbrass"] },
];

// Handles that are just the parent name repeated — always delete
const SELF_REF_SUFFIXES = [
  "chandeliers",  // chandeliers-chandeliers
  "ceiling",      // ceiling-ceiling
  "outdoor",      // outdoor-outdoor (as a child, not the top-level)
];

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

async function adminFetch(medusaUrl, jwt, endpoint, options = {}) {
  const url = new URL(endpoint, medusaUrl);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  });
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  if (!res.ok) {
    const msg = json?.message || json?.error || body.slice(0, 300);
    throw new Error(`Medusa API ${res.status} ${endpoint}: ${msg}`);
  }
  return json;
}

async function paginateAll(medusaUrl, jwt, endpoint, key, fields, pageSize = 200) {
  const all = [];
  let offset = 0;
  while (true) {
    const url = new URL(endpoint, medusaUrl);
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));
    if (fields) url.searchParams.set("fields", fields);

    const data = await adminFetch(medusaUrl, jwt, url.pathname + url.search);
    const items = data[key] ?? [];
    all.push(...items);
    if (all.length >= (data.count ?? items.length) || items.length === 0) break;
    offset += items.length;
  }
  return all;
}

// =============================================================================
// CATEGORY OPERATIONS
// =============================================================================

/**
 * Fetch all products that belong to a specific category.
 */
async function getProductsInCategory(medusaUrl, jwt, categoryId) {
  const products = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = new URL("/admin/products", medusaUrl);
    url.searchParams.set("category_id[]", categoryId);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,title,categories");

    const data = await adminFetch(medusaUrl, jwt, url.pathname + url.search);
    const batch = data.products ?? [];
    products.push(...batch);
    if (products.length >= (data.count ?? batch.length) || batch.length === 0) break;
    offset += batch.length;
  }
  return products;
}

/**
 * Reassign a product: remove dupeCategory, add canonicalCategory.
 * Uses the Medusa Admin API to update the product's category_ids.
 */
async function reassignProduct(medusaUrl, jwt, productId, currentCategories, dupeCatId, canonicalCatId) {
  // Build new category ID list: remove dupe, add canonical (if not already present)
  const newCategoryIds = currentCategories
    .map((c) => c.id)
    .filter((id) => id !== dupeCatId);

  if (!newCategoryIds.includes(canonicalCatId)) {
    newCategoryIds.push(canonicalCatId);
  }

  await adminFetch(medusaUrl, jwt, `/admin/products/${productId}`, {
    method: "POST",
    body: JSON.stringify({
      categories: newCategoryIds.map((id) => ({ id })),
    }),
  });
}

/**
 * Delete a category by ID.
 */
async function deleteCategory(medusaUrl, jwt, categoryId) {
  await adminFetch(medusaUrl, jwt, `/admin/product-categories/${categoryId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

function buildMergeMap(categories) {
  // Group categories by parent
  const byParent = new Map();
  const topLevelIds = new Set();

  for (const cat of categories) {
    if (!cat.parent_category_id) {
      topLevelIds.add(cat.id);
      continue;
    }
    const pid = cat.parent_category_id;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(cat);
  }

  // For each parent group, apply merge rules
  const mergeActions = []; // { canonical: Category, dupe: Category, rule: string }

  for (const [parentId, children] of byParent) {
    // Build suffix → category map for this parent
    // Suffix = handle minus the parent prefix (e.g. "chandeliers-brass" → "brass")
    const parentCat = categories.find((c) => c.id === parentId);
    const prefix = parentCat ? parentCat.handle + "-" : "";

    const bySuffix = new Map();
    for (const child of children) {
      const suffix = child.handle.startsWith(prefix)
        ? child.handle.slice(prefix.length)
        : child.handle;
      bySuffix.set(suffix, child);
    }

    // Check self-referencing (e.g. chandeliers-chandeliers)
    for (const selfSuffix of SELF_REF_SUFFIXES) {
      if (parentCat && parentCat.handle === selfSuffix && bySuffix.has(selfSuffix)) {
        // This is a self-referencing category — we can't "merge" it into itself though.
        // We'll just mark it for deletion. Products stay on the parent.
        mergeActions.push({
          canonical: parentCat,
          dupe: bySuffix.get(selfSuffix),
          rule: `self-ref: ${selfSuffix} under ${parentCat.handle}`,
        });
      }
    }

    // Apply merge rules
    for (const rule of MERGE_RULES) {
      const canonicalCat = bySuffix.get(rule.canonical);
      if (!canonicalCat) continue; // canonical doesn't exist under this parent

      for (const dupeSuffix of rule.dupes) {
        const dupeCat = bySuffix.get(dupeSuffix);
        if (!dupeCat) continue; // this dupe doesn't exist under this parent
        if (dupeCat.id === canonicalCat.id) continue; // same category

        mergeActions.push({
          canonical: canonicalCat,
          dupe: dupeCat,
          rule: `${rule.canonical} ← ${dupeSuffix}`,
        });
      }
    }
  }

  return mergeActions;
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
  console.log("║         CATEGORY DEDUPLICATION" + (args.dryRun ? " (DRY RUN)" : "") + "                ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // 1. Authenticate
  console.log("1. Authenticating with Medusa admin...");
  const jwt = await getMedusaAdminJwt(medusaUrl, email, password);
  console.log("   ✓ Authenticated\n");

  // 2. Fetch all categories
  console.log("2. Fetching all categories...");
  const allCategories = await paginateAll(
    medusaUrl, jwt,
    "/admin/product-categories", "product_categories",
    "id,name,handle,parent_category_id",
    200,
  );
  const topLevel = allCategories.filter((c) => !c.parent_category_id);
  const subcategories = allCategories.filter((c) => c.parent_category_id);
  console.log(`   ✓ ${allCategories.length} total categories (${topLevel.length} top-level, ${subcategories.length} subcategories)\n`);

  // 3. Identify duplicates
  console.log("3. Identifying duplicate categories...");
  const mergeActions = buildMergeMap(allCategories);
  console.log(`   ✓ Found ${mergeActions.length} duplicate categories to merge\n`);

  if (mergeActions.length === 0) {
    console.log("   No duplicates found. Nothing to do.");
    return;
  }

  // Print merge plan
  console.log("   ┌─────────────────────────────────────────────────────────────────");
  console.log("   │ MERGE PLAN");
  console.log("   ├─────────────────────────────────────────────────────────────────");

  // Group by parent for readability
  const byParent = new Map();
  for (const action of mergeActions) {
    const parentId = action.dupe.parent_category_id;
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(action);
  }

  for (const [parentId, actions] of byParent) {
    const parentCat = allCategories.find((c) => c.id === parentId);
    const parentName = parentCat ? parentCat.name : parentId;
    console.log(`   │`);
    console.log(`   │ 📁 ${parentName} (${actions.length} merges)`);
    for (const action of actions) {
      console.log(`   │   🔀 ${action.dupe.handle} → ${action.canonical.handle}  [${action.rule}]`);
    }
  }
  console.log("   └─────────────────────────────────────────────────────────────────\n");

  // 4. Execute merges
  if (args.dryRun) {
    console.log("4. DRY RUN — no changes will be made.\n");
    console.log("   Checking product counts for each duplicate...\n");
  } else {
    console.log("4. Executing merges...\n");
  }

  const results = [];
  let totalProductsMoved = 0;
  let totalCategoriesDeleted = 0;
  let errors = [];

  for (let i = 0; i < mergeActions.length; i++) {
    const action = mergeActions[i];
    const label = `[${i + 1}/${mergeActions.length}]`;

    try {
      // Find products in the dupe category
      const products = await getProductsInCategory(medusaUrl, jwt, action.dupe.id);

      const result = {
        dupeHandle: action.dupe.handle,
        dupeName: action.dupe.name,
        dupeId: action.dupe.id,
        canonicalHandle: action.canonical.handle,
        canonicalName: action.canonical.name,
        canonicalId: action.canonical.id,
        productsAffected: products.length,
        rule: action.rule,
        status: "pending",
      };

      if (args.dryRun) {
        console.log(`   ${label} ${action.dupe.handle} → ${action.canonical.handle} (${products.length} products)`);
        result.status = "dry-run";
      } else {
        // Reassign products
        for (const product of products) {
          const categories = product.categories || [];
          await reassignProduct(
            medusaUrl, jwt,
            product.id, categories,
            action.dupe.id, action.canonical.id,
          );
          // Small delay to avoid rate limits
          await sleep(100);
        }

        // Delete the dupe category
        await deleteCategory(medusaUrl, jwt, action.dupe.id);

        totalProductsMoved += products.length;
        totalCategoriesDeleted++;
        result.status = "merged";

        console.log(`   ${label} ✓ ${action.dupe.handle} → ${action.canonical.handle} (${products.length} products moved, category deleted)`);
      }

      results.push(result);
    } catch (err) {
      const errorResult = {
        dupeHandle: action.dupe.handle,
        canonicalHandle: action.canonical.handle,
        rule: action.rule,
        status: "error",
        error: err.message,
      };
      results.push(errorResult);
      errors.push(errorResult);
      console.log(`   ${label} ✗ ${action.dupe.handle}: ${err.message}`);
    }
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Duplicate categories found:    ${mergeActions.length}`);
  if (!args.dryRun) {
    console.log(`  Categories deleted:            ${totalCategoriesDeleted}`);
    console.log(`  Products reassigned:           ${totalProductsMoved}`);
  } else {
    const totalProducts = results.reduce((sum, r) => sum + (r.productsAffected || 0), 0);
    console.log(`  Total products to reassign:    ${totalProducts}`);
  }
  if (errors.length > 0) {
    console.log(`  Errors:                        ${errors.length}`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  // Write report
  if (args.out) {
    const report = {
      timestamp: new Date().toISOString(),
      mode: args.dryRun ? "dry-run" : "live",
      totalDuplicates: mergeActions.length,
      totalCategoriesDeleted: args.dryRun ? 0 : totalCategoriesDeleted,
      totalProductsMoved: args.dryRun ? 0 : totalProductsMoved,
      errors: errors.length,
      results,
    };
    const outPath = path.resolve(args.out);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`Report written to: ${outPath}\n`);
  }
}

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs(argv) {
  const args = { dryRun: false, out: null, medusaUrl: null };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--out") {
      args.out = argv[++i];
      if (!args.out) throw new Error("--out requires a file path");
      continue;
    }
    if (arg === "--medusa-url") {
      args.medusaUrl = argv[++i];
      if (!args.medusaUrl) throw new Error("--medusa-url requires a URL");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

// =============================================================================
// ENV LOADER
// =============================================================================

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), ".env.local"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
