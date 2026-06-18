import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ProductStatus } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/core-flows"

import { syncProductsToMeilisearchWorkflow } from "../workflows/sync-products-to-meilisearch"

type ProductSummary = {
  id: string
  title?: string | null
  handle?: string | null
  status?: string | null
}

type ScriptOptions = {
  apply: boolean
  syncSearch: boolean
  batchSize: number
}

const DEFAULT_BATCH_SIZE = 50
const PRODUCT_STATUSES = [
  ProductStatus.DRAFT,
  ProductStatus.PROPOSED,
  ProductStatus.PUBLISHED,
  ProductStatus.REJECTED,
]

const parseOptions = (args: string[] = []): ScriptOptions => {
  const batchArg = args.find((arg) => arg.startsWith("--batch-size="))
  const batchSize = batchArg
    ? Number(batchArg.split("=")[1])
    : DEFAULT_BATCH_SIZE

  return {
    apply: args.includes("--apply") || args.includes("apply"),
    syncSearch:
      !args.includes("--no-search-sync") && !args.includes("no-search-sync"),
    batchSize:
      Number.isFinite(batchSize) && batchSize > 0
        ? Math.floor(batchSize)
        : DEFAULT_BATCH_SIZE,
  }
}

const countByStatus = async (productModule: any) => {
  const counts: Record<string, number> = {}

  for (const status of PRODUCT_STATUSES) {
    const [, count] = await productModule.listAndCountProducts(
      { status },
      { take: 1, skip: 0, select: ["id"] }
    )
    counts[status] = count
  }

  const [, total] = await productModule.listAndCountProducts(
    {},
    { take: 1, skip: 0, select: ["id"] }
  )
  counts.total = total

  return counts
}

const listPublishedProducts = async (productModule: any) => {
  const products: ProductSummary[] = []
  let offset = 0

  while (true) {
    const [batch] = await productModule.listAndCountProducts(
      { status: ProductStatus.PUBLISHED },
      {
        take: 100,
        skip: offset,
        select: ["id", "title", "handle", "status"],
      }
    )

    if (!batch.length) {
      break
    }

    products.push(...batch)
    offset += batch.length

    if (batch.length < 100) {
      break
    }
  }

  return products
}

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export default async function draftPublishedProducts({
  container,
  args,
}: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)
  const options = parseOptions(args)

  logger.info(
    `[draft-products] Mode: ${options.apply ? "APPLY" : "DRY RUN"}`
  )
  logger.info(
    `[draft-products] Search sync: ${options.syncSearch ? "enabled" : "disabled"}`
  )
  logger.info(`[draft-products] Batch size: ${options.batchSize}`)

  const beforeCounts = await countByStatus(productModule)
  logger.info(`[draft-products] Counts before: ${JSON.stringify(beforeCounts)}`)

  const publishedProducts = await listPublishedProducts(productModule)
  logger.info(
    `[draft-products] Published products to draft: ${publishedProducts.length}`
  )

  for (const product of publishedProducts.slice(0, 10)) {
    logger.info(
      `[draft-products] Sample: ${product.id} | ${product.title ?? "Untitled"} | ${product.handle ?? "no-handle"}`
    )
  }

  if (!options.apply) {
    logger.info(
      "[draft-products] Dry run only. Re-run with --apply to set published products to draft."
    )
    return
  }

  if (!publishedProducts.length) {
    logger.info("[draft-products] Nothing to update.")
    return
  }

  let updated = 0
  let synced = 0
  const batches = chunk(publishedProducts, options.batchSize)

  for (const [index, batch] of batches.entries()) {
    const ids = batch.map((product) => product.id)

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: ids },
        update: { status: ProductStatus.DRAFT },
      },
    })

    updated += ids.length
    logger.info(
      `[draft-products] Updated batch ${index + 1}/${batches.length}; updated=${updated}`
    )

    if (options.syncSearch) {
      await syncProductsToMeilisearchWorkflow(container).run({
        input: { product_ids: ids },
      })
      synced += ids.length
      logger.info(`[draft-products] Synced search removals; synced=${synced}`)
    }
  }

  const afterCounts = await countByStatus(productModule)

  logger.info(
    `[draft-products] Complete: ${JSON.stringify({
      updated,
      synced,
      before: beforeCounts,
      after: afterCounts,
    })}`
  )
}