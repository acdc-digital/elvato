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
      <ul className="grid grid-cols-2 small:grid-cols-6 gap-x-4 gap-y-6">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        {/* Advertising Card */}
        <li className="min-w-0">
          <div className="relative border border-b-0 border-black rounded-t-2xl overflow-visible bg-white w-full">
            <div className="m-2 border border-black rounded-t-xl overflow-hidden bg-gray-100 aspect-[3/4] flex items-center justify-center">
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
        </li>
      </ul>
    </div>
  )
}
