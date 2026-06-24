import { listProducts } from "@lib/data/products"
import { withCdnImagesBatch } from "@lib/data/convex-images"
import { getRegion } from "@lib/data/regions"
import { pickFamilySibling } from "@lib/util/pick-family-sibling"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const MAX_RELATED = 8

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Build query with collection → type → tags fallback so we always
  // have a meaningful pool, even for products without a collection.
  const queryParams: HttpTypes.StoreProductListParams = {
    region_id: region.id,
    is_giftcard: false,
    limit: 24,
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  } else if (product.type_id) {
    queryParams.type_id = [product.type_id]
  } else if (product.tags?.length) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }

  // Resolve the FamilyShowcase pick in parallel so we can exclude it
  // from this grid and avoid duplicating the hero recommendation above.
  const [listResult, family] = await Promise.all([
    listProducts({ queryParams, countryCode }).catch(() => null),
    pickFamilySibling({ product, countryCode, regionId: region.id }),
  ])

  if (!listResult) {
    return null
  }

  const familySiblingId = family?.sibling.id ?? null

  const products = listResult.response.products
    .filter((p) => p.id !== product.id && p.id !== familySiblingId)
    // Newest first
    .sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })
    .slice(0, MAX_RELATED)

  if (!products.length) {
    return null
  }

  const canonicalProducts = await withCdnImagesBatch(products)

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="text-2xl font-semibold text-ui-fg-base mb-2">
          You might also like
        </h2>
        <p className="text-sm text-ui-fg-muted max-w-md">
          Check out these similar products curated just for you.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {canonicalProducts.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
