import { HttpTypes } from "@medusajs/types"
import CountrySelectCompact from "./country-select-compact"
import Stripe from "@modules/common/icons/stripe"
import PayPalColored from "@modules/common/icons/paypal-colored"

type AnnouncementBannerProps = {
  regions: HttpTypes.StoreRegion[] | null
}

export default function AnnouncementBanner({ regions }: AnnouncementBannerProps) {
  return (
    <div className="w-full bg-white border-b border-black">
      <div className="content-container py-1.5 flex items-center justify-between">
        <p className="text-sm font-mono text-black flex items-center gap-1 whitespace-nowrap">
          Elvato; <img src="/black-leaf.svg" alt="" className="w-4 h-4 inline-block" /> Canadian pure-play lighting e-tailor.<span className="hidden md:inline"> Lighting, Controls, Deisgn for your next project.</span>
        </p>
        <div className="flex items-center gap-x-4">
          {/* Payment badges */}
          <div className="hidden sm:flex items-center gap-x-1.5">
            <div
              className="flex items-center gap-x-1.5 border border-gray-200 rounded-md px-2 py-1 bg-white"
              title="Pay with Stripe"
            >
              <Stripe />
              <span className="text-xs font-bold tracking-tight" style={{ color: '#635BFF' }}>stripe</span>
            </div>
            <div
              className="flex items-center gap-x-1.5 border border-gray-200 rounded-md px-2 py-1 bg-white"
              title="Pay with PayPal"
            >
              <PayPalColored />
              <span className="text-xs font-bold tracking-tight">
                <span style={{ color: '#003087' }}>Pay</span>
                <span style={{ color: '#009CDE' }}>Pal</span>
              </span>
            </div>
          </div>
          {/* Divider */}
          <div className="hidden sm:block h-4 w-px bg-gray-300" />
          {/* Region selector */}
          {regions && (
            <CountrySelectCompact regions={regions} />
          )}
        </div>
      </div>
    </div>
  )
}
