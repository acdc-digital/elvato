import {
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MEILISEARCH_MODULE } from "../../modules/meilisearch"
import MeilisearchModuleService from "../../modules/meilisearch/service"

type DeleteProductsInput = {
  ids: string[]
}

export const deleteProductsFromMeilisearchStep = createStep(
  "delete-products-from-meilisearch",
  async (input: DeleteProductsInput, { container }) => {
    const meilisearchService: MeilisearchModuleService =
      container.resolve(MEILISEARCH_MODULE)

    const task = await meilisearchService.deleteFromIndex(input.ids)

    return new StepResponse({
      taskUid: task?.taskUid,
      deletedCount: input.ids.length,
    })
  }
)
