import Image from "next/image"
import { ArrowUpRight, Sliders, PencilRuler, Headphones } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const services = [
  {
    icon: Sliders,
    title: "Lighting controls",
    copy: "Smart dimmers, scenes, and complete control systems specified for your space.",
  },
  {
    icon: PencilRuler,
    title: "Design specification",
    copy: "A lighting plan sized to your room, ceiling height, and the way you live.",
  },
  {
    icon: Headphones,
    title: "White-glove support",
    copy: "Talk to a real lighting specialist before, during, and after your project.",
  },
]

const SecondaryHero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-grey-90 py-16 small:py-24">
      {/* Warm overhead bloom — a quiet illumination cue against the charcoal */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.16),_transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto grid max-w-8xl grid-cols-1 items-center gap-10 px-6 small:grid-cols-12 small:gap-14 small:px-14">
        {/* Image */}
        <div className="relative order-2 overflow-hidden rounded-[18px] ring-1 ring-white/10 small:order-1 small:col-span-6">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src="/homepage/v1/design-services.webp"
              alt="Elvato lighting controls and design service"
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="order-1 small:order-2 small:col-span-6">
          <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-400">
            Design services
          </p>
          <h2 className="max-w-xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-white small:text-5xl">
            Designed with you, dialled in by us.
          </h2>
          <p className="mt-5 max-w-md font-sans text-[15px] leading-relaxed text-grey-30">
            From a single statement fixture to a whole-home control system, our
            specialists handle the spec so the result feels effortless — and
            entirely yours.
          </p>

          <ul className="mt-9 space-y-5">
            {services.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-accent-400 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-sans text-[15px] font-medium text-white">
                    {title}
                  </h3>
                  <p className="mt-0.5 max-w-sm font-sans text-[13px] leading-relaxed text-grey-40">
                    {copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 xsmall:flex-row xsmall:gap-4">
            <LocalizedClientLink
              href="/design-services"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-medium text-grey-90 transition-colors hover:bg-accent-100"
            >
              Talk to a specialist
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/design-services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-sans text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/5"
            >
              Request a quote
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SecondaryHero
