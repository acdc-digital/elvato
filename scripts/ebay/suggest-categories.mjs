#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { ebayMarketplaceId, ebayRequest } from "./lib/ebay-client.mjs"
import { ensureReportsDir, timestamp } from "./lib/env.mjs"

const args = process.argv.slice(2)
const queryIndex = args.indexOf("--query")
const limitIndex = args.indexOf("--limit")

if (queryIndex === -1 || !args[queryIndex + 1]) {
  console.error("Usage: node scripts/ebay/suggest-categories.mjs --query <product title> [--limit 5]")
  process.exit(1)
}

const query = args[queryIndex + 1]
const limit = limitIndex === -1 ? 5 : Number(args[limitIndex + 1] || 5)
const marketplaceId = ebayMarketplaceId()

const treeResult = await ebayRequest(
  `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(marketplaceId)}`
)
const categoryTreeId = treeResult.payload.categoryTreeId

const suggestionsResult = await ebayRequest(
  `/commerce/taxonomy/v1/category_tree/${encodeURIComponent(categoryTreeId)}/get_category_suggestions?q=${encodeURIComponent(query)}`
)

const suggestions = (suggestionsResult.payload.categorySuggestions || [])
  .slice(0, limit)
  .map((suggestion) => ({
    categoryId: suggestion.category?.categoryId,
    categoryName: suggestion.category?.categoryName,
    categoryTreeNodeAncestors: (suggestion.categoryTreeNodeAncestors || []).map(
      (ancestor) => ({
        categoryId: ancestor.categoryId,
        categoryName: ancestor.categoryName,
      })
    ),
  }))

const reportPath = path.join(
  ensureReportsDir(),
  `category-suggestions-${timestamp()}.json`
)
fs.writeFileSync(
  reportPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), marketplaceId, query, categoryTreeId, suggestions }, null, 2)
)

console.log(`Category suggestions for: ${query}`)
for (const suggestion of suggestions) {
  const lineage = suggestion.categoryTreeNodeAncestors
    .map((ancestor) => ancestor.categoryName)
    .concat(suggestion.categoryName)
    .filter(Boolean)
    .join(" > ")
  console.log(`${suggestion.categoryId}\t${lineage}`)
}
console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`)