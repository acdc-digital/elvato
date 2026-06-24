import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import FeaturedCollection from "@modules/home/components/featured-collection"
import Hero from "@modules/home/components/hero"
import CtaBanner from "@modules/home/components/cta-banner"
import SecondaryHero from "@modules/home/components/secondary-hero"
import ShopByRoom from "@modules/home/components/shop-by-room"
import ClosingCta from "@modules/home/components/closing-cta"
import { listCollections } from "@lib/data/collections"
import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
  "chandeliers",    // Highest AOV, aspirational, strong visual impact
  "pendants",       // #1 search volume in modern lighting
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

      {/* Featured Collection - The Elvato Edit editorial showcase */}
      <FeaturedCollection region={region} />

      {/* Shop the collection — a unifying zone for the product rails */}
      {(topCollections.length > 0 || bottomCollections.length > 0) && (
        <section className="w-full bg-grey-5 py-16 small:py-24">
          <header className="mx-auto mb-4 max-w-8xl px-6 small:px-14">
            <div className="grid grid-cols-1 gap-6 small:grid-cols-12 small:gap-12">
              <div className="small:col-span-7">
                <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
                  Shop the collection
                </p>
                <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-5xl">
                  Every fixture,
                  <br />
                  by category.
                </h2>
              </div>
              <div className="flex flex-col justify-end small:col-span-5">
                <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
                  Handpicked, affordable, and ready to ship. Browse our most-loved
                  categories — from statement chandeliers to everyday ceiling and
                  wall lighting.
                </p>
                <LocalizedClientLink
                  href="/store"
                  className="group mt-6 inline-flex w-fit items-center gap-2 border-b border-grey-40 pb-1 font-sans text-sm tracking-wide text-grey-90 transition-colors hover:border-grey-90"
                >
                  Browse the full store
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.75}
                  />
                </LocalizedClientLink>
              </div>
            </div>
          </header>

          {/* Primary collection rails — highest ROI categories */}
          {topCollections.length > 0 && (
            <ul className="flex flex-col">
              <FeaturedProducts collections={topCollections} region={region} />
            </ul>
          )}

          {/* Secondary collection rails — complementary categories */}
          {bottomCollections.length > 0 && (
            <ul className="flex flex-col">
              <FeaturedProducts collections={bottomCollections} region={region} />
            </ul>
          )}
        </section>
      )}

      {/* Design services & lighting controls */}
      <SecondaryHero />

      {/* Closing invitation */}
      <ClosingCta />
    </>
  )
}
