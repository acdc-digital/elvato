"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Check } from "lucide-react"
import { clx } from "@medusajs/ui"
import { CategoryNode } from "@lib/data/categories-client"

interface CategoryFilterProps {
  categories: CategoryNode[]
  selectedCategoryIds: string[]
}

const CategoryFilter = ({
  categories,
  selectedCategoryIds,
}: CategoryFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )

  const toggleExpanded = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString())

      // Toggle category selection
      const currentCategories = params.get("category_id")?.split(",") || []
      const isSelected = currentCategories.includes(categoryId)

      if (isSelected) {
        const filtered = currentCategories.filter((id) => id !== categoryId)
        if (filtered.length > 0) {
          params.set("category_id", filtered.join(","))
        } else {
          params.delete("category_id")
        }
      } else {
        const newCategories = currentCategories.filter((id) => id !== "")
        params.set("category_id", [...newCategories, categoryId].join(","))
      }

      // Reset to page 1 when filtering
      params.delete("page")

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category_id")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const renderCategory = (category: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategoryIds.includes(category.id)
    const hasChildren = category.children.length > 0

    return (
      <div key={category.id} className="w-full">
        <div
          className={clx(
            "flex items-center justify-between py-2 px-3 rounded-md transition-colors",
            "hover:bg-ui-bg-subtle cursor-pointer",
            isSelected && "bg-ui-bg-subtle-hover font-medium",
            depth > 0 && "ml-4 text-small-regular"
          )}
        >
          <div
            className="flex items-center gap-2 flex-1"
            onClick={() => handleCategorySelect(category.id)}
          >
            <div
              className={clx(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                isSelected
                  ? "bg-ui-fg-base border-ui-fg-base"
                  : "border-ui-border-base"
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-ui-bg-base" />}
            </div>
            <span className="text-ui-fg-base text-small-regular">
              {category.name}
            </span>
            {category.productCount !== undefined && category.productCount > 0 && (
              <span className="text-ui-fg-subtle text-xsmall-regular">
                ({category.productCount})
              </span>
            )}
          </div>

          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(category.id)
              }}
              className="p-1 hover:bg-ui-bg-subtle-hover rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-ui-fg-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-ui-fg-muted" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-ui-border-base ml-5 pl-1">
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="txt-compact-small-plus text-ui-fg-muted">Categories</h3>
        {selectedCategoryIds.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-small-regular text-ui-fg-subtle hover:text-ui-fg-base underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {categories.map((category) => renderCategory(category))}
      </div>

      {selectedCategoryIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ui-border-base">
          <p className="text-small-regular text-ui-fg-subtle">
            {selectedCategoryIds.length} filter
            {selectedCategoryIds.length > 1 ? "s" : ""} applied
          </p>
        </div>
      )}
    </div>
  )
}

export default CategoryFilter
