import { listProducts } from "@lib/data/products"
import { withCdnImagesBatch } from "@lib/data/convex-images"
import { HttpTypes } from "@medusajs/types"

import InteractiveLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { ArrowUpRight } from "lucide-react"

const PRODUCTS_PER_RAIL = 5

const COLLECTION_COPY: Record<string, { eyebrow: string; body: string }> = {
  chandeliers: {
    eyebrow: "Statement light",
    body: "Sculptural fixtures for dining rooms, stairwells, and places where the light should hold the room.",
  },
  pendants: {
    eyebrow: "Focused glow",
    body: "Lowered light for islands, bedside moments, and the spaces where atmosphere needs direction.",
  },
  "table-floor": {
    eyebrow: "Layered warmth",
    body: "Portable light that softens corners, brings height to a room, and makes everyday spaces feel finished.",
  },
}

function getCollectionHref(collection: HttpTypes.StoreCollection) {
  return collection.handle ? `/collections/${collection.handle}` : "/store"
}

export default async function ProductRail({
  collection,
  region,
  products: prefetchedProducts,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  products?: HttpTypes.StoreProduct[]
}) {
  // Use pre-fetched products when available (parallel fetch from parent),
  // otherwise fetch here (standalone usage).
  let pricedProducts = prefetchedProducts
  if (!pricedProducts) {
    const {
      response: { products },
    } = await listProducts({
      regionId: region.id,
      cacheScope: "public",
      queryParams: {
        collection_id: collection.id,
        fields:
          "*variants.calculated_price,title,handle,thumbnail,images.url,options.title,options.values.value",
        limit: PRODUCTS_PER_RAIL,
      },
    })
    pricedProducts = products

    pricedProducts = await withCdnImagesBatch(pricedProducts)
  }

  if (!pricedProducts || pricedProducts.length === 0) {
    return (
      <div id={collection.handle} className="mx-auto max-w-8xl px-6 small:px-14 pt-8 pb-10">
        <div className="flex items-baseline justify-between mb-8">
          <LocalizedClientLink
            href={getCollectionHref(collection)}
            className="text-2xl font-light tracking-wide text-grey-80 hover:text-grey-60 transition-colors"
          >
            {collection.title}
          </LocalizedClientLink>
          <InteractiveLink href={getCollectionHref(collection)}>
            View all
          </InteractiveLink>
        </div>
        <p className="text-grey-40 text-sm">No products found in this collection for your region.</p>
      </div>
    )
  }

  const collectionHref = getCollectionHref(collection)
  const copy = COLLECTION_COPY[collection.handle ?? ""] ?? {
    eyebrow: "The edit",
    body: "A tight selection of pieces chosen for proportion, finish, and the way they shape a room.",
  }
  const products = pricedProducts.slice(0, PRODUCTS_PER_RAIL)

  return (
    <div id={collection.handle} className="mx-auto max-w-8xl px-6 small:px-14 pt-7 pb-10">
      <div className="mb-5 grid grid-cols-1 gap-4 pt-7 small:grid-cols-12 small:gap-8">
        <div className="small:col-span-3">
          <p className="mb-2.5 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
            {copy.eyebrow}
          </p>
          <LocalizedClientLink
            href={collectionHref}
            className="group inline-flex items-end gap-2 font-sans text-2xl font-semibold leading-none tracking-tight text-grey-90 transition-colors hover:text-grey-70 small:text-3xl"
          >
            {collection.title}
            <ArrowUpRight
              className="mb-0.5 h-4 w-4 text-accent-700 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.75}
            />
          </LocalizedClientLink>
        </div>
        <div className="flex flex-col justify-end small:col-span-6">
          <p className="max-w-xl font-sans text-[14px] leading-relaxed text-grey-60">
            {copy.body}
          </p>
        </div>
        <div className="flex items-end small:col-span-3 small:justify-end">
          <InteractiveLink href={collectionHref}>View the edit</InteractiveLink>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 xsmall:grid-cols-3 small:grid-cols-5 small:gap-x-4 small:gap-y-7">
        {products.map((product, index) => (
          <li
            key={product.id}
            className="min-w-0"
          >
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
