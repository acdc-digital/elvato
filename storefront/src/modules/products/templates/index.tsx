import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import CustomerReviews from "@modules/products/components/customer-reviews"
import CustomerQuestions from "@modules/products/components/customer-questions"
import FamilyShowcase from "@modules/products/components/family-showcase"
import CategoryBadges from "@modules/products/components/category-badges"
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
      {/*
        Main product section — 3 column layout.
        Gallery is intentionally narrower (38%) so it doesn't overwhelm
        the page; the info + actions columns get more breathing room.
      */}
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 small:py-12 relative gap-y-8 small:gap-x-10 medium:gap-x-14"
        data-testid="product-container"
      >
        {/* Left: Image gallery — capped width keeps the hero tasteful */}
        <div className="w-full small:w-[38%] small:sticky small:top-32">
          <div className="mx-auto w-full max-w-[460px]">
            <ImageGallery images={images} variants={product.variants ?? undefined} />
            <CategoryBadges />
          </div>
        </div>

        {/* Center: Product details */}
        <div className="w-full small:w-[34%] py-2 small:py-0">
          <ProductInfo product={product} />
        </div>

        {/* Right: Purchase actions */}
        <div className="w-full small:w-[28%] small:sticky small:top-32">
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

      {/*
        Three-column row: customer reviews (left), customer Q&A (middle),
        family showcase (right). Stacks vertically on mobile, splits into
        3 equal columns at `small`.
      */}
      <div
        className="content-container my-16 small:my-24 grid grid-cols-1 small:grid-cols-3 gap-y-12 small:gap-x-12 medium:gap-x-16 items-start"
      >
        <div className="small:col-span-1">
          <CustomerReviews />
        </div>
        <div className="small:col-span-1">
          <CustomerQuestions
            productId={product.id}
            productHandle={product.handle ?? ""}
          />
        </div>
        <div className="small:col-span-1">
          <Suspense
            fallback={
              <div className="border-t border-ui-border-base pt-12">
                <div className="h-4 w-24 bg-ui-bg-subtle rounded mb-3 animate-pulse" />
                <div className="h-6 w-40 bg-ui-bg-subtle rounded mb-6 animate-pulse" />
                <div className="aspect-square w-full bg-ui-bg-subtle rounded-2xl animate-pulse" />
              </div>
            }
          >
            <FamilyShowcase product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>

      {/* Related products grid — broader discovery surface */}
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
