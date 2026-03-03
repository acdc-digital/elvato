import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncProductsToMeilisearchWorkflow } from "../workflows/sync-products-to-meilisearch"

export default async function productChangedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  logger.info(`MeiliSearch sync triggered for product ${data.id}`)

  await syncProductsToMeilisearchWorkflow(container).run({
    input: { product_ids: [data.id] },
  })
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
