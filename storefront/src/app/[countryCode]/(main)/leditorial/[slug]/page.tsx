import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "../../../../../modules/common/components/localized-client-link"

import { getPostBySlug, posts } from "../posts"

type Props = {
  params: Promise<{
    countryCode: string
    slug: string
  }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions
        ?.flatMap((region) => region.countries?.map((country) => country.iso_2))
        .filter(Boolean) as string[]
    )

    return countryCodes.flatMap((countryCode) =>
      posts.map((post) => ({ countryCode, slug: post.slug }))
    )
  } catch {
    return ["ca", "us"].flatMap((countryCode) =>
      posts.map((post) => ({ countryCode, slug: post.slug }))
    )
  }
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
    title: `${post.title} | LED-itorial`,
    description: post.excerpt,
  }
}

export default async function LeditorialPostPage(props: Props) {
  const { slug } = await props.params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="w-full bg-canvas text-black">
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
              {post.title}
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-grey-70 small:text-lg">
              {post.dek}
            </p>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden border border-black bg-grey-10">
            <Image
              src={post.image}
              alt={post.alt}
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
          </div>
        </div>
      </div>

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