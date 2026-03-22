import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch"
import MeilisearchModuleService from "../../../../modules/meilisearch/service"
import { syncProductsToMeilisearchWorkflow } from "../../../../workflows/sync-products-to-meilisearch"

/**
 * POST /admin/meilisearch/bootstrap
 *
 * Runs a full bootstrap: configure index settings + re-index all products.
 * Use this whenever MeiliSearch loses its index (e.g. after a Railway restart).
 *
 * curl -X POST https://your-backend.up.railway.app/admin/meilisearch/bootstrap \
 *   -H "Authorization: Bearer <admin-token>"
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const meilisearchService: MeilisearchModuleService =
    req.scope.resolve(MEILISEARCH_MODULE)

  logger.info("[bootstrap-api] Starting full MeiliSearch bootstrap via API...")

  // --- Step 1: Configure index settings ---
  logger.info("[bootstrap-api] Step 1/2: Configuring index settings...")
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
    })
    logger.info("[bootstrap-api] Index settings configured")
  } catch (e: any) {
    logger.error(`[bootstrap-api] Failed to configure index: ${e.message}`)
    return res.status(500).json({ ok: false, step: "configure", error: e.message })
  }

  // --- Step 2: Full product sync ---
  logger.info("[bootstrap-api] Step 2/2: Syncing all products...")
  const productModule = req.scope.resolve(Modules.PRODUCT)
  const batchSize = 50
  let offset = 0
  let totalIndexed = 0
  const errors: string[] = []

  while (true) {
    const [products] = await productModule.listAndCountProducts(
      {},
      { take: batchSize, skip: offset, select: ["id"] }
    )

    if (!products.length) break

    const productIds = products.map((p: any) => p.id)

    try {
      await syncProductsToMeilisearchWorkflow(req.scope).run({
        input: { product_ids: productIds },
      })
      totalIndexed += products.length
      logger.info(`[bootstrap-api] Synced ${totalIndexed} products...`)
    } catch (e: any) {
      logger.error(
        `[bootstrap-api] Batch failed at offset ${offset}: ${e.message}`
      )
      errors.push(`Batch at offset ${offset}: ${e.message}`)
    }

    offset += batchSize
    if (products.length < batchSize) break
  }

  logger.info(
    `[bootstrap-api] Complete: ${totalIndexed} products indexed, ${errors.length} errors`
  )

  res.json({
    ok: true,
    productsIndexed: totalIndexed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
