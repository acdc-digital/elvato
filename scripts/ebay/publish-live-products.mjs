#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { ebayMarketplaceId, ebayRequest } from "./lib/ebay-client.mjs"
import {
  REPO_ROOT,
  ensureReportsDir,
  loadEbayEnv,
  optionalEnv,
  requiredEnv,
  timestamp,
} from "./lib/env.mjs"

loadEbayEnv()
loadLocalEnv()

const DEFAULT_MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app"
const args = parseArgs(process.argv.slice(2))

function parseArgs(argv) {
  const parsed = {
    limit: 25,
    offset: 0,
    apply: false,
    publish: false,
    yes: false,
    acceptAutoCategories: false,
    includeVariantProducts: false,
    medusaUrl: process.env.MEDUSA_BACKEND_URL || DEFAULT_MEDUSA_URL,
    categoryId: "",
    categoryName: "",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--limit") parsed.limit = Number(argv[++index] || parsed.limit)
    else if (arg === "--offset") parsed.offset = Number(argv[++index] || parsed.offset)
    else if (arg === "--medusa-url") parsed.medusaUrl = argv[++index] || parsed.medusaUrl
    else if (arg === "--category-id") parsed.categoryId = argv[++index] || ""
    else if (arg === "--category-name") parsed.categoryName = argv[++index] || ""
    else if (arg === "--accept-auto-categories") parsed.acceptAutoCategories = true
    else if (arg === "--include-variant-products") parsed.includeVariantProducts = true
    else if (arg === "--apply") parsed.apply = true
    else if (arg === "--publish") parsed.publish = true
    else if (arg === "--yes") parsed.yes = true
    else if (arg === "--help" || arg === "-h") {
      printUsage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!Number.isFinite(parsed.limit) || parsed.limit < 1 || parsed.limit > 25) {
    throw new Error("--limit must be between 1 and 25 because eBay bulk publish accepts 25 offers per call")
  }

  if (parsed.publish && (!parsed.apply || !parsed.yes)) {
    throw new Error("Publishing requires --apply --publish --yes")
  }

  return parsed
}

function printUsage() {
  console.log([
    "Usage: node scripts/ebay/publish-live-products.mjs [options]",
    "  --limit N                    Published Medusa products to process, max 25. Default 25.",
    "  --offset N                   Published Medusa product offset. Default 0.",
    "  --category-id ID             Use one reviewed eBay leaf category for all products.",
    "  --category-name NAME         Human-readable category name for reports.",
    "  --accept-auto-categories     Allow first eBay taxonomy suggestion per product when no category-id is provided.",
    "  --include-variant-products   Include products with multiple variants as a single eBay SKU.",
    "  --apply                      Create/replace inventory items and create offers.",
    "  --publish --yes              Publish created offers as live eBay listings.",
  ].join("\n"))
}

function loadLocalEnv() {
  for (const envPath of [".env", ".env.local", "admin/.env", "admin/.env.local", "storefront/.env.local"]) {
    const fullPath = path.join(REPO_ROOT, envPath)
    if (!fs.existsSync(fullPath)) continue

    for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex === -1) continue
      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
}

async function medusaLogin() {
  const email = requiredProcessEnv("MEDUSA_ADMIN_EMAIL")
  const password = requiredProcessEnv("MEDUSA_ADMIN_PASSWORD")
  const response = await fetch(new URL("/auth/user/emailpass", args.medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30_000),
  })
  const payload = await response.json().catch(async () => ({ message: await response.text() }))
  if (!response.ok) {
    throw new Error(`Medusa admin login failed (${response.status}): ${JSON.stringify(payload)}`)
  }
  return payload.token
}

function requiredProcessEnv(name) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`)
  return process.env[name]
}

async function medusaGet(jwt, endpoint) {
  const response = await fetch(new URL(endpoint, args.medusaUrl), {
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
  })
  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }
  if (!response.ok) {
    throw new Error(`Medusa GET ${endpoint} failed (${response.status}): ${JSON.stringify(payload)}`)
  }
  return payload
}

async function fetchPublishedProducts(jwt) {
  const fields = [
    "id",
    "title",
    "handle",
    "status",
    "description",
    "subtitle",
    "thumbnail",
    "images",
    "metadata",
    "type",
    "tags",
    "categories",
    "options",
    "*variants",
    "*variants.prices",
    "*variants.options",
  ].join(",")
  const endpoint = `/admin/products?status[]=published&limit=${args.limit}&offset=${args.offset}&fields=${encodeURIComponent(fields)}`
  const payload = await medusaGet(jwt, endpoint)
  return { products: payload.products || [], count: payload.count || 0 }
}

async function storeGet(endpoint) {
  const publishableKey = requiredProcessEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  const response = await fetch(new URL(endpoint, args.medusaUrl), {
    headers: { "x-publishable-api-key": publishableKey },
    signal: AbortSignal.timeout(45_000),
  })
  const payload = await response.json().catch(async () => ({ message: await response.text() }))
  if (!response.ok) {
    throw new Error(`Store GET ${endpoint} failed (${response.status}): ${JSON.stringify(payload)}`)
  }
  return payload
}

async function getUsdRegionId() {
  const payload = await storeGet("/store/regions")
  const regions = payload.regions || []
  const region =
    regions.find((candidate) =>
      (candidate.countries || []).some((country) => country.iso_2 === "us")
    ) ||
    regions.find((candidate) => candidate.currency_code === "usd") ||
    regions[0]
  if (!region?.id) throw new Error("Could not find a Store API region")
  return region.id
}

async function fetchStoreProduct(handle, regionId) {
  const fields = [
    "id",
    "title",
    "handle",
    "thumbnail",
    "images",
    "*variants",
    "*variants.calculated_price",
    "*variants.options",
    "+variants.inventory_quantity",
    "+variants.manage_inventory",
    "+variants.allow_backorder",
    "+variants.sku",
  ].join(",")
  const payload = await storeGet(
    `/store/products?handle=${encodeURIComponent(handle)}&region_id=${encodeURIComponent(regionId)}&fields=${encodeURIComponent(fields)}`
  )
  return payload.products?.[0] || null
}

async function enrichWithStorefrontPricing(products) {
  const regionId = await getUsdRegionId()
  const enriched = []
  for (const product of products) {
    const storeProduct = product.handle ? await fetchStoreProduct(product.handle, regionId) : null
    enriched.push({
      ...product,
      storefront: storeProduct,
      thumbnail: storeProduct?.thumbnail || product.thumbnail,
      images: storeProduct?.images?.length ? storeProduct.images : product.images,
    })
  }
  return enriched
}

async function getCategoryTreeId() {
  const marketplaceId = ebayMarketplaceId()
  const result = await ebayRequest(
    `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(marketplaceId)}`
  )
  return result.payload.categoryTreeId
}

async function suggestCategory(categoryTreeId, product) {
  if (args.categoryId) {
    return { id: args.categoryId, name: args.categoryName || "Reviewed category", source: "argument" }
  }

  const result = await ebayRequest(
    `/commerce/taxonomy/v1/category_tree/${encodeURIComponent(categoryTreeId)}/get_category_suggestions?q=${encodeURIComponent(product.title)}`
  )
  const suggestion = result.payload?.categorySuggestions?.[0]
  return {
    id: suggestion?.category?.categoryId || "",
    name: suggestion?.category?.categoryName || "",
    source: "taxonomy-suggestion",
    ancestors: (suggestion?.categoryTreeNodeAncestors || []).map((ancestor) => ancestor.categoryName),
  }
}

function truncateTitle(title) {
  return title.length <= 80 ? title : `${title.slice(0, 77).trimEnd()}...`
}

function imageUrls(product) {
  const seen = new Set()
  const urls = []
  for (const value of [product.thumbnail, ...(product.images || []).map((image) => image.url || image)]) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    urls.push(value)
  }
  return urls.slice(0, 12)
}

function skuFor(product) {
  const variantSkus = (product.variants || []).map((variant) => variant.sku).filter(Boolean)
  if (variantSkus.length === 1) return variantSkus[0]
  return product.metadata?.cjSku || product.metadata?.cjProductId || product.id
}

function priceFor(product) {
  for (const variant of product.variants || []) {
    const calculatedAmount = Number(variant.calculated_price?.calculated_amount)
    if (Number.isFinite(calculatedAmount) && calculatedAmount > 0) return calculatedAmount / 100

    for (const price of variant.prices || []) {
      const amount = Number(price.amount)
      if (Number.isFinite(amount) && amount > 0) return amount > 999 ? amount / 100 : amount
    }
  }

  for (const value of [product.metadata?.price, product.metadata?.retailPrice, product.metadata?.salePrice]) {
    const amount = Number(String(value || "").replace(/^\$/, ""))
    if (Number.isFinite(amount) && amount > 0) return amount
  }

  return null
}

function quantityFor(product) {
  const quantities = (product.variants || [])
    .map((variant) => Number(variant.inventory_quantity))
    .filter((quantity) => Number.isFinite(quantity) && quantity > 0)
  return quantities.length ? Math.max(...quantities) : 1
}

function itemSpecificsFor(product) {
  const text = [product.title, product.type?.value, ...(product.tags || []).map((tag) => tag.value)].filter(Boolean).join(" ").toLowerCase()
  const specifics = {
    Brand: "Elvato",
    Condition: "New",
    Style: "Modern",
    Type: product.type?.value || "Light Fixture",
  }

  if (text.includes("pendant")) specifics.Type = "Pendant Light"
  if (text.includes("chandelier")) specifics.Type = "Chandelier"
  if (text.includes("sconce") || text.includes("wall")) specifics.Type = "Wall Sconce"
  if (text.includes("table lamp")) specifics.Type = "Table Lamp"
  if (text.includes("floor lamp")) specifics.Type = "Floor Lamp"
  if (text.includes("glass")) specifics.Material = "Glass"
  if (text.includes("metal") || text.includes("iron")) specifics.Material = "Metal"
  if (text.includes("brass")) specifics.Finish = "Brass"
  if (text.includes("black")) specifics.Finish = "Black"
  if (text.includes("gold")) specifics.Finish = "Gold"

  return specifics
}

function ebayAspects(aspects) {
  return Object.fromEntries(
    Object.entries(aspects || {})
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .map(([name, value]) => [
        name,
        Array.isArray(value) ? value.map(String) : [String(value)],
      ])
  )
}

function descriptionFor(product) {
  const cleanDescription = String(product.description || product.subtitle || product.title)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return [
    product.title,
    "",
    cleanDescription,
    "",
    "Selected by Elvato for modern residential interiors.",
    "Electrical installation should be completed by a qualified professional where required by local code.",
  ].join("\n")
}

function validateListing(listing) {
  const blockers = []
  if (!listing.category.id) blockers.push("missing eBay category")
  if (listing.category.source === "taxonomy-suggestion" && !args.acceptAutoCategories) {
    blockers.push("auto category requires --accept-auto-categories")
  }
  if (!listing.imageUrls.length) blockers.push("missing images")
  if (!listing.price) blockers.push("missing price")
  if (listing.variantCount > 1 && !args.includeVariantProducts) {
    blockers.push("multiple variants require --include-variant-products")
  }
  return blockers
}

async function buildListings(products) {
  const categoryTreeId = await getCategoryTreeId()
  const listings = []
  for (const product of products) {
    const category = await suggestCategory(categoryTreeId, product)
    const listing = {
      source: {
        medusaProductId: product.id,
        handle: product.handle,
        title: product.title,
      },
      ebay: {
        marketplaceId: ebayMarketplaceId(),
        title: truncateTitle(product.title),
        price: priceFor(product),
        currency: optionalEnv("EBAY_CURRENCY", "USD"),
        condition: optionalEnv("EBAY_DEFAULT_CONDITION", "NEW"),
        quantity: quantityFor(product),
        category,
        itemSpecifics: itemSpecificsFor(product),
        description: descriptionFor(product),
        imageUrls: imageUrls(product),
        sku: skuFor(product),
        variantCount: product.variants?.length || 0,
      },
    }
    listing.launchGate = {
      status: validateListing(listing.ebay).length ? "needs-review" : "ready",
      blockers: validateListing(listing.ebay),
    }
    listings.push(listing)
  }
  return listings
}

function inventoryRequestFor(listing) {
  return {
    sku: listing.ebay.sku,
    locale: optionalEnv("EBAY_LOCALE", "en_US"),
    availability: {
      shipToLocationAvailability: { quantity: listing.ebay.quantity },
    },
    condition: listing.ebay.condition,
    product: {
      title: listing.ebay.title,
      description: listing.ebay.description,
      aspects: ebayAspects(listing.ebay.itemSpecifics),
      imageUrls: listing.ebay.imageUrls,
    },
  }
}

function offerRequestFor(listing) {
  return {
    sku: listing.ebay.sku,
    marketplaceId: listing.ebay.marketplaceId,
    format: "FIXED_PRICE",
    listingDuration: "GTC",
    availableQuantity: listing.ebay.quantity,
    categoryId: listing.ebay.category.id,
    merchantLocationKey: requiredEnv("EBAY_MERCHANT_LOCATION_KEY"),
    listingDescription: listing.ebay.description,
    pricingSummary: {
      price: {
        value: String(listing.ebay.price),
        currency: listing.ebay.currency,
      },
    },
    listingPolicies: {
      paymentPolicyId: requiredEnv("EBAY_PAYMENT_POLICY_ID"),
      fulfillmentPolicyId: requiredEnv("EBAY_FULFILLMENT_POLICY_ID"),
      returnPolicyId: requiredEnv("EBAY_RETURN_POLICY_ID"),
    },
  }
}

function writeReport(payload) {
  const reportPath = path.join(ensureReportsDir(), `live-products-bulk-${timestamp()}.json`)
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`)
  return reportPath
}

async function applyListings(readyListings) {
  const results = []
  for (const listing of readyListings) {
    const inventoryRequest = inventoryRequestFor(listing)
    const { sku, locale, ...inventoryItem } = inventoryRequest
    const offerRequest = offerRequestFor(listing)

    const inventoryResult = await ebayRequest(
      `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      {
        method: "PUT",
        headers: { "Accept-Language": "en-US", "Content-Language": "en-US" },
        body: inventoryItem,
      }
    )

    const existingOffer = await existingOfferFor(offerRequest)
    const offerResult = existingOffer
      ? await updateExistingOffer(existingOffer.offerId, offerRequest)
      : await ebayRequest("/sell/inventory/v1/offer", {
          method: "POST",
          headers: { "Accept-Language": "en-US", "Content-Language": "en-US" },
          body: offerRequest,
        })

    const offerId = offerResult.payload?.offerId
    if (!offerId) {
      throw new Error(`eBay did not return offerId for ${sku}: ${JSON.stringify(offerResult.payload)}`)
    }

    let publishResult = null
    if (args.publish) {
      publishResult = await ebayRequest(
        `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`,
        { method: "POST", headers: { "Accept-Language": "en-US" } }
      )
    }

    const listingId = publishResult?.payload?.listingId || null
    console.log(`${listingId ? "published" : "created"} ${sku}${listingId ? ` listing=${listingId}` : ` offer=${offerId}`}`)
    results.push({
      sku,
      offerId,
      listingId,
      inventoryStatus: inventoryResult.response.status,
      offer: offerResult.payload,
      publish: publishResult?.payload || null,
    })
  }

  return { mode: "sequential", results }
}

async function updateExistingOffer(offerId, offerRequest) {
  await ebayRequest(`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}`, {
    method: "PUT",
    headers: { "Accept-Language": "en-US", "Content-Language": "en-US" },
    body: offerRequest,
  })
  return { payload: { ...offerRequest, offerId } }
}

async function existingOfferFor(offerRequest) {
  const query = new URLSearchParams({
    sku: offerRequest.sku,
    marketplace_id: offerRequest.marketplaceId,
    format: offerRequest.format,
  })

  try {
    const result = await ebayRequest(`/sell/inventory/v1/offer?${query.toString()}`, {
      headers: { "Accept-Language": "en-US" },
    })
    return (result.payload?.offers || []).find((offer) => offer.offerId) || null
  } catch (error) {
    if (/\(404\)/.test(error.message)) return null
    throw error
  }
}

async function main() {
  const jwt = await medusaLogin()
  const { products, count } = await fetchPublishedProducts(jwt)
  const pricedProducts = await enrichWithStorefrontPricing(products)
  const listings = await buildListings(pricedProducts)
  const readyListings = listings.filter((listing) => listing.launchGate.status === "ready")
  const blockedListings = listings.filter((listing) => listing.launchGate.status !== "ready")

  if (args.apply && blockedListings.length) {
    throw new Error(`Refusing to apply: ${blockedListings.length} listings need review. See dry-run report.`)
  }

  const dryRunPayloads = {
    inventory: { requests: readyListings.map(inventoryRequestFor) },
    offers: { requests: readyListings.map(offerRequestFor) },
  }

  let ebayResults = null
  if (args.apply) {
    ebayResults = await applyListings(readyListings)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    medusaUrl: args.medusaUrl,
    medusaPublishedCount: count,
    selectedCount: listings.length,
    readyCount: readyListings.length,
    blockedCount: blockedListings.length,
    apply: args.apply,
    publish: args.publish,
    listings,
    dryRunPayloads: args.apply ? undefined : dryRunPayloads,
    ebayResults,
  }
  const reportPath = writeReport(report)

  console.log(JSON.stringify({
    medusaPublishedCount: count,
    selectedCount: listings.length,
    readyCount: readyListings.length,
    blockedCount: blockedListings.length,
    applied: args.apply,
    published: args.publish,
    report: path.relative(process.cwd(), reportPath),
    blocked: blockedListings.map((listing) => ({
      title: listing.source.title,
      blockers: listing.launchGate.blockers,
    })),
  }, null, 2))

  if (!args.apply) {
    console.log("Dry run only. Re-run with --apply, or --apply --publish --yes for live eBay listings.")
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`)
  process.exit(1)
})