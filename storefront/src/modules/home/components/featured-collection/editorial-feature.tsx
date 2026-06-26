import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type Feature = {
  /** Editorial sub-line / category name shown as the large caption. */
  title: string
  /** Small uppercase descriptor above the title. */
  eyebrow: string
  /** Locally-hosted, uniformly-graded interior photograph. */
  image: string | null
  /** Where the card routes — a collection page (or /store for the signature). */
  href: string
  /** Hover-revealed meta line, e.g. "10 designs". */
  meta: string
}

/**
 * A single editorial frame. Large-format photography, a quiet caption that
 * fades up on hover, and a restrained meta line so the layout sells the
 * *room* — never the discount. Each frame routes to its collection.
 */
function Frame({
  feature,
  index,
  sizes,
  priority = false,
  className = "",
}: {
  feature: Feature
  index: number
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <LocalizedClientLink
      href={feature.href}
      className={`group relative block overflow-hidden rounded-[18px] bg-grey-10 ring-1 ring-black/10 ${className}`}
    >
      {feature.image ? (
        <Image
          src={feature.image}
          alt={`${feature.title} — ${feature.eyebrow} by Elvato`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs text-grey-40">
          Elvato
        </div>
      )}

      {/* Smoky caption wash — preserves the photo while meeting text contrast. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[72%] bg-[linear-gradient(to_top,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.66)_18%,rgba(0,0,0,0.42)_42%,rgba(0,0,0,0.16)_70%,rgba(0,0,0,0)_100%)] transition-opacity duration-500"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/22 via-transparent to-transparent"
      />

      {/* Index marker — editorial numbering */}
      <span className="absolute left-5 top-5 font-sans text-[11px] tracking-[0.3em] text-white/70">
        {String(index).padStart(2, "0")}
      </span>

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="mb-1.5 font-sans text-[10px] uppercase tracking-[0.32em] text-[#f2d99b]">
          {feature.eyebrow}
        </p>
        <h3 className="font-sans text-lg leading-snug text-white sm:text-xl">
          {feature.title}
        </h3>
        <div className="mt-3 flex items-center gap-2 text-white/85 transition-colors duration-300 group-hover:text-white">
          <span className="font-sans text-[12px] tracking-wide">
            {feature.meta}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </div>
    </LocalizedClientLink>
  )
}

/**
 * The Elvato Edit — an editorial, asymmetric feature for the curated
 * collection. Smoky charcoal canvas, varied image scales, large negative
 * space. The room is the hero; the products are how you get there.
 */
export default function EditorialFeature({
  features,
  totalCount,
}: {
  features: Feature[]
  totalCount: number
}) {
  const [hero, t1, t2, t3, t4] = features

  return (
    <section className="relative w-full overflow-hidden bg-canvas py-12 small:py-16">
      <div className="relative mx-auto max-w-8xl px-6 small:px-14">
        {/* Editorial header — two columns, plenty of air */}
        <header className="mb-12 grid grid-cols-1 gap-8 small:mb-16 small:grid-cols-12 small:gap-12">
          <div className="small:col-span-7">
            <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
              The Elvato Edit · Vol. 01
            </p>
            <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
              Rooms, rewritten
              <br />
              in light.
            </h2>
          </div>
          <div className="flex flex-col justify-end small:col-span-5">
            <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
              A short, curated selection from our design team — smoked glass,
              sculptural silhouettes, and a quiet sense of arrival. Chosen not
              to fill a cart, but to finish a room.
            </p>
            <LocalizedClientLink
              href="/store"
              className="group mt-6 inline-flex w-fit items-center gap-2 border-b border-grey-40 pb-1 font-sans text-sm tracking-wide text-grey-90 transition-colors hover:border-grey-90"
            >
              Explore all {totalCount} pieces
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </LocalizedClientLink>
          </div>
        </header>

        {/* Band A — hero + stacked pair */}
        <div className="grid grid-cols-1 gap-5 small:grid-cols-12 small:gap-6">
          <Frame
            feature={hero}
            index={1}
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="aspect-[4/5] small:col-span-7 small:aspect-auto small:min-h-[640px]"
          />
          <div className="grid grid-cols-1 gap-5 small:col-span-5 small:gap-6">
            <Frame
              feature={t1}
              index={2}
              sizes="(max-width: 1024px) 100vw, 41vw"
              className="aspect-[16/11]"
            />
            <Frame
              feature={t2}
              index={3}
              sizes="(max-width: 1024px) 100vw, 41vw"
              className="aspect-[16/11]"
            />
          </div>
        </div>

        {/* Band B — wide + editorial panel + portrait */}
        <div className="mt-5 grid grid-cols-1 gap-5 small:mt-6 small:grid-cols-12 small:gap-6">
          <Frame
            feature={t3}
            index={4}
            sizes="(max-width: 1024px) 100vw, 41vw"
            className="aspect-[4/3] small:col-span-5"
          />

          {/* Editorial copy panel — negative space + point of view */}
          <div className="flex flex-col justify-between rounded-[18px] border border-grey-20 bg-white/60 p-7 small:col-span-3 small:p-8">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-accent-700">
              Curated, not catalogued
            </p>
            <blockquote className="mt-6 font-sans text-xl font-medium leading-snug text-grey-90 small:text-2xl">
              “Good lighting doesn&apos;t announce itself. It just makes
              everything else look intentional.”
            </blockquote>
            <LocalizedClientLink
              href="/design-services"
              className="group mt-8 inline-flex w-fit items-center gap-2 font-sans text-sm tracking-wide text-grey-60 transition-colors hover:text-grey-90"
            >
              Ask about sourcing
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </LocalizedClientLink>
          </div>

          <Frame
            feature={t4}
            index={5}
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="aspect-[4/5] small:col-span-4"
          />
        </div>
      </div>
    </section>
  )
}
