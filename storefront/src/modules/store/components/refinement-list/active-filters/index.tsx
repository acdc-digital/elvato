"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { X } from "lucide-react"
import { CategoryNode, flattenCategoryTree } from "@lib/data/categories-client"

interface ActiveFiltersProps {
  categories: CategoryNode[]
  selectedCategoryIds: string[]
}

const ActiveFilters = ({
  categories,
  selectedCategoryIds,
}: ActiveFiltersProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Build a flat map of category ID to name for quick lookups
  const categoryMap = flattenCategoryTree(categories)

  const removeFilter = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const currentCategories = params.get("category_id")?.split(",") || []
      const filtered = currentCategories.filter((id) => id !== categoryId)

      if (filtered.length > 0) {
        params.set("category_id", filtered.join(","))
      } else {
        params.delete("category_id")
      }
      params.delete("page")

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category_id")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  if (selectedCategoryIds.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <span className="txt-compact-small text-ui-fg-muted">
        Active filters:
      </span>

      {selectedCategoryIds.map((id) => {
        const category = categoryMap.get(id)
        return (
          <button
            key={id}
            onClick={() => removeFilter(id)}
            className="flex items-center gap-1 px-3 py-1 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover rounded-full text-small-regular text-ui-fg-base transition-colors group"
          >
            <span>{category?.name || id}</span>
            <X className="w-3 h-3 text-ui-fg-muted group-hover:text-ui-fg-base" />
          </button>
        )
      })}

      {selectedCategoryIds.length > 1 && (
        <button
          onClick={clearAll}
          className="txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base underline ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

export default ActiveFilters
