import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import CtaBanner from "@modules/home/components/cta-banner"
import SecondaryHero from "@modules/home/components/secondary-hero"
import ShopByRoom from "@modules/home/components/shop-by-room"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Elvato | Contemporary Lighting for Your Next Project",
  description:
    "Shop 803 published, affordable lighting designs — pendants, chandeliers, ceiling, wall, floor & table lamps, outdoor lighting, and smart controls.",
}

export const revalidate = 300

/**
 * Homepage collection display order.
 * Collections are matched by handle and rendered in this sequence.
 * Only collections listed here will appear on the homepage.
 * The first group renders above the editorial break, the second below.
 */
const HOMEPAGE_COLLECTIONS_TOP = [
  "Featured",       // Featured / New Arrivals — editorial curation
  "chandeliers",    // Highest AOV, aspirational, strong visual impact
  "pendants",       // #1 search volume in modern lighting
  "ceiling",        // Broadest need, every room has one
  "wall",           // Strong design-driven category
]

const HOMEPAGE_COLLECTIONS_BOTTOM = [
  "table-floor",    // Lower price point, impulse/add-on purchases
]

function sortCollectionsByPriority(
  collections: { id: string; handle: string; title: string }[],
  priorityHandles: string[]
) {
  return priorityHandles
    .map((handle) => collections.find((c) => c.handle === handle))
    .filter(Boolean) as typeof collections
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  const [region, { collections }] = await Promise.all([
    getRegion(countryCode),
    listCollections({ fields: "id, handle, title" }),
  ])

  if (!collections || !region) {
    return null
  }

  const topCollections = sortCollectionsByPriority(collections, HOMEPAGE_COLLECTIONS_TOP) as HttpTypes.StoreCollection[]
  const bottomCollections = sortCollectionsByPriority(collections, HOMEPAGE_COLLECTIONS_BOTTOM) as HttpTypes.StoreCollection[]

  return (
    <>
      <Hero />
      {/* TODO: PhotoGrid below hero */}
      {/* <PhotoGrid /> */}
      <CtaBanner />

      {/* Shop by Room */}
      <ShopByRoom />

      {/* Primary collection rails — highest ROI categories */}
      {topCollections.length > 0 && (
        <div className="pt-0 pb-8">
          <ul className="flex flex-col">
            <FeaturedProducts collections={topCollections} region={region} />
          </ul>
        </div>
      )}

      {/* Editorial break — Editor's Picks / Shop by Room */}
      {/* <ProductGrid /> */}

      {/* Secondary collection rails — complementary categories */}
      {bottomCollections.length > 0 && (
        <div className="pb-8">
          <ul className="flex flex-col">
            <FeaturedProducts collections={bottomCollections} region={region} />
          </ul>
        </div>
      )}

      {/* Tagline above secondary hero */}
      <div className="px-6 small:px-14 pt-24 pb-10">
        <h2 className="text-xl lg:text-3xl font-bold leading-tight font-sans">
          Curated designs for every room — handpicked, affordable, and ready to ship.
        </h2>
      </div>

      <SecondaryHero />
    </>
  )
}
