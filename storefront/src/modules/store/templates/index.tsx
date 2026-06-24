import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList, { SortOptions } from "@modules/store/components/refinement-list"
import { type PerPageOption, DEFAULT_PER_PAGE } from "@modules/store/components/refinement-list"
import PerPageDropdown from "@modules/store/components/refinement-list/per-page-dropdown"
import SortDropdown from "@modules/store/components/refinement-list/sort-dropdown"

import PaginatedProducts from "./paginated-products"

type StoreTemplateProps = {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categoryId?: string
  query?: string
  limit?: string
  materials?: string
  styles?: string
  roomTypes?: string
  subCategories?: string
}

function RefinementListFallback() {
  return (
    <aside className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 pr-6 small:pr-8 small:min-w-[250px] small:ml-[1.675rem]">
      <div className="hidden small:block space-y-6 w-full">
        <div className="h-10 rounded bg-grey-10 animate-pulse" />
        <div className="border-t border-grey-10" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="h-4 w-24 rounded bg-grey-20 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-grey-10 animate-pulse" />
              <div className="h-3 w-28 rounded bg-grey-10 animate-pulse" />
              <div className="h-3 w-36 rounded bg-grey-10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="small:hidden flex w-full items-center justify-between gap-4">
        <div className="h-10 w-28 rounded bg-grey-10 animate-pulse" />
        <div className="h-10 w-36 rounded bg-grey-10 animate-pulse" />
      </div>
    </aside>
  )
}

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  categoryId,
  query,
  limit,
  materials,
  styles,
  roomTypes,
  subCategories,
}: StoreTemplateProps) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const perPage = (limit ? parseInt(limit) : DEFAULT_PER_PAGE) as PerPageOption

  // Parse category IDs from URL (comma-separated)
  const selectedCategoryIds = categoryId
    ? categoryId.split(",").filter((id) => id.trim() !== "")
    : []

  // Parse facet filters from URL (comma-separated)
  const selectedMaterials = materials
    ? materials.split(",").filter((v) => v.trim() !== "")
    : []
  const selectedStyles = styles
    ? styles.split(",").filter((v) => v.trim() !== "")
    : []
  const selectedRoomTypes = roomTypes
    ? roomTypes.split(",").filter((v) => v.trim() !== "")
    : []
  const selectedSubCategories = subCategories
    ? subCategories.split(",").filter((v) => v.trim() !== "")
    : []

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="store-container"
    >
      {/* Sidebar - Filters */}
      <Suspense fallback={<RefinementListFallback />}>
        <RefinementList
          sortBy={sort}
          perPage={perPage}
          selectedCategoryIds={selectedCategoryIds}
          selectedMaterials={selectedMaterials}
          selectedStyles={selectedStyles}
          selectedRoomTypes={selectedRoomTypes}
          selectedSubCategories={selectedSubCategories}
          showCategoryFilter={true}
          data-testid="refinement-list"
        />
      </Suspense>

      {/* Main Content */}
      <div className="w-full">
        <div className="mb-8 text-2xl-semi flex items-start justify-between">
          <div>
            <h1 data-testid="store-page-title">All Products</h1>
            <p className="text-base-regular text-ui-fg-subtle mt-1">
              Browse our complete lighting collection
            </p>
          </div>
          <div className="hidden small:flex items-center gap-2">
            <SortDropdown sortBy={sort} data-testid="desktop-sort" />
            <PerPageDropdown perPage={perPage} data-testid="desktop-per-page" />
          </div>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            categoryIds={selectedCategoryIds}
            query={query}
            limit={perPage}
            materials={selectedMaterials}
            styles={selectedStyles}
            roomTypes={selectedRoomTypes}
            subCategories={selectedSubCategories}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
