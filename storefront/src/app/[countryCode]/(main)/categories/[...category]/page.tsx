import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list"
import { getBaseURL } from "@lib/util/env"
import { buildAlternates } from "@lib/util/seo"

export const revalidate = 300
export const dynamicParams = true

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    limit?: string
  }>
}

export async function generateStaticParams() {
  // Return empty array to avoid prerendering all category pages at build time.
  // Pages are generated on first request and cached via `revalidate = 300`.
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const description =
      productCategory.description ??
      `Shop ${productCategory.name} lighting at Elvato.`

    let countryCodes: string[] = []
    try {
      const regions = await listRegions()
      countryCodes = regions
        ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
        .filter((c): c is string => Boolean(c)) ?? []
    } catch {
      // hreflang is best-effort; canonical alone is still emitted.
    }

    return {
      title: productCategory.name,
      description,
      alternates: buildAlternates(
        `/categories/${params.category.join("/")}`,
        countryCodes
      ),
    }
  } catch (error) {
    if ((error as Error)?.message?.includes("NEXT_NOT_FOUND")) throw error
    console.error(
      `[seo] category generateMetadata failed for ${params.category.join("/")}:`,
      error
    )
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, limit } = searchParams

  let productCategory
  try {
    productCategory = await getCategoryByHandle(params.category)
    if (!productCategory) notFound()
  } catch (e) {
    if ((e as Error)?.message?.includes("NEXT_NOT_FOUND")) throw e
    console.error(
      `[category] render failed for ${params.category.join("/")}:`,
      e
    )
    notFound()
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${getBaseURL()}/${params.countryCode}`,
      },
      ...params.category.map((segment: string, index: number) => ({
        "@type": "ListItem",
        position: index + 2,
        name: index === params.category.length - 1
          ? productCategory.name
          : segment.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        item: `${getBaseURL()}/${params.countryCode}/categories/${params.category.slice(0, index + 1).join("/")}`,
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
        limit={limit}
      />
    </>
  )
}
