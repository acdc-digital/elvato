"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list"
import { getAuthHeaders, getCacheOptions, getPublicCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  cacheScope = "personalized",
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  cacheScope?: "personalized" | "public"
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers =
    cacheScope === "public"
      ? {}
      : {
          ...(await getAuthHeaders()),
        }

  const next =
    cacheScope === "public"
      ? getPublicCacheOptions("products")
      : {
          ...(await getCacheOptions("products")),
        }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+variants.sku,*variants.options,+variants.metadata,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * Fetch products for the store listing page with sorting + pagination.
 *
 * - `created_at` uses Medusa's server-side sort & pagination (fast, cacheable).
 * - `price_asc` / `price_desc` fetches all products with slim fields and
 *   sorts client-side (Medusa doesn't support ordering by calculated_price).
 *
 * Images are excluded from the response because the storefront renders CDN
 * thumbnails from ConvexFS instead.
 */
const LISTING_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity"

export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  cacheScope = "personalized",
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  cacheScope?: "personalized" | "public"
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 24

  // Price-based sorts require fetching all products for client-side sorting
  if (sortBy === "price_asc" || sortBy === "price_desc") {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: 0,
      queryParams: {
        ...queryParams,
        limit: 1000,
        fields: LISTING_FIELDS,
      },
      countryCode,
      cacheScope,
    })

    const sortedProducts = sortProducts(products, sortBy)
    const pageParam = (page - 1) * limit
    const nextPage = count > pageParam + limit ? pageParam + limit : null
    const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

    return {
      response: {
        products: paginatedProducts,
        count,
      },
      nextPage,
      queryParams,
    }
  }

  // For created_at (default), use server-side sorting + pagination
  return listProducts({
    pageParam: page,
    queryParams: {
      ...queryParams,
      limit,
      order: "-created_at",
      fields: LISTING_FIELDS,
    },
    countryCode,
    cacheScope,
  })
}
