import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}) {
  return collections.map((collection, index) => (
    <li key={collection.id}>
      {index > 0 && (
        <div className="mx-14 border-t border-grey-10" />
      )}
      <ProductRail collection={collection} region={region} />
    </li>
  ))
}
