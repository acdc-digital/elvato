import { ExecArgs } from "@medusajs/framework/types"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import MeilisearchModuleService from "../modules/meilisearch/service"

export default async function configureMeilisearch({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const meilisearchService: MeilisearchModuleService =
    container.resolve(MEILISEARCH_MODULE)

  logger.info("Configuring MeiliSearch product index settings...")

  await meilisearchService.configureIndex({
    searchableAttributes: [
      "title",
      "description",
      "category_names",
      "tags",
      "option_values",
    ],
    filterableAttributes: [
      "category_ids",
      "category_names",
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
    ],
  })

  logger.info("MeiliSearch index configured successfully")
}
