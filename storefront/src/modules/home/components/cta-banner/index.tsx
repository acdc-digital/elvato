"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FileText, Headphones, Star } from "lucide-react"

const CtaBanner = () => {
  return (
    <div className="w-full bg-white">
      <div className="px-8 small:px-12 pt-8 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Submittal Sheets */}
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <p className="text-lg font-sans text-black">
              Submittal Sheets Available
            </p>
          </div>

          {/* Expert Support */}
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            <LocalizedClientLink
              href="/design-services"
              className="text-lg font-sans text-black hover:underline underline-offset-4 transition-all duration-200"
            >
              Expert Lighting Support
            </LocalizedClientLink>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Star className="w-4 h-4 fill-black text-black" />
              <Star className="w-4 h-4 fill-black text-black" />
              <Star className="w-4 h-4 fill-black text-black" />
              <Star className="w-4 h-4 fill-black text-black" />
              <Star className="w-4 h-4 fill-black text-black" />
            </div>
            <p className="text-lg font-sans text-black">
              5.0 Rating
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CtaBanner
