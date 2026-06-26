"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { clx } from "@medusajs/ui"

interface FacetFilterProps {
  /** Section heading */
  title: string
  /** URL search parameter name for this facet (e.g. "materials", "room_types") */
  paramName: string
  /** Map of facet value → document count from Meilisearch */
  facets: Record<string, number>
  /** Currently selected values (parsed from URL) */
  selectedValues: string[]
  /** Max items visible before "Show more" toggle (default 8) */
  initialLimit?: number
  /** Optional additional CSS class */
  className?: string
}

const FacetFilter = ({
  title,
  paramName,
  facets,
  selectedValues,
  initialLimit = 8,
  className,
}: FacetFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)

  // Sort facets: selected first, then by count descending
  const sortedEntries = Object.entries(facets).sort(([aKey, aCount], [bKey, bCount]) => {
    const aSelected = selectedValues.includes(aKey) ? 1 : 0
    const bSelected = selectedValues.includes(bKey) ? 1 : 0
    if (aSelected !== bSelected) return bSelected - aSelected
    return bCount - aCount
  })

  const visibleEntries = expanded
    ? sortedEntries
    : sortedEntries.slice(0, initialLimit)

  const hasMore = sortedEntries.length > initialLimit

  const handleToggle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = params.get(paramName)?.split(",").filter(Boolean) || []
      const isSelected = current.includes(value)

      if (isSelected) {
        const filtered = current.filter((v) => v !== value)
        if (filtered.length > 0) {
          params.set(paramName, filtered.join(","))
        } else {
          params.delete(paramName)
        }
      } else {
        params.set(paramName, [...current, value].join(","))
      }

      params.delete("page")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router, paramName]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router, paramName])

  if (sortedEntries.length === 0) return null

  return (
    <div className={clx("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-grey-40">
          {title}
        </h3>
        {selectedValues.length > 0 && (
          <button
            onClick={clearAll}
            className="text-[11px] text-accent-600 hover:text-accent-700 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {visibleEntries.map(([value, count]) => {
          const isSelected = selectedValues.includes(value)
          return (
            <div
              key={value}
              className={clx(
                "flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-150 cursor-pointer",
                isSelected
                  ? "bg-grey-90 text-white"
                  : "hover:bg-grey-5"
              )}
              onClick={() => handleToggle(value)}
            >
              <span
                className={clx(
                  "text-[13px] font-medium leading-snug truncate",
                  isSelected ? "text-white" : "text-grey-80"
                )}
              >
                {value}
              </span>
              <span
                className={clx(
                  "text-[11px] tabular-nums flex-shrink-0 ml-2",
                  isSelected ? "text-white/60" : "text-grey-30"
                )}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 px-3 py-1.5 text-[11px] font-medium text-grey-40 hover:text-grey-60 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronDown className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="w-3 h-3" />
              Show all ({sortedEntries.length})
            </>
          )}
        </button>
      )}

      {selectedValues.length > 0 && (
        <div className="mt-3 pt-2 border-t border-grey-10">
          <p className="text-[11px] text-grey-30">
            {selectedValues.length} selected
          </p>
        </div>
      )}
    </div>
  )
}

export default FacetFilter
