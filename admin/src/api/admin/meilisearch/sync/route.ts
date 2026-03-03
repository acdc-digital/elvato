import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { syncProductsToMeilisearchWorkflow } from "../../../../workflows/sync-products-to-meilisearch"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  logger.info("MeiliSearch full sync triggered via admin API")

  const productModule = req.scope.resolve(Modules.PRODUCT)
  const batchSize = 100
  let offset = 0
  let totalIndexed = 0

  // Paginate through all products in batches
  while (true) {
    const [products] = await productModule.listAndCountProducts(
      {},
      { take: batchSize, skip: offset, select: ["id"] }
    )

    if (!products.length) break

    const productIds = products.map((p: any) => p.id)

    await syncProductsToMeilisearchWorkflow(req.scope).run({
      input: { product_ids: productIds },
    })

    totalIndexed += products.length
    offset += batchSize

    if (products.length < batchSize) break
  }

  logger.info(`MeiliSearch full sync complete: ${totalIndexed} products processed`)

  res.json({
    success: true,
    productsProcessed: totalIndexed,
  })
}
