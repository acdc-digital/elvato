import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div 
        data-testid="product-wrapper"
        className="border-2 border-black rounded-2xl overflow-hidden bg-white group-hover:shadow-lg transition-shadow ease-in-out duration-150"
      >
        {/* Inner image container with rounded top corners */}
        <div className="m-2 border-2 border-black rounded-t-xl overflow-hidden bg-gray-100">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
        </div>
        {/* Text inside outer container */}
        <div className="flex flex-col py-4 px-2">
          <Text className="text-sm text-black font-normal text-center" data-testid="product-title">
            {product.title}
          </Text>
          <div className="flex items-center justify-center mt-1">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
