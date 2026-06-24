#!/usr/bin/env node
/**
 * Select Elvato catalogue products that fit the current ALVATTA Etsy direction.
 *
 * This is a read-only Medusa scan. It writes Markdown/JSON candidate reports to
 * reports/etsy and does not create or update Etsy listings.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy");
const DEFAULT_MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";

loadEnv();

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || DEFAULT_MEDUSA_URL;

const PRODUCT_FIELDS = [
  "id", "title", "handle", "status", "description", "thumbnail", "material",
  "weight", "length", "width", "height", "metadata", "type.value",
  "*images", "*options", "*options.values", "*categories", "*tags",
  "*variants", "*variants.prices", "*variants.metadata", "*variants.options",
].join(",");

function parseArgs(argv) {
  const args = {
    limit: 30,
    minScore: 70,
    includePreviouslyDrafted: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--min-score") { args.minScore = Number(argv[++index]); continue; }
    if (arg === "--include-previously-drafted") { args.includePreviouslyDrafted = true; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.limit) || args.limit < 1 || args.limit > 100) throw new Error("--limit must be 1-100.");
  if (!Number.isFinite(args.minScore)) throw new Error("--min-score must be numeric.");
  return args;
}

function printUsage() {
  console.log([
    "Usage: node scripts/etsy/select-alvatta-candidates.mjs [options]",
    "  --limit N                         Number of candidates to report, default 30.",
    "  --min-score N                     Minimum ALVATTA brand-fit score, default 70.",
    "  --include-previously-drafted      Do not exclude products already used in Etsy reports.",
  ].join("\n"));
}

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
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function medusaLogin() {
  if (!process.env.MEDUSA_ADMIN_EMAIL || !process.env.MEDUSA_ADMIN_PASSWORD) {
    throw new Error("Set MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD.");
  }
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.MEDUSA_ADMIN_EMAIL, password: process.env.MEDUSA_ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Medusa admin login failed (${res.status}): ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function medusa(jwt, endpoint) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    signal: AbortSignal.timeout(45_000),
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`GET ${endpoint} -> ${res.status}: ${detail.slice(0, 700)}`);
  }
  return body;
}

async function listProducts(jwt) {
  const products = [];
  let offset = 0;
  for (;;) {
    const payload = await medusa(jwt, `/admin/products?limit=100&offset=${offset}&fields=${encodeURIComponent(PRODUCT_FIELDS)}`);
    products.push(...(payload.products || []));
    offset += payload.products?.length || 0;
    if (!payload.products?.length || offset >= payload.count) break;
  }
  return products;
}

function previouslyDraftedProductIds() {
  const ids = new Set();
  if (!fs.existsSync(REPORT_DIR)) return ids;
  const files = fs.readdirSync(REPORT_DIR).filter((name) => name.startsWith("listing-") && name.endsWith(".json"));
  for (const file of files) {
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), "utf-8"));
      const id = payload?.plan?.source?.medusaProductId;
      if (id) ids.add(id);
    } catch {}
  }
  return ids;
}

function textFor(product) {
  return [
    product.title,
    product.description,
    product.material,
    product.type?.value,
    ...(product.categories || []).map((category) => category.name),
    ...(product.tags || []).map((tag) => tag.value || tag.name),
    ...Object.values(product.metadata || {}).map((value) => typeof value === "string" ? value : ""),
    ...(product.options || []).flatMap((option) => [option.title, ...(option.values || []).map((value) => value.value)]),
  ].filter(Boolean).join(" ").toLowerCase();
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

function imageUrls(product) {
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
  return urls;
}

function productPrice(product) {
  const candidates = [];
  for (const variant of product.variants || []) {
    for (const price of variant.prices || []) {
      const amount = Number(price.amount);
      if (Number.isFinite(amount) && amount > 0) candidates.push({ amount, currency: String(price.currency_code || "").toLowerCase() });
    }
  }
  const usd = candidates.filter((price) => price.currency === "usd");
  const selected = (usd.length ? usd : candidates).sort((a, b) => a.amount - b.amount)[0];
  return selected ? Number((selected.amount / 100).toFixed(2)) : null;
}

function keywordHits(text, patterns) {
  return patterns.filter((pattern) => pattern.test(text)).length;
}

function classify(product, text) {
  const title = String(product.title || "").toLowerCase();
  if (/wall\s+(light|lamp|sconce)|sconce|table\s+lamp|desk\s+lamp|floor\s+lamp|flush\s+mount|ceiling\s+(light|lamp)/.test(title)) {
    return "excluded fixture type";
  }
  const hasPendant = /pendant|single drop|hanging|suspension|suspended/.test(text);
  const hasChandelier = /chandelier|linear light|bar light|island light|dining table light/.test(text);
  const hasExcluded = /wall sconce|wall lamp|flush mount|ceiling light|ceiling lamp|crystal|baroque|fan|floor lamp|table lamp|outdoor|solar/.test(text);
  if (hasPendant && hasChandelier) return "pendant chandelier";
  if (hasPendant) return "pendant";
  if (hasChandelier) return "chandelier";
  if (hasExcluded) return "excluded fixture type";
  return "other";
}

function scoreProduct(product) {
  const text = textFor(product);
  const kind = classify(product, text);
  const urls = imageUrls(product);
  const price = productPrice(product);
  const reasons = [];
  let score = 0;

  if (!["pendant", "chandelier", "pendant chandelier"].includes(kind)) return null;
  if (product.status && product.status !== "published") return null;
  if (price == null || price <= 0) return null;

  const add = (points, reason) => {
    score += points;
    reasons.push(reason);
  };

  add(kind === "pendant chandelier" ? 18 : 14, `${kind} format`);

  const glassHits = keywordHits(text, [/glass/, /globe|sphere|bubble|orb/, /transparent|clear/, /smok[ey]|smoke|grey|gray/, /cognac|amber|coffee|brown/, /colored|colour|blue|pink|macaron/]);
  if (glassHits) add(Math.min(28, 8 + glassHits * 4), "smoky/colored glass language");

  const finishHits = keywordHits(text, [/brass|gold|copper|bronze/, /black|matte/, /iron|metal|aluminum|steel/]);
  if (finishHits) add(Math.min(16, finishHits * 5 + 3), "brass/black/metal hardware fit");

  const formHits = keywordHits(text, [/modern|contemporary|nordic|minimalist|postmodern/, /creative|art|designer|sculptural|geometric|orbital|disc|saucer|moon|planet|ring|branch|bean/, /restaurant|hotel|gallery|exhibition|bar|cafe|dining|bedroom|living room|study|island/]);
  if (formHits) add(Math.min(26, formHits * 6 + 4), "moody modern editorial fit");

  if (urls.length >= 8) add(10, `${urls.length} usable images`);
  else if (urls.length >= 5) add(6, `${urls.length} usable images`);

  if (price >= 40 && price <= 450) add(8, `Etsy-friendly price $${price}`);
  else if (price > 450 && price <= 900) add(3, `premium price $${price}`);

  if ((product.variants || []).length <= 12) add(4, "manageable variant count");
  if (/certification|watt|voltage|size|diameter|height|cm|mm|g9|led/.test(text)) add(5, "has technical/spec cues");

  if (/baroque|crystal|european|rustic|farmhouse|children|cartoon|flower|candle/.test(text)) {
    score -= 22;
    reasons.push("penalty: outside current gritty/elegant direction");
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    kind,
    price,
    score: Number(score.toFixed(1)),
    imageCount: urls.length,
    variantCount: (product.variants || []).length,
    categories: (product.categories || []).map((category) => category.name).filter(Boolean),
    thumbnail: urls[0] || null,
    imageUrls: urls.slice(0, 10),
    reasons,
  };
}

function writeReports(candidates, products, excludedIds, args) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const stamp = Date.now();
  const jsonPath = path.join(REPORT_DIR, `alvatta-brand-fit-candidates-${stamp}.json`);
  const mdPath = path.join(REPORT_DIR, `alvatta-brand-fit-candidates-${stamp}.md`);
  const payload = {
    generatedAt,
    visualBrief: {
      direction: "smoky or colored glass, black/brass hardware, sculptural pendant and chandelier forms, moody editorial interiors",
      exclude: "generic flush mounts, wall sconces, crystal/baroque chandeliers, rustic fixtures",
    },
    totalProductsScanned: products.length,
    excludedPreviouslyDrafted: excludedIds.size,
    selectedCount: candidates.length,
    candidates,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  const lines = [
    "# ALVATTA Brand Fit Candidates",
    "",
    `Generated: ${generatedAt}`,
    `Scanned: ${products.length} products`,
    `Excluded previous Etsy report products: ${excludedIds.size}`,
    `Minimum score: ${args.minScore}`,
    "",
    "## Visual Brief",
    "",
    "- Smoky, cognac, clear, or saturated glass",
    "- Black, brass, gold, or slim metal hardware",
    "- Pendant/chandelier silhouettes with sculptural or editorial presence",
    "- Moody modern fit: dining, bedroom, hotel, restaurant, gallery, study",
    "- Avoid generic flush mounts, wall sconces, rustic, crystal, and baroque fixtures",
    "",
    "## Top Candidates",
    "",
    "| Rank | Score | Product | Type | Price | Images | Variants | Why | Product ID |",
    "| ---: | ---: | --- | --- | ---: | ---: | ---: | --- | --- |",
  ];

  candidates.forEach((candidate, index) => {
    lines.push(`| ${index + 1} | ${candidate.score} | ${escapeCell(candidate.title)} | ${candidate.kind} | ${candidate.price == null ? "" : `$${candidate.price.toFixed(2)}`} | ${candidate.imageCount} | ${candidate.variantCount} | ${escapeCell(candidate.reasons.slice(0, 4).join("; "))} | ${candidate.id} |`);
  });
  lines.push("");
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`);
  return { jsonPath, mdPath };
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

async function main() {
  const args = parseArgs(process.argv);
  const excludedIds = args.includePreviouslyDrafted ? new Set() : previouslyDraftedProductIds();
  const jwt = await medusaLogin();
  const products = await listProducts(jwt);
  const candidates = products
    .filter((product) => !excludedIds.has(product.id))
    .map(scoreProduct)
    .filter(Boolean)
    .filter((candidate) => candidate.score >= args.minScore)
    .sort((left, right) => right.score - left.score || (right.imageCount - left.imageCount) || left.price - right.price)
    .slice(0, args.limit);

  const reports = writeReports(candidates, products, excludedIds, args);
  console.log(JSON.stringify({
    scanned: products.length,
    excludedPreviouslyDrafted: excludedIds.size,
    selected: candidates.length,
    markdown: path.relative(REPO_ROOT, reports.mdPath),
    json: path.relative(REPO_ROOT, reports.jsonPath),
    top: candidates.slice(0, 10).map((candidate) => ({ score: candidate.score, title: candidate.title, price: candidate.price, id: candidate.id })),
  }, null, 2));
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});