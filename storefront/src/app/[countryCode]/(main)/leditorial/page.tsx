import { Metadata } from "next"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { articles } from "./articles"

type PageProps = {
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode } = await params

  return {
    title: "LED-itorial | Elvato",
    description:
      "Lighting guides, seasonal ideas, and practical editorial advice for Canadian homeowners planning better residential lighting.",
    alternates: {
      canonical: `/${countryCode}/leditorial`,
    },
    openGraph: {
      title: "LED-itorial | Elvato",
      description:
        "Lighting guides, seasonal ideas, and practical editorial advice for Canadian homeowners.",
      type: "website",
    },
  }
}

export default function LEditorialPage() {
  const [featuredArticle] = articles
  const heroImage = featuredArticle.images[0]

  return (
    <div className="w-full bg-canvas">
      <section className="border-b border-black px-8 py-20 small:px-12 small:py-24">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-12 small:gap-12">
          <div className="small:col-span-7">
            <p className="mb-5 font-sans text-[11px] uppercase tracking-[0.4em] text-accent-700">
              LED-itorial
            </p>
            <h1 className="max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-grey-90 small:text-6xl">
              Residential lighting, edited for Canadian homes.
            </h1>
          </div>
          <div className="flex flex-col justify-end small:col-span-5">
            <p className="max-w-md font-sans text-[15px] leading-relaxed text-grey-60">
              Seasonal guides, room-by-room advice, and practical lighting
              decisions for homeowners who want a better room, not just a
              brighter one.
            </p>
          </div>
        </div>
      </section>

      <section className="px-8 py-12 small:px-12 small:py-16">
        <LocalizedClientLink
          href={`/leditorial/${featuredArticle.slug}`}
          className="group grid grid-cols-1 overflow-hidden border border-black bg-white small:grid-cols-12"
        >
          <div className="relative min-h-[320px] small:col-span-7 small:min-h-[560px]">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
            />
          </div>
          <div className="flex flex-col justify-between p-8 small:col-span-5 small:p-10">
            <div>
              <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
                {featuredArticle.editorial.articleType}
              </p>
              <h2 className="font-sans text-3xl font-semibold leading-tight text-grey-90 small:text-5xl">
                {featuredArticle.hero.headline}
              </h2>
              <p className="mt-5 font-sans text-[15px] leading-relaxed text-grey-60">
                {featuredArticle.hero.subtitle}
              </p>
            </div>
            <div className="mt-10 flex items-center gap-2 font-sans text-sm tracking-wide text-grey-90">
              Read the guide
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.75}
              />
            </div>
          </div>
        </LocalizedClientLink>
      </section>
    </div>
  )
}
