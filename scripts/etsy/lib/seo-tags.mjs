/**
 * Shared Etsy SEO tag builder.
 *
 * Used by:
 *   - update-active-listing-tags.mjs (re-tags ACTIVE Etsy listings)
 *   - publish-etsy-listing.mjs (tags NEW drafts from Medusa products)
 *
 * Produces an SEO-optimized, up-to-13 tag set following Etsy best practice:
 * all slots filled, multi-word long-tail phrases, a mix of broad (fixture /
 * style) and specific (material + room + use), each tag within 20 characters.
 */

export const MAX_TAGS = 13;
export const MAX_TAG_LENGTH = 20;

/**
 * Detect ALVATTA fixture/material/style/room attributes from arbitrary listing
 * or product text. Fixture is detected title-first by head noun (the earliest
 * fixture keyword wins), deliberately ignoring stale/generic existing tags.
 *
 * @param {object} input
 * @param {string} [input.title]
 * @param {string} [input.description]
 * @param {string} [input.extraText]  Extra body text (categories, options, etc.)
 * @param {string[]} [input.materials]
 */
export function detectAttributes(input = {}) {
  const titleText = String(input.title || "").toLowerCase();
  const bodyText = [
    input.title,
    input.description,
    input.extraText,
    ...(input.materials || []),
  ].filter(Boolean).join(" ").toLowerCase();

  const detectFixture = (text) => {
    // Position-based: the earliest fixture keyword in the text is the head noun.
    // Resolves ambiguous titles like "Branch Chandelier ... LED Pendant"
    // (chandelier) vs "Smoke Glass Pendant ... Cluster Chandelier" (pendant).
    const groups = [
      ["wall sconce", /wall\s+(?:light|lamp|sconce)|\bsconce\b/],
      ["floor lamp", /floor lamp|arc lamp|standing lamp/],
      ["table lamp", /table lamp|desk lamp|bedside lamp|nightstand lamp/],
      ["pendant light", /pendant|single drop|hanging light|suspension/],
      ["chandelier", /chandelier|linear light|island light/],
      ["ceiling light", /ceiling light|flush mount/],
    ];
    let best = null;
    let bestIndex = Infinity;
    for (const [label, re] of groups) {
      const match = re.exec(text);
      if (match && match.index < bestIndex) {
        best = label;
        bestIndex = match.index;
      }
    }
    return best;
  };

  // Title is authoritative; fall back to the body only when the title is silent.
  const fixture = detectFixture(titleText) || detectFixture(bodyText);

  const pick = (pairs) => pairs.filter(([, re]) => re.test(bodyText)).map(([label]) => label);

  return {
    text: bodyText,
    fixture,
    styles: pick([
      ["modern", /modern|contemporary/],
      ["minimalist", /minimalist|minimal/],
      ["nordic", /nordic/],
      ["scandinavian", /scandinavian/],
      ["mid century", /mid.?century/],
      ["industrial", /industrial/],
      ["vintage", /vintage|retro/],
    ]),
    materials: pick([
      ["glass globe", /globe|sphere|orb|ball|round glass/],
      ["opal glass", /opal|milk glass|white glass|frosted/],
      ["smoke glass", /smok[ey]|smoke glass|grey glass|gray glass|tinted/],
      ["clear glass", /clear glass|transparent/],
      ["brass", /brass|gold|copper|bronze/],
      ["black metal", /matte black|black metal|black finish/],
      ["marble", /marble|stone/],
      ["rattan", /rattan|woven|wicker/],
    ]),
    rooms: pick([
      ["dining room", /dining/],
      ["kitchen island", /kitchen island|kitchen/],
      ["bedroom", /bedroom|bedside|nightstand/],
      ["living room", /living room|lounge/],
      ["hallway", /hallway|corridor|entryway|foyer/],
      ["study", /study|office|reading/],
    ]),
  };
}

export function normalizeTag(value) {
  const tag = String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{Nd}\p{Zs}\-']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!tag) return null;
  if (tag.length > MAX_TAG_LENGTH) return null;
  return tag;
}

/**
 * Build an SEO-optimized, up-to-13-slot Etsy tag set.
 *
 * @param {object} input  See detectAttributes; plus:
 * @param {string[]} [input.existingTags]  Existing tags used only to top up.
 * @returns {string[]}
 */
export function buildSeoTags(input = {}) {
  const attrs = detectAttributes(input);
  const fixture = attrs.fixture;
  const style = attrs.styles[0];

  const prioritized = [
    // 1. Core fixture term (high-volume head keyword).
    fixture,
    // 2. Material + fixture long-tail.
    attrs.materials.includes("glass globe") ? "glass globe light" : null,
    attrs.materials.includes("smoke glass") ? "smoke glass light" : null,
    attrs.materials.includes("opal glass") ? "opal glass light" : null,
    attrs.materials.includes("brass") && fixture ? `brass ${fixture}` : null,
    attrs.materials.includes("black metal") ? "black light fixture" : null,
    attrs.materials.includes("marble") ? "marble lamp" : null,
    attrs.materials.includes("rattan") ? "rattan light" : null,
    // 3. Style + fixture / style descriptors.
    style && fixture ? `${style} ${fixture}` : null,
    attrs.styles.includes("minimalist") ? "minimalist lamp" : null,
    attrs.styles.includes("nordic") || attrs.styles.includes("scandinavian") ? "nordic lighting" : null,
    attrs.styles.includes("mid century") ? "mid century lamp" : null,
    attrs.styles.includes("industrial") ? "industrial light" : null,
    // 4. Room + use long-tail.
    attrs.rooms.includes("dining room") ? "dining room light" : null,
    attrs.rooms.includes("kitchen island") ? "kitchen island light" : null,
    attrs.rooms.includes("bedroom") ? "bedroom light" : null,
    attrs.rooms.includes("living room") ? "living room light" : null,
    attrs.rooms.includes("hallway") ? "hallway light" : null,
    attrs.rooms.includes("study") ? "reading lamp" : null,
    // 5. Format / function.
    fixture === "pendant light" ? "hanging light" : null,
    fixture === "chandelier" ? "ceiling light" : null,
    fixture === "table lamp" ? "bedside lamp" : null,
    fixture === "floor lamp" ? "standing lamp" : null,
    // 6. Gift / intent.
    "housewarming gift",
    // 7. Evergreen catch-alls.
    "modern lighting",
    "home decor",
  ];

  const tags = [];
  const seen = new Set();
  const add = (value) => {
    const tag = normalizeTag(value);
    if (!tag || seen.has(tag)) return;
    seen.add(tag);
    tags.push(tag);
  };

  for (const item of prioritized) {
    if (tags.length >= MAX_TAGS) break;
    add(item);
  }

  // Fill any remaining slots with relevant evergreen lighting terms.
  if (tags.length < MAX_TAGS) {
    const fillers = [
      "modern lighting",
      "light fixture",
      "led lighting",
      "accent lighting",
      "statement light",
      "modern home decor",
      "new home gift",
      "home decor",
    ];
    for (const filler of fillers) {
      if (tags.length >= MAX_TAGS) break;
      add(filler);
    }
  }

  // Top up from existing tags, skipping any that name a DIFFERENT fixture so we
  // never reintroduce a wrong product type from stale/generic tags.
  if (tags.length < MAX_TAGS) {
    const otherFixtures = ["chandelier", "pendant", "wall sconce", "sconce", "floor lamp", "table lamp", "desk lamp", "ceiling light"]
      .filter((word) => !fixture || !fixture.includes(word.split(" ")[0]));
    for (const existing of input.existingTags || []) {
      if (tags.length >= MAX_TAGS) break;
      const lowered = String(existing).toLowerCase();
      if (otherFixtures.some((word) => lowered.includes(word))) continue;
      add(existing);
    }
  }

  return tags.slice(0, MAX_TAGS);
}
