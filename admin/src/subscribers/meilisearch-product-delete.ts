import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import MeilisearchModuleService from "../modules/meilisearch/service"

export default async function productDeletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const meilisearchService: MeilisearchModuleService =
    container.resolve(MEILISEARCH_MODULE)

  logger.info(`MeiliSearch delete triggered for product ${data.id}`)

  await meilisearchService.deleteFromIndex([data.id])
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}
