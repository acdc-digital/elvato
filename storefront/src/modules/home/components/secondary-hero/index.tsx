import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const services = [
  {
    title: "Design specification",
    copy: "A lighting plan sized to your room, ceiling height, and the way you actually live — drawn up before you spend a dollar.",
  },
  {
    title: "Lighting controls",
    copy: "Smart dimmers, scenes, and full control systems specified and wired to work together from day one.",
  },
  {
    title: "White-glove support",
    copy: "A real lighting specialist on hand before, during, and long after your project — not a ticket queue.",
  },
]

const SecondaryHero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white to-[#F5F5F5] py-16 small:py-24">
      {/* Soft overhead light bloom — quiet "illumination" cue, matching the edit above */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.10),_transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto max-w-8xl px-6 small:px-14">
        {/* Editorial header — two columns, plenty of air */}
        <header className="mb-12 grid grid-cols-1 gap-8 small:mb-16 small:grid-cols-12 small:gap-12">
          <div className="small:col-span-7">
            <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-[#8B6914]">
              Design services
            </p>
            <h2 className="max-w-2xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
              We design
              <br />
              the whole room.
            </h2>
          </div>
          <div className="flex flex-col justify-end small:col-span-5">
            <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
              Lighting is the last ten percent that makes a room feel finished —
              and the part most people get wrong. So we do it for you: a plan
              drawn to your space, the fixtures chosen to match, delivered and
              backed by one team from first sketch to final install.
            </p>
            <LocalizedClientLink
              href="/design-services"
              className="group mt-6 inline-flex w-fit items-center gap-2 border-b border-grey-40 pb-1 font-sans text-sm tracking-wide text-grey-90 transition-colors hover:border-grey-90"
            >
              Talk to a specialist
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
                src="/homepage/v1/design-services.webp"
                alt="An Elvato specialist planning a residential lighting scheme"
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
                  Specified by Elvato
                </p>
                <h3 className="font-sans text-lg leading-snug text-white">
                  Handled end to end.
                </h3>
              </div>
            </div>
          </div>

          {/* Commitment panel — point of view + promise + micro-commitments */}
          <div className="flex flex-col justify-between rounded-[18px] border border-grey-20 bg-white/60 p-7 small:col-span-8 small:p-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-[#8B6914]">
              White-glove, end to end
            </p>
            <blockquote className="mt-6 max-w-2xl font-sans text-2xl font-medium leading-snug text-grey-90 small:text-[32px]">
              “We design the scheme, choose every fixture, and see it through to
              your door — one team, quietly accountable for the whole room.”
            </blockquote>

            {/* Micro-commitments — the end-to-end, white-glove pipeline */}
            <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-grey-20 bg-grey-20 xsmall:grid-cols-2 small:grid-cols-4">
              {[
                {
                  k: "We design",
                  v: "A lighting plan drawn to your space — not pulled off a shelf.",
                },
                {
                  k: "We choose",
                  v: "Every fixture hand-selected to work as one composition.",
                },
                {
                  k: "We ship",
                  v: "Packed, tracked, and delivered to your door.",
                },
                {
                  k: "We make it right",
                  v: "If anything’s off, we fix it — no debate.",
                },
              ].map(({ k, v }) => (
                <div key={k} className="bg-white/70 p-4">
                  <dt className="font-sans text-[13px] font-medium text-grey-90">
                    {k}
                  </dt>
                  <dd className="mt-1 font-sans text-[12px] leading-relaxed text-grey-60">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3 xsmall:flex-row xsmall:gap-4">
              <LocalizedClientLink
                href="/design-services"
                className="group inline-flex items-center justify-center gap-2 border border-black bg-black px-7 py-3.5 font-sans text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black"
              >
                Talk to a specialist
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.75}
                />
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/design-services"
                className="inline-flex items-center justify-center gap-2 border border-black px-7 py-3.5 font-sans text-sm font-medium text-black transition-all duration-200 hover:bg-grey-90 hover:text-white hover:border-grey-90"
              >
                Request a quote
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        {/* Band B — the three ways we go further */}
        <div className="mt-5 grid grid-cols-1 gap-5 small:mt-6 small:grid-cols-3 small:gap-6">
          {services.map(({ title, copy }, i) => (
            <div
              key={title}
              className="flex flex-col rounded-[18px] border border-grey-20 bg-white/60 p-7 small:p-8"
            >
              <span className="font-sans text-[11px] tracking-[0.3em] text-grey-40">
                {String(i + 2).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-sans text-lg font-medium text-grey-90">
                {title}
              </h3>
              <p className="mt-2 font-sans text-[14px] leading-relaxed text-grey-60">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SecondaryHero
