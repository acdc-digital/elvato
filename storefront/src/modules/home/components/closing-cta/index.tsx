import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Closing invitation — the deliberate end of the homepage. One clear next step
 * for visitors who scrolled the whole page: start shopping. Kept light and
 * editorial, in step with the design-services band above it.
 */
export default function ClosingCta() {
  return (
    <section className="w-full bg-canvas py-12 small:py-16">
      <div className="mx-auto flex max-w-8xl flex-col items-center px-6 text-center small:px-14">
        <div className="flex max-w-4xl flex-col items-center">
        <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
          Light, considered
        </p>
        <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
          Bring your space to light.
        </h2>
        <p className="mt-6 max-w-xl font-sans text-[15px] leading-relaxed text-grey-60">
          Our supplier catalogue is being refreshed. Explore the core lighting
          categories or ask our team for sourcing help while the next edit is
          prepared.
        </p>

        <div className="mt-9 flex flex-col gap-3 xsmall:flex-row xsmall:gap-4">
          <LocalizedClientLink
            href="/store"
            className="group inline-flex items-center justify-center gap-2 border border-black bg-black px-8 py-4 font-sans text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black"
          >
            Shop all lighting
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.75}
            />
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/categories/chandeliers"
            className="inline-flex items-center justify-center gap-2 border border-black px-8 py-4 font-sans text-sm font-medium text-black transition-all duration-200 hover:bg-grey-90 hover:text-white hover:border-grey-90"
          >
            Browse chandeliers
          </LocalizedClientLink>
        </div>

        <p className="mt-7 font-sans text-[12px] uppercase tracking-[0.22em] text-grey-40">
          Free shipping · 365-day warranty · 5.0 rated
        </p>
        </div>
      </div>
    </section>
  )
}
