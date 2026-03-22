import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch"
import MeilisearchModuleService from "../../../../modules/meilisearch/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const meilisearchService: MeilisearchModuleService =
    req.scope.resolve(MEILISEARCH_MODULE)

  try {
    const stats = await meilisearchService.getIndexStats()
    res.json({
      ok: true,
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
      fieldDistribution: stats.fieldDistribution,
    })
  } catch (e: any) {
    res.status(503).json({
      ok: false,
      error: e.message,
    })
  }
}
