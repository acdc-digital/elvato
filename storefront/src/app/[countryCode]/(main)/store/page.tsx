import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store | All Products",
  description: "Browse our complete collection of lighting fixtures and accessories.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    category_id?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, category_id, q } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      categoryId={category_id}
      query={q}
    />
  )
}
