#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { ebayMarketplaceId, ebayRequest } from "./lib/ebay-client.mjs"
import {
  ensureReportsDir,
  loadEbayEnv,
  optionalEnv,
  requiredEnv,
  timestamp,
} from "./lib/env.mjs"

loadEbayEnv()

const args = process.argv.slice(2)
const planIndex = args.indexOf("--plan")
const apply = args.includes("--apply")
const publish = args.includes("--publish")
const yes = args.includes("--yes")

if (planIndex === -1 || !args[planIndex + 1]) {
  console.error("Usage: node scripts/ebay/apply-listing-plan.mjs --plan <plan.json> [--apply] [--publish --yes]")
  process.exit(1)
}

if (publish && (!apply || !yes)) {
  throw new Error("Publishing requires --apply --publish --yes")
}

const planPath = path.resolve(args[planIndex + 1])
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"))
const listing = plan.ebay
const sku = listing.sku || plan.source?.cjSku || plan.source?.handle

if (apply && plan.launchGate?.status !== "ready") {
  throw new Error(`Refusing to apply listing plan with launchGate.status=${plan.launchGate?.status || "missing"}`)
}

if (apply) {
  const unresolvedChecks = Object.entries(plan.launchGate?.checks || {})
    .filter(([, value]) => /\b(needs|missing|review|required)\b/i.test(String(value)))

  if (unresolvedChecks.length) {
    throw new Error(
      `Refusing to apply listing plan with unresolved checks: ${unresolvedChecks
        .map(([name, value]) => `${name}=${value}`)
        .join(", ")}`
    )
  }
}

if (apply && (!listing.category?.id || listing.category.id === "REVIEW_REQUIRED")) {
  throw new Error("Refusing to apply listing plan without a reviewed eBay leaf category")
}

if (apply && (!Array.isArray(listing.imageUrls) || listing.imageUrls.length === 0)) {
  throw new Error("Refusing to apply listing plan without at least one image URL")
}

if (!sku) {
  throw new Error("Listing plan must provide ebay.sku, source.cjSku, or source.handle")
}

const quantity = Number(listing.quantity || 1)
const marketplaceId = listing.marketplaceId || ebayMarketplaceId()
const currency = listing.currency || optionalEnv("EBAY_CURRENCY", "USD")
const merchantLocationKey = requiredEnv("EBAY_MERCHANT_LOCATION_KEY")

const inventoryItemPayload = {
  availability: {
    shipToLocationAvailability: { quantity },
  },
  condition: listing.condition || optionalEnv("EBAY_DEFAULT_CONDITION", "NEW"),
  product: {
    title: listing.title,
    description: listing.description,
    aspects: listing.itemSpecifics || {},
    imageUrls: listing.imageUrls,
  },
}

const offerPayload = {
  sku,
  marketplaceId,
  format: "FIXED_PRICE",
  listingDuration: "GTC",
  availableQuantity: quantity,
  categoryId: listing.category.id,
  merchantLocationKey,
  listingDescription: listing.description,
  pricingSummary: {
    price: {
      value: String(listing.price),
      currency,
    },
  },
  listingPolicies: {
    paymentPolicyId:
      listing.businessPolicies?.paymentPolicyId || requiredEnv("EBAY_PAYMENT_POLICY_ID"),
    fulfillmentPolicyId:
      listing.businessPolicies?.fulfillmentPolicyId || requiredEnv("EBAY_FULFILLMENT_POLICY_ID"),
    returnPolicyId:
      listing.businessPolicies?.returnPolicyId || requiredEnv("EBAY_RETURN_POLICY_ID"),
  },
}

if (!apply) {
  const reportPath = path.join(
    ensureReportsDir(),
    `inventory-api-dry-run-${timestamp()}.json`
  )
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ planPath, sku, inventoryItemPayload, offerPayload }, null, 2)
  )
  console.log(`Dry run wrote ${path.relative(process.cwd(), reportPath)}`)
  console.log("Run with --apply to create inventory item + offer. Add --publish --yes to publish.")
  process.exit(0)
}

await ebayRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
  method: "PUT",
  body: inventoryItemPayload,
})
console.log(`Created or replaced inventory item: ${sku}`)

const offerResult = await ebayRequest("/sell/inventory/v1/offer", {
  method: "POST",
  body: offerPayload,
})

const offerId = offerResult.payload?.offerId
if (!offerId) {
  throw new Error(`eBay did not return offerId: ${JSON.stringify(offerResult.payload)}`)
}
console.log(`Created offer: ${offerId}`)

if (publish) {
  const publishResult = await ebayRequest(
    `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`,
    { method: "POST" }
  )
  console.log(`Published listing: ${publishResult.payload?.listingId || "unknown listingId"}`)
} else {
  console.log("Offer was not published. Re-run with --apply --publish --yes when reviewed.")
}