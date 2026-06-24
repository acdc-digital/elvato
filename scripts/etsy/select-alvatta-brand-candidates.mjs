#!/usr/bin/env node
/**
 * Unified ALVATTA brand-fit selector.
 *
 * Produces a single cross-fixture ranked shortlist (pendant, chandelier, table,
 * floor, wall sconce) tuned to the current top-performing Etsy listings:
 *   - Modern Glass Globe Table Lamp for Bedroom & Study
 *   - Modern Branch Chandelier (sculptural dining/island)
 *   - Modern Glass Pendant Light (minimalist single-drop, Scandinavian)
 *   - Nordic Glass Globe Wall Lamp (minimalist sconce)
 *
 * Visual aesthetic confirmed from product imagery: opal/white glass globes and
 * smoked-grey glass, sculptural minimalist silhouettes, warm brass/gold + matte
 * black hardware, neutral and muted-accent editorial styling.
 *
 * Read-only against Medusa. Writes a ranked report to reports/etsy and never
 * creates or updates Etsy listings.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectAttributes } from "./lib/seo-tags.mjs";
import { fetchActiveListings, deriveBrandProfile, scoreAgainstProfile } from "./lib/brand-style.mjs";

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

const SELLABLE_KINDS = ["pendant", "chandelier", "table lamp", "floor lamp", "wall sconce"];

function parseArgs(argv) {
  const args = {
    limit: 25,
    minScore: 70,
    type: "all",
    includePreviouslyDrafted: false,
    useActiveProfile: true,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--min-score") { args.minScore = Number(argv[++index]); continue; }
    if (arg === "--type") { args.type = String(argv[++index] || "").toLowerCase(); continue; }
    if (arg === "--include-previously-drafted") { args.includePreviouslyDrafted = true; continue; }
    if (arg === "--no-active-profile") { args.useActiveProfile = false; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.limit) || args.limit < 1 || args.limit > 100) throw new Error("--limit must be 1-100.");
  if (!Number.isFinite(args.minScore)) throw new Error("--min-score must be numeric.");
  if (!["all", ...SELLABLE_KINDS, "wall", "table", "pendant", "chandelier", "floor"].includes(args.type)) {
    throw new Error("--type must be one of: all, pendant, chandelier, table, floor, wall.");
  }
  return args;
}

function printUsage() {
  console.log([
    "Usage: node scripts/etsy/select-alvatta-brand-candidates.mjs [options]",
    "  --limit N                     Number of candidates to report, default 25.",
    "  --min-score N                 Minimum brand-fit score, default 70.",
    "  --type all|pendant|chandelier|table|floor|wall  Fixture filter, default all.",
    "  --include-previously-drafted  Do not exclude products already used in Etsy reports.",
    "  --no-active-profile           Skip deriving the live brand profile from active Etsy listings.",
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
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
    ...Object.values(product.metadata || {}).map((value) => (typeof value === "string" ? value : "")),
    ...(product.options || []).flatMap((option) => [option.title, ...(option.values || []).map((value) => value.value)]),
  ].filter(Boolean).join(" ").toLowerCase();
}

function categoryNames(product) {
  return (product.categories || []).map((category) => String(category.name || "").toLowerCase());
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
  const categories = categoryNames(product).join(" ");
  const haystack = `${title} ${categories} ${text}`;

  // Hard exclusions: fixtures off-brand for ALVATTA.
  if (/\bfan\b|ceiling fan|outdoor|solar|garden|street|flood|spot ?light|track light|strip light|panel light|downlight|emergency|flashlight|night ?light/.test(haystack)) {
    return "excluded fixture type";
  }

  // Title-first classification (most reliable signal).
  if (/wall\s+(light|lamp|sconce)|sconce|bedside wall/.test(title)) return "wall sconce";
  if (/chandelier|linear (light|pendant)|island light|branch light|molecular/.test(title)) return "chandelier";
  if (/pendant|single drop|hanging light|suspension|drop light/.test(title)) return "pendant";
  if (/floor lamp|arc lamp|standing lamp|tall lamp/.test(title)) return "floor lamp";
  if (/table lamp|desk lamp|bedside lamp|nightstand lamp|reading lamp/.test(title)) return "table lamp";

  // Fall back to broader text / category signals.
  if (/wall sconce|wall lamp|wall light/.test(haystack)) return "wall sconce";
  if (/chandelier|island light|linear light/.test(haystack)) return "chandelier";
  if (/pendant|single drop|suspension/.test(haystack)) return "pendant";
  if (/floor lamp|floor lamps/.test(haystack)) return "floor lamp";
  if (/table lamp|desk lamp|bedside|nightstand|table lamps/.test(haystack)) return "table lamp";

  // Generic ceiling lights that are not pendants/chandeliers are off-brand.
  if (/flush mount|ceiling light|ceiling lamp/.test(haystack)) return "excluded fixture type";
  return "other";
}

function matchesTypeFilter(kind, type) {
  if (type === "all") return true;
  if (type === "wall") return kind === "wall sconce";
  if (type === "table") return kind === "table lamp";
  if (type === "floor") return kind === "floor lamp";
  if (type === "pendant") return kind === "pendant";
  if (type === "chandelier") return kind === "chandelier";
  return kind === type;
}

function scoreProduct(product, args, brandProfile = null) {
  const text = textFor(product);
  const kind = classify(product, text);
  const urls = imageUrls(product);
  const price = productPrice(product);
  const reasons = [];
  let score = 0;

  if (!SELLABLE_KINDS.includes(kind)) return null;
  if (!matchesTypeFilter(kind, args.type)) return null;
  if (product.status && product.status !== "published") return null;
  if (price == null || price <= 0) return null;
  if (!urls.length) return null;

  const add = (points, reason) => {
    score += points;
    reasons.push(reason);
  };

  // Base format weighting: every sellable type qualifies; the proven hero forms
  // (pendant, chandelier, wall sconce, glass globe table) lead.
  const baseByKind = {
    pendant: 16,
    chandelier: 16,
    "wall sconce": 15,
    "table lamp": 14,
    "floor lamp": 13,
  };
  add(baseByKind[kind], `${kind} format`);

  // HERO SIGNAL 1 — glass globe / opal sphere (the single strongest brand cue).
  const globeHits = keywordHits(text, [/globe|sphere|orb|ball|bubble|round glass/, /opal|milk glass|white glass|frosted/]);
  if (globeHits) add(Math.min(26, 10 + globeHits * 8), "glass globe / opal sphere (hero cue)");

  // HERO SIGNAL 2 — smoked / tinted glass language.
  const smokeHits = keywordHits(text, [/smok[ey]|smoke glass|smoked/, /grey glass|gray glass|tinted/, /cognac|amber|coffee/, /clear glass|transparent/]);
  if (smokeHits) add(Math.min(18, 6 + smokeHits * 6), "smoked / tinted glass");

  // HERO SIGNAL 3 — sculptural minimalist silhouette matching winners.
  const formHits = keywordHits(text, [/branch|molecular|twig|sculptural/, /single drop|linear|minimalist|minimal/, /nordic|scandinavian|modern|contemporary/, /geometric|ring|disc|saucer|moon|orbital/]);
  if (formHits) add(Math.min(22, 6 + formHits * 5), "sculptural minimalist form");

  // Hardware finish fit: warm brass/gold + matte black, slim metal.
  const finishHits = keywordHits(text, [/brass|gold|copper|bronze/, /black|matte/, /metal|iron|aluminum|steel/]);
  if (finishHits) add(Math.min(14, finishHits * 4 + 2), "brass/black metal hardware fit");

  // Etsy placement / search-intent rooms.
  const placementHits = keywordHits(text, [/dining|kitchen island|kitchen/, /bedroom|bedside|nightstand/, /living room|study|hallway|entryway/, /hotel|restaurant|gallery|cafe|bar/]);
  if (placementHits) add(Math.min(12, placementHits * 3 + 2), "Etsy placement/search fit");

  // Listing quality proxy: more usable photos == stronger draft.
  if (urls.length >= 8) add(10, `${urls.length} usable images`);
  else if (urls.length >= 5) add(6, `${urls.length} usable images`);
  else add(2, `${urls.length} usable images`);

  // Price bands tuned to Etsy lighting conversion.
  if (price >= 35 && price <= 350) add(8, `Etsy-friendly price $${price}`);
  else if (price > 350 && price <= 700) add(3, `premium price $${price}`);

  if ((product.variants || []).length <= 12) add(3, "manageable variant count");
  if (/certification|watt|voltage|size|diameter|height|cm|mm|g9|e27|e26|led|dimmable/.test(text)) add(4, "has technical/spec cues");

  // Off-brand penalties.
  if (/crystal|baroque|european|rustic|farmhouse|rattan|bamboo|boho|pastoral|candle|kids|children|cartoon|animal|princess|flower|feather|tiffany|mediterranean/.test(text)) {
    add(-22, "penalty: off-brand styling");
  }

  // BRAND-PROFILE FIT — reward products whose attributes match the common
  // threads across the shop's current ACTIVE listings (live brand DNA).
  const attrs = detectAttributes({ title: product.title, description: product.description, extraText: text, materials: [product.material] });
  let brandFit = 0;
  let brandReasons = [];
  if (brandProfile) {
    const fit = scoreAgainstProfile(attrs, brandProfile, 24);
    brandFit = fit.points;
    brandReasons = fit.reasons;
    if (brandFit > 0) add(brandFit, `brand-profile fit +${brandFit}`);
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    kind,
    price,
    score: Number(score.toFixed(1)),
    brandFit,
    brandReasons,
    detectedAttributes: { fixture: attrs.fixture, materials: attrs.materials, styles: attrs.styles, rooms: attrs.rooms },
    imageCount: urls.length,
    variantCount: (product.variants || []).length,
    categories: (product.categories || []).map((category) => category.name).filter(Boolean),
    thumbnail: urls[0] || null,
    imageUrls: urls.slice(0, 10),
    reasons,
  };
}

function writeReports(candidates, products, excludedIds, args, mix, brandProfile) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const stamp = Date.now();
  const jsonPath = path.join(REPORT_DIR, `alvatta-brand-candidates-${stamp}.json`);
  const mdPath = path.join(REPORT_DIR, `alvatta-brand-candidates-${stamp}.md`);
  const payload = {
    generatedAt,
    aesthetic: {
      heroCues: ["opal / white glass globes", "smoked-grey tinted glass", "sculptural minimalist silhouettes"],
      hardware: ["warm brass / gold", "matte black", "slim metal"],
      styling: ["neutral + muted accents", "Scandinavian / Nordic editorial"],
      modeledOnWinners: [
        "Modern Glass Globe Table Lamp for Bedroom & Study",
        "Modern Branch Chandelier (sculptural dining/island)",
        "Modern Glass Pendant Light (minimalist single-drop)",
        "Nordic Glass Globe Wall Lamp (minimalist sconce)",
      ],
      exclude: ["fans", "outdoor/solar", "crystal/baroque", "rustic/rattan", "novelty/kids/floral"],
    },
    brandProfile: brandProfile || null,
    totalProductsScanned: products.length,
    excludedPreviouslyDrafted: excludedIds.size,
    typeFilter: args.type,
    minScore: args.minScore,
    typeMix: mix,
    selectedCount: candidates.length,
    candidates,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  const brandLines = brandProfile
    ? [
        "## Live Brand Style Profile (from active listings)",
        "",
        `Derived from ${brandProfile.sampleSize} active Etsy listings.`,
        `- Dominant fixtures: ${brandProfile.dominant.fixtures.join(", ") || "n/a"}`,
        `- Dominant materials: ${brandProfile.dominant.materials.join(", ") || "n/a"}`,
        `- Dominant styles: ${brandProfile.dominant.styles.join(", ") || "n/a"}`,
        `- Dominant rooms: ${brandProfile.dominant.rooms.join(", ") || "n/a"}`,
        `- Signature tags: ${brandProfile.signatureTags.slice(0, 10).map((entry) => entry.tag).join(", ") || "n/a"}`,
        "",
      ]
    : [];

  const lines = [
    "# ALVATTA Brand Candidates (Unified)",
    "",
    `Generated: ${generatedAt}`,
    `Scanned: ${products.length} products`,
    `Excluded previously drafted: ${excludedIds.size}`,
    `Type filter: ${args.type} | Minimum score: ${args.minScore}`,
    `Type mix: ${Object.entries(mix).map(([key, value]) => `${key} ${value}`).join(", ") || "n/a"}`,
    "",
    "## Aesthetic Brief",
    "",
    "- Hero cues: opal/white glass globes, smoked-grey tinted glass, sculptural minimalist silhouettes",
    "- Hardware: warm brass/gold, matte black, slim metal",
    "- Styling: neutral + muted accents, Scandinavian/Nordic editorial",
    "- Modeled on current winners: glass globe table lamp, branch chandelier, single-drop glass pendant, glass globe wall sconce",
    "- Avoid: fans, outdoor/solar, crystal/baroque, rustic/rattan, novelty/kids/floral",
    "",
    ...brandLines,
    "## Top Candidates",
    "",
    "| Rank | Score | Brand Fit | Product | Type | Price | Images | Variants | Why | Product ID |",
    "| ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- | --- |",
  ];

  candidates.forEach((candidate, index) => {
    lines.push(`| ${index + 1} | ${candidate.score} | ${candidate.brandFit ?? 0} | ${escapeCell(candidate.title)} | ${candidate.kind} | ${candidate.price == null ? "" : `$${candidate.price.toFixed(2)}`} | ${candidate.imageCount} | ${candidate.variantCount} | ${escapeCell(candidate.reasons.slice(0, 4).join("; "))} | ${candidate.id} |`);
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

  // Derive the live brand style profile from active Etsy listings so the
  // database scan prefers products matching the established brand DNA.
  let brandProfile = null;
  if (args.useActiveProfile) {
    try {
      const activeListings = await fetchActiveListings();
      brandProfile = deriveBrandProfile(activeListings);
      console.error(`Brand profile derived from ${brandProfile.sampleSize} active listings: materials [${brandProfile.dominant.materials.join(", ")}], styles [${brandProfile.dominant.styles.join(", ")}].`);
    } catch (error) {
      console.error(`Warning: could not derive active-listing brand profile (${error.message}). Continuing without it.`);
    }
  }

  const jwt = await medusaLogin();
  const products = await listProducts(jwt);
  const candidates = products
    .filter((product) => !excludedIds.has(product.id))
    .map((product) => scoreProduct(product, args, brandProfile))
    .filter(Boolean)
    .filter((candidate) => candidate.score >= args.minScore)
    .sort((left, right) => right.score - left.score || (right.brandFit - left.brandFit) || (right.imageCount - left.imageCount) || left.price - right.price)
    .slice(0, args.limit);

  const mix = candidates.reduce((acc, candidate) => {
    acc[candidate.kind] = (acc[candidate.kind] || 0) + 1;
    return acc;
  }, {});

  const reports = writeReports(candidates, products, excludedIds, args, mix, brandProfile);
  console.log(JSON.stringify({
    scanned: products.length,
    excludedPreviouslyDrafted: excludedIds.size,
    typeFilter: args.type,
    brandProfile: brandProfile ? { sampleSize: brandProfile.sampleSize, dominant: brandProfile.dominant } : null,
    selected: candidates.length,
    typeMix: mix,
    markdown: path.relative(REPO_ROOT, reports.mdPath),
    json: path.relative(REPO_ROOT, reports.jsonPath),
    top: candidates.slice(0, 25).map((candidate) => ({ score: candidate.score, brandFit: candidate.brandFit, kind: candidate.kind, title: candidate.title, price: candidate.price, id: candidate.id })),
  }, null, 2));
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
