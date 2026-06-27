import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getBaseURL } from "@lib/util/env"

import { articles, getArticleBySlug } from "../articles"

type PageProps = {
  params: Promise<{
    countryCode: string
    slug: string
  }>
}

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { countryCode, slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {}
  }

  const canonical = `/${countryCode}${article.seo.canonicalPath}`
  const heroImage = article.images[0]

  return {
    title: article.seo.metaTitle,
    description: article.seo.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.seo.ogTitle,
      description: article.seo.ogDescription,
      type: "article",
      publishedTime: article.editorial.date,
      images: [
        {
          url: heroImage.src,
          alt: heroImage.alt,
        },
      ],
    },
  }
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

function EditorialImageBlock({
  image,
  priority = false,
}: {
  image: (typeof articles)[number]["images"][number]
  priority?: boolean
}) {
  return (
    <figure className="my-10 overflow-hidden border border-black bg-white">
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
        />
      </div>
      <figcaption className="border-t border-black px-5 py-4 font-sans text-[13px] leading-relaxed text-grey-60">
        {image.caption}
      </figcaption>
    </figure>
  )
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <header className="mb-5 mt-12">
      <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
        {eyebrow}
      </p>
      <h2 className="font-sans text-2xl font-semibold leading-tight text-grey-90 small:text-3xl">
        {title}
      </h2>
    </header>
  )
}

export default async function LEditorialArticlePage({ params }: PageProps) {
  const { countryCode, slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const baseUrl = getBaseURL()
  const articleUrl = `${baseUrl}/${countryCode}${article.seo.canonicalPath}`
  const heroImage = article.images[0]

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.hero.headline,
    description: article.seo.metaDescription,
    image: article.images.map((image) => `${baseUrl}${image.src}`),
    datePublished: article.editorial.date,
    dateModified: article.editorial.date,
    author: {
      "@type": "Organization",
      name: "Elvato",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Elvato",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "LED-itorial",
        item: `${baseUrl}/${countryCode}/leditorial`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.hero.headline,
        item: articleUrl,
      },
    ],
  }

  return (
    <article className="w-full bg-canvas">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="border-b border-black px-8 py-16 small:px-12 small:py-20">
        <div className="mx-auto grid max-w-8xl grid-cols-1 gap-10 small:grid-cols-12 small:gap-12">
          <div className="small:col-span-7">
            <LocalizedClientLink
              href="/leditorial"
              className="mb-6 inline-flex font-sans text-[11px] uppercase tracking-[0.34em] text-accent-700 transition-colors hover:text-grey-90"
            >
              LED-itorial
            </LocalizedClientLink>
            <h1 className="font-sans text-4xl font-semibold leading-[1.04] tracking-tight text-grey-90 small:text-6xl">
              {article.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-grey-60 small:text-lg">
              {article.hero.subtitle}
            </p>
          </div>
          <aside className="small:col-span-5 small:pt-12">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border border-black bg-white p-6 font-sans text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-grey-40">
                  Date
                </dt>
                <dd className="mt-1 text-grey-90">{article.editorial.date}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-grey-40">
                  Read
                </dt>
                <dd className="mt-1 text-grey-90">
                  {article.editorial.estimatedReadingTime}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.3em] text-grey-40">
                  Article type
                </dt>
                <dd className="mt-1 text-grey-90">
                  {article.editorial.articleType}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] uppercase tracking-[0.3em] text-grey-40">
                  Primary keyword
                </dt>
                <dd className="mt-1 text-grey-90">
                  {article.editorial.primaryKeyword}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto max-w-8xl px-8 py-10 small:px-12">
          <EditorialImageBlock image={heroImage} priority />
        </div>
      </section>

      <div className="mx-auto grid max-w-8xl grid-cols-1 gap-12 px-8 py-14 small:grid-cols-12 small:px-12 small:py-20">
        <div className="small:col-span-8">
          <div className="prose prose-neutral max-w-none font-sans prose-headings:font-sans prose-headings:text-grey-90 prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-grey-70 prose-a:text-grey-90 prose-a:underline prose-strong:text-grey-90">
            <p>
              In Canada, late June changes the job of residential lighting. The
              sun stays up later, doors stay open longer, and the most important
              room in the house may become the space between the kitchen, the
              dining table, and the patio.
            </p>
            <p>
              That is why the best summer lighting plan is not simply more light
              outside. It is a connected plan: one that lets people move safely
              from indoors to outdoors, makes food and faces look good after
              sunset, and keeps the home feeling calm rather than over-lit.
            </p>

            <SectionHeading eyebrow="01" title="Start with the threshold" />
            <p>
              The first place to review is not the far corner of the deck. It is
              the threshold: the kitchen door, sliding glass wall, mudroom
              entry, or dining room that leads outside. If this transition is
              too dark, the patio feels disconnected. If it is too bright, the
              outdoor area can feel flat and exposed.
            </p>
            <p>
              Aim for a gentle visual handoff. Warm kitchen pendants, a dining
              chandelier on a dimmer, or a pair of nearby wall lights can create
              enough glow for the patio to feel like part of the home.
            </p>
          </div>

          <EditorialImageBlock image={article.images[1]} />

          <div className="prose prose-neutral max-w-none font-sans prose-headings:font-sans prose-headings:text-grey-90 prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-grey-70 prose-a:text-grey-90 prose-a:underline prose-strong:text-grey-90">
            <SectionHeading eyebrow="02" title="Use three layers outside" />
            <p>
              A good patio or deck should rarely depend on one central fixture.
              Single-source outdoor lighting often creates harsh shadows, glare,
              and bright spots that make everything beyond the fixture feel
              darker.
            </p>
            <p>
              Think in three layers instead. The first layer is architectural:
              porch lights, outdoor wall fixtures, step lights, or path lighting
              that makes movement safer. The second layer is task light: focused
              illumination for a grill, serving counter, dining table, or door
              hardware. The third layer is atmosphere: soft light around
              seating, planters, side tables, or the room just inside the house.
            </p>
            <p>
              The goal is not maximum brightness. The goal is orientation,
              comfort, and enough contrast for the space to feel designed.
            </p>
          </div>

          <EditorialImageBlock image={article.images[2]} />

          <div className="prose prose-neutral max-w-none font-sans prose-headings:font-sans prose-headings:text-grey-90 prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-grey-70 prose-a:text-grey-90 prose-a:underline prose-strong:text-grey-90">
            <SectionHeading
              eyebrow="03"
              title="Choose warm LED light for people, not just surfaces"
            />
            <p>
              Outdoor LEDs are efficient, durable, and practical for summer
              evenings, but colour temperature matters. For most patios, decks,
              balconies, and dining zones, 2700K to 3000K gives a warm white
              light that feels comfortable and flattering. Cooler light can be
              useful for security or work areas, but it often feels too stark
              for hosting.
            </p>
            <p>
              If you are replacing bulbs or specifying new integrated LED
              fixtures, look for dimming compatibility and avoid mixing too many
              different colour temperatures in one view. A patio that combines
              warm sconces, cool floodlights, and blue-white landscape lighting
              can feel accidental even when every fixture is technically good.
            </p>

            <SectionHeading eyebrow="04" title="Respect wet and damp ratings" />
            <p>
              Outdoor style should never come before fixture rating. A
              damp-rated fixture may be appropriate in a protected covered area,
              while a fixture exposed to rain, snow, or wind-driven moisture
              generally needs a wet rating. Canadian weather makes this
              distinction especially important.
            </p>
            <p>
              Before buying, confirm where the fixture will live: fully exposed,
              under a roof, under a soffit, inside a screened porch, or just
              beside a door. The right rating protects the fixture, the finish,
              and the long-term safety of the installation.
            </p>

            <SectionHeading
              eyebrow="05"
              title="Make the kitchen and dining lights part of the patio plan"
            />
            <p>
              Summer entertaining often begins in the kitchen. People gather
              around the island, carry plates outside, return for drinks, and
              move between the table and the deck throughout the evening. That
              means kitchen pendants and dining chandeliers are part of the
              outdoor experience, even when they are technically indoors.
            </p>
            <p>
              Use dimmers wherever possible. Brighter light helps with prep
              before guests arrive; lower light helps the dining room and patio
              feel connected once the evening settles in.
            </p>
          </div>

          <div className="my-12 border border-black bg-white p-7">
            <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
              Product placement
            </p>
            <h2 className="font-sans text-2xl font-semibold text-grey-90">
              Shop the summer lighting plan
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 small:grid-cols-2">
              {article.productPlacements.map((product) => (
                <LocalizedClientLink
                  key={product.title}
                  href={product.href}
                  className="group border border-grey-20 p-5 transition-colors hover:border-black"
                >
                  <h3 className="flex items-center justify-between gap-3 font-sans text-base font-semibold text-grey-90">
                    {product.title}
                    <ArrowUpRight
                      className="h-4 w-4 text-accent-700 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={1.75}
                    />
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-grey-60">
                    {product.context}
                  </p>
                </LocalizedClientLink>
              ))}
            </div>
          </div>

          <EditorialImageBlock image={article.images[3]} />

          <div className="prose prose-neutral max-w-none font-sans prose-headings:font-sans prose-headings:text-grey-90 prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-grey-70 prose-a:text-grey-90 prose-a:underline prose-strong:text-grey-90">
            <SectionHeading
              eyebrow="06"
              title="A simple checklist before you buy"
            />
            <ul>
              <li>
                Identify every transition point between indoors and outdoors.
              </li>
              <li>
                Choose warm white light for dining, lounging, and conversation.
              </li>
              <li>
                Use brighter task light only where people cook, serve, or walk.
              </li>
              <li>
                Confirm wet or damp ratings before placing a fixture outside.
              </li>
              <li>Plan dimming so the room can change from prep to hosting.</li>
              <li>
                Repeat one finish, shape, or material so the plan feels
                intentional.
              </li>
            </ul>
            <p>
              The best summer lighting does not call attention to itself. It
              makes the path clearer, the meal warmer, the room more relaxed,
              and the house feel larger after sunset.
            </p>
          </div>

          <section className="mt-14 border-t border-black pt-10">
            <h2 className="font-sans text-2xl font-semibold text-grey-90">
              Frequently asked questions
            </h2>
            <div className="mt-6 divide-y divide-grey-20 border-y border-grey-20">
              {article.faq.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="cursor-pointer list-none font-sans text-base font-semibold text-grey-90">
                    {item.question}
                  </summary>
                  <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-grey-60">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="small:col-span-4">
          <div className="sticky top-32 space-y-6">
            <section className="border border-black bg-white p-6">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
                Newsletter CTA
              </p>
              <h2 className="font-sans text-xl font-semibold leading-tight text-grey-90">
                Get the next lighting edit.
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-grey-60">
                Seasonal room guides, product notes, and practical lighting
                decisions from Elvato.
              </p>
              <a
                href="mailto:hello@elvato.ca?subject=Subscribe%20me%20to%20LED-itorial"
                className="mt-5 inline-flex w-full items-center justify-center border border-black bg-black px-5 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-white hover:text-black"
              >
                SIGN UP BY EMAIL
              </a>
            </section>

            <section className="border border-black bg-white p-6">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
                Shopping CTA
              </p>
              <h2 className="font-sans text-xl font-semibold leading-tight text-grey-90">
                Browse lighting by room and category.
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-grey-60">
                Start with outdoor lighting, pendants, chandeliers, or portable
                table and floor lamps.
              </p>
              <LocalizedClientLink
                href="/store"
                className="mt-5 inline-flex w-full items-center justify-center border border-black bg-black px-5 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-white hover:text-black"
              >
                SHOP LIGHTING
              </LocalizedClientLink>
            </section>

            <section className="border border-black bg-white p-6">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
                Consultation CTA
              </p>
              <h2 className="font-sans text-xl font-semibold leading-tight text-grey-90">
                Need help choosing the right fixture?
              </h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-grey-60">
                Send us the room, scale, finish, and any reference images. We
                can help narrow the edit.
              </p>
              <LocalizedClientLink
                href="/design-services"
                className="mt-5 inline-flex w-full items-center justify-center border border-black px-5 py-3 font-sans text-sm font-medium text-grey-90 transition-colors hover:bg-black hover:text-white"
              >
                REQUEST SOURCING HELP
              </LocalizedClientLink>
            </section>

            <section className="border border-black bg-white p-6">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
                Internal links
              </p>
              <div className="space-y-4">
                {article.internalLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="group block"
                  >
                    <span className="flex items-center justify-between gap-3 font-sans text-sm font-semibold text-grey-90">
                      {link.label}
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-accent-700 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.75}
                      />
                    </span>
                    <span className="mt-1 block font-sans text-xs leading-relaxed text-grey-50">
                      {link.reason}
                    </span>
                  </LocalizedClientLink>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <section className="border-t border-black bg-white px-8 py-14 small:px-12">
        <div className="mx-auto grid max-w-8xl grid-cols-1 gap-8 small:grid-cols-12">
          <div className="small:col-span-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.34em] text-accent-700">
              Editorial notes
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold text-grey-90">
              Why this article was chosen today
            </h2>
          </div>
          <div className="space-y-6 small:col-span-8">
            <p className="font-sans text-sm leading-relaxed text-grey-60">
              {article.editorialNotes.whyChosenToday}
            </p>
            <p className="font-sans text-sm leading-relaxed text-grey-60">
              <strong className="text-grey-90">Expected SEO value:</strong>{" "}
              {article.editorialNotes.expectedSeoValue}
            </p>
            <div>
              <h3 className="font-sans text-sm font-semibold text-grey-90">
                Future follow-up articles
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-sm leading-relaxed text-grey-60">
                {article.editorialNotes.futureFollowUps.map((followUp) => (
                  <li key={followUp}>{followUp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
