import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  console.log("ProductRail - Collection:", collection.id, collection.title)
  console.log("ProductRail - Region:", region.id, region.name)

  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  console.log("ProductRail - Products found:", pricedProducts?.length || 0)

  if (!pricedProducts || pricedProducts.length === 0) {
    return (
      <div className="px-8 small:px-12 pt-4 pb-6">
        <div className="flex justify-between mb-6">
          <Text className="txt-xlarge">{collection.title}</Text>
          <InteractiveLink href={`/collections/${collection.handle}`}>
            View all
          </InteractiveLink>
        </div>
        <p className="text-gray-500">No products found in this collection for your region.</p>
      </div>
    )
  }

  return (
    <div className="px-8 small:px-12 pt-4 pb-6">
      <div className="flex justify-between mb-6">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-6 gap-x-6 gap-y-8">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        {/* Advertising Card */}
        <li>
          <div className="border-2 border-black rounded-2xl overflow-hidden bg-white">
            <div className="m-2 border-2 border-black rounded-t-xl overflow-hidden bg-gray-100 aspect-[3/4] flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-2xl font-bold">Ad Space</p>
              </div>
            </div>
            <div className="flex flex-col py-4 px-2">
              <p className="text-sm text-black font-normal text-center">
                Your Ad Here
              </p>
              <div className="flex items-center justify-center mt-1">
                <span className="text-sm text-gray-500">Promotional Content</span>
              </div>
            </div>
          </div>
        </li>
        {/* Advertising Card 2 */}
        <li>
          <div className="border-2 border-black rounded-2xl overflow-hidden bg-white">
            <div className="m-2 border-2 border-black rounded-t-xl overflow-hidden bg-gray-100 aspect-[3/4] flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-2xl font-bold">Ad Space</p>
              </div>
            </div>
            <div className="flex flex-col py-4 px-2">
              <p className="text-sm text-black font-normal text-center">
                Your Ad Here
              </p>
              <div className="flex items-center justify-center mt-1">
                <span className="text-sm text-gray-500">Promotional Content</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
