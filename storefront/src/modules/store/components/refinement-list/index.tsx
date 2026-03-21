import { getCategoryTree, CategoryNode } from "@lib/data/categories"
import { getFacetDistribution } from "@lib/data/facets"
import CategoryFilter from "./category-filter"
import FacetFilter from "./facet-filter"
import SortDropdown from "./sort-dropdown"
import PerPageDropdown, { PerPageOption, DEFAULT_PER_PAGE } from "./per-page-dropdown"
import MobileFilters from "./mobile-filters"
import ActiveFilters from "./active-filters"
import SearchInput from "./search-input"

// Re-export types for backwards compatibility
export { type SortOptions } from "./sort-dropdown"
export { type PerPageOption, DEFAULT_PER_PAGE } from "./per-page-dropdown"
export type { CategoryNode }

type RefinementListProps = {
  sortBy: "price_asc" | "price_desc" | "created_at"
  perPage?: PerPageOption
  selectedCategoryIds?: string[]
  selectedMainCategory?: string
  selectedSubCategories?: string[]
  selectedMaterials?: string[]
  selectedStyles?: string[]
  selectedRoomTypes?: string[]
  showCategoryFilter?: boolean
  "data-testid"?: string
}

/**
 * Server Component that fetches category tree + facet distributions
 * and renders the full filter sidebar UI
 */
const RefinementList = async ({
  sortBy,
  perPage = DEFAULT_PER_PAGE,
  selectedCategoryIds = [],
  selectedMainCategory,
  selectedSubCategories = [],
  selectedMaterials = [],
  selectedStyles = [],
  selectedRoomTypes = [],
  showCategoryFilter = true,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  // Fetch categories and facet distributions in parallel
  const [categories, facetDistribution] = await Promise.all([
    showCategoryFilter ? getCategoryTree() : Promise.resolve([]),
    getFacetDistribution({
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      mainCategory: selectedMainCategory,
    }),
  ])

  const roomTypeFacets = facetDistribution?.room_types ?? {}
  const materialFacets = facetDistribution?.materials ?? {}
  const styleFacets = facetDistribution?.styles ?? {}
  const subCategoryFacets = facetDistribution?.sub_categories ?? {}
  const mainCategoryFacets = facetDistribution?.main_category ?? {}

  return (
    <div
      className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 pr-6 small:pr-8 small:min-w-[250px] small:ml-[1.675rem]"
      data-testid={dataTestId}
    >
      {showCategoryFilter ? (
        <>
          {/* Mobile: Filter trigger + Sort */}
          <div className="flex items-center justify-between gap-4 small:hidden mb-4">
            <MobileFilters
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              roomTypeFacets={roomTypeFacets}
              materialFacets={materialFacets}
              styleFacets={styleFacets}
              subCategoryFacets={subCategoryFacets}
              selectedRoomTypes={selectedRoomTypes}
              selectedMaterials={selectedMaterials}
              selectedStyles={selectedStyles}
              selectedSubCategories={selectedSubCategories}
            />
            <div className="flex items-center gap-2">
              <PerPageDropdown perPage={perPage} data-testid="mobile-per-page" />
              <SortDropdown sortBy={sortBy} data-testid="mobile-sort" />
            </div>
          </div>

          {/* Mobile: Active filters */}
          <div className="small:hidden">
            <ActiveFilters
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />
          </div>

          {/* Desktop: Sidebar layout */}
          <div className="hidden small:block space-y-6">
            {/* Search */}
            <SearchInput data-testid="desktop-search" />

            {/* Divider */}
            <div className="border-t border-grey-10" />

            {/* Room Type — top-level filter */}
            {Object.keys(roomTypeFacets).length > 0 && (
              <>
                <FacetFilter
                  title="Room Type"
                  paramName="room_types"
                  facets={roomTypeFacets}
                  selectedValues={selectedRoomTypes}
                  initialLimit={10}
                />
                <div className="border-t border-grey-10" />
              </>
            )}

            {/* Category Filter Section */}
            <CategoryFilter
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />

            {/* Sub-Categories (consolidated) */}
            {Object.keys(subCategoryFacets).length > 0 && (
              <>
                <div className="border-t border-grey-10" />
                <FacetFilter
                  title="Type"
                  paramName="sub_categories"
                  facets={subCategoryFacets}
                  selectedValues={selectedSubCategories}
                />
              </>
            )}

            {/* Materials */}
            {Object.keys(materialFacets).length > 0 && (
              <>
                <div className="border-t border-grey-10" />
                <FacetFilter
                  title="Material"
                  paramName="materials"
                  facets={materialFacets}
                  selectedValues={selectedMaterials}
                />
              </>
            )}

            {/* Styles */}
            {Object.keys(styleFacets).length > 0 && (
              <>
                <div className="border-t border-grey-10" />
                <FacetFilter
                  title="Style"
                  paramName="styles"
                  facets={styleFacets}
                  selectedValues={selectedStyles}
                />
              </>
            )}
          </div>
        </>
      ) : (
        // Simple sort-only view for category pages
        <div className="flex flex-col gap-4">
          <SortDropdown sortBy={sortBy} data-testid={dataTestId} />
          <PerPageDropdown perPage={perPage} data-testid="per-page" />
        </div>
      )}
    </div>
  )
}

export default RefinementList
