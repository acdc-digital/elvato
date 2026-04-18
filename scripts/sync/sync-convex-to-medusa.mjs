#!/usr/bin/env node

/**
 * Convex → Medusa Product Sync Pipeline
 * 
 * Pulls products from Convex staging tables, transforms them into Medusa Admin API
 * payloads, and creates/updates them in Medusa. Updates sync status back in Convex.
 * 
 * Usage:
 *   node scripts/sync-convex-to-medusa.mjs [options]
 * 
 * Options:
 *   --batch-size N       Products per batch (default: 10)
 *   --dry-run            Validate transforms without pushing to Medusa
 *   --offset N           Skip first N ready products (default: 0)
 *   --external-id ID     Sync only the product with this externalId (skips bulkMarkReadyToSync)
 *   --out FILE           Write results to JSON file
 *   --convex-url URL     Override CONVEX_URL env var
 *   --medusa-url URL     Override MEDUSA_BACKEND_URL env var
 */

import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// =============================================================================
// CONFIG & CONSTANTS
// =============================================================================

const DEFAULTS = {
  CONVEX_URL: "https://superb-dotterel-37.convex.cloud",
  MEDUSA_URL: "https://medusa-backend-production-d681.up.railway.app",
  SALES_CHANNEL_ID: "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z",
  SHIPPING_PROFILE_ID: "sp_01KDPCN9M6FWK309G054X4RKQ6",
  BATCH_SIZE: 10,
};

// Inventory defaults — every synced variant must have an inventory_level linked
// to this location, otherwise Medusa treats it as "out of stock".
const STOCK_LOCATION_ID = "sloc_01KDPCX8QBWT3SV1STQYB0PNKB"; // European Warehouse
const DEFAULT_STOCK_QUANTITY = 1_000_000; // dropshipping: effectively unlimited

// Category handle → Medusa category ID mapping (top-level)
const TOP_LEVEL_CATEGORIES = {
  chandeliers: "pcat_01KF736S869NMN0XA35AA07XPM",
  pendants: "pcat_01KF73711R8NF7FV7BKB96PWA6",
  wall: "pcat_01KF7375B8QDW6HP07AHYCKZQ8",
  ceiling: "pcat_01KF737B8B0SPRD4DV9W2RGTM8",
  "table-floor": "pcat_01KF737DY59JFQDPA35FTCZ7HM",
  outdoor: "pcat_01KF737MPK7JZFATG1DBV0RBC8",
  accessories: "pcat_01KF737PCZPCQ39EMRNTJHQT9B",
};

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULTS.BATCH_SIZE,
    dryRun: false,
    offset: 0,
    out: null,
    convexUrl: null,
    medusaUrl: null,
    externalId: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--dry-run") { args.dryRun = true; continue; }

    if (arg === "--batch-size") {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v <= 0) throw new Error("--batch-size requires a positive number");
      args.batchSize = Math.floor(v);
      continue;
    }

    if (arg === "--offset") {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 0) throw new Error("--offset requires a non-negative number");
      args.offset = Math.floor(v);
      continue;
    }

    if (arg === "--out") {
      args.out = argv[++i];
      if (!args.out) throw new Error("--out requires a file path");
      continue;
    }

    if (arg === "--convex-url") {
      args.convexUrl = argv[++i];
      if (!args.convexUrl) throw new Error("--convex-url requires a URL");
      continue;
    }

    if (arg === "--medusa-url") {
      args.medusaUrl = argv[++i];
      if (!args.medusaUrl) throw new Error("--medusa-url requires a URL");
      continue;
    }

    if (arg === "--external-id") {
      args.externalId = argv[++i];
      if (!args.externalId) throw new Error("--external-id requires a value");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

// =============================================================================
// MEDUSA AUTH
// =============================================================================

async function getMedusaAdminJwt(medusaUrl, email, password) {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      const { token } = await response.json();
      return token;
    }
    const body = await response.text();
    if (body.includes("pool") && attempt < maxRetries) {
      const wait = attempt * 15000;
      console.log(`   ⏳ DB pool busy, retrying in ${wait / 1000}s (attempt ${attempt}/${maxRetries})...`);
      await sleep(wait);
      continue;
    }
    throw new Error(`Admin login failed (${response.status}): ${body}`);
  }
}

// =============================================================================
// MEDUSA ADMIN API HELPERS
// =============================================================================

async function medusaAdminFetch(medusaUrl, jwtToken, endpoint, options = {}) {
  const url = new URL(endpoint, medusaUrl);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
      ...options.headers,
    },
  });
  
  const body = await response.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }
  
  if (!response.ok) {
    const msg = json?.message || json?.error || body.slice(0, 300);
    throw new Error(`Medusa API ${response.status}: ${msg}`);
  }
  
  return json;
}

/** Find existing Medusa product by external_id metadata */
async function findMedusaProductByExternalId(medusaUrl, jwtToken, externalId) {
  const url = new URL("/admin/products", medusaUrl);
  url.searchParams.set("q", externalId);
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "id,handle,title,metadata,status");
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  
  // Match by external_id in metadata
  return (data.products || []).find(
    (p) => p.metadata?.external_id === externalId
  ) || null;
}

/** Create product in Medusa via Admin API */
async function createMedusaProduct(medusaUrl, jwtToken, payload) {
  return await medusaAdminFetch(medusaUrl, jwtToken, "/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Update product in Medusa via Admin API */
async function updateMedusaProduct(medusaUrl, jwtToken, productId, payload) {
  return await medusaAdminFetch(medusaUrl, jwtToken, `/admin/products/${productId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * After creating a product, create inventory_level records for all variants
 * so they are immediately purchasable instead of showing "out of stock".
 *
 * Medusa auto-creates inventory_items for variants with manage_inventory:true
 * but does NOT create the inventory_levels that link items to stock locations.
 */
async function ensureInventoryLevels(medusaUrl, jwtToken, productId) {
  const product = await medusaAdminFetch(
    medusaUrl, jwtToken,
    `/admin/products/${productId}?fields=*variants,*variants.inventory_items,+variants.inventory_items.inventory.*`
  );

  const variants = product.product?.variants || [];
  let levelsCreated = 0;

  for (const variant of variants) {
    const invItems = variant.inventory_items || [];
    for (const link of invItems) {
      const itemId = link.inventory_item_id || link.inventory?.id;
      if (!itemId) continue;

      // Skip if a level already exists for our stock location
      const levels = link.inventory?.location_levels || [];
      if (levels.some((l) => l.location_id === STOCK_LOCATION_ID)) continue;

      try {
        await medusaAdminFetch(medusaUrl, jwtToken, `/admin/inventory-items/${itemId}/location-levels`, {
          method: "POST",
          body: JSON.stringify({
            location_id: STOCK_LOCATION_ID,
            stocked_quantity: DEFAULT_STOCK_QUANTITY,
          }),
        });
        levelsCreated++;
      } catch (err) {
        console.warn(`   ⚠ Inventory level failed for ${itemId}: ${err.message?.slice(0, 100)}`);
      }
    }
  }

  return levelsCreated;
}

// =============================================================================
// CATEGORY RESOLUTION
// =============================================================================

/**
 * Fetch all categories from Medusa Admin API and build lookup maps.
 */
async function fetchMedusaCategories(medusaUrl, jwtToken) {
  const categories = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const url = new URL("/admin/product-categories", medusaUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,name,handle,parent_category_id,metadata");
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    
    if (!response.ok) {
      console.warn(`   ⚠ Failed to fetch categories (${response.status})`);
      break;
    }
    
    const data = await response.json();
    const batch = data.product_categories || [];
    categories.push(...batch);
    
    if (batch.length < limit) break;
    offset += limit;
  }
  
  return categories;
}

/**
 * Build category lookup maps from Medusa categories.
 * Maps: handle → id, name (lowercase) → id
 */
function buildCategoryMapsFromMedusa(medusaCategories) {
  const byHandle = new Map();
  const byName = new Map();
  const byId = new Map();
  
  for (const cat of medusaCategories) {
    byHandle.set(cat.handle, cat.id);
    byName.set(cat.name.toLowerCase(), cat.id);
    byId.set(cat.id, cat);
  }
  
  return { byHandle, byName, byId };
}

/**
 * Resolve the Medusa category ID for a product.
 * Uses CJ category name/ID from metadata to find matching Medusa category.
 */
function resolveCategory(product, categoryMaps) {
  // 1. Try CJ category name → Medusa category by name match
  const cjCatName = product.metadata?.cjCategoryName;
  if (cjCatName) {
    const medusaId = categoryMaps.byName.get(cjCatName.toLowerCase());
    if (medusaId) return medusaId;
  }
  
  // 2. Try handle-based fallback from metadata classification
  const mainType = product.metadata?.classification?.mainType;
  if (mainType) {
    const handle = mainType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const medusaId = categoryMaps.byHandle.get(handle);
    if (medusaId) return medusaId;
  }
  
  // 3. Hardcoded top-level category fallback
  if (cjCatName) {
    const normalized = cjCatName.toLowerCase();
    for (const [key, id] of Object.entries(TOP_LEVEL_CATEGORIES)) {
      if (normalized.includes(key.replace("-", " ")) || normalized.includes(key)) {
        return id;
      }
    }
  }
  
  return null;
}

// =============================================================================
// PAYLOAD TRANSFORMER: Convex → Medusa Admin API format
// =============================================================================

/**
 * Derive product-level options from variant options data.
 * Scans all variants' options objects to build {title, values[]} array.
 * Falls back to "Default" option if no variant options exist.
 */
function deriveProductOptions(variants, existingOptions) {
  // If product has explicit options defined, use those titles
  const optionTitles = (existingOptions || []).map((o) => o.title);
  
  // Collect all option keys and values from variants
  const optionMap = new Map(); // title → Set of values
  
  for (const variant of variants) {
    if (variant.options && typeof variant.options === "object") {
      for (const [key, value] of Object.entries(variant.options)) {
        if (!optionMap.has(key)) optionMap.set(key, new Set());
        if (value != null && String(value).trim()) {
          optionMap.get(key).add(String(value));
        }
      }
    }
  }
  
  // If variant options found, merge with explicit option titles
  if (optionMap.size > 0) {
    // Add any explicit option titles that weren't in variant data
    for (const title of optionTitles) {
      if (!optionMap.has(title)) optionMap.set(title, new Set());
    }
    
    return Array.from(optionMap.entries()).map(([title, valuesSet]) => ({
      title,
      values: Array.from(valuesSet).sort(),
    }));
  }
  
  // Fallback: single "Default" option for products with no variant options
  return [{ title: "Default", values: ["Default"] }];
}

/**
 * Transform a single Convex product (with children) into a Medusa Admin API payload.
 */
function transformProduct(product, categoryMaps) {
  const categoryId = resolveCategory(product, categoryMaps);
  const options = deriveProductOptions(product.variants, product.options);
  
  // Build variant payloads
  const variants = product.variants.map((variant, idx) => {
    // Build variant options - match keys to product options
    let variantOptions = {};
    if (variant.options && typeof variant.options === "object" && Object.keys(variant.options).length > 0) {
      variantOptions = {};
      for (const opt of options) {
        const value = variant.options[opt.title];
        variantOptions[opt.title] = value ? String(value) : opt.values[0] || "Default";
      }
    } else {
      // Default option for variants without options
      variantOptions = { Default: "Default" };
    }
    
    // Build prices array
    const prices = variant.prices.map((price) => ({
      amount: price.amount,
      currency_code: price.currencyCode.toLowerCase(),
    }));
    
    // Ensure at least one price exists
    if (prices.length === 0) {
      prices.push({ amount: 0, currency_code: "usd" });
    }
    
    return {
      title: variant.title || `Variant ${idx + 1}`,
      sku: variant.sku || undefined,
      options: variantOptions,
      prices,
      manage_inventory: variant.manageInventory ?? true,
      allow_backorder: variant.allowBackorder ?? false,
      ...(variant.weight ? { weight: variant.weight } : {}),
      ...(variant.length ? { length: variant.length } : {}),
      ...(variant.width ? { width: variant.width } : {}),
      ...(variant.height ? { height: variant.height } : {}),
      ...(variant.barcode ? { barcode: variant.barcode } : {}),
      ...(variant.ean ? { ean: variant.ean } : {}),
      ...(variant.upc ? { upc: variant.upc } : {}),
      ...(variant.hsCode ? { hs_code: variant.hsCode } : {}),
      ...(variant.originCountry ? { origin_country: variant.originCountry } : {}),
      ...(variant.midCode ? { mid_code: variant.midCode } : {}),
      ...(variant.material ? { material: variant.material } : {}),
    };
  });
  
  // Build images array (sorted by rank)
  const images = (product.images || [])
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((img) => ({ url: img.url }));
  
  // Build the Medusa product payload
  // Append externalId suffix to handle to ensure uniqueness across products
  const uniqueHandle = product.handle + "-" + (product.externalId || "").slice(-8).toLowerCase();
  
  const payload = {
    title: product.title,
    handle: uniqueHandle,
    status: "draft", // Always import as draft
    description: product.description || undefined,
    thumbnail: product.thumbnail || undefined,
    shipping_profile_id: DEFAULTS.SHIPPING_PROFILE_ID,
    options,
    variants,
    sales_channels: [{ id: DEFAULTS.SALES_CHANNEL_ID }],
    metadata: {
      external_id: product.externalId,
      convex_id: product._id,
      ...(product.metadata || {}),
    },
  };
  
  // Add images if present
  if (images.length > 0) {
    payload.images = images;
  }
  
  // Add category if resolved
  if (categoryId) {
    payload.categories = [{ id: categoryId }];
  }
  
  // Add weight if present (product-level)
  if (product.weight) payload.weight = Number(product.weight) || undefined;
  
  return payload;
}

// =============================================================================
// SYNC ORCHESTRATOR
// =============================================================================

async function runSync(args) {
  const convexUrl = args.convexUrl || process.env.CONVEX_URL || DEFAULTS.CONVEX_URL;
  const medusaUrl = args.medusaUrl || process.env.MEDUSA_BACKEND_URL || DEFAULTS.MEDUSA_URL;
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD env vars");
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           Convex → Medusa Product Sync Pipeline             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Convex:     ${convexUrl}`);
  console.log(`  Medusa:     ${medusaUrl}`);
  console.log(`  Batch size: ${args.batchSize}`);
  console.log(`  Offset:     ${args.offset}`);
  console.log(`  Dry run:    ${args.dryRun}`);
  console.log();

  let jwtToken;

  // --- 1. Initialize clients ---
  const convex = new ConvexHttpClient(convexUrl);
  
  console.log("🔐 Authenticating with Medusa Admin API...");
  jwtToken = await getMedusaAdminJwt(medusaUrl, email, password);
  console.log("   ✓ Authenticated\n");

  // --- 2. Fetch categories from Medusa directly ---
  console.log("📂 Fetching categories from Medusa...");
  const medusaCategories = await fetchMedusaCategories(medusaUrl, jwtToken);
  const categoryMaps = buildCategoryMapsFromMedusa(medusaCategories);
  console.log(`   ✓ ${medusaCategories.length} categories loaded (${categoryMaps.byName.size} name mappings)\n`);

  // --- 3. Ensure products are marked ready to sync ---
  if (args.externalId) {
    console.log(`🔎 Targeted mode: syncing only externalId=${args.externalId} (skipping bulkMarkReadyToSync)\n`);
  } else {
    console.log("🔄 Marking pending products as ready to sync...");
    const markResult = await convex.mutation(api.medusa.staging.bulkMarkReadyToSync, {
      limit: args.batchSize + args.offset + 50, // Mark enough for this batch + buffer
    });
    console.log(`   ✓ Marked ${markResult.marked} new products ready (${markResult.total} total pending)\n`);
  }

  // --- 4. Fetch products ready to sync ---
  const fetchLimit = args.externalId
    ? 500 // load enough to filter
    : args.batchSize + args.offset;
  console.log(`📦 Fetching up to ${fetchLimit} ready products from Convex...`);
  const allReady = await convex.query(api.medusa.staging.getProductsReadyToSync, {
    limit: fetchLimit,
  });

  // Apply external-id filter or offset/batch slicing
  let products;
  if (args.externalId) {
    products = allReady.filter((p) => p.externalId === args.externalId);
    console.log(`   ✓ ${allReady.length} total ready, ${products.length} match externalId=${args.externalId}\n`);
  } else {
    products = allReady.slice(args.offset, args.offset + args.batchSize);
    console.log(`   ✓ ${allReady.length} total ready, processing ${products.length} (offset ${args.offset})\n`);
  }

  if (products.length === 0) {
    console.log("ℹ️  No products to sync. Done.");
    return { created: 0, updated: 0, failed: 0, skipped: 0, total: 0, results: [] };
  }

  // --- 5. Transform & sync each product ---
  const results = [];
  let created = 0, updated = 0, failed = 0, skipped = 0, duplicates = 0, exhausted = 0;
  const categoryMisses = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;
    let payload;
    
    try {
      // Transform
      payload = transformProduct(product, categoryMaps);
      
      // Track category resolution
      if (!payload.categories) {
        categoryMisses.push({ title: product.title, externalId: product.externalId });
      }
      
      if (args.dryRun) {
        // Dry run: validate transform only
        const validationErrors = validatePayload(payload);
        results.push({
          convexId: product._id,
          externalId: product.externalId,
          title: product.title,
          status: validationErrors.length > 0 ? "validation_error" : "dry_run_ok",
          validationErrors,
          optionCount: payload.options.length,
          variantCount: payload.variants.length,
          imageCount: payload.images?.length || 0,
          hasCategory: !!payload.categories,
          payload: validationErrors.length > 0 ? payload : undefined,
        });
        if (validationErrors.length > 0) failed++;
        else skipped++;
        console.log(`  ${progress} DRY ${product.title.slice(0, 50)} — ${validationErrors.length ? "⚠️ " + validationErrors.join(", ") : "✓ OK"} (${payload.variants.length}v, ${payload.options.length}o)`);
        continue;
      }
      
      // Mark as syncing in Convex
      await convex.mutation(api.medusa.staging.updateSyncStatus, {
        medusaProductId: product._id,
        status: "syncing",
      });
      
      // Check if product already exists in Medusa
      let existingProduct = null;
      if (product.externalId) {
        existingProduct = await findMedusaProductByExternalId(medusaUrl, jwtToken, product.externalId);
      }
      // Also check by handle as fallback
      if (!existingProduct && payload.handle) {
        try {
          const hUrl = new URL("/admin/products", medusaUrl);
          hUrl.searchParams.set("handle", payload.handle);
          hUrl.searchParams.set("limit", "1");
          hUrl.searchParams.set("fields", "id,handle,title,metadata,status,variants.id");
          const hRes = await fetch(hUrl, { headers: { Authorization: `Bearer ${jwtToken}` } });
          if (hRes.ok) {
            const hData = await hRes.json();
            existingProduct = hData.products?.[0] || null;
          }
        } catch { /* ignore */ }
      }
      
      let medusaResult;
      let action;
      
      if (existingProduct) {
        // Update existing product
        action = "updated";
        // Remove fields that shouldn't be updated
        const { handle, sales_channels, shipping_profile_id, ...updatePayload } = payload;
        medusaResult = await updateMedusaProduct(medusaUrl, jwtToken, existingProduct.id, updatePayload);
        updated++;
      } else {
        // Create new product
        action = "created";
        medusaResult = await createMedusaProduct(medusaUrl, jwtToken, payload);
        created++;
      }
      
      const medusaProductId = medusaResult.product?.id;
      
      // Create inventory levels so new products are immediately purchasable
      if (action === "created" && medusaProductId) {
        try {
          const invLevels = await ensureInventoryLevels(medusaUrl, jwtToken, medusaProductId);
          if (invLevels > 0) {
            console.log(`  ${progress}   📦 Created ${invLevels} inventory level(s)`);
          }
        } catch (invErr) {
          console.warn(`  ${progress}   ⚠ Inventory setup failed: ${invErr.message?.slice(0, 100)}`);
        }
      }
      
      // Build variant mappings
      const variantMappings = [];
      if (medusaResult.product?.variants) {
        const medusaVariants = medusaResult.product.variants;
        for (let vi = 0; vi < product.variants.length && vi < medusaVariants.length; vi++) {
          variantMappings.push({
            convexVariantId: product.variants[vi]._id,
            medusaVariantId: medusaVariants[vi].id,
          });
        }
      }
      
      // Update sync status in Convex
      await convex.mutation(api.medusa.staging.updateSyncStatus, {
        medusaProductId: product._id,
        status: "synced",
        medusaId: medusaProductId,
        syncAttempts: 0,
        variantMappings: variantMappings.length > 0 ? variantMappings : undefined,
      });
      
      results.push({
        convexId: product._id,
        externalId: product.externalId,
        title: product.title,
        status: action,
        medusaProductId,
        variantsMapped: variantMappings.length,
      });
      
      console.log(`  ${progress} ✓ ${action.toUpperCase()} ${product.title.slice(0, 50)} → ${medusaProductId}`);

    } catch (err) {
      const errorMsg = err.message?.slice(0, 200) || String(err);

      // Some Medusa 5xx errors occur after the product is created. Attempt
      // a handle-based reconciliation before classifying this as failed.
      if (payload?.handle) {
        try {
          const lookupUrl = new URL("/admin/products", medusaUrl);
          lookupUrl.searchParams.set("handle", payload.handle);
          lookupUrl.searchParams.set("limit", "1");
          lookupUrl.searchParams.set("fields", "id,handle,title,variants.id");
          const lookupRes = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            const existing = lookupData.products?.[0];
            if (existing) {
              const variantMappings = [];
              if (existing.variants) {
                for (let vi = 0; vi < product.variants.length && vi < existing.variants.length; vi++) {
                  variantMappings.push({
                    convexVariantId: product.variants[vi]._id,
                    medusaVariantId: existing.variants[vi].id,
                  });
                }
              }
              await convex.mutation(api.medusa.staging.updateSyncStatus, {
                medusaProductId: product._id,
                status: "synced",
                medusaId: existing.id,
                syncAttempts: 0,
                variantMappings: variantMappings.length > 0 ? variantMappings : undefined,
              });
              created++;
              results.push({
                convexId: product._id,
                externalId: product.externalId,
                title: product.title,
                status: "reconciled",
                medusaProductId: existing.id,
                error: errorMsg,
              });
              console.log(`  ${progress} ✓ RECONCILED ${product.title.slice(0, 50)} → ${existing.id}`);
              if (!args.dryRun && i < products.length - 1) {
                await sleep(500);
              }
              continue;
            }
          }
        } catch {
          // Fall through to duplicate/failed classification.
        }
      }
      
      // If "already exists" error, try to find and reconcile.
      if (errorMsg.includes("already exists") && payload?.handle) {
        try {
          const lookupUrl = new URL("/admin/products", medusaUrl);
          lookupUrl.searchParams.set("handle", payload.handle);
          lookupUrl.searchParams.set("limit", "1");
          lookupUrl.searchParams.set("fields", "id,handle,title,variants.id");
          const lookupRes = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            const existing = lookupData.products?.[0];
            if (existing) {
              const variantMappings = [];
              if (existing.variants) {
                for (let vi = 0; vi < product.variants.length && vi < existing.variants.length; vi++) {
                  variantMappings.push({
                    convexVariantId: product.variants[vi]._id,
                    medusaVariantId: existing.variants[vi].id,
                  });
                }
              }
              await convex.mutation(api.medusa.staging.updateSyncStatus, {
                medusaProductId: product._id,
                status: "synced",
                medusaId: existing.id,
                syncAttempts: 0,
                variantMappings: variantMappings.length > 0 ? variantMappings : undefined,
              });
              created++;
              results.push({
                convexId: product._id, externalId: product.externalId,
                title: product.title, status: "reconciled", medusaProductId: existing.id,
              });
              console.log(`  ${progress} ✓ RECONCILED ${product.title.slice(0, 50)} → ${existing.id}`);
              if (!args.dryRun && i < products.length - 1) await sleep(500);
              continue;
            }
          }
        } catch (reconcileErr) { /* fall through to normal failure */ }

        // Could not reconcile to an existing Medusa product: mark as duplicate so
        // it doesn't get re-queued as a normal failed sync.
        duplicates++;
        if (!args.dryRun) {
          try {
            await convex.mutation(api.medusa.staging.updateSyncStatus, {
              medusaProductId: product._id,
              status: "duplicate",
              error: errorMsg,
            });
          } catch (updateErr) {
            console.error(`  ${progress} ✗ Failed to mark duplicate for ${product.title}: ${updateErr.message}`);
          }
        }

        results.push({
          convexId: product._id,
          externalId: product.externalId,
          title: product.title,
          status: "duplicate",
          error: errorMsg,
        });

        console.log(`  ${progress} ↺ DUPLICATE ${product.title.slice(0, 50)}: ${errorMsg.slice(0, 100)}`);
        if (!args.dryRun && i < products.length - 1) {
          await sleep(500);
        }
        continue;
      }
      
      const nextAttempts = Number(product.syncAttempts || 0) + 1;
      const isExhausted = nextAttempts >= 5;
      if (isExhausted) exhausted++;
      else failed++;
      
      // Mark as failed in Convex (only if not dry run)
      if (!args.dryRun) {
        try {
          await convex.mutation(api.medusa.staging.updateSyncStatus, {
            medusaProductId: product._id,
            status: isExhausted ? "exhausted" : "failed",
            error: errorMsg,
            syncAttempts: nextAttempts,
          });
        } catch (updateErr) {
          console.error(`  ${progress} ✗ Failed to update status for ${product.title}: ${updateErr.message}`);
        }
      }
      
      results.push({
        convexId: product._id,
        externalId: product.externalId,
        title: product.title,
        status: isExhausted ? "exhausted" : "failed",
        error: errorMsg,
        syncAttempts: nextAttempts,
      });
      
      if (isExhausted) {
        console.log(`  ${progress} ! EXHAUSTED ${product.title.slice(0, 50)}: ${errorMsg.slice(0, 100)}`);
      } else {
        console.log(`  ${progress} ✗ FAILED ${product.title.slice(0, 50)}: ${errorMsg.slice(0, 100)}`);
      }
    }
    
    // Small delay between API calls to avoid rate limiting
    if (!args.dryRun && i < products.length - 1) {
      await sleep(500);
    }
  }

  // --- 6. Summary ---
  console.log();
  console.log("═══════════════════════════════════════════════");
  console.log("  SYNC SUMMARY");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Total processed: ${products.length}`);
  console.log(`  Created:         ${created}`);
  console.log(`  Updated:         ${updated}`);
  console.log(`  Duplicates:      ${duplicates}`);
  console.log(`  Exhausted:       ${exhausted}`);
  console.log(`  Failed:          ${failed}`);
  if (args.dryRun) console.log(`  Dry run OK:      ${skipped}`);
  if (categoryMisses.length > 0) {
    console.log(`  Category misses: ${categoryMisses.length}`);
  }
  console.log("═══════════════════════════════════════════════");

  const report = {
    timestamp: new Date().toISOString(),
    config: {
      convexUrl,
      medusaUrl,
      batchSize: args.batchSize,
      offset: args.offset,
      dryRun: args.dryRun,
    },
    summary: { total: products.length, created, updated, duplicates, exhausted, failed, skipped },
    categoryMisses: categoryMisses.length > 0 ? categoryMisses : undefined,
    results,
  };

  // Write report if requested
  if (args.out) {
    const dir = path.dirname(args.out);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report written to ${args.out}`);
  }

  return report;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validatePayload(payload) {
  const errors = [];
  
  if (!payload.title?.trim()) errors.push("missing_title");
  if (!payload.handle?.trim()) errors.push("missing_handle");
  if (!payload.options || payload.options.length === 0) errors.push("no_options");
  if (!payload.variants || payload.variants.length === 0) errors.push("no_variants");
  
  // Check each option has values
  for (const opt of payload.options || []) {
    if (!opt.values || opt.values.length === 0) {
      errors.push(`option_no_values:${opt.title}`);
    }
  }
  
  // Check each variant has prices
  for (const v of payload.variants || []) {
    if (!v.prices || v.prices.length === 0) {
      errors.push(`variant_no_prices:${v.title}`);
    }
    // Check variant options match product options
    const optionKeys = new Set(Object.keys(v.options || {}));
    for (const opt of payload.options || []) {
      if (!optionKeys.has(opt.title)) {
        errors.push(`variant_missing_option:${v.title}:${opt.title}`);
      }
    }
  }
  
  // Check for duplicate handles/SKUs among variants
  const skus = payload.variants?.map((v) => v.sku).filter(Boolean);
  const uniqueSkus = new Set(skus);
  if (skus && skus.length !== uniqueSkus.size) {
    errors.push("duplicate_variant_skus");
  }
  
  return errors;
}

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  try {
    const args = parseArgs(process.argv);
    
    // Load env from admin/.env
    loadEnv();
    
    await runSync(args);
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    process.exit(1);
  }
}

function loadEnv() {
  // Try to load from admin/.env
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
        // Don't overwrite existing env vars
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

main();
