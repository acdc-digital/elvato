import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import CtaBanner from "@modules/home/components/cta-banner"
import SecondaryHero from "@modules/home/components/secondary-hero"
import ProductGrid from "@modules/home/components/product-grid"
import PhotoGrid from "@modules/home/components/photo-grid"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  console.log("Home Page - Country Code:", countryCode)

  const region = await getRegion(countryCode)
  console.log("Home Page - Region:", region?.id, region?.name)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })
  console.log("Home Page - Collections:", collections?.length, collections?.map(c => c.title))

  if (!collections || !region) {
    console.log("Home Page - Missing collections or region, returning null")
    return null
  }

  return (
    <>
      <Hero />
      {/* TODO: PhotoGrid below hero */}
      {/* <PhotoGrid /> */}
      <CtaBanner />
      <div className="pt-0 pb-4">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <div className="pb-4">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <ProductGrid />
      <div className="pb-4">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <div className="pb-4">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <div className="pb-16">
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      {/* TODO: PhotoGrid above hero-2 */}
      {/* <PhotoGrid /> */}
      <SecondaryHero />
    </>
  )
}
