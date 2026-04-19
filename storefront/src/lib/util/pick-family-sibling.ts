import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

/**
 * Selects a single "family" sibling for a given product, using a layered
 * priority: same collection → same product type → shared tags.
 *
 * Returns the chosen sibling plus the candidate pool that produced it, so
 * downstream components (e.g. RelatedProducts) can dedupe against it.
 *
 * Returns null when no region is available or no candidates are found.
 */
export type FamilySiblingResult = {
  sibling: HttpTypes.StoreProduct
  candidates: HttpTypes.StoreProduct[]
} | null

export async function pickFamilySibling({
  product,
  countryCode,
  regionId,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  regionId: string
}): Promise<FamilySiblingResult> {
  // Manual override: products can pin a specific sibling via
  // metadata.family_sibling_handle (string) — useful when the automatic
  // collection/type/tag heuristic doesn't surface the desired companion.
  const overrideHandle =
    typeof (product.metadata as any)?.family_sibling_handle === "string"
      ? ((product.metadata as any).family_sibling_handle as string).trim()
      : ""
  if (overrideHandle) {
    try {
      const { response } = await listProducts({
        countryCode,
        queryParams: {
          region_id: regionId,
          handle: overrideHandle,
          limit: 1,
        } as HttpTypes.StoreProductListParams,
      })
      const pinned = response.products.find((p) => p.id !== product.id)
      if (pinned) {
        return { sibling: pinned, candidates: [pinned] }
      }
    } catch {
      // fall through to heuristic selection
    }
  }

  const queryParams: HttpTypes.StoreProductListParams = {
    region_id: regionId,
    is_giftcard: false,
    limit: 8,
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  } else if (product.type_id) {
    queryParams.type_id = [product.type_id]
  } else if (product.tags?.length) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  } else {
    return null
  }

  let candidates: HttpTypes.StoreProduct[] = []
  try {
    const { response } = await listProducts({ countryCode, queryParams })
    candidates = response.products.filter((p) => p.id !== product.id)
  } catch {
    return null
  }

  if (candidates.length === 0) return null

  const sibling =
    candidates.find((p) =>
      (p.variants ?? []).some(
        (v) => (v as any).calculated_price?.calculated_amount != null
      )
    ) ?? candidates[0]

  return { sibling, candidates }
}
