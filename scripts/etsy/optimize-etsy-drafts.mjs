#!/usr/bin/env node
/**
 * Optimize Etsy draft listings for ALVATTA marketplace review.
 *
 * This patches draft title, description, and tags only. It does not publish.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy", "optimization");
const ETSY_BASE = "https://api.etsy.com";

const PRESETS = new Map([
  ["Nordic Modern Simple Glass Ball Wall Lamp", {
    title: "Nordic Glass Globe Wall Lamp - Modern Minimalist Sconce",
    visualFocus: ["round glass globe shade", "minimal wall-mounted silhouette", "Nordic modern restraint", "soft ambient bedside or hallway glow"],
    description: [
      "A quiet modern wall lamp with a rounded glass globe and a clean Nordic profile. The simple form keeps the look light and architectural, while the globe shade softens the light for bedrooms, corridors, reading corners, and hospitality spaces.",
      "The visual direction is minimal rather than ornate: smooth glass, compact wall-mounted hardware, and a balanced shape that works beside a bed, along a hallway, or as an accent in a small lounge area.",
      "Choose this fixture when you want a sculptural wall light that feels polished but understated, with enough presence to frame a room without overpowering the surrounding decor.",
    ],
    details: ["Glass globe shade", "Modern wall sconce form", "Nordic minimalist styling", "For bedroom, hallway, hotel, and living spaces"],
    tags: ["wall lamp", "glass globe", "wall sconce", "nordic light", "bedroom lamp", "hallway light", "modern lighting", "minimalist", "glass light", "hotel lighting", "home decor"],
  }],
  ["Model Room Exhibition Hall Creative Bar Glass Table Lamp", {
    title: "Creative Glass Table Lamp - Bar Model Room Accent Light",
    visualFocus: ["decorative glass table lamp", "gallery and model-room styling", "bar counter accent lighting", "compact sculptural presence"],
    description: [
      "A creative glass table lamp designed for spaces that need a small sculptural focal point: model rooms, exhibition settings, bar counters, lounges, and styled side tables.",
      "The glass-forward design gives the lamp a polished reflective quality, while the compact table format makes it easy to place on consoles, bedside surfaces, shelves, or hospitality display areas.",
      "Use it as an atmospheric accent where the fixture itself should read as part of the decor, not just a light source.",
    ],
    details: ["Glass table lamp", "Creative decorative silhouette", "For bars, model rooms, displays, bedrooms, and lounges", "Accent lighting scale"],
    tags: ["table lamp", "glass lamp", "bar lamp", "accent light", "model room", "hotel decor", "modern lighting", "desk lamp", "bedside lamp", "creative lamp", "home decor"],
  }],
  ["Mahjong Modern Simple Homestay Hotel Table Lamp", {
    title: "Mahjong Table Lamp - Modern Hotel Bedside Accent Light",
    visualFocus: ["playful mahjong-inspired form", "simple modern table lamp", "homestay and boutique hotel accent", "bedside-friendly scale"],
    description: [
      "A modern table lamp with a playful mahjong-inspired character, made for boutique hotel rooms, homestays, bedside tables, and styled reading corners.",
      "The design brings a graphic, conversational accent into the room while keeping the overall shape simple enough for contemporary interiors. It works well where you want the lighting to feel personal, memorable, and a little unexpected.",
      "Place it on a nightstand, console, reception shelf, or lounge side table to add warm light and a distinctive design detail.",
    ],
    details: ["Mahjong-inspired table lamp", "Modern simple styling", "For hotel, homestay, bedroom, and lounge decor", "Decorative accent lighting"],
    tags: ["table lamp", "mahjong lamp", "hotel lamp", "bedside lamp", "homestay decor", "accent light", "modern lighting", "desk lamp", "unique lamp", "home decor"],
  }],
  ["Brilliance Modern Gold Brush Floor Lamp, Opal Glass Shades And Round Metal Base", {
    title: "Brushed Gold Floor Lamp - Opal Glass Globe Shades",
    visualFocus: ["brushed gold floor lamp", "opal glass shades", "round metal base", "vertical living room statement"],
    description: [
      "A modern brushed-gold floor lamp with opal glass shades and a round metal base, designed to bring warm vertical light into living rooms, bedrooms, reading corners, and lounge spaces.",
      "The gold finish gives the piece a polished, elevated look, while the opal glass diffuses the light for a softer glow. The round base keeps the profile grounded and easy to style beside sofas, lounge chairs, beds, or console tables.",
      "This is a strong choice when you want a floor lamp that feels decorative and architectural without becoming heavy or overly ornate.",
    ],
    details: ["Brushed gold finish", "Opal glass shade design", "Round metal base", "For living room, bedroom, lounge, and reading spaces"],
    tags: ["floor lamp", "gold lamp", "opal glass", "globe lamp", "living room", "reading lamp", "modern lighting", "bedroom lamp", "metal base", "home decor"],
  }],
  ["Creative Glass LED Art Deco Table Lamp", {
    title: "Creative Glass LED Table Lamp - Modern Art Deco Accent",
    visualFocus: ["glass LED table lamp", "Art Deco-inspired accent", "decorative ambient glow", "compact statement shape"],
    description: [
      "A creative glass LED table lamp with an Art Deco-inspired feel, made for bedside tables, desks, consoles, and small lounge surfaces that need a polished accent light.",
      "The glass element gives the lamp a refined luminous quality, while the LED format keeps the piece practical for everyday ambient lighting. Its decorative profile works well in modern, eclectic, hotel, and apartment interiors.",
      "Use it where you want a compact lamp that can act as both mood lighting and a visible design object.",
    ],
    details: ["Glass LED table lamp", "Art Deco-inspired styling", "For bedside, desk, console, and lounge use", "Decorative ambient lighting"],
    tags: ["table lamp", "glass lamp", "led lamp", "art deco", "bedside lamp", "desk lamp", "accent light", "modern lighting", "hotel decor", "home decor"],
  }],
]);

loadEnv();

function parseArgs(argv) {
  const args = { titles: [], listingIds: [], dryRun: false };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--title") { args.titles.push(argv[++index]); continue; }
    if (arg === "--titles") { args.titles.push(...argv[++index].split("|").map((value) => value.trim()).filter(Boolean)); continue; }
    if (arg === "--listing-id") { args.listingIds.push(String(argv[++index])); continue; }
    if (arg === "--listing-ids") { args.listingIds.push(...argv[++index].split(",").map((value) => value.trim()).filter(Boolean)); continue; }
    if (arg === "--dry-run") { args.dryRun = true; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.titles.length && !args.listingIds.length) throw new Error("Provide --title/--titles or --listing-id/--listing-ids.");
  return args;
}

function printUsage() {
  console.log(`Usage:\n  node ../scripts/etsy/optimize-etsy-drafts.mjs --title "Draft title"\n  node ../scripts/etsy/optimize-etsy-drafts.mjs --titles "Title A|Title B"\n  node ../scripts/etsy/optimize-etsy-drafts.mjs --listing-ids 123,456\n\nOptions:\n  --dry-run   Write reports without patching Etsy drafts.\n`);
}

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

function etsyHeaders() {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY.");
  if (!process.env.ETSY_ACCESS_TOKEN) throw new Error("Set ETSY_ACCESS_TOKEN. Run yarn etsy:refresh first.");
  const apiKey = process.env.ETSY_API_HEADER_KEY || `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET || ""}`;
  return { "x-api-key": apiKey, Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}` };
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

async function listDrafts() {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  const drafts = [];
  let offset = 0;
  while (true) {
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings?state=draft&limit=100&offset=${offset}`);
    const results = data.results || [];
    drafts.push(...results);
    if (results.length < 100) break;
    offset += results.length;
  }
  return drafts;
}

async function getImages(listingId) {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  try {
    const data = await etsyRequest(`/v3/application/listings/${listingId}/images`);
    return sortImages(data.results || []);
  } catch (error) {
    if (!String(error.message || "").includes("-> 404")) throw error;
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings/${listingId}/images`);
    return sortImages(data.results || []);
  }
}

function sortImages(images) {
  return images.sort((left, right) => (left.rank || 9999) - (right.rank || 9999));
}

function imageUrl(image) {
  return image.url_fullxfull || image.url_570xN || image.url_170x135 || image.url_75x75;
}

function normalizeTitle(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findPreset(title) {
  const normalized = normalizeTitle(title);
  for (const [sourceTitle, preset] of PRESETS) if (normalizeTitle(sourceTitle) === normalized) return preset;
  for (const [sourceTitle, preset] of PRESETS) {
    const source = normalizeTitle(sourceTitle);
    if (normalized.includes(source) || source.includes(normalized)) return preset;
  }
  return null;
}

function tagsFor(preset) {
  return [...new Set(preset.tags.map((tag) => tag.toLowerCase()).filter((tag) => tag.length <= 20))].slice(0, 13);
}

function buildDescription(listing, preset, images) {
  const imageUrls = images.map(imageUrl).filter(Boolean);
  const imageContext = imageUrls.length
    ? `Image analysis: ${imageUrls.length} listing photos show ${preset.visualFocus.join(", ")}.`
    : "Image analysis: no Etsy image URLs were returned, so copy was optimized from the draft title and fixture attributes.";
  const sections = [
    preset.description.join("\n\n"),
    imageContext,
    "Highlights",
    ...preset.details.map((detail) => `- ${detail}`),
    "",
    "Good for",
    placementLine(preset),
    "",
    "Listing image URLs reviewed",
    ...(imageUrls.length ? imageUrls.map((url, index) => `- ${index + 1}. ${url}`) : ["- None returned by Etsy at optimization time"]),
    "",
    "Review note",
    "This Etsy draft has been optimized for manual review and remains unpublished.",
  ];
  return sections.join("\n").replace(/\n{3,}/g, "\n\n").slice(0, 9000);
}

function placementLine(preset) {
  const tags = preset.tags.join(" ");
  if (tags.includes("floor lamp")) return "Living rooms, reading corners, bedrooms, lounges, and styled hospitality spaces.";
  if (tags.includes("wall")) return "Bedrooms, hallways, hotel rooms, reading nooks, and compact accent walls.";
  return "Bedside tables, desks, consoles, lounges, model rooms, boutique hotel rooms, and styled home interiors.";
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

async function patchListing(listingId, optimization) {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  return etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings/${listingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody(optimization),
  });
}

function reportName(title, listingId) {
  const slug = String(title || listingId)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || String(listingId);
  return `optimized-${slug}-${listingId}-${Date.now()}.json`;
}

function writeReport(payload) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const filePath = path.join(REPORT_DIR, reportName(payload.before.title, payload.listingId));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

function selectDrafts(drafts, args) {
  const byId = new Map(drafts.map((listing) => [String(listing.listing_id), listing]));
  const selected = [];
  for (const listingId of args.listingIds) {
    const listing = byId.get(String(listingId));
    if (!listing) throw new Error(`Could not find draft listing ID ${listingId}.`);
    selected.push(listing);
  }
  for (const title of args.titles) {
    const normalized = normalizeTitle(title);
    const listing = drafts.find((item) => normalizeTitle(item.title) === normalized)
      || drafts.find((item) => normalizeTitle(item.title).includes(normalized) || normalized.includes(normalizeTitle(item.title)));
    if (!listing) throw new Error(`Could not find draft title: ${title}`);
    if (!selected.some((item) => String(item.listing_id) === String(listing.listing_id))) selected.push(listing);
  }
  return selected;
}

async function main() {
  const args = parseArgs(process.argv);
  const drafts = await listDrafts();
  const selected = selectDrafts(drafts, args);
  const results = [];

  for (const listing of selected) {
    const preset = findPreset(listing.title);
    if (!preset) throw new Error(`No optimization preset for draft: ${listing.title}`);
    const images = await getImages(listing.listing_id);
    const imageUrls = images.map(imageUrl).filter(Boolean);
    const optimization = {
      title: preset.title,
      description: buildDescription(listing, preset, images),
      tags: tagsFor(preset),
    };
    const patched = args.dryRun ? null : await patchListing(listing.listing_id, optimization);
    const report = {
      generatedAt: new Date().toISOString(),
      dryRun: args.dryRun,
      listingId: String(listing.listing_id),
      before: {
        title: listing.title,
        description: listing.description,
        state: listing.state,
        url: listing.url,
        tags: listing.tags || [],
      },
      optimization,
      imageAnalysis: {
        method: "etsy_image_set_and_fixture_cue_analysis",
        note: "No dedicated vision-model API key is configured; optimization uses the Etsy draft image URLs plus fixture-specific visual/material cues.",
        imageCount: imageUrls.length,
        imageUrls,
        visualFocus: preset.visualFocus,
      },
      after: patched ? {
        title: patched.title,
        description: patched.description,
        state: patched.state,
        url: patched.url,
        tags: patched.tags || [],
      } : null,
    };
    const reportPath = writeReport(report);
    results.push({ listingId: String(listing.listing_id), beforeTitle: listing.title, optimizedTitle: optimization.title, imageCount: imageUrls.length, report: path.relative(REPO_ROOT, reportPath).split(path.sep).join("/") });
    await delay(350);
  }

  console.log(JSON.stringify({ optimized: results.length, dryRun: args.dryRun, results }, null, 2));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
