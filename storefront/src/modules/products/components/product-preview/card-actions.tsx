"use client"

import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"
import { useState } from "react"

type CardActionsProps = {
  variantId: string | null
  productHandle: string
}

export default function CardActions({ variantId, productHandle }: CardActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!variantId) return

    setIsAdding(true)
    try {
      await addToCart({ variantId, quantity, countryCode })
    } catch {
      // silently fail – cart state will surface errors
    } finally {
      setIsAdding(false)
    }
  }

  const decrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuantity((q) => Math.max(1, q - 1))
  }

  const increment = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuantity((q) => Math.min(10, q + 1))
  }

  return (
    <div className="flex items-center gap-2 px-4 pb-4 pt-0">
      {/* Quantity picker */}
      <div className="flex items-center h-9 rounded-lg ring-1 ring-black/[0.08] bg-grey-5 overflow-hidden flex-shrink-0">
        <button
          onClick={decrement}
          disabled={quantity <= 1 || isAdding}
          className="w-8 h-full flex items-center justify-center text-grey-50 hover:text-grey-80 hover:bg-grey-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="w-7 text-center text-[13px] font-medium text-grey-80 tabular-nums select-none">
          {quantity}
        </span>
        <button
          onClick={increment}
          disabled={quantity >= 10 || isAdding}
          className="w-8 h-full flex items-center justify-center text-grey-50 hover:text-grey-80 hover:bg-grey-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increase quantity"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAdd}
        disabled={!variantId || isAdding}
        className="flex-1 h-9 rounded-lg bg-grey-90 text-white text-[12px] font-medium tracking-wide hover:bg-grey-80 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {isAdding ? (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  )
}
