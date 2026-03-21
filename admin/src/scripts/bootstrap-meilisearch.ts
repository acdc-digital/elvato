import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import MeilisearchModuleService from "../modules/meilisearch/service"
import { syncProductsToMeilisearchWorkflow } from "../workflows/sync-products-to-meilisearch"

/**
 * Bootstrap Meilisearch: configure index settings + full product sync.
 *
 * Run via:  npx medusa exec ./src/scripts/bootstrap-meilisearch.ts
 *
 * This is the single command to run after every Meilisearch restart
 * (Railway ephemeral storage wipes the index on each deploy).
 */
export default async function bootstrapMeilisearch({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const meilisearchService: MeilisearchModuleService =
    container.resolve(MEILISEARCH_MODULE)

  // --- Step 1: Configure index settings ---
  logger.info("[bootstrap] Step 1/2: Configuring index settings...")

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
    displayedAttributes: [
      "id",
      "handle",
      "title",
      "description",
      "status",
      "thumbnail",
      "category_ids",
      "category_names",
      "tags",
      "option_values",
      "price_cents",
      "created_at",
      "variant_count",
      "main_category",
      "sub_categories",
      "materials",
      "styles",
      "room_types",
    ],
    stopWords: [
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
      "for", "of", "with", "by", "from", "is", "it", "this", "that",
      "are", "was", "be", "has", "had", "do", "does", "did", "will",
      "would", "could", "should", "may", "might", "can", "each",
      "which", "their", "not", "also", "than", "then", "its",
    ],
    synonyms: {
      chandelier: ["chandeliers", "hanging light", "ceiling fixture"],
      pendant: ["pendants", "pendant light", "hanging pendant"],
      sconce: ["sconces", "wall sconce", "wall light"],
      lamp: ["lamps", "light", "lighting"],
      crystal: ["crystals", "crystal glass"],
      modern: ["contemporary"],
      "flush mount": ["flushmount", "flush-mount", "ceiling light"],
      led: ["LED"],
    },
  })

  logger.info("[bootstrap] Index settings configured")

  // --- Step 2: Full product sync ---
  logger.info("[bootstrap] Step 2/2: Syncing all products...")

  const productModule = container.resolve(Modules.PRODUCT)
  const batchSize = 50
  let offset = 0
  let totalIndexed = 0
  let errors: string[] = []

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
      logger.info(`[bootstrap] Synced ${totalIndexed} products...`)
    } catch (e: any) {
      logger.error(`[bootstrap] Batch failed at offset ${offset}: ${e.message}`)
      errors.push(`Batch at offset ${offset}: ${e.message}`)
    }

    offset += batchSize
    if (products.length < batchSize) break
  }

  logger.info(
    `[bootstrap] Complete: ${totalIndexed} products indexed, ${errors.length} errors`
  )

  if (errors.length > 0) {
    logger.warn(`[bootstrap] Errors:\n${errors.join("\n")}`)
  }
}
