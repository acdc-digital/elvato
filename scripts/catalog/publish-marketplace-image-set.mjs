#!/usr/bin/env node

/**
 * Publish the selected marketplace image-set products into Medusa.
 *
 * Source of truth:
 *   - marketplace/images product folders with metadata, sources, and local images.
 *
 * Flow:
 *   1. Match the requested 25 products to local image folders.
 *   2. Match existing Medusa products uniquely; create when missing.
 *   3. Upload selected local images to ConvexFS/Bunny via Convex upload URL.
 *   4. Patch Medusa title, description, thumbnail, images, pricing, metadata,
 *      status=published, and default sales channel.
 *
 * Default mode is dry-run. Use --live to apply production writes.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computePricingRecommendation } from "../etsy/lib/price.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const IMAGE_ROOT = path.join(REPO_ROOT, "marketplace", "images");

const DEFAULTS = {
  medusaUrl: "https://medusa-backend-production-d681.up.railway.app",
  convexUrl: "https://superb-dotterel-37.convex.cloud",
  salesChannelId: "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z",
  shippingProfileId: "sp_01KDPCN9M6FWK309G054X4RKQ6",
  categoryIds: {
    chandelier: "pcat_01KF736S869NMN0XA35AA07XPM",
    pendant: "pcat_01KF73711R8NF7FV7BKB96PWA6",
    wall: "pcat_01KF7375B8QDW6HP07AHYCKZQ8",
    "table-floor": "pcat_01KF737DY59JFQDPA35FTCZ7HM",
  },
};

const REQUESTED = [
  "Eclipse Resin LED Asymmetric Chandelier",
  "Modern Smoke Glass Globe Chandelier - Dining Room, Living Room Pendant Light",
  "Smoke Glass Pendant Light - Modern Dining Room Chandelier, Gray Glass Ceiling Fixture for Kitchen Island",
  "Modern Branches Pendant Light - Smoke Glass Bedroom Chandelier, Minimalist Dining Room Ceiling Fixture",
  "Glass Globe Pendant Light - Scandinavian Modern Ceiling Fixture, Color Accent Lighting",
  "Sculptural Half-Circle Chandelier - Modern Black Metal Ceiling Light Fixture",
  "Smoke Glass Pendant Light - Minimalist Cluster Chandelier, Modern Dining Room Fixture",
  "Modern Bubble Glass Chandelier - Linear Dining Room, Kitchen Island Pendant Light",
  "Modern Branch Chandelier - Sculptural Dining Room Light, Kitchen Island Ceiling Fixture, Minimalist LED Pendant",
  "Modern Glass Pendant Light - Minimalist Single Drop Ceiling Fixture, Scandinavian Dining Light",
  "Modern Cement Glass Table Lamp - Industrial Minimalist",
  "Modern Globe Table Lamp with Minimalist Round Design",
  "Nordic Glass Ball Marble Table Lamp",
  "Creative Glass LED Table Lamp - Modern Art Deco Accent",
  "Brushed Gold Floor Lamp - Opal Glass Globe Shades",
  "Mahjong Table Lamp - Modern Hotel Bedside Accent Light",
  "Creative Glass Table Lamp - Bar Model Room Accent Light",
  "Nordic Glass Globe Wall Lamp - Modern Minimalist Sconce",
  "Modern Glass Globe Pendant Light - Minimalist Bedside, Living Room Fixture",
  "Nordic Glass Orb Chandelier with Textured Design",
  "Nordic Glass Globe Sconce - Postmodern Minimalist Lighting Fixture",
  "Modern Glass Globe Pendant Chandelier - Minimalist Dining, Kitchen Island Light",
  "Modern Glass Globe Chandelier - Minimalist Restaurant Style Dining Light",
  "Nordic Linear Chandelier - Modern Strip Bar Light, Dining Kitchen Island Pendant",
  "Modern Glass Globe Table Lamp for Bedroom & Study",
];

const FORCED_CREATE_TITLES = new Set([
  "Eclipse Resin LED Asymmetric Chandelier",
  "Brushed Gold Floor Lamp - Opal Glass Globe Shades",
]);

function parseArgs(argv) {
  const args = {
    live: false,
    maxImages: 10,
    includeFound: true,
    out: null,
    matchThreshold: 0.35,
    priceMode: "scale",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--live") args.live = true;
    else if (arg === "--max-images") args.maxImages = Number(argv[++i]);
    else if (arg === "--no-found") args.includeFound = false;
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--match-threshold") args.matchThreshold = Number(argv[++i]);
    else if (arg === "--price-mode") args.priceMode = argv[++i];
    else if (arg === "--help") {
      console.log([
        "Usage: node scripts/catalog/publish-marketplace-image-set.mjs [--live]",
        "",
        "Options:",
        "  --live                  Apply writes. Default is dry-run.",
        "  --max-images N          Upload/apply up to N images per product (default 10).",
        "  --no-found              Use only original_XX images, not found_XX images.",
        "  --price-mode scale|flat  Scale preserves variant price spread (default); flat sets all variants to recommended.",
        "  --out FILE              Report path override.",
      ].join("\n"));
      process.exit(0);
    }
  }
  if (!["scale", "flat"].includes(args.priceMode)) throw new Error("--price-mode must be scale or flat");
  return args;
}

function loadEnv() {
  for (const rel of ["admin/.env", "admin/.env.local", ".env.local", ".env", "storefront/.env.local"]) {
    const file = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(light|lighting|fixture|fixtures|ceiling|room|for|with|and|the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  const union = new Set([...a, ...b]);
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap++;
  const jaccard = union.size ? overlap / union.size : 0;
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  const contains = normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft) ? 0.2 : 0;
  return Math.min(1, jaccard + contains);
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkImageDirs(dir = IMAGE_ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkImageDirs(full, out);
    else if (entry.name === "metadata.json") out.push(path.dirname(full));
  }
  return out;
}

function loadImageSets() {
  return walkImageDirs().map((dir) => {
    const metadata = readJson(path.join(dir, "metadata.json"));
    const sourcesPath = path.join(dir, "sources.json");
    return {
      dir,
      metadata,
      sources: fs.existsSync(sourcesPath) ? readJson(sourcesPath) : null,
      categoryFolder: path.basename(path.dirname(dir)),
    };
  });
}

function bestMatch(target, items, titleFn, used = new Set()) {
  let best = null;
  for (const item of items) {
    const id = item.id || item.dir;
    if (used.has(id)) continue;
    const score = similarity(target, titleFn(item));
    if (!best || score > best.score) best = { item, score };
  }
  return best;
}

function imageExtension(file) {
  return path.extname(file).replace(/^\./, "").toLowerCase() || "jpg";
}

function contentTypeFor(file) {
  const ext = imageExtension(file);
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

function selectedImageFiles(imageSet, maxImages, includeFound) {
  const files = fs.readdirSync(imageSet.dir);
  const originals = files.filter((file) => /^original_\d+\.(jpe?g|png|webp)$/i.test(file)).sort();
  const found = includeFound ? files.filter((file) => /^found_\d+\.(jpe?g|png|webp)$/i.test(file)).sort() : [];
  const byLocalPath = new Map();
  for (const item of imageSet.sources?.originals || []) {
    if (item.localPath) byLocalPath.set(item.localPath, item);
  }
  for (const item of imageSet.sources?.discoveredCandidates || []) {
    if (item.localPath) byLocalPath.set(item.localPath, item);
  }
  return [...originals, ...found].slice(0, maxImages).map((file) => {
    const localFile = path.join(imageSet.dir, file);
    const localPath = path.relative(REPO_ROOT, localFile);
    const source = byLocalPath.get(localPath) || null;
    return {
      localPath,
      localFile,
      sourceUrl: source?.imageUrl || source?.raw?.image || null,
      sourcePageUrl: source?.sourceUrl || null,
      sourceDomain: source?.sourceDomain || null,
      contentType: source?.contentType || contentTypeFor(localFile),
    };
  });
}

function categoryIdFor(title, imageSet) {
  const text = `${title} ${imageSet.categoryFolder}`.toLowerCase();
  if (/wall|sconce/.test(text)) return DEFAULTS.categoryIds.wall;
  if (/table|floor|lamp/.test(text) && !/chandelier|pendant/.test(text)) return DEFAULTS.categoryIds["table-floor"];
  if (/pendant/.test(text) && !/chandelier/.test(text)) return DEFAULTS.categoryIds.pendant;
  return DEFAULTS.categoryIds.chandelier;
}

function formatMoney(value) {
  return value == null ? null : `$${Number(value).toFixed(2)}`;
}

function recommendedCents(pricing) {
  const recommended = pricing?.recommended;
  if (!Number.isFinite(Number(recommended))) return 9999;
  return Math.max(100, Math.round(Number(recommended) * 100));
}

function currentUsdCents(variant) {
  const price = (variant.prices || []).find((p) => String(p.currency_code || "").toLowerCase() === "usd");
  if (!price) return null;
  const amount = Number(price.amount);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount);
}

function buildVariantPricePatches(product, targetCents, priceMode) {
  const variants = product?.variants || [];
  const current = variants.map((variant) => currentUsdCents(variant)).filter((value) => value && value > 0);
  const min = current.length ? Math.min(...current) : null;
  const ratio = priceMode === "scale" && min ? targetCents / min : null;
  return variants.map((variant) => {
    const existing = currentUsdCents(variant);
    const next = priceMode === "scale" && ratio && existing ? Math.max(100, Math.round(existing * ratio)) : targetCents;
    return { id: variant.id, title: variant.title, sku: variant.sku, currentCents: existing, nextCents: next };
  });
}

function sourceDomains(imageSet) {
  const candidates = imageSet.sources?.discoveredCandidates || [];
  return Array.from(new Set(candidates.map((item) => item.sourceDomain).filter(Boolean))).slice(0, 12);
}

function buildDescription(title, imageSet, pricing) {
  const lower = title.toLowerCase();
  const productType = /table/.test(lower) ? "table lamp" : /floor/.test(lower) ? "floor lamp" : /sconce|wall/.test(lower) ? "wall sconce" : /pendant/.test(lower) ? "pendant light" : "chandelier";
  const materials = [];
  if (/glass|globe|orb|bubble/.test(lower)) materials.push("glass globe detailing");
  if (/smoke|gray|grey/.test(lower)) materials.push("smoke-toned glass");
  if (/gold|brass/.test(lower)) materials.push("warm metallic accents");
  if (/marble/.test(lower)) materials.push("marble-inspired character");
  if (/cement/.test(lower)) materials.push("cement and glass contrast");
  if (/resin/.test(lower)) materials.push("sculptural resin form");
  const materialText = materials.length ? materials.join(", ") : "a clean modern silhouette";
  const roomText = /kitchen|island/.test(lower)
    ? "kitchen islands, dining spaces, and open-plan living rooms"
    : /bedroom|bedside|study/.test(lower)
      ? "bedrooms, bedside settings, studies, and quiet reading corners"
      : /restaurant|bar|hotel/.test(lower)
        ? "hospitality spaces, bars, dining rooms, and styled commercial interiors"
        : "dining rooms, living rooms, bedrooms, and curated interiors";
  const priceText = pricing?.count
    ? `Competitive research reviewed ${pricing.count} comparable marketplace listings and supports a list price of ${formatMoney(pricing.recommended)}.`
    : "Competitive pricing was reviewed from the available local source report.";

  return [
    `${title} brings ${materialText} into a refined ${productType} designed for ${roomText}. The profile is modern without feeling cold, giving the piece enough visual presence to anchor a space while still pairing easily with minimalist, Nordic, contemporary, and transitional interiors.`,
    `Use it as a focal point where atmosphere matters: over a dining table, beside a bed, along a feature wall, or anywhere a warmer decorative lighting layer can make the room feel more intentional. ${priceText}`,
  ].join("\n\n");
}

async function medusaLogin(medusaUrl) {
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD.");
  const res = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Medusa auth failed (${res.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text).token;
}

async function medusa(jwt, medusaUrl, endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, medusaUrl), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(45_000),
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${init.method || "GET"} ${endpoint} -> ${res.status}: ${detail.slice(0, 500)}`);
  }
  return body;
}

async function allProducts(jwt, medusaUrl) {
  const products = [];
  let offset = 0;
  const fields = "id,title,handle,status,description,thumbnail,*images,*sales_channels,*variants,*variants.prices,metadata";
  for (;;) {
    const data = await medusa(jwt, medusaUrl, `/admin/products?limit=100&offset=${offset}&fields=${encodeURIComponent(fields)}`);
    products.push(...(data.products || []));
    if (!data.products?.length || products.length >= data.count) break;
    offset += 100;
  }
  return products;
}

async function convexCall(convexUrl, kind, fnPath, fnArgs) {
  const res = await fetch(`${convexUrl}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args: fnArgs }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Convex ${kind} ${fnPath} failed (${res.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text).value;
}

async function uploadImageSet(convexUrl, handle, imageItems) {
  const uploaded = [];
  for (let index = 0; index < imageItems.length; index++) {
    const item = imageItems[index];
    if (!item.sourceUrl) throw new Error(`No source image URL for ${item.localPath}`);
    const ext = imageExtension(item.localFile);
    const destPath = index === 0
      ? `/products/${handle}/thumbnail.${ext}`
      : `/products/${handle}/images/${String(index).padStart(2, "0")}.${ext}`;
    const ingest = await convexCall(convexUrl, "action", "files:ingestImage", {
      sourceUrl: item.sourceUrl,
      destPath,
    });
    const url = await convexCall(convexUrl, "query", "files:getFileUrl", { path: destPath });
    if (!url) throw new Error(`ConvexFS did not return a URL for ${destPath}`);
    uploaded.push({
      ...ingest,
      url,
      localPath: item.localPath,
      sourceUrl: item.sourceUrl,
      sourcePageUrl: item.sourcePageUrl,
      sourceDomain: item.sourceDomain,
    });
  }
  return uploaded;
}

function buildPlan(args, products, imageSets) {
  const usedProducts = new Set();
  const usedImageSets = new Set();
  return REQUESTED.map((title, index) => {
    const imageMatch = bestMatch(title, imageSets, (item) => item.metadata.title || item.metadata.slug || path.basename(item.dir), usedImageSets);
    if (!imageMatch || imageMatch.score < args.matchThreshold) throw new Error(`No local image folder matched ${title}`);
    const imageSet = imageMatch.item;
    usedImageSets.add(imageSet.dir);

    const pricing = imageSet.sources ? computePricingRecommendation(imageSet.sources) : null;
    const targetCents = recommendedCents(pricing);
    const exactExisting = products.find((product) => normalize(product.title) === normalize(title));
    const forceCreate = FORCED_CREATE_TITLES.has(title) && !exactExisting;
    const productMatch = forceCreate
      ? null
      : exactExisting
        ? { item: exactExisting, score: 1 }
        : bestMatch(title, products, (product) => product.title, usedProducts);
    const existing = productMatch && productMatch.score >= args.matchThreshold ? productMatch.item : null;
    if (existing) usedProducts.add(existing.id);
    const imageFiles = selectedImageFiles(imageSet, args.maxImages, args.includeFound);
    const handle = existing?.handle || slugify(`${title}-${imageSet.metadata.etsyListingId || index + 1}`);
    const description = buildDescription(title, imageSet, pricing);
    const categoryId = categoryIdFor(title, imageSet);
    const variantPricePatches = existing ? buildVariantPricePatches(existing, targetCents, args.priceMode) : [];
    return {
      index: index + 1,
      requestedTitle: title,
      action: existing ? "update" : "create",
      productId: existing?.id || null,
      currentTitle: existing?.title || null,
      currentStatus: existing?.status || null,
      matchScore: productMatch ? Number(productMatch.score.toFixed(3)) : null,
      handle,
      imageFolder: path.relative(REPO_ROOT, imageSet.dir),
      imageTitle: imageSet.metadata.title,
      imageScore: Number(imageMatch.score.toFixed(3)),
      etsyListingId: imageSet.metadata.etsyListingId || imageSet.sources?.etsyListing?.listingId || null,
      categoryId,
      targetPriceCents: targetCents,
      targetPrice: targetCents / 100,
      pricing: pricing ? {
        count: pricing.count,
        min: pricing.min,
        p25: pricing.p25,
        median: pricing.median,
        recommended: pricing.recommended,
      } : null,
      sourceDomains: sourceDomains(imageSet),
      localImages: imageFiles.map((item) => item.localPath),
      imageSources: imageFiles,
      currentImageCount: existing?.images?.length || 0,
      variantCount: existing?.variants?.length || 0,
      variantPricePatches,
      productPatch: {
        title,
        description,
        status: "published",
        categories: [{ id: categoryId }],
        metadata: {
          ...(existing?.metadata || {}),
          marketplaceImageRefresh: {
            source: "marketplace/images",
            imageFolder: path.relative(REPO_ROOT, imageSet.dir),
            etsyListingId: imageSet.metadata.etsyListingId || null,
            refreshedAt: new Date().toISOString(),
            pricing,
            sourceDomains: sourceDomains(imageSet),
          },
        },
      },
    };
  });
}

function createProductPayload(plan, uploadedImages) {
  const imageUrls = uploadedImages.map((image) => image.url).filter(Boolean);
  return {
    title: plan.requestedTitle,
    handle: plan.handle,
    status: "published",
    description: plan.productPatch.description,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
    shipping_profile_id: DEFAULTS.shippingProfileId,
    categories: [{ id: plan.categoryId }],
    sales_channels: [{ id: DEFAULTS.salesChannelId }],
    options: [{ title: "Default", values: ["Default"] }],
    variants: [{
      title: "Default",
      sku: `MP-${String(plan.etsyListingId || plan.index).replace(/\D/g, "").slice(-8) || String(plan.index).padStart(3, "0")}`,
      options: { Default: "Default" },
      prices: [{ amount: plan.targetPriceCents, currency_code: "usd" }],
      manage_inventory: false,
      allow_backorder: true,
    }],
    metadata: plan.productPatch.metadata,
  };
}

function updateProductPayload(plan, uploadedImages) {
  const imageUrls = uploadedImages.map((image) => image.url).filter(Boolean);
  return {
    ...plan.productPatch,
    thumbnail: imageUrls[0],
    images: imageUrls.map((url) => ({ url })),
  };
}

async function ensureSalesChannel(jwt, medusaUrl, productId) {
  await medusa(jwt, medusaUrl, `/admin/sales-channels/${DEFAULTS.salesChannelId}/products`, {
    method: "POST",
    body: JSON.stringify({ add: [productId] }),
  });
}

async function applyPlan(args, jwt, medusaUrl, convexUrl, plan) {
  const uploadedImages = await uploadImageSet(convexUrl, plan.handle, plan.imageSources);
  let productId = plan.productId;
  let medusaResult = null;

  if (plan.action === "create") {
    medusaResult = await medusa(jwt, medusaUrl, "/admin/products", {
      method: "POST",
      body: JSON.stringify(createProductPayload(plan, uploadedImages)),
    });
    productId = medusaResult.product?.id;
  } else {
    medusaResult = await medusa(jwt, medusaUrl, `/admin/products/${plan.productId}`, {
      method: "POST",
      body: JSON.stringify(updateProductPayload(plan, uploadedImages)),
    });
  }

  if (!productId) throw new Error(`No Medusa product id returned for ${plan.requestedTitle}`);
  await ensureSalesChannel(jwt, medusaUrl, productId);

  for (const variant of plan.variantPricePatches) {
    await medusa(jwt, medusaUrl, `/admin/products/${productId}/variants/${variant.id}`, {
      method: "POST",
      body: JSON.stringify({ prices: [{ amount: variant.nextCents, currency_code: "usd" }] }),
    });
  }

  return { productId, uploadedImages, medusaStatus: medusaResult.product?.status || "published" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnv();
  const medusaUrl = process.env.MEDUSA_BACKEND_URL || DEFAULTS.medusaUrl;
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || DEFAULTS.convexUrl;
  const imageSets = loadImageSets();
  const jwt = await medusaLogin(medusaUrl);
  const products = await allProducts(jwt, medusaUrl);
  const plans = buildPlan(args, products, imageSets);
  const report = {
    timestamp: new Date().toISOString(),
    mode: args.live ? "live" : "dry-run",
    summary: {
      total: plans.length,
      creates: plans.filter((plan) => plan.action === "create").length,
      updates: plans.filter((plan) => plan.action === "update").length,
      imageUploadsPlanned: plans.reduce((sum, plan) => sum + plan.localImages.length, 0),
      productsScanned: products.length,
    },
    plans,
    results: [],
  };

  console.log(`Mode: ${report.mode}`);
  console.log(`Plans: ${report.summary.total} (${report.summary.creates} create, ${report.summary.updates} update)`);
  console.log(`Images: ${report.summary.imageUploadsPlanned} local files selected for ConvexFS/Bunny`);

  if (args.live) {
    for (const plan of plans) {
      const label = `[${plan.index}/${plans.length}] ${plan.requestedTitle}`;
      try {
        console.log(`${label} -> ${plan.action}`);
        const result = await applyPlan(args, jwt, medusaUrl, convexUrl, plan);
        report.results.push({ index: plan.index, title: plan.requestedTitle, ok: true, ...result });
      } catch (err) {
        report.results.push({ index: plan.index, title: plan.requestedTitle, ok: false, error: err.message });
        console.error(`  FAILED: ${err.message}`);
      }
    }
  }

  const outPath = args.out || path.join(REPO_ROOT, "reports", "catalog", `marketplace-publish-${args.live ? "live" : "dry"}-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Report: ${path.relative(REPO_ROOT, outPath)}`);
  if (!args.live) console.log("Dry-run only. Re-run with --live to create/update/publish products.");
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});