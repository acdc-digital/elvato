import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Closing invitation — the deliberate end of the homepage. One clear next step
 * for visitors who scrolled the whole page: start shopping. Kept light and
 * editorial to balance the dark design-services band above it.
 */
export default function ClosingCta() {
  return (
    <section className="w-full bg-warm px-6 small:px-14 py-20 small:py-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
          Light, considered
        </p>
        <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
          Bring your space to light.
        </h2>
        <p className="mt-6 max-w-xl font-sans text-[15px] leading-relaxed text-grey-60">
          Hundreds of curated fixtures, fair pricing, and a team that knows
          lighting — ready to ship to your door. Find the piece that finishes
          your room.
        </p>

        <div className="mt-9 flex flex-col gap-3 xsmall:flex-row xsmall:gap-4">
          <LocalizedClientLink
            href="/store"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-grey-90 px-8 py-4 font-sans text-sm font-medium text-white transition-colors hover:bg-grey-80"
          >
            Shop all lighting
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.75}
            />
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/collections"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-grey-30 px-8 py-4 font-sans text-sm font-medium text-grey-90 transition-colors hover:border-grey-90"
          >
            Browse collections
          </LocalizedClientLink>
        </div>

        <p className="mt-7 font-sans text-[12px] uppercase tracking-[0.22em] text-grey-40">
          Free shipping · 365-day warranty · 5.0 rated
        </p>
      </div>
    </section>
  )
}
