"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"

type ShippingTier = {
  id: string
  label: string
  days: string
  surcharge: number
  formatted: string | null
}

type ShippingSelectorProps = {
  variant?: HttpTypes.StoreProductVariant
  currencyCode: string
  selectedSurcharge: number
  onSurchargeChange: (surcharge: number) => void
}

export default function ShippingSelector({
  variant,
  currencyCode,
  selectedSurcharge,
  onSurchargeChange,
}: ShippingSelectorProps) {
  const tiers = useMemo(() => {
    const meta = (variant as any)?.metadata as Record<string, any> | undefined
    const options: ShippingTier[] = [
      {
        id: "free",
        label: "Free Shipping",
        days: "10-21 business days",
        surcharge: 0,
        formatted: null,
      },
    ]

    if (meta?.expeditedTier1Surcharge != null && meta.expeditedTier1Surcharge > 0) {
      const surchargeInCents = meta.expeditedTier1Surcharge * 100
      options.push({
        id: "tier1",
        label: meta.expeditedTier1DisplayName || "USPS Priority",
        days: meta.expeditedTier1Days || "7-14 business days",
        surcharge: surchargeInCents,
        formatted: convertToLocale({
          amount: surchargeInCents,
          currency_code: currencyCode,
        }),
      })
    }

    if (meta?.expeditedTier2Surcharge != null && meta.expeditedTier2Surcharge > 0) {
      const surchargeInCents = meta.expeditedTier2Surcharge * 100
      options.push({
        id: "tier2",
        label: meta.expeditedTier2DisplayName || "DHL Express",
        days: meta.expeditedTier2Days || "3-7 business days",
        surcharge: surchargeInCents,
        formatted: convertToLocale({
          amount: surchargeInCents,
          currency_code: currencyCode,
        }),
      })
    }

    return options
  }, [variant, currencyCode])

  // Don't render if only free shipping is available
  if (tiers.length <= 1) {
    return (
      <div className="flex items-center gap-x-2 text-xs text-ui-fg-muted py-2">
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-8.688 2.014 2.014 0 0 0-1.527-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <span>Free Shipping · 10-21 business days</span>
      </div>
    )
  }

  const selectedTier = tiers.find((t) => t.surcharge === selectedSurcharge) || tiers[0]

  return (
    <div className="flex flex-col gap-y-1.5 py-2">
      <label
        htmlFor="shipping-speed"
        className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted"
      >
        Shipping Speed
      </label>
      <select
        id="shipping-speed"
        value={selectedTier.id}
        onChange={(e) => {
          const tier = tiers.find((t) => t.id === e.target.value)
          if (tier) {
            onSurchargeChange(tier.surcharge)
            try {
              localStorage.setItem("shipping_preference", tier.id)
            } catch {
              // localStorage unavailable
            }
          }
        }}
        className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive focus:border-ui-border-interactive cursor-pointer"
      >
        {tiers.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.label} · {tier.days}
            {tier.formatted ? ` · +${tier.formatted}` : ""}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-ui-fg-muted">
        Shipping cost applies once per order
      </p>
    </div>
  )
}
