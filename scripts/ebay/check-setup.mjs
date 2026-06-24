#!/usr/bin/env node
import {
  ebayMarketplaceId,
  ebayRequest,
  ebayEnvironment,
  refreshUserAccessToken,
} from "./lib/ebay-client.mjs"
import { loadEbayEnv, optionalEnv } from "./lib/env.mjs"

loadEbayEnv()

const checks = []

function addCheck(name, status, details = "") {
  checks.push({ name, status, details })
}

function hasEnv(name) {
  return Boolean(process.env[name])
}

for (const name of [
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
  "EBAY_REFRESH_TOKEN",
  "EBAY_MARKETPLACE_ID",
  "EBAY_PAYMENT_POLICY_ID",
  "EBAY_FULFILLMENT_POLICY_ID",
  "EBAY_RETURN_POLICY_ID",
]) {
  addCheck(name, hasEnv(name) ? "ok" : "missing")
}

if (!hasEnv("EBAY_MERCHANT_LOCATION_KEY")) {
  addCheck("EBAY_MERCHANT_LOCATION_KEY", "missing", "Required before creating offers")
}

for (const name of [
  "EBAY_LOCATION_ADDRESS_LINE1",
  "EBAY_LOCATION_CITY",
  "EBAY_LOCATION_STATE_OR_PROVINCE",
  "EBAY_LOCATION_POSTAL_CODE",
]) {
  addCheck(name, hasEnv(name) ? "ok" : "missing", "Required before creating inventory location")
}

try {
  const token = await refreshUserAccessToken()
  addCheck("OAuth refresh", "ok", `access token expires in ${token.expires_in}s`)

  const marketplaceId = ebayMarketplaceId()
  const taxonomy = await ebayRequest(
    `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${encodeURIComponent(marketplaceId)}`,
    { accessToken: token.access_token }
  )
  addCheck(
    "Taxonomy API",
    "ok",
    `${marketplaceId} categoryTreeId=${taxonomy.payload.categoryTreeId}`
  )

  const locationKey = optionalEnv("EBAY_MERCHANT_LOCATION_KEY")
  if (locationKey) {
    try {
      await ebayRequest(`/sell/inventory/v1/location/${encodeURIComponent(locationKey)}`, {
        accessToken: token.access_token,
      })
      addCheck("Inventory location", "ok", locationKey)
    } catch (error) {
      addCheck("Inventory location", "needs-create", error.message)
    }
  }
} catch (error) {
  addCheck("eBay API", "failed", error.message)
}

console.log(`eBay setup check (${ebayEnvironment()})`)
for (const check of checks) {
  const suffix = check.details ? ` - ${check.details}` : ""
  console.log(`${check.status.padEnd(12)} ${check.name}${suffix}`)
}

const failed = checks.some((check) => ["missing", "failed"].includes(check.status))
process.exitCode = failed ? 1 : 0