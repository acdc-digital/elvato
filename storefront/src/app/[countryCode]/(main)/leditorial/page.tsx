import { Metadata } from "next"
import Image from "next/image"

import { canonicalUrl } from "@lib/util/seo"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const publishedDate = "2026-06-26"
const canonical = canonicalUrl(`/leditorial`)
const heroImage = "/homepage/v1/room-dining.webp"

export const metadata: Metadata = {
  title: "Summer Patio Lighting Ideas for Canadian Homes | Elvato",
  description:
    "A homeowner-first guide to layered summer patio lighting, warm LEDs, outdoor dining ambience, and fixture choices for Canadian evenings.",
  alternates: {
    canonical,
  },
  openGraph: {
    title: "The Summer Lighting Layering Guide | Elvato",
    description:
      "How to light patios, porches, dining zones, and indoor-outdoor spaces for long Canadian summer evenings.",
    type: "article",
    url: canonical,
    images: [
      {
        url: `${getBaseURL()}${heroImage}`,
        width: 1200,
        height: 630,
        alt: "Warm layered dining lighting for a summer entertaining space",
      },
    ],
  },
}

const editorial = {
  date: publishedDate,
  topic:
    "How to layer warm, practical summer lighting for patios, porches, balconies, and adjacent dining rooms.",
  objective:
    "Educate homeowners, answer seasonal lighting questions, support outdoor entertaining searches, and guide readers toward Elvato fixture categories.",
  primaryKeyword: "summer patio lighting ideas",
  secondaryKeywords: [
    "outdoor dining lighting",
    "warm LED patio lights",
    "porch lighting ideas",
    "layered lighting",
    "Canada outdoor lighting",
    "patio lighting for entertaining",
  ],
  searchIntent:
    "Homeowners looking for practical, attractive lighting ideas before buying or refreshing fixtures for summer entertaining.",
  targetAudience:
    "Canadian homeowners, condo owners, renovators, and design-conscious shoppers preparing outdoor and indoor-outdoor spaces.",
  funnelStage: "Top to middle funnel",
  articleType: "Seasonal Decorating / Installation Guide",
  estimatedReadingTime: "8 minutes",
  confidenceScore: "88/100",
}

const images = [
  {
    label: "Hero image",
    src: heroImage,
    searchQuery:
      "warm modern patio dining lighting summer evening Canada contemporary pendant",
    alt: "A warm dining area styled for summer entertaining with layered lighting",
    caption:
      "Start with ambience: summer lighting should make the table, faces, and surrounding architecture feel intentional.",
    placement: "Hero and opening section",
  },
  {
    label: "Image 2",
    src: "/homepage/v1/category-v2-pendants.webp",
    searchQuery:
      "covered porch pendant light warm LED modern residential exterior",
    alt: "Modern pendant lighting used to anchor a covered outdoor dining zone",
    caption:
      "A pendant over a covered table gives an outdoor room the same sense of centre as an interior dining room.",
    placement: "After the layered lighting framework",
  },
  {
    label: "Image 3",
    src: "/homepage/v1/category-v2-wall.webp",
    searchQuery:
      "modern exterior wall sconces porch warm light architectural home",
    alt: "Wall lighting adding a soft glow along an exterior residential wall",
    caption:
      "Wall lights are the quiet workhorses of summer: they define edges, entries, and paths without flooding the space.",
    placement: "Safety and wall-light section",
  },
  {
    label: "Image 4",
    src: "/homepage/v1/category-v2-table-floor.webp",
    searchQuery:
      "portable table lamp patio lounge warm LED layered lighting outdoor room",
    alt: "Table and floor lighting creating a relaxed patio lounge atmosphere",
    caption:
      "Eye-level lighting is what makes an outdoor setup feel like a room rather than a yard.",
    placement: "Product placement and CTA section",
  },
]

const internalLinks = [
  { label: "Browse all lighting", href: "/store" },
  { label: "Shop pendants", href: "/collections/pendants" },
  { label: "Shop wall lighting", href: "/collections/wall" },
  { label: "Shop table and floor lamps", href: "/collections/table-floor" },
  { label: "Dining room lighting", href: "/store?room_types=Dining" },
  { label: "Kitchen lighting", href: "/store?room_types=Kitchen" },
  { label: "Lighting sourcing help", href: "/design-services" },
]

const productPlacements = [
  {
    title: "Pendants for covered dining areas",
    href: "/collections/pendants",
    copy:
      "Best for covered porches, pergolas, and dining tables where one visual anchor helps the space feel complete.",
  },
  {
    title: "Wall lights for entries and edges",
    href: "/collections/wall",
    copy:
      "Best for doors, side yards, porch walls, and transitional spaces where safety and atmosphere need to work together.",
  },
  {
    title: "Table and floor lamps for lounge zones",
    href: "/collections/table-floor",
    copy:
      "Best for seating areas that need softer light at eye level instead of a single bright overhead source.",
  },
  {
    title: "Sourcing support for weather-rated fixtures",
    href: "/design-services",
    copy:
      "Best when you need help confirming scale, finish, brightness, lead time, or whether a fixture belongs outside.",
  },
]

const faqs = [
  {
    question: "What colour temperature is best for patio lighting?",
    answer:
      "Most patios feel best around 2700K to 3000K because warm LED light flatters wood, stone, plants, food, and skin tones. Use cooler light only where visibility matters more than ambience, such as a task-heavy garage or utility zone.",
  },
  {
    question: "How bright should outdoor dining lighting be?",
    answer:
      "Aim for soft, dimmable light rather than a single high-output fixture. The table should be bright enough for serving and conversation, while surrounding walls, steps, and plants can stay lower and more atmospheric.",
  },
  {
    question: "Can I use an indoor pendant outdoors?",
    answer:
      "Use only fixtures rated for the location. Covered porches often need damp-rated fixtures, while exposed areas generally need wet-rated fixtures. If you are unsure, ask for sourcing help before purchasing.",
  },
  {
    question: "What is layered lighting outdoors?",
    answer:
      "Layered outdoor lighting combines ambient light, task light, accent light, and safety light. Instead of relying on one bright source, each layer does a smaller job so the whole space feels more comfortable.",
  },
  {
    question: "Should patio lights be smart or dimmable?",
    answer:
      "Dimming is more important than novelty. Smart controls are useful when you want scheduled scenes, but the main goal is being able to lower brightness after cooking, serving, or cleanup.",
  },
]

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "The Summer Lighting Layering Guide: How to Make Patios, Porches, and Dining Rooms Glow",
  description:
    "A practical Canadian homeowner guide to layered summer patio lighting, warm LEDs, outdoor dining ambience, and fixture selection.",
  image: images.map((image) => `${getBaseURL()}${image.src}`),
  datePublished: publishedDate,
  dateModified: publishedDate,
  author: {
    "@type": "Organization",
    name: "Elvato",
  },
  publisher: {
    "@type": "Organization",
    name: "Elvato",
    logo: {
      "@type": "ImageObject",
      url: `${getBaseURL()}/brand/Elvato.svg`,
    },
  },
  mainEntityOfPage: canonical,
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${getBaseURL()}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "LEditorial",
      item: canonical,
    },
  ],
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string
  title: string
}) {
  return (
    <header className="mb-8">
      {eyebrow && (
        <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-accent-700">
          {eyebrow}
        </p>
      )}
      <h2 className="font-sans text-3xl font-semibold leading-tight text-grey-90 small:text-4xl">
        {title}
      </h2>
    </header>
  )
}

export default function LEditorialPage() {
  return (
    <main className="w-full bg-canvas">
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="border-b border-black bg-white">
        <div className="grid min-h-[620px] grid-cols-1 small:grid-cols-2">
          <div className="flex flex-col justify-center px-8 py-16 small:px-12">
            <p className="mb-5 font-sans text-xs uppercase tracking-[0.4em] text-accent-700">
              LEditorial / Summer Lighting
            </p>
            <h1 className="max-w-4xl font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-black small:text-6xl">
              The summer lighting layering guide.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-grey-70 small:text-lg">
              How to make patios, porches, balconies, and dining rooms glow for
              long Canadian evenings without over-lighting the space.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 font-sans text-xs uppercase tracking-[0.22em] text-grey-60">
              <span>{publishedDate}</span>
              <span>8 minute read</span>
              <span>Seasonal guide</span>
            </div>
          </div>
          <div className="relative min-h-[420px] border-t border-black small:border-l small:border-t-0">
            <Image
              src={heroImage}
              alt="Warm layered dining lighting for a summer entertaining space"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-canvas px-8 py-14 small:px-12">
        <div className="mx-auto grid max-w-8xl grid-cols-1 gap-6 small:grid-cols-3">
          <div className="border border-black bg-white p-6">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-accent-700">
              Primary keyword
            </p>
            <p className="mt-3 font-sans text-xl font-semibold text-grey-90">
              {editorial.primaryKeyword}
            </p>
          </div>
          <div className="border border-black bg-white p-6">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-accent-700">
              Search intent
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-grey-70">
              {editorial.searchIntent}
            </p>
          </div>
          <div className="border border-black bg-white p-6">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-accent-700">
              Confidence
            </p>
            <p className="mt-3 font-sans text-xl font-semibold text-grey-90">
              {editorial.confidenceScore}
            </p>
          </div>
        </div>
      </section>

      <article className="bg-white">
        <section className="mx-auto max-w-4xl px-8 py-16 small:px-12">
          <p className="font-sans text-lg leading-8 text-grey-80">
            Late June is when lighting decisions become urgent in Canadian
            homes. The patio is open. Dinner moves outside. Guests stay longer.
            The problem is that many outdoor spaces are still lit like utility
            zones: one harsh fixture by the door, a few string lights, and not
            much else.
          </p>
          <p className="mt-6 font-sans text-lg leading-8 text-grey-80">
            Good summer lighting is not about making the backyard brighter. It
            is about making each moment easier: carrying food safely, seeing the
            people around the table, softening the edges of the house, and
            giving the evening a reason to slow down.
          </p>
        </section>

        <section className="border-y border-black bg-canvas">
          <div className="mx-auto grid max-w-8xl grid-cols-1 small:grid-cols-2">
            <div className="relative min-h-[360px]">
              <Image
                src="/homepage/v1/category-v2-pendants.webp"
                alt="Modern pendant lighting used to anchor a covered outdoor dining zone"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center border-t border-black p-8 small:border-l small:border-t-0 small:p-12">
              <SectionHeading
                eyebrow="The framework"
                title="Think in layers, not fixtures."
              />
              <div className="space-y-5 font-sans text-base leading-7 text-grey-80">
                <p>
                  A strong patio lighting plan usually needs four layers:
                  ambient light for overall glow, task light for food and
                  drinks, accent light for walls or planting, and safety light
                  for steps, doors, and paths.
                </p>
                <p>
                  When each layer is modest, the result feels calmer than one
                  powerful fixture. This is especially important outdoors,
                  where glare reflects off glass doors, pale stone, metal
                  furniture, and neighbouring windows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-8 py-16 small:px-12">
          <SectionHeading title="Start with the table." />
          <div className="space-y-6 font-sans text-lg leading-8 text-grey-80">
            <p>
              If the patio has a dining table, begin there. The table is where
              faces, food, glassware, and conversation meet. A covered outdoor
              dining area can often handle a pendant or chandelier-style
              centrepiece, provided the fixture is correctly rated for the
              location.
            </p>
            <p>
              Keep the light warm and controllable. For most residential
              entertaining, 2700K to 3000K is the sweet spot: warm enough to feel
              relaxed, but clear enough that food still looks appetizing. If the
              fixture can dim, even better. You want one setting for serving and
              another for lingering.
            </p>
          </div>
        </section>

        <section className="border-y border-black bg-canvas">
          <div className="mx-auto grid max-w-8xl grid-cols-1 small:grid-cols-2">
            <div className="order-2 flex flex-col justify-center border-t border-black p-8 small:order-1 small:border-r small:border-t-0 small:p-12">
              <SectionHeading
                eyebrow="Walls and edges"
                title="Let sconces do the quiet work."
              />
              <div className="space-y-5 font-sans text-base leading-7 text-grey-80">
                <p>
                  Wall lighting is where summer patios become easier to use.
                  The right sconces frame entries, mark transitions, and create
                  enough vertical glow that the space does not disappear after
                  sunset.
                </p>
                <p>
                  Avoid treating every wall as a security surface. Instead of
                  flooding the area, place light where the eye needs help: door
                  hardware, steps, grill zones, side paths, and the blank wall
                  behind a seating group.
                </p>
              </div>
            </div>
            <div className="relative order-1 min-h-[360px] small:order-2">
              <Image
                src="/homepage/v1/category-v2-wall.webp"
                alt="Wall lighting adding a soft glow along an exterior residential wall"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-8 py-16 small:px-12">
          <SectionHeading title="Bring light down to eye level." />
          <div className="space-y-6 font-sans text-lg leading-8 text-grey-80">
            <p>
              The difference between a lit patio and a comfortable outdoor room
              is often eye-level light. Table lamps, floor lamps, lantern-style
              fixtures, and low wall lights make people look better and make
              seating areas feel intentional.
            </p>
            <p>
              This is the same principle used indoors. Living rooms rarely rely
              only on the ceiling. They use lamps, sconces, and accent lighting
              to create depth. Your patio should do the same, especially if it
              connects visually to a kitchen, dining room, or great room.
            </p>
          </div>
        </section>

        <section className="border-y border-black bg-canvas px-8 py-16 small:px-12">
          <div className="mx-auto max-w-8xl">
            <SectionHeading
              eyebrow="Product placement"
              title="What to feature from the Elvato edit."
            />
            <div className="grid grid-cols-1 gap-5 small:grid-cols-2">
              {productPlacements.map((item) => (
                <LocalizedClientLink
                  key={item.title}
                  href={item.href}
                  className="group border border-black bg-white p-7 transition-colors hover:bg-grey-90"
                >
                  <h3 className="font-sans text-xl font-semibold text-grey-90 group-hover:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-sans text-sm leading-6 text-grey-60 group-hover:text-grey-10">
                    {item.copy}
                  </p>
                  <span className="mt-5 inline-block font-sans text-xs uppercase tracking-[0.25em] text-accent-700 group-hover:text-accent-200">
                    Explore
                  </span>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-8 py-16 small:px-12">
          <SectionHeading title="The homeowner checklist." />
          <div className="grid grid-cols-1 gap-4 font-sans text-base leading-7 text-grey-80 small:grid-cols-2">
            {[
              "Choose warm LEDs first, usually 2700K to 3000K.",
              "Use dimmers where possible so the space can shift after dinner.",
              "Confirm damp or wet ratings before using fixtures outdoors.",
              "Light the table, entries, steps, and seating separately.",
              "Keep glare away from neighbouring windows and glass doors.",
              "Repeat finishes from the house so outdoor fixtures feel built in.",
              "Use sconces to define architecture, not just for security.",
              "Ask for help if scale, rating, or installation conditions are unclear.",
            ].map((item) => (
              <div key={item} className="border border-grey-20 bg-canvas p-5">
                {item}
              </div>
            ))}
          </div>
        </section>
      </article>

      <section className="border-y border-black bg-white px-8 py-16 small:px-12">
        <div className="mx-auto max-w-8xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Common summer lighting questions."
          />
          <div className="grid grid-cols-1 gap-5 small:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="border border-black p-6">
                <h3 className="font-sans text-lg font-semibold text-grey-90">
                  {faq.question}
                </h3>
                <p className="mt-3 font-sans text-sm leading-6 text-grey-70">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-canvas px-8 py-16 small:px-12">
        <div className="mx-auto grid max-w-8xl grid-cols-1 gap-10 small:grid-cols-3">
          <div>
            <SectionHeading eyebrow="CTA" title="Keep the edit close." />
            <p className="font-sans text-sm leading-6 text-grey-70">
              Join the Elvato newsletter for seasonal lighting ideas, fixture
              edits, and practical guidance for residential projects.
            </p>
            <a
              href="mailto:hello@elvato.ca?subject=Newsletter signup"
              className="mt-6 inline-flex items-center justify-center border border-black bg-black px-8 py-4 font-sans text-sm font-medium text-white transition-colors hover:bg-white hover:text-black"
            >
              JOIN THE NEWSLETTER
            </a>
          </div>
          <div>
            <SectionHeading eyebrow="Shop" title="Browse summer-ready lighting." />
            <p className="font-sans text-sm leading-6 text-grey-70">
              Start with pendants, wall lights, and table or floor pieces that
              help your outdoor and indoor entertaining spaces feel connected.
            </p>
            <LocalizedClientLink
              href="/store"
              className="mt-6 inline-flex items-center justify-center border border-black bg-white px-8 py-4 font-sans text-sm font-medium text-black transition-colors hover:bg-grey-90 hover:text-white"
            >
              SHOP THE EDIT
            </LocalizedClientLink>
          </div>
          <div>
            <SectionHeading eyebrow="Consultation" title="Need rating or scale help?" />
            <p className="font-sans text-sm leading-6 text-grey-70">
              Send Elvato the room, measurements, finish direction, and fixture
              conditions. We can help narrow the search before you order.
            </p>
            <LocalizedClientLink
              href="/design-services"
              className="mt-6 inline-flex items-center justify-center border border-black bg-white px-8 py-4 font-sans text-sm font-medium text-black transition-colors hover:bg-grey-90 hover:text-white"
            >
              REQUEST SOURCING HELP
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-white px-8 py-16 small:px-12">
        <div className="mx-auto max-w-8xl">
          <SectionHeading
            eyebrow="Editorial package"
            title="Why this was published today."
          />
          <div className="grid grid-cols-1 gap-6 small:grid-cols-2">
            <div className="border border-black p-6">
              <h3 className="font-sans text-lg font-semibold">Editorial notes</h3>
              <p className="mt-3 font-sans text-sm leading-6 text-grey-70">
                This article was chosen because late June is the strongest
                seasonal window for patio, porch, and outdoor entertaining
                searches in Canada. It connects practical homeowner questions
                with Elvato&apos;s existing pendant, wall, table, floor, dining, and
                sourcing journeys.
              </p>
            </div>
            <div className="border border-black p-6">
              <h3 className="font-sans text-lg font-semibold">Expected SEO value</h3>
              <p className="mt-3 font-sans text-sm leading-6 text-grey-70">
                The page targets seasonal long-tail queries with buying intent,
                supports topical authority around layered residential lighting,
                and creates internal links to high-value shopping and service
                pages.
              </p>
            </div>
            <div className="border border-black p-6">
              <h3 className="font-sans text-lg font-semibold">Future follow-up articles</h3>
              <ul className="mt-3 space-y-2 font-sans text-sm leading-6 text-grey-70">
                <li>How to choose damp-rated vs wet-rated outdoor fixtures.</li>
                <li>The best colour temperature for every room in a Canadian home.</li>
                <li>Porch lighting mistakes that make a home feel less welcoming.</li>
                <li>Balcony lighting ideas for condos and small outdoor spaces.</li>
              </ul>
            </div>
            <div className="border border-black p-6">
              <h3 className="font-sans text-lg font-semibold">Internal links</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {internalLinks.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="border border-grey-20 px-3 py-2 font-sans text-xs uppercase tracking-[0.18em] text-grey-70 transition-colors hover:border-black hover:text-black"
                  >
                    {link.label}
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border border-black">
            <div className="border-b border-black p-6">
              <h3 className="font-sans text-lg font-semibold">Image sourcing package</h3>
              <p className="mt-2 font-sans text-sm leading-6 text-grey-70">
                Live page imagery uses approved Elvato storefront assets. The
                search queries below are included for future SerpAPI sourcing or
                editorial refreshes.
              </p>
            </div>
            <div className="grid grid-cols-1 small:grid-cols-2">
              {images.map((image) => (
                <div
                  key={image.label}
                  className="border-b border-black p-6 last:border-b-0 small:even:border-l small:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <p className="font-sans text-xs uppercase tracking-[0.25em] text-accent-700">
                    {image.label}
                  </p>
                  <p className="mt-3 font-sans text-sm font-semibold text-grey-90">
                    {image.searchQuery}
                  </p>
                  <p className="mt-3 font-sans text-sm leading-6 text-grey-70">
                    {image.caption}
                  </p>
                  <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-grey-50">
                    Placement: {image.placement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
