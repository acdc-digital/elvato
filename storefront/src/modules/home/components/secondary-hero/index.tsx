import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const services = [
  {
    eyebrow: "The edit",
    title: "Curated selection",
    copy: "A focused catalogue shaped by proportion, finish, material, and the way each fixture changes a room.",
  },
  {
    eyebrow: "The search",
    title: "Personal sourcing",
    copy: "If the right piece is not online yet, we can search our manufacturer network for close matches and special finds.",
  },
  {
    eyebrow: "The handoff",
    title: "White-glove support",
    copy: "Clear answers from selection through delivery, with a lighting specialist helping you compare, specify, and decide.",
  },
]

const commitments = [
  {
    k: "We edit",
    v: "A tighter catalogue, shaped by taste instead of endless scrolling.",
  },
  {
    k: "We source",
    v: "Access to manufacturers beyond what is currently on the site.",
  },
  {
    k: "We specify",
    v: "Help comparing scale, finish, brightness, and fit before you buy.",
  },
  {
    k: "We deliver",
    v: "Clear communication from inquiry to delivery at your door.",
  },
]

const SecondaryHero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-canvas py-12 small:py-16">
      <div className="relative mx-auto max-w-8xl px-6 small:px-14">
        {/* Editorial header — two columns, plenty of air */}
        <header className="mb-12 grid grid-cols-1 gap-8 small:mb-16 small:grid-cols-12 small:gap-12">
          <div className="small:col-span-7">
            <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
              The lighting edit
            </p>
            <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
              Better lighting,
              <br />
              carefully found.
            </h2>
          </div>
          <div className="flex flex-col justify-end small:col-span-5">
            <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
              We are not an interior design firm. We are lighting editors —
              curating a focused catalogue, searching hundreds of manufacturers,
              and helping you find the fixture that makes the room feel finished.
            </p>
            <LocalizedClientLink
              href="/design-services"
              className="group mt-6 inline-flex w-fit items-center gap-2 border-b border-grey-40 pb-1 font-sans text-sm tracking-wide text-grey-90 transition-colors hover:border-grey-90"
            >
              Ask about sourcing
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </LocalizedClientLink>
          </div>
        </header>

        {/* Band A — photo accent left, commitment panel right */}
        <div className="grid grid-cols-1 gap-5 small:grid-cols-12 small:gap-6">
          {/* Portrait accent — supporting imagery, not the hero */}
          <div className="group relative overflow-hidden rounded-[18px] bg-grey-10 ring-1 ring-black/10 small:col-span-4">
            <div className="relative aspect-[4/5] w-full small:aspect-auto small:h-full small:min-h-[460px]">
              <Image
                src="/homepage/v1/lighting-sourcing.webp"
                alt="A curated group of warm brass pendant lights"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
              />
              <span className="absolute left-5 top-5 font-sans text-[11px] tracking-[0.3em] text-white/60">
                01
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6 small:p-7">
                <p className="mb-1.5 font-sans text-[10px] uppercase tracking-[0.32em] text-[#e7c98a]">
                  Edited by Elvato
                </p>
                <h3 className="font-sans text-lg leading-snug text-white">
                  Selected with intention.
                </h3>
              </div>
            </div>
          </div>

          {/* Commitment panel — point of view + promise + micro-commitments */}
          <div className="flex flex-col justify-between rounded-[18px] border border-grey-20 bg-white/70 p-7 small:col-span-8 small:p-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-accent-700">
              Curated, sourced, supported
            </p>
            <blockquote className="mt-6 max-w-2xl font-sans text-2xl font-medium leading-snug text-grey-90 small:text-[32px]">
              “We know great lighting. We choose carefully, source widely, and
              help you find the fixture that belongs in your home.”
            </blockquote>

            {/* Micro-commitments — the lighting edit and sourcing pipeline */}
            <div className="mt-8 grid grid-cols-1 gap-3 xsmall:grid-cols-2 small:grid-cols-4">
              {commitments.map(({ k, v }, i) => (
                <div
                  key={k}
                  className="relative overflow-hidden rounded-xl border border-grey-20 bg-white/80 p-4.5 small:p-5"
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/[0.055] via-black/[0.018] to-transparent"
                  />
                  <div className="relative z-10">
                    <span className="mb-1.5 block font-sans text-[10px] tracking-[0.26em] text-accent-700/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-sans text-[13px] font-medium text-grey-90">
                      {k}
                    </h3>
                    <p className="mt-2 font-sans text-[12px] leading-relaxed text-grey-60">
                      {v}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 xsmall:flex-row xsmall:gap-4">
              <LocalizedClientLink
                href="/design-services"
                className="group inline-flex items-center justify-center gap-2 border border-black bg-black px-7 py-3.5 font-sans text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black"
              >
                Ask a lighting specialist
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.75}
                />
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 border border-black px-7 py-3.5 font-sans text-sm font-medium text-black transition-all duration-200 hover:bg-grey-90 hover:text-white hover:border-grey-90"
              >
                Request sourcing help
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        {/* Band B — the three ways we go further */}
        <div className="mt-5 grid grid-cols-1 gap-5 small:mt-6 small:grid-cols-3 small:gap-6">
          {services.map(({ eyebrow, title, copy }, i) => (
            <div
              key={title}
              className="relative flex min-h-[190px] flex-col overflow-hidden rounded-[18px] border border-grey-20 bg-white/70 p-7 small:p-8"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-sans text-[10px] uppercase tracking-[0.32em] text-accent-700">
                    {eyebrow}
                  </span>
                  <span className="font-sans text-[11px] tracking-[0.3em] text-grey-40">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 max-w-[13rem] font-sans text-xl font-medium leading-tight text-grey-90">
                  {title}
                </h3>
                <p className="mt-3 font-sans text-[14px] leading-relaxed text-grey-60">
                  {copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SecondaryHero
