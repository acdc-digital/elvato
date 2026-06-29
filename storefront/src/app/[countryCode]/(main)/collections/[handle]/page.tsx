import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list"
import { getBaseURL } from "@lib/util/env"
import { buildAlternates } from "@lib/util/seo"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
    limit?: string
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections({
      fields: "id,handle,title",
    })

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for collection pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  let collection: StoreCollection | undefined
  let countryCodes: string[] = []

  try {
    collection = await getCollectionByHandle(params.handle)
    if (!collection) notFound()

    const regions = await listRegions()
    countryCodes = regions
      ?.flatMap((r) => r.countries?.map((c) => c.iso_2))
      .filter((c): c is string => Boolean(c)) ?? []
  } catch (e) {
    if ((e as Error)?.message?.includes("NEXT_NOT_FOUND")) throw e
    console.error(
      `[seo] collection generateMetadata failed for ${params.handle}:`,
      e
    )
    notFound()
  }

  const description = `Shop the ${collection!.title} collection at Elvato — contemporary lighting designs.`

  return {
    title: collection!.title,
    description,
    openGraph: {
      title: `${collection!.title} | Elvato`,
      description,
    },
    alternates: buildAlternates(
      `/collections/${params.handle}`,
      countryCodes
    ),
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, limit } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      limit={limit}
    />
  )
}
