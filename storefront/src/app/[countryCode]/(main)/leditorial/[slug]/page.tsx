import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getBaseURL } from "@lib/util/env"
import LocalizedClientLink from "../../../../../modules/common/components/localized-client-link"

import { getPostBySlug, posts } from "../posts"

export const revalidate = 300
export const dynamicParams = true

type Props = {
  params: Promise<{
    countryCode: string
    slug: string
  }>
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: "LED-itorial | Elvato",
    }
  }

  return {
    title: post.seo?.metaTitle ?? `${post.title} | LED-itorial`,
    description: post.seo?.metaDescription ?? post.excerpt,
    openGraph: {
      title: post.seo?.ogTitle ?? post.title,
      description: post.seo?.ogDescription ?? post.excerpt,
      type: "article",
      images: [
        {
          url: `${getBaseURL()}${post.images?.[0]?.src ?? post.image}`,
          alt: post.images?.[0]?.alt ?? post.alt,
        },
      ],
    },
  }
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default async function LeditorialPostPage(props: Props) {
  const { countryCode, slug } = await props.params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const baseUrl = getBaseURL()
  const canonicalPath = post.seo?.canonicalPath ?? `/leditorial/${post.slug}`
  const articleUrl = `${baseUrl}/${countryCode}${canonicalPath}`
  const heroImage = post.images?.[0]
  const supportingImages = post.images?.slice(1) ?? []
  const ctas = post.ctas
    ? [post.ctas.newsletter, post.ctas.shopping, post.ctas.consultation].flatMap(
        (cta) => (cta ? [cta] : [])
      )
    : []
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.hero?.headline ?? post.title,
    description: post.seo?.metaDescription ?? post.excerpt,
    image: (post.images?.length ? post.images : [{ src: post.image }]).map(
      (image) => `${baseUrl}${image.src}`
    ),
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
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
    mainEntityOfPage: articleUrl,
  }
  const faqJsonLd = post.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null
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
        name: post.hero?.headline ?? post.title,
        item: articleUrl,
      },
    ],
  }

  return (
    <article className="w-full bg-canvas text-black">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <header className="border-b border-black px-6 py-10 small:px-12 small:py-16">
        <div className="grid gap-10 small:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] small:items-start">
          <div className="max-w-3xl">
            <LocalizedClientLink
              href="/leditorial"
              className="mb-8 inline-flex font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50 transition-colors hover:text-black"
            >
              LED-itorial
            </LocalizedClientLink>
            <div className="mb-5 flex flex-wrap items-center gap-4 font-sans text-xs uppercase tracking-[0.22em] text-grey-50">
              <span>{post.category}</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="font-sans text-4xl font-semibold leading-[1.02] tracking-normal small:text-6xl">
              {post.hero?.headline ?? post.title}
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-grey-70 small:text-lg">
              {post.hero?.subtitle ?? post.dek}
            </p>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden border border-black bg-grey-10">
            <Image
              src={heroImage?.src ?? post.image}
              alt={heroImage?.alt ?? post.alt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </header>

      <div className="grid border-b border-black small:grid-cols-[minmax(220px,0.34fr)_minmax(0,0.66fr)]">
        <aside className="border-b border-black px-6 py-8 small:border-b-0 small:border-r small:px-12 small:py-12">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
            Published
          </p>
          <p className="mt-3 font-sans text-sm text-grey-70">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </aside>

        <div className="px-6 py-10 small:px-12 small:py-14">
          <div className="mx-auto max-w-3xl space-y-12">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-sans text-2xl font-semibold leading-tight">
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-5">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="font-sans text-base leading-8 text-grey-70"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {supportingImages.length > 0 && (
              <section className="grid gap-6">
                {supportingImages.map((image) => (
                  <figure key={`${image.src}-${image.placement ?? image.alt}`} className="border border-black bg-white">
                    <div className="relative aspect-[16/10] overflow-hidden bg-grey-10">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        loading="lazy"
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    </div>
                    {image.caption && (
                      <figcaption className="border-t border-black p-4 font-sans text-sm leading-6 text-grey-60">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>

      {(post.productPlacements?.length || post.internalLinks?.length) && (
        <section className="border-b border-black px-6 py-12 small:px-12 small:py-16">
          <div className="grid gap-8 small:grid-cols-2">
            {post.productPlacements?.length ? (
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
                  Product edit
                </p>
                <div className="mt-6 grid gap-4">
                  {post.productPlacements.map((placement) => (
                    <LocalizedClientLink
                      key={placement.title}
                      href={placement.href}
                      className="group border border-black bg-white p-5 transition-colors hover:bg-black"
                    >
                      <h2 className="font-sans text-lg font-semibold leading-tight group-hover:text-white">
                        {placement.title}
                      </h2>
                      <p className="mt-3 font-sans text-sm leading-6 text-grey-60 group-hover:text-grey-10">
                        {placement.context}
                      </p>
                    </LocalizedClientLink>
                  ))}
                </div>
              </div>
            ) : null}

            {post.internalLinks?.length ? (
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
                  Continue reading
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {post.internalLinks.map((link) => (
                    <LocalizedClientLink
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className="border border-black bg-white px-4 py-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-black hover:text-white"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {post.faq?.length ? (
        <section className="border-b border-black px-6 py-12 small:px-12 small:py-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
            FAQ
          </p>
          <div className="mt-6 grid gap-4 small:grid-cols-2">
            {post.faq.map((item) => (
              <div key={item.question} className="border border-black bg-white p-5">
                <h2 className="font-sans text-lg font-semibold leading-tight">
                  {item.question}
                </h2>
                <p className="mt-3 font-sans text-sm leading-6 text-grey-60">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {post.editorialNotes && (
        <section className="border-b border-black bg-white px-6 py-12 small:px-12 small:py-16">
          <div className="grid gap-6 small:grid-cols-3">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
                Why now
              </p>
              <p className="mt-4 font-sans text-sm leading-6 text-grey-70">
                {post.editorialNotes.whyChosenToday}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
                SEO value
              </p>
              <p className="mt-4 font-sans text-sm leading-6 text-grey-70">
                {post.editorialNotes.expectedSeoValue}
              </p>
            </div>
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
                Follow-ups
              </p>
              <ul className="mt-4 space-y-2 font-sans text-sm leading-6 text-grey-70">
                {post.editorialNotes.futureFollowUps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {ctas.length > 0 && (
        <section className="border-b border-black px-6 py-12 small:px-12 small:py-16">
          <div className="grid gap-4 small:grid-cols-3">
            {ctas.map((cta) => (
              <a
                key={`${cta.href}-${cta.label}`}
                href={cta.href}
                className="group border border-black bg-white p-5 transition-colors hover:bg-black"
              >
                <h2 className="font-sans text-lg font-semibold leading-tight group-hover:text-white">
                  {cta.label}
                </h2>
                <p className="mt-3 font-sans text-sm leading-6 text-grey-60 group-hover:text-grey-10">
                  {cta.copy}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="px-6 py-12 small:px-12 small:py-16">
        <div className="flex flex-col justify-between gap-6 border border-black bg-white p-6 small:flex-row small:items-center small:p-8">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
              Continue exploring
            </p>
            <h2 className="mt-3 font-sans text-2xl font-semibold leading-tight">
              Find fixtures that fit the note.
            </h2>
          </div>
          <LocalizedClientLink
            href={post.relatedHref}
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-7 py-3 font-sans text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
          >
            {post.relatedLabel}
          </LocalizedClientLink>
        </div>
      </footer>
    </article>
  )
}