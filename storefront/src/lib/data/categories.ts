import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

// Re-export client-safe types and utilities for server components
export {
  type CategoryNode,
  type MainCategoryName,
  MAIN_CATEGORY_IDS,
  flattenCategoryTree,
} from "./categories-client"

import type { CategoryNode } from "./categories-client"

export const listCategories = async (query?: Record<string, any>) => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields:
            "*category_children, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories)
}

/**
 * Fetches the category tree with parent-child hierarchy
 * Returns only root-level categories with their children nested
 */
export const getCategoryTree = async (): Promise<CategoryNode[]> => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  try {
    const response = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      query: {
        fields: "id,name,handle,parent_category_id,category_children",
        include_descendants_tree: true,
        parent_category_id: "null",
        limit: 100,
      },
      next,
      cache: "force-cache",
    })

    const categories = response.product_categories || []
    const allIds = collectCategoryIds(categories)
    const counts = await getCategoryCounts(allIds)

    return buildCategoryTree(categories, counts)
  } catch (error) {
    console.error("Failed to fetch category tree:", error)
    return []
  }
}

/**
 * Fetch product counts for a list of category IDs via lightweight Medusa queries.
 * Uses limit=0 so no product data is returned — only the count.
 */
async function getCategoryCounts(
  categoryIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}

  await Promise.all(
    categoryIds.map(async (id) => {
      try {
        const res = await sdk.client.fetch<{ count: number }>(
          "/store/products",
          {
            query: { category_id: id, limit: 0, fields: "id" },
            cache: "force-cache",
          }
        )
        counts[id] = res.count
      } catch {
        counts[id] = 0
      }
    })
  )

  return counts
}

/**
 * Collect all category IDs from a tree (root + children)
 */
function collectCategoryIds(
  categories: HttpTypes.StoreProductCategory[]
): string[] {
  const ids: string[] = []
  const walk = (cats: HttpTypes.StoreProductCategory[]) => {
    for (const cat of cats) {
      ids.push(cat.id)
      if (cat.category_children) walk(cat.category_children)
    }
  }
  walk(categories)
  return ids
}

/**
 * Recursively builds a CategoryNode tree from Medusa categories
 */
function buildCategoryTree(
  categories: HttpTypes.StoreProductCategory[],
  counts?: Record<string, number>
): CategoryNode[] {
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    handle: cat.handle || "",
    parentId: cat.parent_category_id || null,
    children: cat.category_children
      ? buildCategoryTree(cat.category_children, counts)
      : [],
    productCount: counts?.[cat.id],
  }))
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children",
          handle,
        },
        next,
        cache: "force-cache",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
