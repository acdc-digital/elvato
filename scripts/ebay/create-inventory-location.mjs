#!/usr/bin/env node
import { ebayRequest } from "./lib/ebay-client.mjs"
import { loadEbayEnv, optionalEnv, requiredEnv } from "./lib/env.mjs"

loadEbayEnv()

const args = new Set(process.argv.slice(2))
const dryRun = !args.has("--apply")

const merchantLocationKey = requiredEnv("EBAY_MERCHANT_LOCATION_KEY")
const payload = {
  name: optionalEnv("EBAY_LOCATION_NAME", "Elvato Fulfillment"),
  merchantLocationStatus: "ENABLED",
  locationTypes: ["WAREHOUSE"],
  location: {
    address: {
      stateOrProvince: requiredEnv("EBAY_LOCATION_STATE_OR_PROVINCE"),
      postalCode: requiredEnv("EBAY_LOCATION_POSTAL_CODE"),
      country: optionalEnv("EBAY_LOCATION_COUNTRY", "US"),
    },
  },
}

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, merchantLocationKey, payload }, null, 2))
  console.log("Run again with --apply to create or replace this eBay inventory location.")
} else {
  await ebayRequest(`/sell/inventory/v1/location/${encodeURIComponent(merchantLocationKey)}`, {
    method: "POST",
    body: payload,
  })
  console.log(`Created or updated eBay inventory location: ${merchantLocationKey}`)
}