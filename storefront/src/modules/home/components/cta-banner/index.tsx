"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Headphones, ShieldCheck, Truck, Star } from "lucide-react"

const CtaBanner = () => {
  return (
    <div className="w-full bg-white">
      <div className="px-8 small:px-12 pt-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-6">
          {/* Expert Support */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              <LocalizedClientLink
                href="/design-services"
                className="text-lg font-sans text-black hover:underline underline-offset-4 transition-all duration-200"
              >
                Expert Lighting Support
              </LocalizedClientLink>
            </div>
            <div className="md:pl-7 font-sans text-sm leading-relaxed text-grey-50">
              <a
                href="tel:18009492347"
                className="block transition-colors hover:text-black"
              >
                1-800-949-2347
              </a>
              <a
                href="mailto:support@elvato.com"
                className="block transition-colors hover:text-black"
              >
                support@elvato.com
              </a>
            </div>
          </div>

          {/* 365-Day Warranty */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-lg font-sans text-black">365-Day Warranty</p>
            </div>
            <p className="md:pl-7 max-w-[15rem] font-sans text-sm leading-relaxed text-grey-50">
              Every luminaire fully covered for a full year — no fine print.
            </p>
          </div>

          {/* Free Shipping */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <p className="text-lg font-sans text-black">Free Shipping</p>
            </div>
            <p className="md:pl-7 max-w-[15rem] font-sans text-sm leading-relaxed text-grey-50">
              Standard shipping always free. Expedited rates available at checkout.
            </p>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-black text-black" />
                <Star className="w-4 h-4 fill-black text-black" />
                <Star className="w-4 h-4 fill-black text-black" />
                <Star className="w-4 h-4 fill-black text-black" />
                <Star className="w-4 h-4 fill-black text-black" />
              </div>
              <p className="text-lg font-sans text-black">5.0 Rating</p>
            </div>
            <p className="font-sans text-sm leading-relaxed text-grey-50">
              Thousands of five-star reviews from designers and homeowners.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CtaBanner
