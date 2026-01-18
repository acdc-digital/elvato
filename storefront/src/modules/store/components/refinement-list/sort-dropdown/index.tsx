"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, Check } from "lucide-react"
import { clx } from "@medusajs/ui"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Latest Arrivals" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

type SortDropdownProps = {
  sortBy: SortOptions
  "data-testid"?: string
}

const SortDropdown = ({
  sortBy,
  "data-testid": dataTestId,
}: SortDropdownProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === sortBy) || SORT_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSort = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sortBy", value)
      params.delete("page") // Reset pagination on sort change
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
      setIsOpen(false)
    },
    [searchParams, pathname, router]
  )

  return (
    <div ref={dropdownRef} className="relative" data-testid={dataTestId}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clx(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
          "hover:border-ui-border-strong focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive",
          isOpen
            ? "border-ui-border-strong bg-ui-bg-subtle"
            : "border-ui-border-base bg-ui-bg-base"
        )}
      >
        <span className="txt-compact-small text-ui-fg-subtle">Sort:</span>
        <span className="txt-compact-small-plus text-ui-fg-base">
          {selectedOption.label}
        </span>
        <ChevronDown
          className={clx(
            "w-4 h-4 text-ui-fg-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-ui-bg-base rounded-lg shadow-elevation-card-rest border border-ui-border-base py-1 z-50">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === sortBy
            return (
              <button
                key={option.value}
                onClick={() => handleSort(option.value)}
                className={clx(
                  "w-full flex items-center justify-between px-4 py-2 text-small-regular transition-colors",
                  "hover:bg-ui-bg-subtle",
                  isSelected ? "text-ui-fg-base font-medium" : "text-ui-fg-subtle"
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-ui-fg-base" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SortDropdown
