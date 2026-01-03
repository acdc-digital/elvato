"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SearchButton = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="relative">
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="h-full flex items-center hover:text-ui-fg-base"
        aria-label="Search"
        data-testid="nav-search-button"
      >
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 64 64" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
        >
          <circle cx="27" cy="27" r="15" />
          <path d="M38 38L50 50" />
        </svg>
      </button>

      {/* Search Dropdown */}
      {searchOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search Panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-ui-border-base shadow-lg z-50 p-4">
            <form action="/store" method="get">
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-3 py-2 border border-ui-border-base text-sm focus:outline-none focus:border-ui-fg-base"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-ui-fg-base text-white text-sm hover:bg-ui-fg-subtle transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="mt-3">
              <LocalizedClientLink
                href="/store"
                className="text-sm text-ui-fg-subtle hover:text-ui-fg-base"
                onClick={() => setSearchOpen(false)}
              >
                Browse all products →
              </LocalizedClientLink>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SearchButton
