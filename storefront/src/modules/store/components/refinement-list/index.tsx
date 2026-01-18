import { getCategoryTree, CategoryNode } from "@lib/data/categories"
import CategoryFilter from "./category-filter"
import SortDropdown from "./sort-dropdown"
import MobileFilters from "./mobile-filters"
import ActiveFilters from "./active-filters"

// Re-export types for backwards compatibility
export { type SortOptions } from "./sort-dropdown"
export type { CategoryNode }

type RefinementListProps = {
  sortBy: "price_asc" | "price_desc" | "created_at"
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
  selectedCategoryIds = [],
  showCategoryFilter = true,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  // Only fetch categories if we're showing the category filter
  const categories = showCategoryFilter ? await getCategoryTree() : []

  return (
    <div
      className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]"
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
            <SortDropdown sortBy={sortBy} data-testid="mobile-sort" />
          </div>

          {/* Mobile: Active filters */}
          <div className="small:hidden">
            <ActiveFilters
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />
          </div>

          {/* Desktop: Sidebar layout */}
          <div className="hidden small:block">
            {/* Sort Section */}
            <div className="mb-6 pb-6 border-b border-ui-border-base">
              <h3 className="txt-compact-small-plus text-ui-fg-muted mb-4">
                Sort by
              </h3>
              <SortDropdown sortBy={sortBy} data-testid="desktop-sort" />
            </div>

            {/* Category Filter Section */}
            <CategoryFilter
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
            />
          </div>
        </>
      ) : (
        // Simple sort-only view for category pages
        <SortDropdown sortBy={sortBy} data-testid={dataTestId} />
      )}
    </div>
  )
}

export default RefinementList
