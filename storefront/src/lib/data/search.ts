"use server"

import { MeiliSearch } from "meilisearch"
import { SortOptions } from "@modules/store/components/refinement-list"

let client: MeiliSearch | null = null

function getClient(): MeiliSearch | null {
  // Prefer server-only env vars — the master key is stable across Meilisearch
  // restarts (derived search keys regenerate and go stale).
  // This file is "use server" so non-NEXT_PUBLIC_ vars are never exposed to the client.
  const host = process.env.MEILISEARCH_HOST || process.env.NEXT_PUBLIC_MEILISEARCH_HOST
  const apiKey = process.env.MEILISEARCH_API_KEY || process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY

  if (!host || !apiKey) return null

  if (!client) {
    client = new MeiliSearch({ host, apiKey })
  }
  return client
}

type SearchProductsOptions = {
  query?: string
  categoryIds?: string[]
  mainCategory?: string
  subCategories?: string[]
  materials?: string[]
  styles?: string[]
  roomTypes?: string[]
  sortBy?: SortOptions
  page?: number
  limit?: number
}

export type SearchHit = {
  id: string
  handle: string
  title: string
  description: string
  status: string
  thumbnail: string | null
  category_ids: string[]
  category_names: string[]
  tags: string[]
  option_values: string[]
  price_cents: number
  created_at: number
  variant_count: number
  main_category: string
  sub_categories: string[]
  materials: string[]
  styles: string[]
  room_types: string[]
}

export type FacetDistribution = Record<string, Record<string, number>>

export type SearchResult = {
  hits: SearchHit[]
  totalHits: number
  page: number
  totalPages: number
  processingTimeMs: number
  facetDistribution?: FacetDistribution
}

const SORT_MAP: Record<string, string> = {
  price_asc: "price_cents:asc",
  price_desc: "price_cents:desc",
  created_at: "created_at:desc",
}

// Facets we request distribution for on every search
const FACET_FIELDS = [
  "main_category",
  "sub_categories",
  "materials",
  "styles",
  "room_types",
]

export async function searchProducts(
  options: SearchProductsOptions
): Promise<SearchResult | null> {
  const meili = getClient()
  if (!meili) return null

  const {
    query = "",
    categoryIds = [],
    mainCategory,
    subCategories = [],
    materials = [],
    styles = [],
    roomTypes = [],
    sortBy,
    page: rawPage,
    limit: rawLimit,
  } = options

  const page = Number(rawPage) > 0 ? Number(rawPage) : 1
  const limit = Number(rawLimit) > 0 ? Number(rawLimit) : 12
  const offset = (page - 1) * limit

  const filter: string[] = ['status = "published"']

  if (categoryIds.length > 0) {
    const categoryFilter = categoryIds
      .map((id) => `category_ids = "${id}"`)
      .join(" OR ")
    filter.push(`(${categoryFilter})`)
  }

  if (mainCategory) {
    filter.push(`main_category = "${mainCategory}"`)
  }

  if (subCategories.length > 0) {
    const subFilter = subCategories
      .map((s) => `sub_categories = "${s}"`)
      .join(" OR ")
    filter.push(`(${subFilter})`)
  }

  if (materials.length > 0) {
    const matFilter = materials
      .map((m) => `materials = "${m}"`)
      .join(" OR ")
    filter.push(`(${matFilter})`)
  }

  if (styles.length > 0) {
    const styleFilter = styles
      .map((s) => `styles = "${s}"`)
      .join(" OR ")
    filter.push(`(${styleFilter})`)
  }

  if (roomTypes.length > 0) {
    const roomFilter = roomTypes
      .map((r) => `room_types = "${r}"`)
      .join(" OR ")
    filter.push(`(${roomFilter})`)
  }

  const sort = sortBy && SORT_MAP[sortBy] ? [SORT_MAP[sortBy]] : undefined

  try {
    const result = await meili.index("products").search(query, {
      filter,
      sort,
      limit,
      offset,
      facets: FACET_FIELDS,
    })

    return {
      hits: result.hits as SearchHit[],
      totalHits: result.estimatedTotalHits ?? result.hits.length,
      page,
      totalPages: Math.ceil(
        (result.estimatedTotalHits ?? result.hits.length) / limit
      ),
      processingTimeMs: result.processingTimeMs,
      facetDistribution: result.facetDistribution as FacetDistribution | undefined,
    }
  } catch (error) {
    console.error("Meilisearch query failed, falling back:", error)
    return null
  }
}
