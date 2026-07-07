import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

/**
 * Editor's Picks — sourced live from Medusa so the thumbnail always matches
 * the actual product gallery. Never hardcode a static stock photo here: if a
 * product's real photos are wrong, fix them in Medusa, don't paper over it
 * with an unrelated local asset.
 */
const EDITORS_PICKS_HANDLES = [
  "half-circle-modern-chandelier-for-bedroom-dining-90112512",
  "modern-luxury-glass-bubble-chandelier-55049984",
  "nordic-glass-orb-chandelier-with-textured-design-76930304",
  "eclipse-resin-led-asymmetric-chandelier-4513445740",
  "postmodern-creative-chandelier-for-living-rooms-06790656",
]

async function getEditorsPicks(region: HttpTypes.StoreRegion) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    cacheScope: "public",
    queryParams: {
      handle: EDITORS_PICKS_HANDLES,
      limit: EDITORS_PICKS_HANDLES.length,
      fields: "id,handle,title,thumbnail",
    },
  })

  const byHandle = new Map(products.map((product) => [product.handle, product]))

  return EDITORS_PICKS_HANDLES.map((handle) => byHandle.get(handle)).filter(
    (product): product is HttpTypes.StoreProduct => Boolean(product?.thumbnail)
  )
}

const Hero = async ({ region }: { region: HttpTypes.StoreRegion }) => {
  const picks = await getEditorsPicks(region)

  return (
    <div className="w-full bg-canvas">
      <div className="mx-auto grid max-w-8xl grid-cols-1 lg:grid-cols-2">
        {/* Left: Content */}
        <div className="flex flex-col order-1 bg-canvas">
          {/* Buttons */}
          <div className="px-4 pt-4 pb-4 lg:px-8 lg:pt-6 lg:pb-0">
            <div className="flex flex-wrap gap-1">
              {[
                {
                  label: "Featured",
                  href: "/store",
                },
                { label: "Chandeliers", href: "/categories/chandeliers" },
                { label: "Pendants", href: "/categories/pendants" },
                { label: "Ceiling", href: "/categories/ceiling" },
                { label: "Wall", href: "/categories/wall" },
                { label: "Desk & Floor", href: "/categories/table-floor" },
                { label: "Outdoor", href: "/categories/outdoor" },
              ].map((badge) => (
                <LocalizedClientLink
                  key={badge.label}
                  href={badge.href}
                  className="px-3 py-1 text-sm font-sans font-medium uppercase tracking-wide text-black hover:underline underline-offset-4 transition-all duration-200"
                >
                  {badge.label}
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center flex-1 px-6 pt-0 pb-8 lg:px-10 lg:pt-0 lg:pb-10">
            <h1 className="m-0 text-4xl lg:text-7xl font-bold leading-tight font-sans">
              <span className="relative inline-block">
                <span className="relative z-10">Contemporary</span>
                <span
                  className="absolute left-0 bottom-[0.1em] w-full h-[0.35em] bg-accent-400/30 -z-0 -rotate-[0.5deg]"
                  aria-hidden="true"
                />
              </span>{" "}
              lighting for your next project.
            </h1>
            <p className="mt-5 lg:mt-7 text-sm lg:text-base leading-relaxed font-sans text-black">
              Elvato lighting is a curated sourcing destination for affordable,
              handpicked designs from manufacturers around the world.
            </p>
            
            <div className="flex flex-row gap-4 mt-8 lg:mt-10">
              <LocalizedClientLink
                href="/store"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-black text-white text-sm font-medium rounded-none border border-black transition-all duration-200 hover:bg-white hover:text-black"
              >
                SHOP NOW
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 px-9 py-4 text-black text-sm font-normal rounded-none border border-black transition-all duration-200 hover:bg-grey-70 hover:text-white"
              >
                SOURCING HELP
              </LocalizedClientLink>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-6 mt-6 text-xs font-sans text-gray-500">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>30-Day Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Free Shipping</span>
              </div>
              <span>Catalogue Refresh</span>
            </div>
          </div>

          {/* Mobile Ticker (horizontal) */}
          <div className="hidden border-t border-black overflow-hidden mt-8 -mx-6 px-0 h-14">
            <div className="flex flex-nowrap h-full items-center">
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center mr-4 flex-shrink-0 py-3">
                    <div className="w-7 mr-5">
                      <img 
                        src="/brand/scroll-E.svg" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-xl font-bold font-sans text-black">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</p>
                  </div>
                ))}
              </div>
              <div className="flex whitespace-nowrap animate-ticker flex-shrink-0">
                {[...Array(12)].map((_, i) => (
                  <div key={`dup-${i}`} className="flex items-center mr-4 flex-shrink-0 py-3">
                    <div className="w-7 mr-5">
                      <img 
                        src="/brand/scroll-E.svg" 
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="m-0 text-xl font-bold font-sans text-black">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Vertical Ticker */}
        {/* <div className="hidden lg:flex items-center justify-center order-2 bg-white border-l border-r border-black overflow-hidden relative">
          <div className="flex flex-col overflow-hidden h-full">
            <div className="flex flex-col animate-ticker-vertical">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-4">
                    <img 
                      src="/brand/scroll-E.svg" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</span>
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={`dup-${i}`} className="flex flex-col items-center py-3">
                  <div className="w-8 h-8 mb-4">
                    <img 
                      src="/brand/scroll-E.svg" 
                      alt=""
                      className="w-full h-auto"
                    />
                  </div>
                  <span className="writing-vertical text-2xl font-bold font-sans text-black rotate-180">{i % 2 === 0 ? 'COUPON' : 'SAVE15'}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Right: Featured Fixture — editorial large-format showcase */}
        <div className="order-3 flex flex-col overflow-hidden bg-canvas group/hero">
          {/* Editor's picks — top, just below the header */}
          <div className="px-6 pt-6 pb-4 lg:px-8 lg:pt-7 lg:pb-4">
            <div className="mb-3 flex items-center gap-3">
              <p className="font-sans text-sm font-medium uppercase tracking-wide text-black">
                Editor&apos;s Picks
              </p>
            </div>
            <div className="grid grid-cols-5 gap-2.5 lg:gap-3">
              {picks.map((product) => (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  aria-label={`Shop ${product.title}`}
                  className="group/pick relative block aspect-square overflow-hidden bg-grey-5 ring-1 ring-black/10 transition-all duration-300 hover:ring-black/30"
                >
                  <img
                    src={product.thumbnail ?? undefined}
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/pick:scale-110"
                  />
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          {/* Main fixture image — rounded card floating below the picks */}
          <div className="px-6 pb-6 lg:px-8 lg:pb-8">
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-grey-90 ring-1 ring-black/5">
              <div className="aspect-[4/5] w-full lg:aspect-[16/10]" />
              <LocalizedClientLink
                href="/products/nordic-minimalist-resin-art-chandelier"
                aria-label="Shop the Nordic Minimalist Resin Art Chandelier"
                className="absolute inset-0 z-0 block"
              >
                <Image
                  src="/hero/hero-2.jpg"
                  alt="Nordic Minimalist Resin Art Chandelier illuminating a contemporary room"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover/hero:scale-[1.04]"
                  style={{ objectPosition: "30% center" }}
                />
                {/* Legibility wash — darkened top and bottom so text reads on either end */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/10 to-black/80"
                />
              </LocalizedClientLink>

              {/* Top block — eyebrow, new-in marker, and the headline/description in the dark space */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-5 lg:p-7">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-[#e7c98a]">
                    The Featured Fixture
                  </p>
                  <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                    New In
                  </span>
                </div>
                <div className="mt-5 max-w-md lg:mt-6">
                  <h2 className="font-sans text-2xl font-semibold leading-tight text-white lg:text-3xl">
                    Nordic Minimalist Resin Art Chandelier
                  </h2>
                  {/* <p className="mt-2 font-sans text-sm leading-relaxed text-white/75">
                    Hand-selected for its sculptural silhouette and warm,
                    diffused glow — a quiet centerpiece for the room you&apos;re
                    imagining.
                  </p> */}
                </div>
              </div>

              {/* Bottom caption — keep the shop link anchored at the bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 lg:p-7">
                <div className="max-w-md">
                  <span className="inline-flex items-center gap-2 font-sans text-[13px] tracking-wide text-white transition-colors group-hover/hero:text-[#e7c98a]">
                    Shop the fixture
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Hero
