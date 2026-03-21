/**
 * Facet extraction logic for Meilisearch product documents.
 *
 * Derives structured facets (material, style, room_type, main_category,
 * sub_category) from existing Medusa product data — category names,
 * tags, and option values — so these can be used as filterable attributes
 * in the search index without creating dozens of separate indexes.
 */

// ─── Main category bucket names ────────────────────────────────────
export const MAIN_CATEGORIES = [
  "Chandeliers",
  "Pendants",
  "Wall",
  "Ceiling",
  "Table & Floor",
  "Outdoor",
  "Accessories",
] as const

export type MainCategory = (typeof MAIN_CATEGORIES)[number]

// ─── Material keywords → canonical material name ───────────────────
// Keys are lowercased substrings to match against category names,
// tag values, and option values. Values are the canonical facet label.
const MATERIAL_MAP: Record<string, string> = {
  crystal: "Crystal",
  glass: "Glass",
  "blown glass": "Blown Glass",
  "murano glass": "Murano Glass",
  "art glass": "Art Glass",
  iron: "Iron",
  "wrought iron": "Wrought Iron",
  bronze: "Bronze",
  brass: "Brass",
  nickel: "Nickel",
  chrome: "Chrome",
  copper: "Copper",
  gold: "Gold",
  silver: "Silver",
  steel: "Steel",
  "stainless steel": "Stainless Steel",
  wood: "Wood",
  bamboo: "Bamboo",
  rattan: "Rattan",
  wicker: "Wicker",
  fabric: "Fabric",
  linen: "Linen",
  silk: "Silk",
  ceramic: "Ceramic",
  porcelain: "Porcelain",
  marble: "Marble",
  stone: "Stone",
  concrete: "Concrete",
  alabaster: "Alabaster",
  resin: "Resin",
  acrylic: "Acrylic",
  paper: "Paper",
  leather: "Leather",
  shell: "Shell",
  capiz: "Capiz",
  bone: "Bone",
  tiffany: "Stained Glass",
  "stained glass": "Stained Glass",
  metal: "Metal",
  plastic: "Plastic",
  rope: "Rope",
  hemp: "Hemp",
  jute: "Jute",
}

// ─── Style keywords → canonical style label ────────────────────────
const STYLE_MAP: Record<string, string> = {
  modern: "Modern",
  contemporary: "Contemporary",
  traditional: "Traditional",
  transitional: "Transitional",
  rustic: "Rustic",
  farmhouse: "Farmhouse",
  industrial: "Industrial",
  "mid-century": "Mid-Century Modern",
  "mid century": "Mid-Century Modern",
  minimalist: "Minimalist",
  bohemian: "Bohemian",
  boho: "Bohemian",
  coastal: "Coastal",
  nautical: "Coastal",
  scandinavian: "Scandinavian",
  "art deco": "Art Deco",
  artisan: "Artisan",
  glam: "Glam",
  glamorous: "Glam",
  luxury: "Luxury",
  vintage: "Vintage",
  retro: "Retro",
  classic: "Classic",
  french: "French",
  mediterranean: "Mediterranean",
  "old world": "Old World",
  ornate: "Ornate",
  baroque: "Baroque",
  victorian: "Victorian",
  gothic: "Gothic",
  asian: "Asian",
  japanese: "Japanese",
  tropical: "Tropical",
  lodge: "Lodge",
  cabin: "Lodge",
  southwest: "Southwestern",
  southwestern: "Southwestern",
  eclectic: "Eclectic",
  geometric: "Geometric",
  organic: "Organic",
  nature: "Nature-Inspired",
}

// ─── Room type keywords → canonical room label ────────────────────
const ROOM_TYPE_MAP: Record<string, string> = {
  "living room": "Living Room",
  "family room": "Living Room",
  bedroom: "Bedroom",
  "master bedroom": "Bedroom",
  bathroom: "Bathroom",
  "bath vanity": "Bathroom",
  vanity: "Bathroom",
  kitchen: "Kitchen",
  "dining room": "Dining Room",
  dining: "Dining Room",
  foyer: "Foyer & Entryway",
  entryway: "Foyer & Entryway",
  entry: "Foyer & Entryway",
  hallway: "Hallway",
  corridor: "Hallway",
  office: "Office",
  study: "Office",
  "home office": "Office",
  nursery: "Kids Room",
  "kids room": "Kids Room",
  "children's room": "Kids Room",
  closet: "Closet",
  laundry: "Laundry",
  utility: "Utility",
  garage: "Garage",
  patio: "Outdoor",
  porch: "Outdoor",
  deck: "Outdoor",
  garden: "Outdoor",
  outdoor: "Outdoor",
  stairway: "Stairway",
  staircase: "Stairway",
  stairs: "Stairway",
  "wine cellar": "Wine Cellar",
  basement: "Basement",
  attic: "Attic",
  commercial: "Commercial",
  restaurant: "Commercial",
  hotel: "Commercial",
  lobby: "Commercial",
}

// ─── Sub-category consolidation ────────────────────────────────────
// Maps raw sub-category names (lowercased) to a simplified bucket.
// Any sub-category not listed here gets mapped via fuzzy keyword matching.
const SUB_CATEGORY_CONSOLIDATION: Record<string, string> = {
  // Chandeliers
  "crystal chandeliers": "Crystal",
  "modern chandeliers": "Modern",
  "contemporary chandeliers": "Contemporary",
  "traditional chandeliers": "Traditional",
  "mini chandeliers": "Mini",
  "small chandeliers": "Mini",
  "large chandeliers": "Large",
  "extra large chandeliers": "Extra Large",
  "candle chandeliers": "Candle Style",
  "candle style chandeliers": "Candle Style",
  "drum chandeliers": "Drum",
  "drum shade chandeliers": "Drum",
  "globe chandeliers": "Globe",
  "sphere chandeliers": "Globe",
  "linear chandeliers": "Linear",
  "rectangle chandeliers": "Linear",
  "island chandeliers": "Linear",
  "sputnik chandeliers": "Sputnik",
  "wagon wheel chandeliers": "Wagon Wheel",
  "lantern chandeliers": "Lantern",
  "cage chandeliers": "Cage",
  "tiered chandeliers": "Tiered",
  "multi tier chandeliers": "Tiered",
  "beaded chandeliers": "Beaded",
  "wrought iron chandeliers": "Wrought Iron",
  "rustic chandeliers": "Rustic",
  "farmhouse chandeliers": "Farmhouse",
  "industrial chandeliers": "Industrial",
  "bohemian chandeliers": "Bohemian",
  "coastal chandeliers": "Coastal",
  "glam chandeliers": "Glam",
  "art deco chandeliers": "Art Deco",

  // Pendants
  "mini pendants": "Mini",
  "multi-light pendants": "Multi-Light",
  "multi light pendants": "Multi-Light",
  "drum pendants": "Drum",
  "globe pendants": "Globe",
  "linear pendants": "Linear",
  "island pendants": "Linear",
  "lantern pendants": "Lantern",
  "cage pendants": "Cage",
  "dome pendants": "Dome",
  "bell pendants": "Bell",
  "geometric pendants": "Geometric",
  "schoolhouse pendants": "Schoolhouse",
  "jar pendants": "Jar",

  // Wall
  "wall sconces": "Sconces",
  sconces: "Sconces",
  "bathroom vanity lights": "Vanity",
  "vanity lights": "Vanity",
  "picture lights": "Picture Lights",
  "swing arm lamps": "Swing Arm",
  "wall lanterns": "Lanterns",
  "outdoor wall lights": "Outdoor Wall",

  // Ceiling
  "flush mount": "Flush Mount",
  "flush mount lights": "Flush Mount",
  "semi-flush mount": "Semi-Flush Mount",
  "semi flush mount": "Semi-Flush Mount",
  "semi flush mount lights": "Semi-Flush Mount",
  "ceiling fans": "Ceiling Fans",
  "recessed lighting": "Recessed",
  "track lighting": "Track Lighting",

  // Table & Floor
  "table lamps": "Table Lamps",
  "desk lamps": "Desk Lamps",
  "floor lamps": "Floor Lamps",
  "arc floor lamps": "Arc Floor Lamps",
  "torchiere lamps": "Torchiere",
  "buffet lamps": "Buffet Lamps",
  "accent lamps": "Accent Lamps",
  "nightstand lamps": "Table Lamps",

  // Outdoor
  "outdoor pendants": "Pendants",
  "outdoor ceiling lights": "Ceiling Lights",
  "outdoor post lights": "Post Lights",
  "landscape lighting": "Landscape",
  "outdoor chandeliers": "Chandeliers",
  "outdoor lanterns": "Lanterns",
  "outdoor flush mounts": "Flush Mounts",
  "solar lights": "Solar",
  "path lights": "Path Lights",

  // Accessories
  lampshades: "Lampshades",
  "lamp shades": "Lampshades",
  bulbs: "Bulbs",
  "light bulbs": "Bulbs",
  dimmers: "Dimmers",
  "dimmer switches": "Dimmers",
  "cord covers": "Cord Covers",
  chains: "Chains",
  "mounting hardware": "Hardware",
  hardware: "Hardware",
  adapters: "Adapters",
  medallions: "Medallions",
  "ceiling medallions": "Medallions",
}

// ─── Extraction helpers ────────────────────────────────────────────

/**
 * Given a pool of text tokens (category names, tags, option values),
 * returns all matching values from a keyword map.
 */
function extractFromMap(
  tokens: string[],
  map: Record<string, string>
): string[] {
  const results = new Set<string>()
  const joined = tokens.join(" ").toLowerCase()

  // Check multi-word keys first (longer matches take priority)
  const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length)

  for (const keyword of sortedKeys) {
    if (joined.includes(keyword)) {
      results.add(map[keyword])
    }
  }

  return Array.from(results)
}

/**
 * Determines the main category for a product from its category names.
 */
export function extractMainCategory(categoryNames: string[]): string {
  for (const name of categoryNames) {
    const lower = name.toLowerCase()
    for (const main of MAIN_CATEGORIES) {
      if (
        lower === main.toLowerCase() ||
        lower.includes(main.toLowerCase())
      ) {
        return main
      }
    }
  }
  return "Other"
}

/**
 * Consolidates raw sub-category names into simplified buckets.
 * Skips names that match a main category (those go into main_category).
 */
export function extractSubCategories(categoryNames: string[]): string[] {
  const subs = new Set<string>()
  const mainLower = MAIN_CATEGORIES.map((m) => m.toLowerCase())

  for (const name of categoryNames) {
    const lower = name.toLowerCase().trim()

    // Skip if it's a main category
    if (mainLower.includes(lower)) continue

    // Check explicit consolidation map
    if (SUB_CATEGORY_CONSOLIDATION[lower]) {
      subs.add(SUB_CATEGORY_CONSOLIDATION[lower])
      continue
    }

    // Fallback: use the raw name but capitalize
    subs.add(name.trim())
  }

  return Array.from(subs)
}

/**
 * Extracts all facets for a product document.
 */
export function extractFacets(product: {
  categoryNames: string[]
  tags: string[]
  optionValues: string[]
  title: string
  description: string
}): {
  main_category: string
  sub_categories: string[]
  materials: string[]
  styles: string[]
  room_types: string[]
} {
  // Build token pools from all available text
  const allTokens = [
    ...product.categoryNames,
    ...product.tags,
    ...product.optionValues,
  ]

  // Also include title/description for room type and style hints
  const extendedTokens = [
    ...allTokens,
    product.title,
    product.description,
  ]

  return {
    main_category: extractMainCategory(product.categoryNames),
    sub_categories: extractSubCategories(product.categoryNames),
    materials: extractFromMap(allTokens, MATERIAL_MAP),
    styles: extractFromMap(extendedTokens, STYLE_MAP),
    room_types: extractFromMap(extendedTokens, ROOM_TYPE_MAP),
  }
}
