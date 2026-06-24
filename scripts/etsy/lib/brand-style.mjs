/**
 * Brand-style profiler.
 *
 * Derives ALVATTA's live brand "style DNA" from the shop's ACTIVE Etsy listings
 * (the products that already represent the brand) and provides a scorer so the
 * database selector can prefer catalogue products whose attributes match the
 * common threads across the active listings.
 *
 * The profile is built from shared attributes detected across every active
 * listing: fixtures, materials (glass globe, smoke glass, brass, ...), styles
 * (modern, minimalist, nordic, ...), rooms, and the most frequent tag tokens.
 */

import { detectAttributes } from "./seo-tags.mjs";

const ETSY_BASE = "https://api.etsy.com";

function etsyHeaders() {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY.");
  if (!process.env.ETSY_ACCESS_TOKEN) throw new Error("Set ETSY_ACCESS_TOKEN. Run node scripts/etsy/oauth.mjs refresh first.");
  const apiKey = process.env.ETSY_API_HEADER_KEY || `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET || ""}`;
  return { "x-api-key": apiKey, Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}` };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function etsyRequest(endpoint) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(new URL(endpoint, ETSY_BASE), {
      headers: etsyHeaders(),
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
    throw new Error(`GET ${endpoint} -> ${response.status}: ${detail.slice(0, 500)}`);
  }
  return body;
}

/**
 * Fetch every ACTIVE listing in the shop (paginated).
 */
export async function fetchActiveListings() {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID.");
  const listings = [];
  let offset = 0;
  for (;;) {
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings?state=active&limit=100&offset=${offset}`);
    const results = data.results || [];
    listings.push(...results);
    if (results.length < 100) break;
    offset += results.length;
  }
  return listings;
}

function tally(map, key, weight = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function toWeightedObject(map, total) {
  const out = {};
  for (const [key, count] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
    out[key] = { count, weight: total ? Number((count / total).toFixed(3)) : 0 };
  }
  return out;
}

function dominantKeys(weighted, minWeight = 0.2) {
  return Object.entries(weighted)
    .filter(([, value]) => value.weight >= minWeight)
    .map(([key]) => key);
}

/**
 * Build a weighted brand-style profile from active listings.
 */
export function deriveBrandProfile(listings) {
  const total = listings.length || 1;
  const fixtures = new Map();
  const materials = new Map();
  const styles = new Map();
  const rooms = new Map();
  const tagTokens = new Map();

  for (const listing of listings) {
    const attrs = detectAttributes({
      title: listing.title,
      description: listing.description,
      extraText: (listing.tags || []).join(" "),
      materials: listing.materials || [],
    });
    if (attrs.fixture) tally(fixtures, attrs.fixture);
    for (const material of attrs.materials) tally(materials, material);
    for (const style of attrs.styles) tally(styles, style);
    for (const room of attrs.rooms) tally(rooms, room);
    for (const tag of listing.tags || []) tally(tagTokens, String(tag).toLowerCase().trim());
  }

  const materialsWeighted = toWeightedObject(materials, total);
  const stylesWeighted = toWeightedObject(styles, total);
  const roomsWeighted = toWeightedObject(rooms, total);
  const fixturesWeighted = toWeightedObject(fixtures, total);

  return {
    sampleSize: listings.length,
    fixtures: fixturesWeighted,
    materials: materialsWeighted,
    styles: stylesWeighted,
    rooms: roomsWeighted,
    signatureTags: [...tagTokens.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count })),
    dominant: {
      fixtures: dominantKeys(fixturesWeighted, 0.15),
      materials: dominantKeys(materialsWeighted, 0.2),
      styles: dominantKeys(stylesWeighted, 0.25),
      rooms: dominantKeys(roomsWeighted, 0.25),
    },
  };
}

/**
 * Score how well a product's detected attributes match the brand profile.
 * Returns { points, reasons } where points is bounded by maxPoints.
 *
 * @param {object} attrs   Output of detectAttributes for the product.
 * @param {object} profile Output of deriveBrandProfile.
 * @param {number} [maxPoints=24]
 */
export function scoreAgainstProfile(attrs, profile, maxPoints = 24) {
  if (!profile) return { points: 0, reasons: [] };
  const reasons = [];
  let points = 0;

  const weightOf = (group, key) => profile[group]?.[key]?.weight || 0;

  // Materials carry the strongest brand signal (glass globe, smoke glass, brass).
  for (const material of attrs.materials) {
    const weight = weightOf("materials", material);
    if (weight > 0) {
      const gained = Math.min(8, Math.round(weight * 12));
      points += gained;
      if (gained > 0) reasons.push(`brand material "${material}" (${Math.round(weight * 100)}% of active)`);
    }
  }

  // Style alignment with the established editorial direction.
  for (const style of attrs.styles) {
    const weight = weightOf("styles", style);
    if (weight > 0) {
      const gained = Math.min(5, Math.round(weight * 7));
      points += gained;
      if (gained > 0) reasons.push(`brand style "${style}"`);
    }
  }

  // Fixture mix the brand already sells well.
  if (attrs.fixture) {
    const weight = weightOf("fixtures", attrs.fixture);
    if (weight > 0) {
      const gained = Math.min(6, Math.round(weight * 14));
      points += gained;
      if (gained > 0) reasons.push(`proven fixture "${attrs.fixture}"`);
    }
  }

  // Room/use overlap with where the brand places product.
  for (const room of attrs.rooms) {
    const weight = weightOf("rooms", room);
    if (weight > 0) {
      const gained = Math.min(3, Math.round(weight * 5));
      points += gained;
      if (gained > 0) reasons.push(`brand room "${room}"`);
    }
  }

  return { points: Math.min(maxPoints, points), reasons: reasons.slice(0, 5) };
}
