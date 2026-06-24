#!/usr/bin/env node
import { ebayEnvironment, ebayScopes } from "./lib/ebay-client.mjs"
import { loadEbayEnv, requiredEnv } from "./lib/env.mjs"

loadEbayEnv()

const clientId = requiredEnv("EBAY_CLIENT_ID")
const redirectUri = requiredEnv("EBAY_REDIRECT_URI")
const scopes = ebayScopes() || [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
].join(" ")

const authBase = ebayEnvironment() === "sandbox"
  ? "https://auth.sandbox.ebay.com/oauth2/authorize"
  : "https://auth.ebay.com/oauth2/authorize"

const url = new URL(authBase)
url.searchParams.set("client_id", clientId)
url.searchParams.set("redirect_uri", redirectUri)
url.searchParams.set("response_type", "code")
url.searchParams.set("scope", scopes)
url.searchParams.set("prompt", "login")

console.log(url.toString())
console.log("\nOpen this URL, approve access, then copy the code= value from the accepted callback URL.")