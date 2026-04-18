"use client"

type QuantitySelectorProps = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

/**
 * Compact +/- quantity stepper styled to match the product page surface
 * (rounded border, ui-border-base, ui-bg-subtle hover). Sits inline next
 * to the price.
 */
const QuantitySelector = ({
  value,
  onChange,
  min = 0,
  max = 99,
  disabled,
}: QuantitySelectorProps) => {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  const btn =
    "flex h-9 w-9 items-center justify-center text-ui-fg-base transition-colors hover:bg-ui-bg-subtle disabled:text-ui-fg-disabled disabled:hover:bg-transparent"

  return (
    <div
      className="inline-flex items-center rounded-md border border-ui-border-base bg-ui-bg-base overflow-hidden"
      data-testid="quantity-selector"
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className={btn}
        aria-label="Decrease quantity"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>
      <span
        className="w-9 text-center text-sm font-medium text-ui-fg-base tabular-nums select-none"
        aria-live="polite"
        data-testid="quantity-value"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        className={btn}
        aria-label="Increase quantity"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

export default QuantitySelector
