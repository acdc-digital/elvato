"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, Check } from "lucide-react"
import { clx } from "@medusajs/ui"

export const PER_PAGE_OPTIONS = [12, 24, 48, 100] as const
export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number]
export const DEFAULT_PER_PAGE: PerPageOption = 12

type PerPageDropdownProps = {
  perPage: PerPageOption
  "data-testid"?: string
}

const PerPageDropdown = ({
  perPage,
  "data-testid": dataTestId,
}: PerPageDropdownProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handlePerPageChange = useCallback(
    (value: PerPageOption) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === DEFAULT_PER_PAGE) {
        params.delete("limit")
      } else {
        params.set("limit", value.toString())
      }
      params.delete("page") // Reset pagination on limit change
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
        <span className="txt-compact-small text-ui-fg-subtle">Show:</span>
        <span className="txt-compact-small-plus text-ui-fg-base">
          {perPage} per page
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
          {PER_PAGE_OPTIONS.map((option) => {
            const isSelected = option === perPage
            return (
              <button
                key={option}
                onClick={() => handlePerPageChange(option)}
                className={clx(
                  "w-full flex items-center justify-between px-4 py-2 text-small-regular transition-colors",
                  "hover:bg-ui-bg-subtle",
                  isSelected
                    ? "text-ui-fg-base font-medium"
                    : "text-ui-fg-subtle"
                )}
              >
                <span>{option} per page</span>
                {isSelected && <Check className="w-4 h-4 text-ui-fg-base" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PerPageDropdown
