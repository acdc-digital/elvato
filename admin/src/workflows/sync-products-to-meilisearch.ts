import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { syncProductsToMeilisearchStep } from "./steps/sync-products-to-meilisearch"
import { deleteProductsFromMeilisearchStep } from "./steps/delete-products-from-meilisearch"
import { extractFacets } from "../modules/meilisearch/facet-mapping"

type SyncProductsToMeilisearchInput = {
  product_ids?: string[]
}

type SearchProduct = {
  id: string
  handle?: string | null
  title?: string | null
  description?: string | null
  status?: string | null
  thumbnail?: string | null
  created_at: string | Date
  categories?: { id: string; name: string }[] | null
  tags?: { value: string }[] | null
  options?: { values?: { value?: string | null }[] | null }[] | null
  variants?: { id: string; prices?: { amount?: number | null }[] | null }[] | null
}

export const syncProductsToMeilisearchWorkflow = createWorkflow(
  "sync-products-to-meilisearch",
  (input: SyncProductsToMeilisearchInput) => {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "handle",
        "title",
        "description",
        "status",
        "thumbnail",
        "created_at",
        "categories.id",
        "categories.name",
        "tags.value",
        "options.values.value",
        "variants.prices.amount",
        "variants.id",
      ],
      filters: input.product_ids
        ? { id: input.product_ids }
        : {},
    })

    const { toIndex, toDelete } = transform(
      { products: products as unknown as SearchProduct[] },
      (data) => {
        const toIndex: Record<string, any>[] = []
        const toDelete: string[] = []

        for (const product of data.products) {
          if (product.status === "published") {
            const categoryIds = (product.categories || []).map(
              (c: any) => c.id
            )
            const categoryNames = (product.categories || []).map(
              (c: any) => c.name
            )
            const tags = (product.tags || []).map((t: any) => t.value)

            const optionValues: string[] = []
            for (const option of product.options || []) {
              for (const val of option.values || []) {
                if (val.value && !optionValues.includes(val.value)) {
                  optionValues.push(val.value)
                }
              }
            }

            const prices = (product.variants || [])
              .flatMap((v: any) => (v.prices || []).map((p: any) => p.amount))
              .filter((p: any) => typeof p === "number")
            const priceCents = prices.length > 0 ? Math.min(...prices) : 0

            // Extract structured facets from product metadata
            const facets = extractFacets({
              categoryNames,
              tags,
              optionValues,
              title: product.title || "",
              description: product.description || "",
            })

            toIndex.push({
              id: product.id,
              handle: product.handle,
              title: product.title,
              description: product.description || "",
              status: product.status,
              thumbnail: product.thumbnail,
              category_ids: categoryIds,
              category_names: categoryNames,
              tags,
              option_values: optionValues,
              price_cents: priceCents,
              created_at: Math.floor(
                new Date(product.created_at).getTime() / 1000
              ),
              variant_count: (product.variants || []).length,
              // Structured facets
              main_category: facets.main_category,
              sub_categories: facets.sub_categories,
              materials: facets.materials,
              styles: facets.styles,
              room_types: facets.room_types,
            })
          } else {
            toDelete.push(product.id)
          }
        }

        return { toIndex, toDelete }
      }
    )

    const syncResult = syncProductsToMeilisearchStep({
      documents: toIndex,
    })

    const deleteResult = deleteProductsFromMeilisearchStep({
      ids: toDelete,
    })

    return new WorkflowResponse({
      indexed: syncResult,
      deleted: deleteResult,
    })
  }
)
