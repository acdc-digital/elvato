"use client"

import { useState, useRef, useEffect } from "react"

const SearchButton = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchOpen])

  if (searchOpen) {
    return (
      <div 
        ref={headerRef}
        className="absolute inset-0 z-[60] bg-white flex items-center justify-center px-6"
        style={{ background: 'linear-gradient(to bottom right, #f8f8f8, #ffffff)' }}
      >
        <form action="/store" method="get" className="w-full max-w-3xl">
          <div className="flex items-center border border-black bg-white">
            <input
              ref={inputRef}
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 px-4 py-2 text-sm font-sans focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-3 py-2 hover:bg-gray-100 transition-colors"
              aria-label="Submit search"
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
          </div>
        </form>
        <button
          onClick={() => {
            setSearchOpen(false)
            setSearchQuery("")
          }}
          className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close search"
        >
          <svg 
            className="w-6 h-6" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setSearchOpen(true)}
      className="h-full flex items-center text-black hover:text-gray-400 transition-colors"
      aria-label="Search"
      data-testid="nav-search-button"
    >
      <svg 
        className="w-6 h-6" 
        viewBox="0 0 64 64" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3"
      >
        <circle cx="27" cy="27" r="15" />
        <path d="M38 38L50 50" />
      </svg>
    </button>
  )
}

export default SearchButton
