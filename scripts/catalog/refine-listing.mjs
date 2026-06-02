#!/usr/bin/env node
/**
 * Interactive Product Listing Refiner — "polish pass" walk-through.
 *
 * Companion to scripts/catalog/onboard-cj-product.mjs (which gets a CJ SKU
 * published) and the runbook at
 * .docs/products/product-listing-refinement-playbook.md.
 *
 * This script walks ONE published product at a time and brings it up to the
 * "polished" standard set by the six reference listings, by writing the
 * presentation layer that's missing across the catalogue:
 *
 *   • product.title              (confirm / tidy)
 *   • product.description        (2-paragraph human voice — locked decision)
 *   • metadata.packageSize       (string, e.g. "410 × 410 × 300 mm")
 *   • metadata.comparisonTable   (single-column spec sheet by default)
 *   • variant.metadata.image     (per-variant hero image for color/finish axes)
 *   • metadata.refinedAt / refinedBy   (the "done" marker)
 *
 * It REPORTS ON (but does not auto-restructure — that's delegated to
 * expand-cj-variants.mjs / normalize-elv-skus.mjs to stay safe):
 *
 *   • option naming (no "Default" / "Option N")
 *   • Medusa variant matrix vs. CJ truth
 *   • pricing sanity & baked-in shipping
 *   • category assignment
 *   • thumbnail integrity (no JSON-stringified array)
 *
 * SOURCE OF TRUTH: CJ /product/query. The script is resilient if CJ is
 * unavailable — it falls back to existing Medusa metadata (extractedSpecs,
 * dimensions, options) so you can still build a spec sheet offline.
 *
 * USAGE
 * ─────
 *   # Pick the next un-refined published product:
 *   node scripts/catalog/refine-listing.mjs --next
 *
 *   # Target a specific product:
 *   node scripts/catalog/refine-listing.mjs --product-id prod_01KJK5...
 *   node scripts/catalog/refine-listing.mjs --cj-sku CJJT1494811
 *
 *   # Preview only — build the plan + write it, but never write to Medusa:
 *   node scripts/catalog/refine-listing.mjs --product-id prod_... --dry-run
 *
 *   # Non-interactive: auto-accept every proposal (for later batch runs):
 *   node scripts/catalog/refine-listing.mjs --product-id prod_... --yes
 *
 * FLAGS
 *   --product-id ID    Target a Medusa product by id.
 *   --cj-sku SKU       Target by CJ SKU (resolved via product metadata).
 *   --next             Auto-select the next published product with no
 *                      metadata.refinedAt and no comparisonTable.
 *   --dry-run          Build + write the plan file, but apply NOTHING.
 *   --yes              Accept all proposals without prompting (still respects
 *                      --dry-run). Implies non-interactive.
 *   --refined-by NAME  Stamp metadata.refinedBy (default: $USER).
 *   --no-cj            Skip CJ entirely; use Medusa data only.
 *
 * ENV (auto-loaded from admin/.env, .env.local, storefront/.env.local,
 *      .agents/product-listing-analyst/.env)
 *   MEDUSA_BACKEND_URL, MEDUSA_ADMIN_EMAIL, MEDUSA_ADMIN_PASSWORD, CJ_API_KEY
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// =============================================================================
// ENV
// =============================================================================
const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const CJ_TOKEN_CACHE = path.join(REPO_ROOT, "scripts", ".cj-token-cache.json");

function loadEnv() {
  const paths = [
    path.join(REPO_ROOT, "admin", ".env"),
    path.join(REPO_ROOT, "admin", ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, "storefront", ".env.local"),
    path.join(REPO_ROOT, ".agents", "product-listing-analyst", ".env"),
  ];
  for (const p of paths) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim();
    }
  }
}
loadEnv();

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ||
  "https://medusa-backend-production-d681.up.railway.app";
const CJ_BASE = "https://developers.cjdropshipping.com";

// =============================================================================
// CLI
// =============================================================================
function parseArgs(argv) {
  const a = {
    productId: null,
    cjSku: null,
    next: false,
    dryRun: false,
    yes: false,
    noCj: false,
    flatPrice: true,
    config: null,
    refinedBy: process.env.USER || "operator",
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--product-id") { a.productId = argv[++i]; continue; }
    if (arg === "--cj-sku") { a.cjSku = argv[++i]; continue; }
    if (arg === "--next") { a.next = true; continue; }
    if (arg === "--dry-run") { a.dryRun = true; continue; }
    if (arg === "--yes" || arg === "-y") { a.yes = true; continue; }
    if (arg === "--no-cj") { a.noCj = true; continue; }
    if (arg === "--no-flat-price") { a.flatPrice = false; continue; }
    if (arg === "--config") { a.config = argv[++i]; continue; }
    if (arg === "--refined-by") { a.refinedBy = argv[++i]; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!a.productId && !a.cjSku && !a.next) {
    printUsage();
    throw new Error("Provide one of --product-id, --cj-sku, or --next.");
  }
  return a;
}
function printUsage() {
  console.log(
    "Usage: node scripts/catalog/refine-listing.mjs (--product-id ID | --cj-sku SKU | --next) [options]\n" +
    "  --dry-run        Build + save plan, write nothing to Medusa\n" +
    "  --yes            Accept all proposals (non-interactive)\n" +
    "  --no-cj          Use Medusa data only (skip CJ)\n" +
    "  --no-flat-price  Disable flat per-spec pricing across cosmetic (color/finish) axes\n" +
    "  --config FILE    JSON: {optionTitles:[], optionValues:[[]], skus?:{cjSku:elvSku}, prices?:{key:cents}} to apply non-interactively\n" +
    "  --refined-by N   Stamp metadata.refinedBy (default $USER)",
  );
}

// =============================================================================
// TTY HELPERS (prompts + $EDITOR)
// =============================================================================
const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

let rl = null;
function getRl() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}
function ask(question) {
  return new Promise((resolve) => getRl().question(question, (ans) => resolve(ans)));
}
function closeRl() { if (rl) { rl.close(); rl = null; } }

/**
 * Show a proposed section and let the operator accept / edit / skip / keep.
 * Returns the chosen value, or null to skip writing this section.
 *   - accept → proposed
 *   - edit   → opens $EDITOR seeded with `proposed` (or its JSON), returns parsed result
 *   - keep   → current (no change written)
 *   - skip   → null
 */
async function review({ label, current, proposed, json = false, yes = false, recommend = "accept", note = null }) {
  const show = (v) => (v == null ? C.dim("(none)") : json ? JSON.stringify(v, null, 2) : String(v));
  console.log(`\n${C.bold("── " + label + " ──")}`);
  console.log(`${C.dim("current:")}\n${show(current)}`);
  console.log(`${C.cyan("proposed:")}\n${show(proposed)}`);
  if (note) console.log(C.yellow(`note: ${note}`));

  if (proposed == null) {
    console.log(C.dim("(no proposal — nothing to write)"));
    return null;
  }
  const keepDefault = recommend === "keep";
  if (yes) {
    if (keepDefault) { console.log(C.green("auto-kept current (--yes; current looks good)")); return null; }
    console.log(C.green("auto-accepted (--yes)"));
    return proposed;
  }

  for (;;) {
    const prompt = keepDefault
      ? `${C.yellow("[a]ccept / [e]dit / [K]eep current / [s]kip? ")}`
      : `${C.yellow("[A]ccept / [e]dit / [k]eep current / [s]kip? ")}`;
    const ans = (await ask(prompt)).trim().toLowerCase();
    if (ans === "") return keepDefault ? null : proposed; // Enter follows the recommendation
    if (ans === "a") return proposed;
    if (ans === "k") return null; // keep current = no write
    if (ans === "s") return null;
    if (ans === "e") {
      const edited = editInEditor(proposed, json);
      if (edited === undefined) { console.log(C.red("edit aborted — try again")); continue; }
      console.log(`${C.cyan("edited:")}\n${show(edited)}`);
      const ok = (await ask(`${C.yellow("use this edited value? [Y/n] ")}`)).trim().toLowerCase();
      if (ok === "" || ok === "y") return edited;
      continue;
    }
    console.log(C.red("Please answer a / e / k / s."));
  }
}

function editInEditor(value, json) {
  const editor = process.env.EDITOR || process.env.VISUAL || "nano";
  const ext = json ? ".json" : ".txt";
  const tmp = path.join(os.tmpdir(), `refine-${Date.now()}${ext}`);
  const seed = json ? JSON.stringify(value, null, 2) : String(value);
  fs.writeFileSync(tmp, seed, "utf-8");
  const r = spawnSync(editor, [tmp], { stdio: "inherit" });
  if (r.status !== 0 && r.error) {
    console.log(C.red(`editor (${editor}) failed: ${r.error.message}`));
    try { fs.unlinkSync(tmp); } catch {}
    return undefined;
  }
  const raw = fs.readFileSync(tmp, "utf-8");
  try { fs.unlinkSync(tmp); } catch {}
  if (json) {
    try { return JSON.parse(raw); }
    catch (e) { console.log(C.red(`invalid JSON: ${e.message}`)); return undefined; }
  }
  return raw.replace(/\s+$/, "");
}

// =============================================================================
// MEDUSA ADMIN API
// =============================================================================
async function medusaLogin() {
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
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
    throw new Error(`${init.method || "GET"} ${endpoint} → ${res.status}: ${detail.slice(0, 500)}`);
  }
  return body;
}

const PRODUCT_FIELDS =
  "id,title,handle,status,description,thumbnail,material,weight,length,width,height," +
  "type.value,*images,*options,*options.values,*categories," +
  "*variants,*variants.options,*variants.prices,*variants.metadata,metadata";

async function getProduct(jwt, id) {
  const { product } = await medusa(jwt, `/admin/products/${id}?fields=${PRODUCT_FIELDS}`);
  return product;
}

async function findProductByCjSku(jwt, cjSku) {
  // NOTE: Medusa silently ignores unknown `metadata[...]` filter keys (it
  // returns the first product instead of an empty set), so we must NOT trust a
  // metadata-filtered query. Scan and match explicitly on real fields.
  let offset = 0;
  for (;;) {
    const { products, count } = await medusa(
      jwt,
      `/admin/products?limit=100&offset=${offset}&fields=id,metadata,*variants,variants.sku,variants.metadata`,
    );
    if (!products?.length) break;
    for (const p of products) {
      const md = p.metadata || {};
      if (md.cjSku === cjSku || md.external_id === cjSku) return getProduct(jwt, p.id);
      for (const v of p.variants || []) {
        const vm = v.metadata || {};
        if (v.sku === cjSku || vm.cj_sku === cjSku || vm.cj_variant_sku === cjSku) {
          return getProduct(jwt, p.id);
        }
      }
    }
    offset += 100;
    if (offset >= count) break;
  }
  return null;
}

async function findNextUnrefined(jwt) {
  let offset = 0;
  for (;;) {
    const { products, count } = await medusa(
      jwt,
      `/admin/products?status[]=published&limit=100&offset=${offset}&fields=id,title,metadata`,
    );
    if (!products?.length) break;
    for (const p of products) {
      const md = p.metadata || {};
      const hasTable = md.comparisonTable?.rows?.length;
      if (!md.refinedAt && !hasTable) return getProduct(jwt, p.id);
    }
    offset += 100;
    if (offset >= count) break;
  }
  return null;
}

// =============================================================================
// CJ OPEN API (read-only; source of truth)
// =============================================================================
let cjToken = null;
function loadCachedCjToken() {
  try {
    if (!fs.existsSync(CJ_TOKEN_CACHE)) return null;
    const c = JSON.parse(fs.readFileSync(CJ_TOKEN_CACHE, "utf-8"));
    if (Date.now() - c.ts < 23 * 60 * 60 * 1000) return c.token;
  } catch {}
  return null;
}
function saveCjToken(token) {
  try { fs.writeFileSync(CJ_TOKEN_CACHE, JSON.stringify({ token, ts: Date.now() })); } catch {}
}
async function ensureCjToken() {
  if (cjToken) return cjToken;
  const cached = loadCachedCjToken();
  if (cached) { cjToken = cached; return cached; }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY not set");
  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed (code ${data.code}): ${data.message || "no token"}`);
  }
  cjToken = data.data.accessToken;
  saveCjToken(cjToken);
  return cjToken;
}
async function cjGet(endpoint, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const token = await ensureCjToken();
    const res = await fetch(`${CJ_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json();
    if (data.code === 1600001 || data.code === 1600002) { cjToken = null; continue; }
    if (data.code === 1600200) { await new Promise((r) => setTimeout(r, 400 * attempt)); continue; }
    return data;
  }
  throw new Error(`CJ GET ${endpoint} failed after ${retries} attempts`);
}
async function tryProductQuery(sku) {
  const data = await cjGet(`/api2.0/v1/product/query?productSku=${encodeURIComponent(sku)}&features=enable_inventory`);
  return data.result && data.data ? data.data : null;
}
async function fetchCjBySku(sku) {
  const direct = await tryProductQuery(sku);
  if (direct) return { detail: direct, parentSku: sku };
  for (let drop = 1; drop <= 8; drop++) {
    const candidate = sku.slice(0, sku.length - drop);
    if (candidate.length < 6) break;
    await new Promise((r) => setTimeout(r, 300));
    const hit = await tryProductQuery(candidate);
    if (hit) return { detail: hit, parentSku: candidate };
  }
  return null;
}
function pickFirstImage(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  const s = String(value).trim();
  if (s.startsWith("[")) {
    try { const arr = JSON.parse(s); if (Array.isArray(arr) && arr.length) return String(arr[0]); } catch {}
  }
  return s;
}

// =============================================================================
// PROPOSAL BUILDERS
// =============================================================================

/** All option values for an option whose title matches one of `names` (case-insensitive). */
function optionValues(product, names) {
  const lc = names.map((n) => n.toLowerCase());
  const opt = (product.options || []).find((o) => lc.includes((o.title || "").toLowerCase()));
  if (!opt) return [];
  return Array.from(new Set((opt.values || []).map((v) => v.value?.trim()).filter(Boolean)));
}

/**
 * Some products have a corrupted `material` field carrying a raw CJ description
 * blob (e.g. "specification: diameter 85×height 75 MM Packing list： ...").
 * Reject anything that doesn't look like a clean material name.
 */
function cleanMaterial(...candidates) {
  for (const c of candidates) {
    const s = String(c || "").replace(/\s+/g, " ").trim();
    if (!s) continue;
    const lc = s.toLowerCase();
    if (s.length > 40) continue;
    if (lc.includes("packing list") || lc.includes("specification")) continue;
    if (s.includes(":") || s.includes("：")) continue;
    if (/\d{2,}/.test(s) || /\bmm\b/i.test(s) || /[×x]\s*\d/.test(s)) continue;
    return s;
  }
  return null;
}

/**
 * Parse a human dimensions string into a normalised "... mm" form.
 * Handles "diameter 85×height 75 MM" and "400 × 200 × 150 mm" shapes.
 */
function parseDimsText(...candidates) {
  for (const c of candidates) {
    const s = String(c || "");
    const dia = s.match(/diameter\s*([\d.]+)[^\d.]*height\s*([\d.]+)\s*mm/i);
    if (dia) return `Ø${dia[1]} × H${dia[2]} mm`;
    const three = s.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*[×x]\s*([\d.]+)\s*mm/i);
    if (three) return `${three[1]} × ${three[2]} × ${three[3]} mm`;
    const two = s.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*mm/i);
    if (two) return `${two[1]} × ${two[2]} mm`;
  }
  return null;
}

/** Best available dimensions string for a product (clean dims → parsed blobs). */
function productDimensions(product) {
  if (product.length && product.width && product.height) {
    return `${product.length} × ${product.width} × ${product.height} mm`;
  }
  const md = product.metadata || {};
  const specs = md.extractedSpecs || {};
  return parseDimsText(specs.Dimensions, specs.Size, specs.Material, product.material, product.description);
}

/**
 * Build a single-column "Specification" sheet from existing Medusa data
 * (extractedSpecs + dimensions + options), enriched by CJ when available.
 * Locked decision: single-column by default.
 */
function buildSpecSheet(product, cj) {
  const md = product.metadata || {};
  const specs = md.extractedSpecs || {};
  const rows = [];
  const push = (label, value) => {
    if (value == null) return;
    const s = String(value).trim();
    if (!s) return;
    if (rows.some((r) => r.label.toLowerCase() === label.toLowerCase())) return;
    rows.push({ label, values: [s] });
  };

  const voltageOpts = optionValues(product, ["Voltage"]);

  push("Material", cleanMaterial(product.material, specs.Material, cj?.material));
  push("Style", specs.Style);
  push("Light Source", specs["Light Source"] || (md.classification?.isLED ? "Integrated LED" : null));

  // Naming-agnostic option axes: surface EVERY meaningful option as its own row
  // (skips generic "Default"/"Option N" placeholders). This keeps the spec
  // sheet accurate regardless of how axes were named during expansion.
  const knownLabel = (title) => {
    const t = title.toLowerCase();
    if (t === "color" || t === "finish") return "Color Options";
    if (t === "size") return "Size Options";
    if (t === "number of lights" || t === "lights") return "Configuration";
    return title;
  };
  for (const opt of product.options || []) {
    const title = (opt.title || "").trim();
    if (!title || /^(default|option \d+)$/i.test(title)) continue;
    const vals = Array.from(new Set((opt.values || []).map((v) => v.value?.trim()).filter(Boolean)));
    if (vals.length) push(knownLabel(title), vals.join(", "));
  }

  // Dimensions — clean product dims, else parsed from spec/description blobs
  push("Dimensions", productDimensions(product));
  push("Voltage", voltageOpts.join(", ") || specs.Voltage);
  push("Dimmable", specs.Dimmable);
  push("Cord Length", specs["Cord Length"]);
  if (product.weight) push("Weight", `${product.weight} g`);
  push("Installation", "Easy DIY with included hardware");

  if (!rows.length) return null;
  return { headers: ["Specification"], rows, shared: [] };
}

/** Propose package size string from product dimensions (mm). */
function buildPackageSize(product) {
  return productDimensions(product);
}

/**
 * Propose a 2-paragraph description scaffold (locked decision: 2 paragraphs).
 * This is a SEED the operator is expected to edit — it never overwrites good
 * copy silently because every section is reviewed.
 */
function buildDescription(product) {
  const md = product.metadata || {};
  const specs = md.extractedSpecs || {};
  const material = cleanMaterial(product.material, specs.Material) || "premium materials";
  const colorOpts = optionValues(product, ["Color", "Finish"]);
  const lightOpts = optionValues(product, ["Light Color", "Color Temperature"]);
  const sizeOpts = optionValues(product, ["Size"]);

  const choices = [];
  if (colorOpts.length > 1) choices.push(`${colorOpts.join(" or ")} finishes`);
  if (lightOpts.length > 1) choices.push(`${lightOpts.join(" or ")} light`);
  if (sizeOpts.length > 1) choices.push(`${sizeOpts.join(" / ")} sizes`);

  const p1 =
    `${product.title} brings a considered, modern silhouette to your space. ` +
    `Crafted from ${material}, it delivers clean ambient light without overpowering the room.`;
  const p2 = choices.length
    ? `Choose between ${choices.join(", and ")} to suit your space. ` +
      `Easy to install with the included hardware, it's a natural fit for living rooms, bedrooms, dining areas, and hallways.`
    : `Easy to install with the included hardware, it's a natural fit for living rooms, ` +
      `bedrooms, dining areas, and hallways.`;

  return `${p1}\n\n${p2}`;
}

/**
 * Match CJ variant images to Medusa variants and propose per-variant
 * metadata.image / color_image. Returns an array of
 * { variantId, sku, title, image } proposals (only where a match is found).
 */
function buildVariantImages(product, cj) {
  const cjVariants = cj?.variants || [];
  if (!cjVariants.length) return [];
  // Map CJ variant SKU → image, and color token → image.
  const bySku = new Map();
  const byColor = new Map();
  for (const cv of cjVariants) {
    const img = pickFirstImage(cv.variantImage);
    if (!img) continue;
    if (cv.variantSku) bySku.set(String(cv.variantSku), img);
    const key = String(cv.variantKey || cv.variantNameEn || "").toLowerCase();
    for (const tok of key.split(/[\s/,|-]+/).filter(Boolean)) {
      if (!byColor.has(tok)) byColor.set(tok, img);
    }
  }

  const out = [];
  for (const v of product.variants || []) {
    const vm = v.metadata || {};
    if (vm.image) continue; // already has a per-variant image
    let img = null;
    const cjSku = vm.cj_sku || vm.cj_variant_sku;
    if (cjSku && bySku.has(String(cjSku))) img = bySku.get(String(cjSku));
    if (!img) {
      // match by option value token (color/finish)
      const vals = (v.options || []).map((o) => String(o.value || "").toLowerCase());
      for (const val of vals) {
        for (const tok of val.split(/\s+/).filter(Boolean)) {
          if (byColor.has(tok)) { img = byColor.get(tok); break; }
        }
        if (img) break;
      }
    }
    if (img) out.push({ variantId: v.id, sku: v.sku, title: v.title, image: img });
  }
  return out;
}

// =============================================================================
// VARIANT EXPANSION ENGINE (ported from expand-cj-variants.mjs)
//
// A partially-onboarded product often has a single "Default" variant while CJ
// exposes the full matrix. Expansion is part of polishing — not a precondition
// — so the refiner builds the matrix, then the presentation layer on top of it.
// =============================================================================
function normalizeValue(s) {
  const trimmed = (s ?? "").toString().replace(/\s+/g, " ").trim();
  if (!trimmed) return "Default";
  return trimmed.split(" ").map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

/**
 * Normalize a CJ variant SKU → Elvato SKU (matches normalize-elv-skus.mjs,
 * generalized to any CJ prefix): CJ<2 letters><digits><trailing letters> → ELV<digits>.
 * e.g. CJSN105178201AZ → ELV105178201, CJJT138616904DW → ELV138616904.
 * Returns null when the SKU doesn't match (caller falls back to the CJ SKU).
 */
function toElvSku(cjSku) {
  const m = /^CJ[A-Z]{2}(\d+)[A-Z]*$/i.exec(String(cjSku || ""));
  return m ? `ELV${m[1]}` : null;
}

// Words that signal a cosmetic (finish/color) option axis — purely visual, so
// it should not drive price differences across an otherwise-identical spec.
const COLOR_WORDS = new Set([
  "black", "white", "gold", "golden", "brass", "chrome", "silver", "nickel",
  "bronze", "copper", "grey", "gray", "beige", "cream", "ivory", "green",
  "blue", "red", "pink", "purple", "yellow", "orange", "brown", "wood",
  "walnut", "oak", "rose", "champagne", "gunmetal", "matte", "matt", "glossy",
  "gloss", "clear", "smoke", "smoked", "amber", "sand", "titanium", "graphite",
  "pewter", "antique", "transparent", "wenge", "natural", "rust",
]);

/**
 * Heuristic: is this option axis cosmetic (color/finish) rather than a
 * spec/size that legitimately affects price? An axis whose values carry digits
 * or spec/unit keywords (e.g. "7W", "3000K", "60cm", "Dimming") is a spec axis
 * and never cosmetic. Otherwise it's cosmetic when the title says so or at
 * least half of its values are recognisable colour/finish words.
 */
function isCosmeticAxis(title, values) {
  const vals = values || [];
  if (!vals.length) return false;
  const SPEC_RE = /\d|\b(w|watt|watts|mm|cm|m|kg|g|k|kelvin|v|volt|lumen|lm|inch|in|dimming|dimmable|light|lights|head|heads|tier|ring)\b/i;
  if (vals.some((v) => SPEC_RE.test(String(v)))) return false;
  if (/colou?r|finish|shade|frame|body|plating|tone/i.test(String(title || ""))) return true;
  let hits = 0;
  for (const v of vals) {
    const toks = String(v).toLowerCase().split(/\s+/);
    if (toks.some((t) => COLOR_WORDS.has(t))) hits++;
  }
  return hits >= Math.ceil(vals.length / 2);
}

function buildDimensions(parts, dimCount) {
  const titles = [];
  const values = [];
  for (let d = 0; d < dimCount; d++) {
    titles.push(`Option ${d + 1}`);
    const seen = new Set();
    const vals = [];
    for (const p of parts) {
      const v = normalizeValue(p[d]);
      if (!seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); vals.push(v); }
    }
    values.push(vals);
  }
  // assignmentIdx[i][d] = index into values[d] (index-stable so renaming a value
  // spelling in the review step propagates to every variant automatically).
  const assignmentIdx = parts.map((p) =>
    p.map((v, d) => {
      const canon = normalizeValue(v).toLowerCase();
      const idx = values[d].findIndex((vv) => vv.toLowerCase() === canon);
      return idx < 0 ? 0 : idx;
    }),
  );
  return { titles, values, assignmentIdx };
}

/**
 * Heuristic decomposition of CJ `variantKey` strings into an option matrix.
 * Improves on the original by also splitting on a bare hyphen (the most common
 * CJ pattern, e.g. "Black-7W warm light" → Color × Light Mode).
 */
function detectOptions(variants) {
  const keys = variants.map((v) => (v.variantKey || v.variantNameEn || "").trim());
  for (const delim of ["/", "|", ",", " - ", "-"]) {
    if (keys.every((k) => k.includes(delim))) {
      const parts = keys.map((k) => k.split(delim).map((s) => s.trim()).filter(Boolean));
      const dimCount = parts[0].length;
      if (dimCount >= 1 && parts.every((p) => p.length === dimCount)) {
        const dims = buildDimensions(parts, dimCount);
        // Reject degenerate splits (a dimension that's unique per variant isn't an axis).
        if (dimCount === 1 || dims.values.every((vv) => vv.length >= 1 && vv.length < variants.length)) {
          return dims;
        }
      }
    }
  }
  if (keys.every((k) => k.includes(" "))) {
    const firstTokens = keys.map((k) => k.split(/\s+/)[0]);
    const rest = keys.map((k) => k.split(/\s+/).slice(1).join(" ").trim());
    const uniqFirst = [...new Set(firstTokens)];
    const uniqRest = [...new Set(rest.map((s) => s.toLowerCase()))];
    if (uniqFirst.length >= 2 && uniqRest.length >= 2 && uniqFirst.length * uniqRest.length === variants.length) {
      const parts = keys.map((k) => { const toks = k.split(/\s+/); return [toks[0], toks.slice(1).join(" ")]; });
      return buildDimensions(parts, 2);
    }
  }
  return buildDimensions(keys.map((k) => [k || "Variant"]), 1);
}

/**
 * Build an expansion plan when Medusa has a single variant but CJ has more.
 * Returns null when no expansion is needed/possible.
 */
function buildExpansionPlan(product, cj, { flatPrice = true } = {}) {
  const cjVariants = cj?.variants || [];
  const medVariants = product.variants || [];
  if (!cjVariants.length || cjVariants.length <= medVariants.length || medVariants.length > 1) return null;

  const current = medVariants[0] || null;
  const currentUsd = (current?.prices || []).find((p) => p.currency_code === "usd");
  const matchedIdx = Math.max(0, cjVariants.findIndex((v) => v.variantSku === current?.sku));
  const baseCj = cjVariants[matchedIdx];
  const baseCost = Number(baseCj?.variantSellPrice) || 0;
  const basePriceCents = currentUsd?.amount ?? null;
  const ratio = basePriceCents && baseCost ? basePriceCents / 100 / baseCost : null;

  const { titles, values, assignmentIdx } = detectOptions(cjVariants);

  const variants = cjVariants.map((cv, i) => {
    const cost = Number(cv.variantSellPrice) || 0;
    const isReuse = i === matchedIdx && !!current;
    const priceCents = isReuse
      ? basePriceCents
      : ratio ? Math.round(cost * 100 * ratio) : (basePriceCents ?? Math.round(cost * 100 * 2));
    const cjSku = cv.variantSku;
    return {
      cjIndex: i,
      sku: toElvSku(cjSku) || cjSku, // ELV format; falls back to CJ SKU if unparseable
      cjSku,
      assignmentIdx: assignmentIdx[i],
      cjCostUsd: cost,
      priceCents,
      image: pickFirstImage(cv.variantImage),
      weight: cv.variantWeight ?? null,
      length: cv.variantLength ?? null,
      width: cv.variantWidth ?? null,
      height: cv.variantHeight ?? null,
      reuseId: isReuse ? current.id : null,
      reuseMeta: isReuse ? (current.metadata || {}) : null,
    };
  });

  // Flat pricing: a purely cosmetic axis (e.g. Color/Finish) should not change
  // the price. Group variants by their non-cosmetic option indices and align
  // every variant in a group to one price — the human-anchored base price when
  // the base/reuse variant is in the group, otherwise the group's max markup
  // price. Only NEW variants are adjusted; the reused variant keeps its price.
  if (flatPrice) {
    const cosmetic = titles.map((t, d) => isCosmeticAxis(t, values[d]));
    if (cosmetic.some(Boolean)) {
      const groups = new Map();
      for (const v of variants) {
        const key = v.assignmentIdx.filter((_, d) => !cosmetic[d]).join("|");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
      }
      for (const grp of groups.values()) {
        const baseInGroup = grp.find((v) => v.reuseId);
        const target = baseInGroup
          ? baseInGroup.priceCents
          : Math.max(...grp.map((v) => v.priceCents));
        for (const v of grp) if (!v.reuseId) v.priceCents = target;
      }
    }
  }

  return {
    reuseIdx: matchedIdx,
    pricing: { ratio, baseCost, baseSku: baseCj?.variantSku, basePriceCents },
    optionTitles: titles,
    optionValues: values,
    variants,
    // Shared (non-variant-specific) metadata from the base variant — e.g.
    // expedited shipping tiers, shippingBakedIn flags — must be inherited by
    // every NEW variant so per-variant features (shipping selector) work for
    // all of them, not just the original. Per-variant keys are excluded.
    sharedMeta: sharedVariantMeta(current?.metadata),
    existingOptions: product.options || [],
  };
}

// Metadata keys that are specific to a single variant and must NOT be inherited
// by sibling variants during expansion.
const VARIANT_SPECIFIC_META = new Set(["image", "color_image", "cj_sku", "cj_variant_sku"]);

/** Return base-variant metadata minus per-variant keys (safe to inherit). */
function sharedVariantMeta(meta) {
  const out = {};
  for (const [k, val] of Object.entries(meta || {})) {
    if (!VARIANT_SPECIFIC_META.has(k)) out[k] = val;
  }
  return out;
}

const expansionVariantOptions = (exp, v) => {
  const o = {};
  exp.optionTitles.forEach((t, d) => { o[t] = exp.optionValues[d][v.assignmentIdx[d]]; });
  return o;
};
const expansionVariantTitle = (exp, v) =>
  exp.optionTitles.map((t, d) => exp.optionValues[d][v.assignmentIdx[d]]).join(" / ");

/** In-memory view of the product AS IF expanded — feeds audit + proposals in dry-run. */
function expandedProductView(product, exp) {
  const options = exp.optionTitles.map((t, d) => ({
    id: exp.existingOptions[d]?.id ?? null,
    title: t,
    values: exp.optionValues[d].map((value) => ({ value })),
  }));
  const variants = exp.variants.map((v) => ({
    id: v.reuseId ?? `new:${v.sku}`,
    sku: v.sku,
    title: expansionVariantTitle(exp, v),
    options: exp.optionTitles.map((t, d) => ({ value: exp.optionValues[d][v.assignmentIdx[d]] })),
    prices: [{ amount: v.priceCents, currency_code: "usd" }],
    metadata: { ...(exp.sharedMeta || {}), ...(v.reuseMeta || {}), image: v.image, color_image: v.image, cj_sku: v.cjSku },
  }));
  return { ...product, options, variants };
}

/** Apply the expansion plan to Medusa: rename/create options, reuse/create variants. */
async function applyExpansion(jwt, productId, exp) {
  for (let d = 0; d < exp.optionTitles.length; d++) {
    const existing = exp.existingOptions[d];
    const body = JSON.stringify({ title: exp.optionTitles[d], values: exp.optionValues[d] });
    if (existing) {
      await medusa(jwt, `/admin/products/${productId}/options/${existing.id}`, { method: "POST", body });
      console.log(C.green(`  ✓ option "${exp.optionTitles[d]}" updated (${exp.optionValues[d].join(", ")})`));
    } else {
      await medusa(jwt, `/admin/products/${productId}/options`, { method: "POST", body });
      console.log(C.green(`  ✓ option "${exp.optionTitles[d]}" created (${exp.optionValues[d].join(", ")})`));
    }
  }
  for (const v of exp.variants) {
    const options = expansionVariantOptions(exp, v);
    const title = expansionVariantTitle(exp, v);
    const meta = { ...(exp.sharedMeta || {}), ...(v.reuseMeta || {}), image: v.image, color_image: v.image, cj_sku: v.cjSku };
    if (v.reuseId) {
      await medusa(jwt, `/admin/products/${productId}/variants/${v.reuseId}`, {
        method: "POST",
        body: JSON.stringify({ title, sku: v.sku, options, metadata: meta }),
      });
      console.log(C.green(`  ✓ variant reused → "${title}" sku=${v.sku} (price preserved)`));
    } else {
      const body = {
        title, sku: v.sku, manage_inventory: false, allow_backorder: true,
        ...(v.weight ? { weight: v.weight } : {}),
        ...(v.length ? { length: v.length } : {}),
        ...(v.width ? { width: v.width } : {}),
        ...(v.height ? { height: v.height } : {}),
        options,
        prices: [{ amount: v.priceCents, currency_code: "usd" }],
        metadata: meta,
      };
      await medusa(jwt, `/admin/products/${productId}/variants`, { method: "POST", body: JSON.stringify(body) });
      console.log(C.green(`  ✓ variant created → "${title}" sku=${v.sku} $${(v.priceCents / 100).toFixed(2)}`));
    }
  }
}

// =============================================================================
// AUDIT (report-only checklist)
// =============================================================================
function auditProduct(product, cj) {
  const md = product.metadata || {};
  const variants = product.variants || [];
  const optTitles = (product.options || []).map((o) => o.title);
  const checks = [];
  const add = (label, pass, detail) => checks.push({ label, pass, detail });

  add("Title 30–60 chars", (product.title || "").length >= 25 && (product.title || "").length <= 70, `${(product.title || "").length} chars`);
  add("Description clean (no <img>)", !!product.description && !product.description.includes("<img"), `${(product.description || "").length} chars`);
  add("Options named (no Default/Option N)", !optTitles.some((t) => /^(default|option \d)/i.test(t)), optTitles.join(", ") || "(none)");
  add("All variants have ELV SKU", variants.length > 0 && variants.every((v) => /^ELV/i.test(v.sku || "")), `${variants.filter((v) => /^ELV/i.test(v.sku || "")).length}/${variants.length}`);
  add("All variants priced", variants.every((v) => (v.prices || []).some((p) => p.amount > 0)), `${variants.filter((v) => (v.prices || []).some((p) => p.amount > 0)).length}/${variants.length}`);
  add("Shipping baked in", !!md.shippingBakedIn, String(!!md.shippingBakedIn));
  add("Thumbnail is single URL", !!product.thumbnail && !String(product.thumbnail).startsWith("["), product.thumbnail ? "ok" : "missing");
  add("≥3 gallery images", (product.images || []).length >= 3, `${(product.images || []).length}`);
  add("≥1 category", (product.categories || []).length >= 1, (product.categories || []).map((c) => c.name).join(", ") || "(none)");
  add("packageSize present", !!md.packageSize, md.packageSize || "(missing)");
  add("comparisonTable present", !!md.comparisonTable?.rows?.length, md.comparisonTable?.rows?.length ? `${md.comparisonTable.rows.length} rows` : "(missing)");
  // CJ matrix parity (report-only)
  if (cj?.variants) {
    add("Variant count vs CJ", variants.length === cj.variants.length, `Medusa ${variants.length} vs CJ ${cj.variants.length}`);
  }
  return checks;
}

function printAudit(checks) {
  console.log(`\n${C.bold("══ AUDIT ══")}`);
  for (const c of checks) {
    const mark = c.pass ? C.green("✓") : C.red("✗");
    console.log(`  ${mark} ${c.label} ${C.dim("— " + c.detail)}`);
  }
  const passed = checks.filter((c) => c.pass).length;
  console.log(C.bold(`  ${passed}/${checks.length} passed`));
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  const args = parseArgs(process.argv);
  const mode = args.dryRun ? "DRY-RUN" : "LIVE";
  console.log(`\n${C.bold("Elvato Listing Refiner")} — ${mode}\n`);

  let cfg = null;
  if (args.config) {
    cfg = JSON.parse(fs.readFileSync(args.config, "utf-8"));
    console.log(C.dim(`Loaded config: ${args.config}`));
  }

  const jwt = await medusaLogin();

  // 1. Resolve product
  let product;
  if (args.productId) product = await getProduct(jwt, args.productId);
  else if (args.cjSku) product = await findProductByCjSku(jwt, args.cjSku);
  else if (args.next) product = await findNextUnrefined(jwt);
  if (!product) throw new Error("No matching product found.");

  console.log(`${C.bold("Product:")} ${product.title}`);
  console.log(`${C.dim("id:")} ${product.id}  ${C.dim("handle:")} ${product.handle}  ${C.dim("status:")} ${product.status}`);
  console.log(`${C.dim("options:")} ${(product.options || []).map((o) => o.title).join(", ") || "(none)"}`);
  console.log(`${C.dim("variants:")} ${(product.variants || []).length}`);

  // 2. Resolve CJ (best-effort, source of truth)
  let cj = null;
  if (!args.noCj) {
    const md = product.metadata || {};
    const seedSku =
      md.cjSku ||
      product.variants?.map((v) => v.metadata?.cj_sku || v.metadata?.cj_variant_sku).find(Boolean) ||
      null;
    if (seedSku) {
      try {
        console.log(C.dim(`\nFetching CJ /product/query for ${seedSku}…`));
        const r = await fetchCjBySku(String(seedSku));
        if (r) { cj = r.detail; console.log(C.dim(`  CJ parent: ${r.parentSku} (${(cj.variants || []).length} variants)`)); }
        else console.log(C.yellow("  CJ: no match (continuing with Medusa data only)"));
      } catch (e) {
        console.log(C.yellow(`  CJ fetch failed: ${e.message} — continuing with Medusa data only`));
      }
    } else {
      console.log(C.yellow("\nNo CJ SKU on product/variants — continuing with Medusa data only."));
    }
  }

  // 3. Audit (current state)
  const checks = auditProduct(product, cj);
  printAudit(checks);

  // 3b. VARIANT EXPANSION — part of polishing, not a precondition.
  // If Medusa has a single "Default" variant but CJ exposes the full matrix,
  // build (and interactively confirm) the expansion before the polish layer.
  let expansion = args.noCj ? null : buildExpansionPlan(product, cj, { flatPrice: args.flatPrice });
  if (expansion) {
    console.log(`\n${C.bold("══ VARIANT EXPANSION ══")}`);
    console.log(`  Medusa has ${C.yellow(String(product.variants.length))} variant(s); CJ exposes ${C.cyan(String(cj.variants.length))}.`);
    console.log(`  Proposing ${expansion.variants.length} variants across ${expansion.optionTitles.length} option axis(es).`);
    if (expansion.pricing.ratio) {
      console.log(C.dim(`  Pricing: ${expansion.pricing.ratio.toFixed(3)}× markup off CJ cost (base CJ $${expansion.pricing.baseCost.toFixed(2)} → $${(expansion.pricing.basePriceCents / 100).toFixed(2)}).`));
    } else {
      console.log(C.yellow("  No USD base price found — new variant prices default to 2× CJ cost; review carefully."));
    }
    if (args.flatPrice) {
      console.log(C.dim("  Flat pricing: prices held constant across cosmetic (color/finish) axes (--no-flat-price to disable)."));
    }

    // (0) Optional non-interactive config: pre-apply axis names / tidied values /
    // sku + price overrides so a --yes run produces a polished result without
    // the $EDITOR step. Shape-checked the same way as the interactive edits.
    if (cfg) {
      if (Array.isArray(cfg.optionTitles) && cfg.optionTitles.length === expansion.optionTitles.length) {
        expansion.optionTitles = cfg.optionTitles.map((t) => String(t).trim());
      }
      if (Array.isArray(cfg.optionValues)
        && cfg.optionValues.length === expansion.optionValues.length
        && cfg.optionValues.every((vs, d) => Array.isArray(vs) && vs.length === expansion.optionValues[d].length)) {
        expansion.optionValues = cfg.optionValues.map((vs) => vs.map((v) => String(v).trim()));
      } else if (cfg.optionValues) {
        console.log(C.red("  --config optionValues shape invalid (counts/order must match auto-detected) — ignoring."));
      }
      for (const v of expansion.variants) {
        if (cfg.skus && cfg.skus[v.cjSku]) v.sku = String(cfg.skus[v.cjSku]).trim();
        const optKey = expansion.optionTitles.map((_, d) => expansion.optionValues[d][v.assignmentIdx[d]]).join(" / ");
        if (cfg.prices && Number.isFinite(cfg.prices[optKey])) v.priceCents = Math.round(cfg.prices[optKey]);
      }
      console.log(C.green(`  Applied --config: ${args.config}`));
    }

    // (1) Rename axes + tidy value spellings (index-stable: keep counts/order).
    const optProposed = expansion.optionTitles.map((t, d) => ({ title: t, values: expansion.optionValues[d] }));
    console.log(C.dim("  Edit option TITLES and value spellings only — do not add, remove, or reorder values."));
    const editedOpts = await review({
      label: "Variant options (rename axes & tidy values)",
      current: "(auto-detected from CJ variantKey)",
      proposed: optProposed, json: true, yes: args.yes,
    });
    if (editedOpts && Array.isArray(editedOpts)
      && editedOpts.length === expansion.optionTitles.length
      && editedOpts.every((o, d) => Array.isArray(o.values) && o.values.length === expansion.optionValues[d].length)) {
      expansion.optionTitles = editedOpts.map((o) => String(o.title).trim());
      expansion.optionValues = editedOpts.map((o) => o.values.map((v) => String(v).trim()));
    } else if (editedOpts) {
      console.log(C.red("  Edited options shape invalid (value counts/order must match) — keeping auto-detected."));
    }

    // (2) Final matrix review — adjust per-variant prices / SKUs if needed.
    const matrixProposed = expansion.variants.map((v) => ({
      sku: v.sku,
      cjSku: v.cjSku,
      options: expansionVariantOptions(expansion, v),
      priceCents: v.priceCents,
      reuse: !!v.reuseId,
    }));
    const editedMatrix = await review({
      label: `Variant matrix (${matrixProposed.length} variants — adjust price/sku)`,
      current: "(single variant today)",
      proposed: matrixProposed, json: true, yes: args.yes,
    });
    if (editedMatrix && Array.isArray(editedMatrix) && editedMatrix.length === expansion.variants.length) {
      editedMatrix.forEach((m, i) => {
        if (m && m.sku) expansion.variants[i].sku = String(m.sku).trim();
        if (m && Number.isFinite(m.priceCents)) expansion.variants[i].priceCents = Math.round(m.priceCents);
      });
    }
  }

  // Working view: the product as it will be AFTER expansion, so the polish
  // proposals + projected audit reflect the real matrix.
  const workProduct = expansion ? expandedProductView(product, expansion) : product;
  if (expansion) {
    console.log(`\n${C.dim("Projected audit after expansion:")}`);
    printAudit(auditProduct(workProduct, cj));
  }

  // 4. Build proposals (against the working/expanded view)
  const md = product.metadata || {};
  const proposals = {
    title: workProduct.title, // confirm/keep by default
    description: buildDescription(workProduct),
    packageSize: md.packageSize || buildPackageSize(workProduct),
    comparisonTable: buildSpecSheet(workProduct, cj),
    variantImages: buildVariantImages(workProduct, cj),
  };

  // 5. Walk through each section
  const plan = { productPatch: {}, variantPatches: [] };

  const newTitle = await review({ label: "Title", current: product.title, proposed: proposals.title, yes: args.yes });
  if (newTitle && newTitle !== product.title) plan.productPatch.title = newTitle;

  // The scaffold description is a generic fallback. When the current copy is
  // already clean (no <img>) and substantial, recommend keeping it so we don't
  // regress good, specific marketing copy into boilerplate.
  const curDesc = product.description || "";
  const descIsGood = curDesc.length >= 300 && !curDesc.includes("<img");
  const newDesc = await review({
    label: "Description (2 paragraphs)",
    current: product.description,
    proposed: proposals.description,
    yes: args.yes,
    recommend: descIsGood ? "keep" : "accept",
    note: descIsGood ? "current description is clean & substantial — keeping it is recommended (Enter = keep). Accept only to replace with the generic scaffold." : null,
  });
  if (newDesc) plan.productPatch.description = newDesc;

  const newPkg = await review({ label: "Package Size", current: md.packageSize, proposed: proposals.packageSize, yes: args.yes });
  if (newPkg) plan.productPatch._packageSize = newPkg;

  const newTable = await review({ label: "Comparison / Spec Table", current: md.comparisonTable, proposed: proposals.comparisonTable, json: true, yes: args.yes });
  if (newTable) plan.productPatch._comparisonTable = newTable;

  // Variant images (each reviewed as a batch)
  if (proposals.variantImages.length) {
    const imgSummary = proposals.variantImages.map((p) => ({ sku: p.sku, title: p.title, image: p.image }));
    const approvedImgs = await review({ label: `Per-variant images (${imgSummary.length})`, current: "(none set)", proposed: imgSummary, json: true, yes: args.yes });
    if (approvedImgs && Array.isArray(approvedImgs)) {
      for (const a of approvedImgs) {
        const v = workProduct.variants.find((vv) => vv.sku === a.sku);
        if (v && a.image && !String(v.id).startsWith("new:")) {
          plan.variantPatches.push({
            id: v.id,
            sku: v.sku,
            metadata: { ...(v.metadata || {}), image: a.image, color_image: a.image },
          });
        }
      }
    }
  } else {
    console.log(`\n${C.bold("── Per-variant images ──")}`);
    console.log(C.dim(expansion
      ? "Per-variant images are set as part of variant expansion above."
      : "No per-variant image matches found (or all variants already have one)."));
  }

  // Assemble product metadata patch (always preserve existing metadata)
  const metaPatch = { ...md };
  if (plan.productPatch._packageSize) metaPatch.packageSize = plan.productPatch._packageSize;
  if (plan.productPatch._comparisonTable) metaPatch.comparisonTable = plan.productPatch._comparisonTable;
  delete plan.productPatch._packageSize;
  delete plan.productPatch._comparisonTable;

  const willWriteMeta = metaPatch.packageSize !== md.packageSize || metaPatch.comparisonTable !== md.comparisonTable;

  // 6. Plan summary + save
  const reportDir = path.join(REPO_ROOT, "reports", "catalog", "refine");
  fs.mkdirSync(reportDir, { recursive: true });
  const planPath = path.join(reportDir, `refine-${product.id}-${args.dryRun ? "dry" : "live"}.json`);
  const planOut = {
    timestamp: new Date().toISOString(),
    mode,
    productId: product.id,
    title: product.title,
    audit: checks,
    expansion: expansion ? {
      optionTitles: expansion.optionTitles,
      optionValues: expansion.optionValues,
      variantCount: expansion.variants.length,
      reuseSku: expansion.variants[expansion.reuseIdx]?.sku,
      pricing: expansion.pricing,
      variants: expansion.variants.map((v) => ({
        sku: v.sku, options: expansionVariantOptions(expansion, v),
        priceCents: v.priceCents, reuse: !!v.reuseId, image: v.image,
      })),
    } : null,
    productPatch: plan.productPatch,
    metadataChanges: {
      packageSize: willWriteMeta ? metaPatch.packageSize : "(unchanged)",
      comparisonTableRows: metaPatch.comparisonTable?.rows?.length ?? 0,
    },
    variantPatches: plan.variantPatches.map((p) => ({ sku: p.sku, image: p.metadata.image })),
  };
  fs.writeFileSync(planPath, JSON.stringify(planOut, null, 2));
  console.log(`\n${C.dim("Plan saved:")} ${path.relative(REPO_ROOT, planPath)}`);

  const hasChanges =
    !!expansion ||
    Object.keys(plan.productPatch).length > 0 || willWriteMeta || plan.variantPatches.length > 0;
  if (!hasChanges) {
    console.log(C.yellow("\nNothing approved to write. Exiting."));
    closeRl();
    return;
  }

  console.log(`\n${C.bold("── CHANGES TO APPLY ──")}`);
  if (expansion) {
    console.log(`  • ${C.bold("expand variants")}: 1 → ${expansion.variants.length} across [${expansion.optionTitles.join(", ")}]`);
  }
  if (plan.productPatch.title) console.log(`  • title → "${plan.productPatch.title}"`);
  if (plan.productPatch.description) console.log(`  • description (${plan.productPatch.description.length} chars)`);
  if (willWriteMeta && metaPatch.packageSize !== md.packageSize) console.log(`  • metadata.packageSize → "${metaPatch.packageSize}"`);
  if (willWriteMeta && metaPatch.comparisonTable) console.log(`  • metadata.comparisonTable (${metaPatch.comparisonTable.rows.length} rows)`);
  for (const vp of plan.variantPatches) console.log(`  • variant ${vp.sku} → image ${vp.metadata.image}`);

  if (args.dryRun) {
    console.log(C.yellow("\nDRY-RUN: no writes performed. Re-run without --dry-run to apply."));
    closeRl();
    return;
  }

  // 7. Confirm + apply
  if (!args.yes) {
    const ok = (await ask(`\n${C.yellow("Apply these changes to Medusa? [y/N] ")}`)).trim().toLowerCase();
    if (ok !== "y") { console.log("Aborted — nothing written."); closeRl(); return; }
  }

  console.log(`\n${C.bold("── APPLYING ──")}`);

  // 7a. Variant expansion FIRST (so the polish layer lands on the real matrix).
  if (expansion) {
    console.log(C.dim("  Expanding variants…"));
    await applyExpansion(jwt, product.id, expansion);
    metaPatch.variantsExpandedAt = new Date().toISOString();
  }

  // 7b. Product patch (title/description/metadata + refined marker)
  const productBody = { ...plan.productPatch };
  metaPatch.refinedAt = new Date().toISOString();
  metaPatch.refinedBy = args.refinedBy;
  productBody.metadata = metaPatch;
  await medusa(jwt, `/admin/products/${product.id}`, { method: "POST", body: JSON.stringify(productBody) });
  console.log(C.green(`  ✓ product patched (title/description/metadata + refinedAt)`));

  // 7c. Per-variant image patches (only for the non-expansion path; expansion
  // already set images during create/update).
  for (const vp of plan.variantPatches) {
    await medusa(jwt, `/admin/products/${product.id}/variants/${vp.id}`, {
      method: "POST",
      body: JSON.stringify({ metadata: vp.metadata }),
    });
    console.log(C.green(`  ✓ variant ${vp.sku} image set`));
  }

  // 8. Verify
  const after = await getProduct(jwt, product.id);
  const am = after.metadata || {};
  console.log(`\n${C.bold("── VERIFY ──")}`);
  if (expansion) {
    const ok = (after.variants || []).length === expansion.variants.length;
    console.log(`  variants:        ${ok ? C.green(after.variants.length + " variants") : C.red(after.variants.length + " (expected " + expansion.variants.length + ")")}`);
    console.log(`  options:         ${(after.options || []).map((o) => o.title).join(", ")}`);
  }
  console.log(`  comparisonTable: ${am.comparisonTable?.rows?.length ? C.green(am.comparisonTable.rows.length + " rows") : C.red("missing")}`);
  console.log(`  packageSize:     ${am.packageSize ? C.green(am.packageSize) : C.red("missing")}`);
  console.log(`  refinedAt:       ${am.refinedAt ? C.green(am.refinedAt) : C.red("missing")}`);
  const imgSet = (after.variants || []).filter((v) => v.metadata?.image).length;
  console.log(`  variant images:  ${imgSet}/${(after.variants || []).length}`);

  // Save completion report
  const donePath = path.join(reportDir, `refine-${product.id}-applied.json`);
  fs.writeFileSync(donePath, JSON.stringify({
    timestamp: new Date().toISOString(),
    productId: product.id,
    title: after.title,
    refinedBy: args.refinedBy,
    variantsExpandedTo: expansion ? after.variants.length : undefined,
    comparisonTableRows: am.comparisonTable?.rows?.length ?? 0,
    packageSize: am.packageSize ?? null,
    variantImages: imgSet,
    audit: auditProduct(after, cj),
  }, null, 2));
  console.log(`\n${C.green("✅ Listing refined.")} Report: ${path.relative(REPO_ROOT, donePath)}`);
  console.log(C.dim("Allow ~5 min for storefront ISR cache to refresh."));

  closeRl();
}

main().catch((err) => {
  closeRl();
  console.error(`\n${C.red("❌ " + err.message)}`);
  process.exit(1);
});
