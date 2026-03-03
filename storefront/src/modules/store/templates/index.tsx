import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList, { SortOptions } from "@modules/store/components/refinement-list"

import PaginatedProducts from "./paginated-products"

type StoreTemplateProps = {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categoryId?: string
  query?: string
}

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  categoryId,
  query,
}: StoreTemplateProps) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  // Parse category IDs from URL (comma-separated)
  const selectedCategoryIds = categoryId
    ? categoryId.split(",").filter((id) => id.trim() !== "")
    : []

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="store-container"
    >
      {/* Sidebar - Filters */}
      <RefinementList
        sortBy={sort}
        selectedCategoryIds={selectedCategoryIds}
        showCategoryFilter={true}
        data-testid="refinement-list"
      />

      {/* Main Content */}
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">All Products</h1>
          <p className="text-base-regular text-ui-fg-subtle mt-1">
            Browse our complete lighting collection
          </p>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            categoryIds={selectedCategoryIds}
            query={query}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
