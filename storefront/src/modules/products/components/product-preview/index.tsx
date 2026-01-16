import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
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
    <LocalizedClientLink href={`/products/${product.handle}`} className="group w-full">
      <div 
        data-testid="product-wrapper"
        className="relative border border-b-0 border-black rounded-t-2xl overflow-visible bg-white group-hover:shadow-lg transition-shadow ease-in-out duration-150 w-full"
      >
        {/* Inner image container with fixed aspect ratio using before pseudo element */}
        <div className="m-2 border border-black rounded-t-xl overflow-hidden bg-gray-100 relative before:content-[''] before:block before:pt-[133.33%]">
          <div className="absolute inset-0">
            <Image
              src={product.thumbnail || product.images?.[0]?.url || ''}
              alt={product.title || 'Product'}
              fill
              className="object-cover object-center"
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            />
          </div>
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
        {/* Torn receipt edge */}
        <div className="absolute -bottom-[10px] left-[-1px] right-[-1px] h-[12px] overflow-hidden">
          <svg 
            viewBox="0 0 100 12" 
            preserveAspectRatio="none" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* White fill - no stroke */}
            <path 
              d="M0,0 L100,0 L100,5 Q97.5,10 95,5 Q92.5,0 90,5 Q87.5,10 85,5 Q82.5,0 80,5 Q77.5,10 75,5 Q72.5,0 70,5 Q67.5,10 65,5 Q62.5,0 60,5 Q57.5,10 55,5 Q52.5,0 50,5 Q47.5,10 45,5 Q42.5,0 40,5 Q37.5,10 35,5 Q32.5,0 30,5 Q27.5,10 25,5 Q22.5,0 20,5 Q17.5,10 15,5 Q12.5,0 10,5 Q7.5,10 5,5 Q2.5,0 0,5 Z" 
              fill="white"
            />
            {/* Left side stroke */}
            <path d="M0,0 L0,5" fill="none" stroke="black" strokeWidth="1" />
            {/* Right side stroke */}
            <path d="M100,0 L100,5" fill="none" stroke="black" strokeWidth="1" />
            {/* Wavy stroke only */}
            <path 
              d="M0,5 Q2.5,0 5,5 Q7.5,10 10,5 Q12.5,0 15,5 Q17.5,10 20,5 Q22.5,0 25,5 Q27.5,10 30,5 Q32.5,0 35,5 Q37.5,10 40,5 Q42.5,0 45,5 Q47.5,10 50,5 Q52.5,0 55,5 Q57.5,10 60,5 Q62.5,0 65,5 Q67.5,10 70,5 Q72.5,0 75,5 Q77.5,10 80,5 Q82.5,0 85,5 Q87.5,10 90,5 Q92.5,0 95,5 Q97.5,10 100,5" 
              fill="none"
              stroke="black"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
