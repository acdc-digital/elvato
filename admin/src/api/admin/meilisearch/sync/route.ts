import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { syncProductsToMeilisearchWorkflow } from "../../../../workflows/sync-products-to-meilisearch"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  logger.info("MeiliSearch full sync triggered via admin API")

  const productModule = req.scope.resolve(Modules.PRODUCT)
  const batchSize = 50
  let offset = 0
  let totalIndexed = 0
  let errors: string[] = []

  // Paginate through all products in smaller batches
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
      logger.info(`MeiliSearch sync batch: ${totalIndexed} products indexed so far`)
    } catch (e: any) {
      logger.error(`MeiliSearch sync batch failed at offset ${offset}: ${e.message}`)
      errors.push(`Batch at offset ${offset}: ${e.message}`)
    }

    offset += batchSize

    if (products.length < batchSize) break
  }

  logger.info(`MeiliSearch full sync complete: ${totalIndexed} products processed, ${errors.length} errors`)

  res.json({
    success: true,
    productsProcessed: totalIndexed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
