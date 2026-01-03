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
      <div className="px-8 small:px-12 py-10">
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
    <div className="px-8 small:px-12 py-10">
      <div className="flex justify-between mb-6">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </div>
  )
}
