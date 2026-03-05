import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import CustomerReviews from "@modules/products/components/customer-reviews"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/* Main product section – 3 column layout */}
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 small:py-12 relative gap-y-8 small:gap-x-8 medium:gap-x-12"
        data-testid="product-container"
      >
        {/* Left: Image gallery */}
        <div className="w-full small:w-[48%] small:sticky small:top-32">
          <ImageGallery images={images} />
        </div>

        {/* Center: Product details */}
        <div className="w-full small:w-[28%] py-2 small:py-0">
          <ProductInfo product={product} />
        </div>

        {/* Right: Purchase actions */}
        <div className="w-full small:w-[24%] small:sticky small:top-32">
          <div className="flex flex-col gap-y-6">
            <ProductOnboardingCta />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Customer reviews */}
      <div className="content-container my-16 small:my-24">
        <CustomerReviews />
      </div>

      {/* Related products */}
      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
