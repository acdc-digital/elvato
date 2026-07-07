import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import EditorialFeature, { type Feature } from "./editorial-feature"

/**
 * Featured Collection — "The Elvato Edit"
 *
 * An editorial, category-led showcase. Rather than five SKUs, the layout sells
 * five *worlds* — the brand's fixture families — each card a bright, cohesive
 * interior that embodies Elvato (editorial, smart, elegant, illuminating) and
 * routes the visitor to the matching collection. The room is the hero; the
 * category is how you get there.
 */

/**
 * The five editorial worlds, in layout order:
 *   [hero, top-pair-1, top-pair-2, band-b-wide, band-b-portrait].
 * Each links to a real collection (or the full store for the signature hero)
 * and is paired with a locally-hosted, uniformly-graded interior photograph so
 * the whole feature reads as one shoot.
 */
const CATEGORIES: {
  title: string
  eyebrow: string
  image: string
  href: string
  collectionHandle?: string
}[] = [
  {
    title: "Lighting, curated by room",
    eyebrow: "The Elvato Edit",
    image: "/homepage/v1/category-v2-signature.webp",
    href: "/store",
  },
  {
    title: "Chandeliers",
    eyebrow: "Sculptural centrepieces",
    image: "/homepage/v1/category-v2-chandeliers.webp",
    href: "/categories/chandeliers",
    collectionHandle: "chandeliers",
  },
  {
    title: "Pendants",
    eyebrow: "Focused, lowered light",
    image: "/homepage/v1/category-v2-pendants.webp",
    href: "/categories/pendants",
    collectionHandle: "pendants",
  },
  {
    title: "Table & Floor",
    eyebrow: "Warmth at eye level",
    image: "/homepage/v1/category-v2-table-floor.webp",
    href: "/categories/table-floor",
    collectionHandle: "table-floor",
  },
  {
    title: "Wall",
    eyebrow: "Quiet, ambient glow",
    image: "/homepage/v1/category-v2-wall.webp",
    href: "/categories/wall",
    collectionHandle: "wall",
  },
]

export default async function FeaturedCollection({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  // One lightweight catalogue read so each card can show a live "N designs"
  // count and the footer can show the true total. Counts are best-effort — the
  // section still renders cleanly if the fetch returns nothing.
  let count = 0
  const counts = new Map<string, number>()
  try {
    const {
      response: { products, count: total },
    } = await listProducts({
      regionId: region.id,
      cacheScope: "public",
      queryParams: {
        limit: 100,
        fields: "handle,collection.handle",
      },
    })
    count = total ?? 0
    for (const p of products ?? []) {
      const h = (p as any).collection?.handle as string | undefined
      if (h) counts.set(h, (counts.get(h) ?? 0) + 1)
    }
  } catch {
    // Non-fatal — fall through with empty counts.
  }

  const features: Feature[] = CATEGORIES.map((c) => {
    const n = c.collectionHandle ? counts.get(c.collectionHandle) : count
    return {
      title: c.title,
      eyebrow: c.eyebrow,
      image: c.image,
      href: c.href,
      meta: n ? `${n} design${n === 1 ? "" : "s"}` : "Explore",
    }
  })

  return <EditorialFeature features={features} totalCount={count} />
}
