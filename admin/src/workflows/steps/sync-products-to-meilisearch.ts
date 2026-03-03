import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MEILISEARCH_MODULE } from "../../modules/meilisearch"
import MeilisearchModuleService from "../../modules/meilisearch/service"

type SyncProductsInput = {
  documents: Record<string, any>[]
}

export const syncProductsToMeilisearchStep = createStep(
  "sync-products-to-meilisearch",
  async (input: SyncProductsInput, { container }) => {
    const meilisearchService: MeilisearchModuleService =
      container.resolve(MEILISEARCH_MODULE)

    const task = await meilisearchService.indexData(input.documents)

    return new StepResponse({
      taskUid: task?.taskUid,
      documentsCount: input.documents.length,
    })
  }
)
