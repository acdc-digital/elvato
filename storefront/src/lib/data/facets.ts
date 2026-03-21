"use server"

import { searchProducts, FacetDistribution } from "./search"

/**
 * Performs a facet-only search (no results needed, just distributions)
 * to populate filter sidebars with available facet values and counts.
 */
export async function getFacetDistribution(opts?: {
  mainCategory?: string
  categoryIds?: string[]
}): Promise<FacetDistribution | null> {
  const result = await searchProducts({
    query: "",
    categoryIds: opts?.categoryIds,
    mainCategory: opts?.mainCategory,
    limit: 0,
  })

  return result?.facetDistribution ?? null
}
