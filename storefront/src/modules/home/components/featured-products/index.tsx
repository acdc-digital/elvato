import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { prefetchThumbnails } from "@lib/data/convex-images"
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

  // Batch-prefetch all CDN thumbnails in one pass
  const allHandles = railData
    .flatMap(({ products }) => products.map((p) => p.handle))
    .filter(Boolean) as string[]
  if (allHandles.length > 0) {
    await prefetchThumbnails(allHandles)
  }

  return railData.map(({ collection, products }, index) => (
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
