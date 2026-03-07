import { listProducts } from "@lib/data/products"
import { prefetchThumbnails } from "@lib/data/convex-images"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

const PRODUCTS_PER_RAIL = 5

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price,title,handle,thumbnail,images.url,options.title,options.values.value",
      limit: PRODUCTS_PER_RAIL,
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return (
      <div className="px-6 small:px-14 pt-8 pb-10">
        <div className="flex items-baseline justify-between mb-8">
          <LocalizedClientLink
            href="/store"
            className="text-2xl font-light tracking-wide text-grey-80 hover:text-grey-60 transition-colors"
          >
            {collection.title}
          </LocalizedClientLink>
          <InteractiveLink href="/store">
            View all
          </InteractiveLink>
        </div>
        <p className="text-grey-40 text-sm">No products found in this collection for your region.</p>
      </div>
    )
  }

  // Batch-prefetch CDN thumbnails in one Convex query
  const handles = pricedProducts.map((p) => p.handle).filter(Boolean) as string[]
  await prefetchThumbnails(handles)

  return (
    <div className="px-6 small:px-14 pt-8 pb-10">
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-8">
        <LocalizedClientLink
          href="/store"
          className="text-2xl font-light tracking-wide text-grey-80 hover:text-grey-60 transition-colors"
        >
          {collection.title}
        </LocalizedClientLink>
        <InteractiveLink href="/store">
          View all
        </InteractiveLink>
      </div>

      {/* Product grid */}
      <ul className="grid grid-cols-2 small:grid-cols-5 gap-x-5 gap-y-8">
        {pricedProducts &&
          pricedProducts.slice(0, PRODUCTS_PER_RAIL).map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </div>
  )
}
