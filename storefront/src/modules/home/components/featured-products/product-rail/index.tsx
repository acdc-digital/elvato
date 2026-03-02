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
      <div className="px-8 small:px-12 pt-4 pb-6">
        <div className="flex justify-between mb-6">
          <LocalizedClientLink href="/store" className="txt-xlarge hover:underline">{collection.title}</LocalizedClientLink>
          <InteractiveLink href="/store">
            View all
          </InteractiveLink>
        </div>
        <p className="text-gray-500">No products found in this collection for your region.</p>
      </div>
    )
  }

  // Batch-prefetch CDN thumbnails in one Convex query
  const handles = pricedProducts.map((p) => p.handle).filter(Boolean) as string[]
  await prefetchThumbnails(handles)

  return (
    <div className="px-8 small:px-12 pt-4 pb-6">
      <div className="flex justify-between mb-6">
        <LocalizedClientLink href="/store" className="txt-xlarge hover:underline">{collection.title}</LocalizedClientLink>
        <InteractiveLink href="/store">
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-6 gap-x-4 gap-y-6">
        {pricedProducts &&
          pricedProducts.slice(0, PRODUCTS_PER_RAIL).map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        {/* Category Promotional Card — 6th slot */}
        <li className="min-w-0">
          <div className="relative border border-black rounded-t-2xl rounded-b-none overflow-visible bg-white w-full h-full flex flex-col">
            <div className="m-2 border border-black rounded-t-xl rounded-b-none overflow-hidden bg-gray-100 relative before:content-[''] before:block before:pt-[133.33%] flex-1">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-2xl font-bold">Ad Space</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col py-3 mx-2 items-start">
              <p className="text-sm text-black font-normal">
                Your Ad Here
              </p>
              <span className="text-xs text-gray-500 mt-1">Promotional Content</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
