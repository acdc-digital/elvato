#!/usr/bin/env node
/**
 * Etsy Active listing SEO tag optimizer.
 *
 * Reviews every ACTIVE listing in the shop and rebuilds its tag set for search
 * (Etsy "Attributes > Tags"). Tags are derived from each listing's own title,
 * description, existing tags, and taxonomy, then expanded into high-intent
 * long-tail phrases that follow Etsy SEO best practices:
 *   - Use all 13 tag slots.
 *   - Prefer multi-word phrases buyers actually search.
 *   - Mix broad (fixture/style) with specific (material + room + use).
 *   - Keep every tag within Etsy's 20-character limit.
 *
 * Default mode is dry-run; pass --live to PATCH the listings on Etsy.
 *
 * Usage:
 *   node ../scripts/etsy/update-active-listing-tags.mjs                 # dry-run all active
 *   node ../scripts/etsy/update-active-listing-tags.mjs --live          # apply to all active
 *   node ../scripts/etsy/update-active-listing-tags.mjs --listing-ids 123,456
 *   node ../scripts/etsy/update-active-listing-tags.mjs --live --only-changed
 *
 * Requires (from marketplace/.env.local, set by `node ../scripts/etsy/oauth.mjs refresh`):
 *   ETSY_API_KEY, ETSY_CLIENT_SECRET (or ETSY_API_HEADER_KEY), ETSY_ACCESS_TOKEN, ETSY_SHOP_ID
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeoTags } from "./lib/seo-tags.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy", "tag-seo");
const ETSY_BASE = "https://api.etsy.com";

loadEnv();

function loadEnv() {
  for (const envPath of [
    path.join(MARKETPLACE_DIR, ".env.local"),
    path.join(MARKETPLACE_DIR, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".env"),
  ]) {
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

function parseArgs(argv) {
  const args = { live: false, listingIds: [], onlyChanged: false, limit: Infinity };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--live") { args.live = true; continue; }
    if (arg === "--only-changed") { args.onlyChanged = true; continue; }
    if (arg === "--listing-id") { args.listingIds.push(String(argv[++index])); continue; }
    if (arg === "--listing-ids") { args.listingIds.push(...argv[++index].split(",").map((value) => value.trim()).filter(Boolean)); continue; }
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node ../scripts/etsy/update-active-listing-tags.mjs            # dry-run, review all active listings
  node ../scripts/etsy/update-active-listing-tags.mjs --live     # apply optimized tags to all active listings
  node ../scripts/etsy/update-active-listing-tags.mjs --listing-ids 123,456

Options:
  --live           Apply tag changes to Etsy (default is dry-run preview).
  --only-changed   Skip listings whose optimized tags equal their current tags.
  --listing-ids    Comma-separated subset of active listing IDs to process.
  --limit N        Process at most N active listings.
`);
}

function etsyHeaders() {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY.");
  if (!process.env.ETSY_ACCESS_TOKEN) throw new Error("Set ETSY_ACCESS_TOKEN. Run node ../scripts/etsy/oauth.mjs refresh first.");
  const apiKey = process.env.ETSY_API_HEADER_KEY || `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET || ""}`;
  return { "x-api-key": apiKey, Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}` };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function etsyRequest(endpoint, init = {}) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(new URL(endpoint, ETSY_BASE), {
      ...init,
      headers: { ...etsyHeaders(), ...(init.headers || {}) },
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status !== 429) break;
    await delay(1500 * (attempt + 1));
  }
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${init.method || "GET"} ${endpoint} -> ${response.status}: ${detail.slice(0, 700)}`);
  }
  return body;
}

async function listActiveListings() {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  const listings = [];
  let offset = 0;
  while (true) {
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings?state=active&limit=100&offset=${offset}`);
    const results = data.results || [];
    listings.push(...results);
    if (results.length < 100) break;
    offset += results.length;
  }
  return listings;
}

/**
 * Build the optimized 13-tag set for an Etsy listing using the shared SEO tag
 * builder. Fixture detection is title-first; existing tags are used only to top
 * up empty slots and never to override the detected fixture.
 */
function buildListingTags(listing) {
  return buildSeoTags({
    title: listing.title,
    description: listing.description,
    materials: listing.materials || [],
    extraText: listing.taxonomy_path ? listing.taxonomy_path.join(" ") : "",
    existingTags: listing.tags || [],
  });
}

function tagsEqual(left, right) {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

function formBody(data) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (Array.isArray(value)) for (const item of value) form.append(key, String(item));
    else form.append(key, String(value));
  }
  return form;
}

async function patchTags(listingId, tags) {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  // Etsy's updateListing expects `tags` as a single comma-separated string.
  // Sending repeated `tags` keys makes Etsy keep only the last value.
  return etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings/${listingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody({ tags: tags.join(",") }),
  });
}

function writeReport(payload) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const filePath = path.join(REPORT_DIR, `active-tag-seo-${Date.now()}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

function selectListings(listings, args) {
  if (args.listingIds.length) {
    const byId = new Map(listings.map((listing) => [String(listing.listing_id), listing]));
    return args.listingIds.map((id) => {
      const listing = byId.get(String(id));
      if (!listing) throw new Error(`Active listing ID ${id} not found in shop.`);
      return listing;
    });
  }
  return listings.slice(0, args.limit);
}

async function main() {
  const args = parseArgs(process.argv);
  const active = await listActiveListings();
  console.log(`Active listings found: ${active.length}`);
  const selected = selectListings(active, args);

  const items = [];
  let changedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const listing of selected) {
    const before = (listing.tags || []).map((tag) => String(tag));
    const after = buildListingTags(listing);
    const changed = !tagsEqual(before, after);
    if (changed) changedCount += 1;

    const added = after.filter((tag) => !before.includes(tag));
    const removed = before.filter((tag) => !after.includes(tag));

    let result = "dry-run";
    if (!changed) {
      result = "unchanged";
    } else if (args.onlyChanged && !changed) {
      result = "skipped";
    } else if (args.live) {
      try {
        await patchTags(listing.listing_id, after);
        result = "updated";
        updatedCount += 1;
        await delay(400);
      } catch (error) {
        result = "error";
        errors.push({ listingId: String(listing.listing_id), error: error.message });
      }
    }
    if (!changed && args.onlyChanged) skippedCount += 1;

    items.push({
      listingId: String(listing.listing_id),
      title: listing.title,
      url: listing.url,
      changed,
      result,
      before,
      after,
      added,
      removed,
    });

    const flag = changed ? (args.live ? `→ ${result.toUpperCase()}` : "WOULD UPDATE") : "unchanged";
    console.log(`\n[${flag}] ${listing.title}`);
    console.log(`  before (${before.length}): ${before.join(", ") || "(none)"}`);
    console.log(`  after  (${after.length}): ${after.join(", ")}`);
    if (changed) {
      if (added.length) console.log(`  + ${added.join(", ")}`);
      if (removed.length) console.log(`  - ${removed.join(", ")}`);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: args.live ? "live" : "dry-run",
    shopId: process.env.ETSY_SHOP_ID,
    totals: {
      activeListings: active.length,
      processed: selected.length,
      changed: changedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors.length,
    },
    errors,
    items,
  };
  const report = writeReport(payload);

  console.log(`\n${args.live ? "LIVE" : "DRY-RUN"} complete.`);
  console.log(`Processed ${selected.length} | changed ${changedCount} | updated ${updatedCount} | errors ${errors.length}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, report)}`);
  if (!args.live && changedCount) console.log(`Re-run with --live to apply ${changedCount} tag update${changedCount === 1 ? "" : "s"}.`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
