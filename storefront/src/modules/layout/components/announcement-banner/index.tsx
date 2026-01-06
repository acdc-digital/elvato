import { HttpTypes } from "@medusajs/types"
import CountrySelectCompact from "./country-select-compact"

type AnnouncementBannerProps = {
  regions: HttpTypes.StoreRegion[] | null
}

export default function AnnouncementBanner({ regions }: AnnouncementBannerProps) {
  return (
    <div className="w-full bg-white border-b border-black">
      <div className="content-container py-3 flex items-center justify-between">
        <p className="text-sm font-mono text-black flex items-center gap-1 whitespace-nowrap">
          Elvato; <img src="/black-leaf.svg" alt="" className="w-4 h-4 inline-block" /> Canadian pure-play lighting e-tailor.<span className="hidden md:inline"> Lighting & Controls for your next project.</span>
        </p>
        {regions && (
          <CountrySelectCompact regions={regions} />
        )}
      </div>
    </div>
  )
}
