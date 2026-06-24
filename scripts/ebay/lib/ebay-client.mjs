import { Buffer } from "node:buffer"
import { loadEbayEnv, optionalEnv, requiredEnv } from "./env.mjs"

loadEbayEnv()

export function ebayEnvironment() {
  return optionalEnv("EBAY_ENV", "production").toLowerCase()
}

export function ebayApiBaseUrl() {
  return ebayEnvironment() === "sandbox"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com"
}

export function ebayTokenUrl() {
  return `${ebayApiBaseUrl()}/identity/v1/oauth2/token`
}

export function ebayMarketplaceId() {
  return optionalEnv("EBAY_MARKETPLACE_ID", "EBAY_US")
}

export function ebayScopes() {
  return optionalEnv("EBAY_OAUTH_SCOPES")
}

export function basicAuthorizationHeader() {
  const clientId = requiredEnv("EBAY_CLIENT_ID")
  const clientSecret = requiredEnv("EBAY_CLIENT_SECRET")
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
}

export async function refreshUserAccessToken() {
  const refreshToken = requiredEnv("EBAY_REFRESH_TOKEN")
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })

  const scopes = ebayScopes()
  if (scopes) {
    body.set("scope", scopes)
  }

  const response = await fetch(ebayTokenUrl(), {
    method: "POST",
    headers: {
      Authorization: basicAuthorizationHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      `eBay token refresh failed (${response.status}): ${JSON.stringify(payload)}`
    )
  }

  return payload
}

export async function ebayRequest(path, options = {}) {
  const accessToken = options.accessToken || (await refreshUserAccessToken()).access_token
  const url = path.startsWith("http") ? path : `${ebayApiBaseUrl()}${path}`

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    ...options.headers,
  }

  let body = options.body
  if (body && typeof body !== "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json"
    body = JSON.stringify(body)
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
  })

  const responseText = await response.text()
  let payload = null
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    throw new Error(
      `eBay request failed ${options.method || "GET"} ${path} (${response.status}): ${JSON.stringify(payload)}`
    )
  }

  return { response, payload, accessToken }
}