"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"

type SearchInputProps = {
  "data-testid"?: string
}

const SearchInput = ({ "data-testid": dataTestId }: SearchInputProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const [value, setValue] = useState(searchParams.get("q") || "")

  useEffect(() => {
    setValue(searchParams.get("q") || "")
  }, [searchParams])

  const pushQuery = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set("q", query.trim())
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushQuery(next), 400)
  }

  const handleClear = () => {
    setValue("")
    pushQuery("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      pushQuery(value)
    }
  }

  return (
    <div className="relative" data-testid={dataTestId}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-40 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search products…"
        className="w-full h-10 pl-9 pr-9 rounded-xl bg-grey-5 ring-1 ring-black/[0.06] text-[13px] text-grey-80 placeholder:text-grey-30 focus:outline-none focus:ring-2 focus:ring-accent-400/40 transition-shadow"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-grey-10 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5 text-grey-40" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
