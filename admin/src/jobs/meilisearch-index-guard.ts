import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import MeilisearchModuleService from "../modules/meilisearch/service"
import { syncProductsToMeilisearchWorkflow } from "../workflows/sync-products-to-meilisearch"

/**
 * Runs every 30 minutes.  Detects when the MeiliSearch index has been wiped
 * (e.g. Railway ephemeral storage after a MeiliSearch service restart) and
 * automatically re-configures settings + re-indexes all products.
 *
 * This is the code-side complement to the Dockerfile bootstrap step:
 * the Dockerfile handles "Medusa restarts", this job handles
 * "MeiliSearch restarts without Medusa restarting".
 */
export default async function meilisearchIndexGuard(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const meilisearchService: MeilisearchModuleService =
    container.resolve(MEILISEARCH_MODULE)

  let stats: { numberOfDocuments: number }

  try {
    stats = await meilisearchService.getIndexStats()
  } catch (e: any) {
    logger.warn(
      `[meilisearch-guard] Could not reach MeiliSearch: ${e.message}`
    )
    return
  }

  if (stats.numberOfDocuments > 0) {
    // Index is healthy — nothing to do
    return
  }

  logger.info(
    "[meilisearch-guard] Index is empty — MeiliSearch was likely restarted. Triggering full resync..."
  )

  // --- Step 1: Re-configure index settings ---
  try {
    await meilisearchService.configureIndex({
      searchableAttributes: [
        "title",
        "description",
        "category_names",
        "main_category",
        "sub_categories",
        "materials",
        "styles",
        "room_types",
        "tags",
        "option_values",
      ],
      filterableAttributes: [
        "category_ids",
        "category_names",
        "main_category",
        "sub_categories",
        "materials",
        "styles",
        "room_types",
        "price_cents",
        "tags",
        "option_values",
        "status",
      ],
      sortableAttributes: ["price_cents", "created_at", "title"],
    })
    logger.info("[meilisearch-guard] Index settings configured")
  } catch (e: any) {
    logger.error(
      `[meilisearch-guard] Failed to configure index: ${e.message}`
    )
    return
  }

  // --- Step 2: Re-index all products ---
  const productModule = container.resolve(Modules.PRODUCT)
  const batchSize = 50
  let offset = 0
  let totalIndexed = 0

  while (true) {
    const [products] = await productModule.listAndCountProducts(
      {},
      { take: batchSize, skip: offset, select: ["id"] }
    )

    if (!products.length) break

    const productIds = products.map((p: any) => p.id)

    try {
      await syncProductsToMeilisearchWorkflow(container).run({
        input: { product_ids: productIds },
      })
      totalIndexed += products.length
    } catch (e: any) {
      logger.error(
        `[meilisearch-guard] Batch failed at offset ${offset}: ${e.message}`
      )
    }

    offset += batchSize
    if (products.length < batchSize) break
  }

  logger.info(
    `[meilisearch-guard] Resync complete: ${totalIndexed} products indexed`
  )
}

export const config = {
  name: "meilisearch-index-guard",
  schedule: "*/30 * * * *", // every 30 minutes
}
