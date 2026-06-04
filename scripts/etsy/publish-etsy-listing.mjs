#!/usr/bin/env node
/**
 * Etsy marketplace listing publisher.
 *
 * This is separate from the storefront/catalog polish workflow. Default mode is
 * dry-run: fetch one Medusa product, build an Etsy draft plan, and write the
 * plan to reports/etsy without touching Etsy.
 *
 * Usage:
 *   node scripts/etsy/publish-etsy-listing.mjs --product-id prod_...
 *   node scripts/etsy/publish-etsy-listing.mjs --handle modern-lamp
 *   node scripts/etsy/publish-etsy-listing.mjs --cj-sku CJJT1494811
 *   node scripts/etsy/publish-etsy-listing.mjs --check-shop
 *   node scripts/etsy/publish-etsy-listing.mjs --product-id prod_... --live
 *   node scripts/etsy/publish-etsy-listing.mjs --product-id prod_... --live --publish
 *
 * ENV is auto-loaded from marketplace/.env.local, marketplace/.env, admin/.env,
 * admin/.env.local, .env, .env.local, and .agents/product-listing-analyst/.env.
 *
 * Required env for product reads:
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD
 *
 * Required env for Etsy writes/reads:
 *   ETSY_API_KEY, ETSY_ACCESS_TOKEN
 *
 * Required env for Etsy draft creation:
 *   ETSY_SHOP_ID, ETSY_DEFAULT_TAXONOMY_ID, ETSY_SHIPPING_PROFILE_ID
 *
 * Recommended env:
 *   ETSY_RETURN_POLICY_ID, ETSY_SHOP_SECTION_ID, ETSY_PRODUCTION_PARTNER_IDS
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy");
const ETSY_BASE = "https://api.etsy.com";
const DEFAULT_MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";

loadEnv();

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || DEFAULT_MEDUSA_URL;

function loadEnv() {
  const paths = [
    path.join(REPO_ROOT, "marketplace", ".env.local"),
    path.join(REPO_ROOT, "marketplace", ".env"),
    path.join(REPO_ROOT, "admin", ".env"),
    path.join(REPO_ROOT, "admin", ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".agents", "product-listing-analyst", ".env"),
  ];
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
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

function parseArgs(argv) {
  const args = {
    productId: null,
    handle: null,
    cjSku: null,
    checkShop: false,
    live: false,
    publish: false,
    uploadImages: true,
    updateInventory: false,
    maxImages: 10,
    quantity: Number(process.env.ETSY_DEFAULT_QUANTITY || 999),
    taxonomyId: process.env.ETSY_DEFAULT_TAXONOMY_ID || null,
    shippingProfileId: process.env.ETSY_SHIPPING_PROFILE_ID || null,
    returnPolicyId: process.env.ETSY_RETURN_POLICY_ID || null,
    shopSectionId: process.env.ETSY_SHOP_SECTION_ID || null,
    shopId: process.env.ETSY_SHOP_ID || null,
    whoMade: process.env.ETSY_WHO_MADE || "someone_else",
    whenMade: process.env.ETSY_WHEN_MADE || "made_to_order",
    isSupply: parseBool(process.env.ETSY_IS_SUPPLY, false),
    shouldAutoRenew: parseBool(process.env.ETSY_SHOULD_AUTO_RENEW, true),
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--product-id") { args.productId = argv[++i]; continue; }
    if (arg === "--handle") { args.handle = argv[++i]; continue; }
    if (arg === "--cj-sku") { args.cjSku = argv[++i]; continue; }
    if (arg === "--check-shop") { args.checkShop = true; continue; }
    if (arg === "--live") { args.live = true; continue; }
    if (arg === "--publish") { args.publish = true; continue; }
    if (arg === "--no-images") { args.uploadImages = false; continue; }
    if (arg === "--update-inventory") { args.updateInventory = true; continue; }
    if (arg === "--max-images") { args.maxImages = Number(argv[++i]); continue; }
    if (arg === "--quantity") { args.quantity = Number(argv[++i]); continue; }
    if (arg === "--taxonomy-id") { args.taxonomyId = argv[++i]; continue; }
    if (arg === "--shipping-profile-id") { args.shippingProfileId = argv[++i]; continue; }
    if (arg === "--return-policy-id") { args.returnPolicyId = argv[++i]; continue; }
    if (arg === "--shop-section-id") { args.shopSectionId = argv[++i]; continue; }
    if (arg === "--shop-id") { args.shopId = argv[++i]; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.checkShop && !args.productId && !args.handle && !args.cjSku) {
    printUsage();
    throw new Error("Provide --product-id, --handle, --cj-sku, or --check-shop.");
  }
  if (!Number.isFinite(args.quantity) || args.quantity <= 0) throw new Error("--quantity must be a positive number.");
  if (!Number.isFinite(args.maxImages) || args.maxImages < 1 || args.maxImages > 20) {
    throw new Error("--max-images must be between 1 and 20.");
  }
  if (args.publish && !args.live) throw new Error("--publish requires --live.");
  return args;
}

function printUsage() {
  console.log([
    "Usage: node scripts/etsy/publish-etsy-listing.mjs (--product-id ID | --handle HANDLE | --cj-sku SKU | --check-shop) [options]",
    "  --live                  Create an Etsy draft listing. Default is dry-run only.",
    "  --publish               After draft creation and image upload, activate the listing.",
    "  --update-inventory      Push SKU/variant inventory when option property mappings are configured.",
    "  --no-images             Skip image upload in live mode.",
    "  --taxonomy-id ID        Override ETSY_DEFAULT_TAXONOMY_ID.",
    "  --shipping-profile-id ID Override ETSY_SHIPPING_PROFILE_ID.",
    "  --return-policy-id ID   Override ETSY_RETURN_POLICY_ID.",
    "  --shop-section-id ID    Override ETSY_SHOP_SECTION_ID.",
    "  --quantity N            Listing quantity fallback (default 999).",
  ].join("\n"));
}

function parseBool(value, fallback) {
  if (value == null || value === "") return fallback;
  return /^(1|true|yes|y)$/i.test(String(value));
}

async function medusaLogin() {
  if (!process.env.MEDUSA_ADMIN_EMAIL || !process.env.MEDUSA_ADMIN_PASSWORD) {
    throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD.");
  }
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Medusa admin login failed (${res.status}): ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function medusa(jwt, endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
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

const PRODUCT_FIELDS = [
  "id", "title", "handle", "status", "description", "thumbnail", "material",
  "weight", "length", "width", "height", "metadata", "type.value",
  "*images", "*options", "*options.values", "*categories", "*tags",
  "*variants", "*variants.options", "*variants.prices", "*variants.metadata",
].join(",");

async function getProduct(jwt, id) {
  const { product } = await medusa(jwt, `/admin/products/${id}?fields=${encodeURIComponent(PRODUCT_FIELDS)}`);
  return product;
}

async function findProductByHandle(jwt, handle) {
  const { products } = await medusa(
    jwt,
    `/admin/products?handle=${encodeURIComponent(handle)}&limit=1&fields=id`,
  );
  return products?.[0] ? getProduct(jwt, products[0].id) : null;
}

async function findProductByCjSku(jwt, cjSku) {
  let offset = 0;
  for (;;) {
    const { products, count } = await medusa(
      jwt,
      `/admin/products?limit=100&offset=${offset}&fields=id,metadata,*variants,variants.sku,variants.metadata`,
    );
    if (!products?.length) break;
    for (const product of products) {
      const metadata = product.metadata || {};
      if (metadata.cjSku === cjSku || metadata.external_id === cjSku) return getProduct(jwt, product.id);
      for (const variant of product.variants || []) {
        const variantMetadata = variant.metadata || {};
        if (variant.sku === cjSku || variantMetadata.cj_sku === cjSku || variantMetadata.cj_variant_sku === cjSku) {
          return getProduct(jwt, product.id);
        }
      }
    }
    offset += 100;
    if (offset >= count) break;
  }
  return null;
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/[^\p{L}\p{Nd}\p{P}\p{Sm}\p{Zs}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function cleanDescription(product) {
  const description = stripHtmlImages(product.description || "").trim();
  const specs = [];
  const metadata = product.metadata || {};
  if (metadata.packageSize) specs.push(`Package size: ${metadata.packageSize}`);
  if (product.material) specs.push(`Material: ${product.material}`);
  if (product.weight) specs.push(`Weight: ${product.weight} g`);
  if (product.length && product.width && product.height) {
    specs.push(`Dimensions: ${product.length} x ${product.width} x ${product.height} mm`);
  }
  const optionSummary = (product.options || [])
    .filter((option) => !/^(default|option \d+)$/i.test(option.title || ""))
    .map((option) => {
      const values = (option.values || []).map((value) => value.value).filter(Boolean).join(", ");
      return values ? `${option.title}: ${values}` : null;
    })
    .filter(Boolean);
  if (optionSummary.length) specs.push(...optionSummary);

  const sections = [description || product.title, specs.length ? `Details\n${specs.join("\n")}` : null]
    .filter(Boolean);
  return sections.join("\n\n");
}

function stripHtmlImages(value) {
  return String(value || "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n");
}

function cleanMaterial(value) {
  const material = String(value || "").replace(/\s+/g, " ").trim();
  if (!material || material.length > 40) return null;
  if (/packing list|specification|\d{2,}|:|[x]\s*\d/i.test(material)) return null;
  return material.replace(/[^\p{L}\p{Nd}\p{Zs}]/gu, "").trim() || null;
}

function productPrice(product) {
  const candidates = [];
  for (const variant of product.variants || []) {
    for (const price of variant.prices || []) {
      const amount = Number(price.amount);
      if (Number.isFinite(amount) && amount > 0) {
        candidates.push({ amount, currency: String(price.currency_code || "").toLowerCase() });
      }
    }
  }
  const usd = candidates.filter((price) => price.currency === "usd");
  const selected = (usd.length ? usd : candidates).sort((a, b) => a.amount - b.amount)[0];
  if (!selected) throw new Error("Product has no positive variant price.");
  return Number((selected.amount / 100).toFixed(2));
}

function collectImages(product, maxImages) {
  const seen = new Set();
  const urls = [];
  const add = (value) => {
    const url = firstImageUrl(value);
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };
  add(product.thumbnail);
  for (const image of product.images || []) add(image.url);
  for (const variant of product.variants || []) {
    add(variant.metadata?.image);
    add(variant.metadata?.color_image);
  }
  return urls.slice(0, maxImages);
}

function firstImageUrl(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed[0] || null;
    } catch {}
  }
  return text;
}

function buildTags(product) {
  const raw = [
    ...(product.categories || []).map((category) => category.name),
    ...(product.tags || []).map((tag) => tag.value || tag.name),
    product.type?.value,
    "modern lighting",
    "home decor",
  ];
  const tags = [];
  const seen = new Set();
  for (const item of raw) {
    const tag = String(item || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{Nd}\p{Zs}\-']/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length === 13) break;
  }
  return tags;
}

function parseCsvNumbers(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter((number) => Number.isFinite(number));
}

function buildListingPlan(product, args) {
  const materials = [cleanMaterial(product.material)].filter(Boolean);
  const images = collectImages(product, args.maxImages);
  const price = productPrice(product);
  const createDraft = {
    quantity: args.quantity,
    title: cleanTitle(product.title),
    description: cleanDescription(product),
    price,
    who_made: args.whoMade,
    when_made: args.whenMade,
    taxonomy_id: numberOrNull(args.taxonomyId),
    shipping_profile_id: numberOrNull(args.shippingProfileId),
    return_policy_id: numberOrNull(args.returnPolicyId),
    materials,
    shop_section_id: numberOrNull(args.shopSectionId),
    tags: buildTags(product),
    item_weight: product.weight || null,
    item_weight_unit: product.weight ? "g" : null,
    item_length: product.length || null,
    item_width: product.width || null,
    item_height: product.height || null,
    item_dimensions_unit: product.length || product.width || product.height ? "mm" : null,
    production_partner_ids: parseCsvNumbers(process.env.ETSY_PRODUCTION_PARTNER_IDS),
    is_supply: args.isSupply,
    should_auto_renew: args.shouldAutoRenew,
    is_taxable: true,
    type: "physical",
  };

  const inventory = buildInventory(product, args.quantity);
  const missing = [];
  if (!args.shopId) missing.push("ETSY_SHOP_ID");
  if (!createDraft.taxonomy_id) missing.push("ETSY_DEFAULT_TAXONOMY_ID or --taxonomy-id");
  if (!createDraft.shipping_profile_id) missing.push("ETSY_SHIPPING_PROFILE_ID or --shipping-profile-id");
  if (!images.length) missing.push("at least one product image");

  return {
    source: {
      medusaProductId: product.id,
      handle: product.handle,
      status: product.status,
      variantCount: (product.variants || []).length,
    },
    etsy: {
      shopId: numberOrNull(args.shopId),
      createDraft: pruneNulls(createDraft),
      imageUrls: images,
      inventory,
      canUpdateInventory: inventory.canUpdate,
      missingRequiredForLive: missing,
    },
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function pruneNulls(value) {
  if (Array.isArray(value)) return value.map(pruneNulls).filter((item) => item != null);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (item == null || item === "") continue;
    if (Array.isArray(item) && !item.length) continue;
    out[key] = pruneNulls(item);
  }
  return out;
}

function buildInventory(product, fallbackQuantity) {
  const optionMappings = parseOptionMappings(process.env.ETSY_VARIATION_PROPERTY_MAP);
  const options = (product.options || []).filter((option) => !/^(default|option \d+)$/i.test(option.title || ""));
  const variants = product.variants || [];
  if (!variants.length) return { canUpdate: false, reason: "Product has no variants." };

  const missingMappings = options
    .map((option) => option.title)
    .filter((title) => !optionMappings.has(title.toLowerCase()));

  const products = variants.map((variant) => {
    const price = variantPrice(variant) ?? productPrice({ variants: [variant] });
    return {
      sku: variant.sku || variant.id,
      property_values: (variant.options || [])
        .filter((option) => !/^(default|option \d+)$/i.test(option.option?.title || option.title || ""))
        .map((option) => {
          const propertyName = option.option?.title || option.title;
          const mapped = optionMappings.get(String(propertyName || "").toLowerCase());
          return mapped ? {
            property_id: mapped,
            property_name: propertyName,
            values: [String(option.value || "")],
          } : null;
        })
        .filter(Boolean),
      offerings: [{ price, quantity: fallbackQuantity, is_enabled: true }],
    };
  });

  return {
    canUpdate: missingMappings.length === 0,
    reason: missingMappings.length
      ? `Set ETSY_VARIATION_PROPERTY_MAP for: ${missingMappings.join(", ")}`
      : null,
    request: pruneNulls({
      products,
      price_on_property: inferChangingPropertyIds(products, "price"),
      quantity_on_property: inferChangingPropertyIds(products, "quantity"),
      sku_on_property: options.map((option) => optionMappings.get(option.title.toLowerCase())).filter(Boolean),
    }),
  };
}

function parseOptionMappings(value) {
  const map = new Map();
  for (const pair of String(value || "").split(",")) {
    const [name, id] = pair.split(":").map((part) => part?.trim());
    const number = Number(id);
    if (name && Number.isFinite(number)) map.set(name.toLowerCase(), number);
  }
  return map;
}

function variantPrice(variant) {
  const prices = (variant.prices || [])
    .map((price) => ({ amount: Number(price.amount), currency: String(price.currency_code || "").toLowerCase() }))
    .filter((price) => Number.isFinite(price.amount) && price.amount > 0);
  const selected = (prices.filter((price) => price.currency === "usd").length
    ? prices.filter((price) => price.currency === "usd")
    : prices).sort((a, b) => a.amount - b.amount)[0];
  return selected ? Number((selected.amount / 100).toFixed(2)) : null;
}

function inferChangingPropertyIds(products, field) {
  const values = new Set();
  for (const product of products) {
    const offering = product.offerings?.[0];
    values.add(field === "price" ? offering?.price : offering?.quantity);
  }
  if (values.size <= 1) return [];
  const ids = new Set();
  for (const product of products) {
    for (const property of product.property_values || []) ids.add(property.property_id);
  }
  return [...ids];
}

function etsyHeaders({ json = false } = {}) {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY.");
  if (!process.env.ETSY_CLIENT_SECRET && !process.env.ETSY_API_HEADER_KEY) {
    throw new Error("Set ETSY_CLIENT_SECRET or ETSY_API_HEADER_KEY.");
  }
  if (!process.env.ETSY_ACCESS_TOKEN) throw new Error("Set ETSY_ACCESS_TOKEN.");
  const apiKey = process.env.ETSY_API_HEADER_KEY || `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET}`;
  return {
    "x-api-key": apiKey,
    Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

async function etsyRequest(endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, ETSY_BASE), {
    ...init,
    headers: {
      ...etsyHeaders({ json: init.json }),
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(45_000),
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${init.method || "GET"} ${endpoint} -> ${res.status}: ${detail.slice(0, 700)}`);
  }
  return body;
}

async function checkShop(args) {
  const me = await etsyRequest("/v3/application/users/me");
  const userId = me.user_id || me.user?.user_id || me.id;
  let shopId = numberOrNull(args.shopId);
  let shop = null;
  if (!shopId && userId) {
    shop = await etsyRequest(`/v3/application/users/${userId}/shops`);
    shopId = shop.shop_id || shop.results?.[0]?.shop_id || null;
  }
  if (!shopId) throw new Error("Could not resolve shop ID. Set ETSY_SHOP_ID.");

  const [shippingProfiles, returnPolicies, sections] = await Promise.all([
    etsyRequest(`/v3/application/shops/${shopId}/shipping-profiles`),
    etsyRequest(`/v3/application/shops/${shopId}/policies/return`),
    etsyRequest(`/v3/application/shops/${shopId}/sections`),
  ]);

  return {
    user: me,
    shopId,
    shop,
    shippingProfiles: summarizeResults(shippingProfiles, ["shipping_profile_id", "title", "origin_country_iso", "profile_type"]),
    returnPolicies: summarizeResults(returnPolicies, ["return_policy_id", "accepts_returns", "accepts_exchanges", "return_deadline"]),
    sections: summarizeResults(sections, ["shop_section_id", "title", "active_listing_count"]),
  };
}

function summarizeResults(payload, keys) {
  return (payload.results || []).map((item) => {
    const out = {};
    for (const key of keys) out[key] = item[key];
    return out;
  });
}

function appendFormValue(form, key, value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) appendFormValue(form, key, item);
    return;
  }
  form.append(key, String(value));
}

function toUrlEncoded(data) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) appendFormValue(form, key, value);
  return form;
}

async function createDraftListing(plan) {
  const { shopId, createDraft } = plan.etsy;
  return etsyRequest(`/v3/application/shops/${shopId}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toUrlEncoded(createDraft),
  });
}

async function uploadListingImages(shopId, listingId, imageUrls) {
  const uploaded = [];
  for (let index = 0; index < imageUrls.length; index++) {
    const imageUrl = imageUrls[index];
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(45_000) });
    if (!imageResponse.ok) throw new Error(`Image fetch failed (${imageResponse.status}): ${imageUrl}`);
    const blob = await imageResponse.blob();
    const form = new FormData();
    form.append("image", blob, imageFileName(imageUrl, index));
    form.append("rank", String(index + 1));
    form.append("overwrite", "true");
    const uploadedImage = await etsyRequest(`/v3/application/shops/${shopId}/listings/${listingId}/images`, {
      method: "POST",
      headers: {},
      body: form,
    });
    uploaded.push(uploadedImage);
  }
  return uploaded;
}

function imageFileName(imageUrl, index) {
  try {
    const url = new URL(imageUrl);
    const base = path.basename(url.pathname).replace(/[^a-z0-9._-]/gi, "") || `image-${index + 1}.jpg`;
    return base.includes(".") ? base : `${base}.jpg`;
  } catch {
    return `image-${index + 1}.jpg`;
  }
}

async function updateInventory(listingId, inventory) {
  return etsyRequest(`/v3/application/listings/${listingId}/inventory`, {
    method: "PUT",
    json: true,
    body: JSON.stringify(inventory.request),
  });
}

async function publishListing(shopId, listingId) {
  return etsyRequest(`/v3/application/shops/${shopId}/listings/${listingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toUrlEncoded({ state: "active" }),
  });
}

function writeReport(name, payload) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${name}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  return file;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.checkShop) {
    const result = await checkShop(args);
    const report = writeReport("check-shop", result);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nWrote ${path.relative(REPO_ROOT, report)}`);
    return;
  }

  const jwt = await medusaLogin();
  let product = null;
  if (args.productId) product = await getProduct(jwt, args.productId);
  if (args.handle) product = await findProductByHandle(jwt, args.handle);
  if (args.cjSku) product = await findProductByCjSku(jwt, args.cjSku);
  if (!product) throw new Error("No matching Medusa product found.");

  const plan = buildListingPlan(product, args);
  const reportPayload = { mode: args.live ? "live" : "dry-run", plan, result: null };
  const reportBase = `listing-${product.handle || product.id}`;

  console.log(`Product: ${product.title}`);
  console.log(`Mode: ${args.live ? "LIVE" : "DRY-RUN"}`);
  console.log(`Images: ${plan.etsy.imageUrls.length}`);
  console.log(`Variant inventory: ${plan.etsy.canUpdateInventory ? "ready" : plan.etsy.inventory.reason}`);

  if (!args.live) {
    const report = writeReport(reportBase, reportPayload);
    console.log(`Wrote ${path.relative(REPO_ROOT, report)}`);
    return;
  }

  if (plan.etsy.missingRequiredForLive.length) {
    throw new Error(`Missing required live inputs: ${plan.etsy.missingRequiredForLive.join(", ")}`);
  }

  const draft = await createDraftListing(plan);
  const listingId = draft.listing_id;
  const result = { draft, uploadedImages: [], inventory: null, published: null };

  if (args.uploadImages) {
    result.uploadedImages = await uploadListingImages(plan.etsy.shopId, listingId, plan.etsy.imageUrls);
  }

  if (args.updateInventory) {
    if (!plan.etsy.canUpdateInventory) throw new Error(plan.etsy.inventory.reason);
    result.inventory = await updateInventory(listingId, plan.etsy.inventory);
  }

  if (args.publish) {
    result.published = await publishListing(plan.etsy.shopId, listingId);
  }

  reportPayload.result = result;
  const report = writeReport(reportBase, reportPayload);
  console.log(`Created Etsy listing ${listingId} (${args.publish ? "active" : "draft"}).`);
  console.log(`Wrote ${path.relative(REPO_ROOT, report)}`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
