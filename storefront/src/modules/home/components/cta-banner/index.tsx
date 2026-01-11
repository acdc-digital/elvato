"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShieldCheck, Truck } from "lucide-react"

const CtaBanner = () => {
  return (
    <div className="w-full bg-white">
      <div className="px-8 small:px-12 pt-8 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Submittal Sheet CTA */}
          <div className="flex items-center gap-4">
            <p className="text-lg font-mono text-black">
              Need a Submittal Sheet?
            </p>
            <LocalizedClientLink
              href="/configurator"
              className="text-md font-mono uppercase tracking-wider text-black underline-offset-4 hover:underline transition-all duration-200"
            >
              Document Library
            </LocalizedClientLink>
          </div>

          {/* 30-Day Guarantee */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <p className="text-lg font-mono text-black">
              30-Day Money Back Guarantee
            </p>
          </div>

          {/* Free Shipping */}
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <p className="text-lg font-mono text-black">
              Free Shipping Over $1500
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CtaBanner
