import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list"
import { getBaseURL } from "@lib/util/env"

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

    return {
      title: productCategory.name,
      description,
      alternates: {
        canonical: `${getBaseURL()}/${params.countryCode}/categories/${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, limit } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
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
