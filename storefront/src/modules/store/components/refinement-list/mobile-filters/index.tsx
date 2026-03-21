"use client"

import { useState } from "react"
import { X, SlidersHorizontal } from "lucide-react"
import { clx } from "@medusajs/ui"
import { CategoryNode } from "@lib/data/categories-client"
import CategoryFilter from "../category-filter"
import FacetFilter from "../facet-filter"

interface MobileFiltersProps {
  categories: CategoryNode[]
  selectedCategoryIds: string[]
  roomTypeFacets?: Record<string, number>
  materialFacets?: Record<string, number>
  styleFacets?: Record<string, number>
  subCategoryFacets?: Record<string, number>
  selectedRoomTypes?: string[]
  selectedMaterials?: string[]
  selectedStyles?: string[]
  selectedSubCategories?: string[]
}

const MobileFilters = ({
  categories,
  selectedCategoryIds,
  roomTypeFacets = {},
  materialFacets = {},
  styleFacets = {},
  subCategoryFacets = {},
  selectedRoomTypes = [],
  selectedMaterials = [],
  selectedStyles = [],
  selectedSubCategories = [],
}: MobileFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const totalActiveFilters =
    selectedCategoryIds.length +
    selectedRoomTypes.length +
    selectedMaterials.length +
    selectedStyles.length +
    selectedSubCategories.length

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-ui-border-base rounded-lg bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4 text-ui-fg-subtle" />
        <span className="txt-compact-small-plus text-ui-fg-base">Filters</span>
        {totalActiveFilters > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xsmall-semibold bg-ui-fg-base text-ui-bg-base rounded-full">
            {totalActiveFilters}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ui-bg-overlay z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={clx(
          "fixed inset-y-0 left-0 w-full max-w-sm bg-ui-bg-base z-50 transform transition-transform duration-300 shadow-elevation-modal",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ui-border-base">
          <h2 className="text-large-semi text-ui-fg-base">Filters</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-ui-bg-subtle rounded-full transition-colors"
            aria-label="Close filters"
            title="Close filters"
          >
            <X className="w-5 h-5 text-ui-fg-subtle" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-140px)] space-y-6">
          {/* Room Type — top-level */}
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

          {/* Categories */}
          <CategoryFilter
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
          />

          {/* Sub-Categories */}
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ui-border-base bg-ui-bg-base">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-ui-fg-base text-ui-bg-base rounded-lg font-medium hover:bg-ui-fg-subtle transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    </>
  )
}

export default MobileFilters
