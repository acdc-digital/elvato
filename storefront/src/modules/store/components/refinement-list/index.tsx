import { getCategoryTree, CategoryNode } from "@lib/data/categories"
import CategoryFilter from "./category-filter"
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
  showCategoryFilter?: boolean
  "data-testid"?: string
}

/**
 * Server Component that fetches category tree and renders filter UI
 * Use showCategoryFilter=false on category pages where filtering isn't needed
 */
const RefinementList = async ({
  sortBy,
  perPage = DEFAULT_PER_PAGE,
  selectedCategoryIds = [],
  showCategoryFilter = true,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  // Only fetch categories if we're showing the category filter
  const categories = showCategoryFilter ? await getCategoryTree() : []

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

            {/* Category Filter Section */}
            <CategoryFilter
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />
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
