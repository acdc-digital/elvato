import { Metadata } from "next"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { featuredPost, posts } from "./posts"

export const metadata: Metadata = {
  title: "LED-itorial | Elvato",
  description:
    "Lighting notes, room guides, and fixture edits from Elvato's contemporary lighting team.",
}

const principles = [
  "Scale before style",
  "Layer ambient, task, and accent light",
  "Choose finishes that repeat somewhere in the room",
]

export default function LeditorialPage() {
  return (
    <div className="w-full bg-canvas text-black">
      <section className="border-b border-black px-6 py-10 small:px-12 small:py-16">
        <div className="grid gap-10 small:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] small:items-start">
          <div className="max-w-3xl">
            <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-grey-50">
              LED-itorial
            </p>
            <h1 className="font-sans text-4xl font-semibold leading-[0.98] tracking-normal small:text-7xl">
              Notes on lighting a room well.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-grey-70 small:text-lg">
              Practical, design-minded guidance from Elvato: fixture scale, room
              planning, finish choices, colour temperature, and the small details
              that make lighting feel considered.
            </p>
          </div>
          <LocalizedClientLink href={`/leditorial/${featuredPost.slug}`} className="group block">
            <article className="border border-black bg-white">
              <div className="relative aspect-[16/11] overflow-hidden border-b border-black bg-grey-10">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.alt}
                  fill
                  priority
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="p-6 small:p-8">
                <div className="mb-4 flex items-center justify-between gap-4 font-sans text-xs uppercase tracking-[0.2em] text-grey-50">
                  <span>{featuredPost.category}</span>
                  <span>{featuredPost.readTime}</span>
                </div>
                <h2 className="font-sans text-2xl font-semibold leading-tight small:text-3xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-4 font-sans text-sm leading-relaxed text-grey-60">
                  {featuredPost.excerpt}
                </p>
              </div>
            </article>
          </LocalizedClientLink>
        </div>
      </section>

      <section className="border-b border-black px-6 py-14 small:px-12 small:py-16">
        <div className="grid gap-6 small:grid-cols-3">
          {principles.map((principle, index) => (
            <div key={principle} className="border border-black bg-white p-6">
              <p className="mb-6 font-mono text-xs text-grey-40">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="font-sans text-lg font-semibold leading-tight">
                {principle}
              </h2>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 small:px-12 small:py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 small:flex-row small:items-end">
          <div>
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-grey-50">
              Latest
            </p>
            <h2 className="font-sans text-3xl font-semibold leading-tight small:text-5xl">
              Field notes for better fixtures.
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-7 py-3 font-sans text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
          >
            Shop lighting
          </LocalizedClientLink>
        </div>

        <div className="grid gap-6 medium:grid-cols-3">
          {posts.slice(1).map((post) => (
            <LocalizedClientLink key={post.title} href={`/leditorial/${post.slug}`} className="group block">
              <article className="h-full border border-black bg-white">
                <div className="relative aspect-[4/3] overflow-hidden border-b border-black bg-grey-10">
                  <Image
                    src={post.image}
                    alt={post.alt}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1280px) 100vw, 33vw"
                  />
                </div>
                <div className="flex h-full flex-col p-6">
                  <div className="mb-4 flex items-center justify-between gap-4 font-sans text-[11px] uppercase tracking-[0.2em] text-grey-50">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="font-sans text-xl font-semibold leading-tight">
                    {post.title}
                  </h3>
                  <p className="mt-4 font-sans text-sm leading-relaxed text-grey-60">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </LocalizedClientLink>
          ))}
        </div>
      </section>
    </div>
  )
}