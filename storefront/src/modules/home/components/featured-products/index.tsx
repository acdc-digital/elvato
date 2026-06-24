import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { withCdnImagesBatch } from "@lib/data/convex-images"
import ProductRail from "@modules/home/components/featured-products/product-rail"

const PRODUCTS_PER_RAIL = 5

export default async function FeaturedProducts({
  collections,
  region,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
}) {
  // Fetch all collection product data in parallel instead of sequentially
  const railData = await Promise.all(
    collections.map(async (collection) => {
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
      return { collection, products }
    })
  )

  const canonicalRailData = await Promise.all(
    railData.map(async ({ collection, products }) => ({
      collection,
      products: await withCdnImagesBatch(products),
    }))
  )

  return canonicalRailData.map(({ collection, products }, index) => (
    <li key={collection.id}>
      {index > 0 && <div className="mx-14 border-t border-grey-10" />}
      <ProductRail
        collection={collection}
        region={region}
        products={products}
      />
    </li>
  ))
}
