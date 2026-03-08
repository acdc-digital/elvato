"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
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
            "flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-150 cursor-pointer",
            isSelected
              ? "bg-grey-90 text-white shadow-sm"
              : "hover:bg-grey-5",
            depth > 0 && "ml-4"
          )}
        >
          <div
            className="flex items-center gap-2.5 flex-1 min-w-0"
            onClick={() => handleCategorySelect(category.id)}
          >
            <span
              className={clx(
                "text-[13px] font-medium leading-snug truncate",
                isSelected ? "text-white" : "text-grey-80"
              )}
            >
              {category.name}
            </span>
            {category.productCount !== undefined && category.productCount > 0 && (
              <span
                className={clx(
                  "text-[11px] tabular-nums flex-shrink-0",
                  isSelected ? "text-white/60" : "text-grey-30"
                )}
              >
                {category.productCount}
              </span>
            )}
          </div>

          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(category.id)
              }}
              className={clx(
                "p-1 rounded-lg flex-shrink-0 transition-colors",
                isSelected ? "hover:bg-white/10" : "hover:bg-grey-10"
              )}
            >
              {isExpanded ? (
                <ChevronDown className={clx("w-3.5 h-3.5", isSelected ? "text-white/60" : "text-grey-40")} />
              ) : (
                <ChevronRight className={clx("w-3.5 h-3.5", isSelected ? "text-white/60" : "text-grey-40")} />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-grey-10 ml-5 pl-1 mt-0.5">
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-grey-40">
          Categories
        </h3>
        {selectedCategoryIds.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-accent-600 hover:text-accent-700 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {categories.map((category) => renderCategory(category))}
      </div>

      {selectedCategoryIds.length > 0 && (
        <div className="mt-4 pt-3 border-t border-grey-10">
          <p className="text-[11px] text-grey-30">
            {selectedCategoryIds.length} filter
            {selectedCategoryIds.length > 1 ? "s" : ""} applied
          </p>
        </div>
      )}
    </div>
  )
}

export default CategoryFilter
