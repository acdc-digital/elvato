#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { ebayTokenUrl, basicAuthorizationHeader } from "./lib/ebay-client.mjs"
import { EBAY_DIR, loadEbayEnv, requiredEnv } from "./lib/env.mjs"

loadEbayEnv()

const args = process.argv.slice(2)
const codeIndex = args.indexOf("--code")
const urlIndex = args.indexOf("--accepted-url")
const save = args.includes("--save")

function codeFromArgs() {
  if (codeIndex !== -1 && args[codeIndex + 1]) {
    return args[codeIndex + 1]
  }

  if (urlIndex !== -1 && args[urlIndex + 1]) {
    return new URL(args[urlIndex + 1]).searchParams.get("code")
  }

  return ""
}

function saveEnvValue(name, value) {
  const envPath = path.join(EBAY_DIR, ".env.local")
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
  const line = `${name}=${value}`

  if (current.match(new RegExp(`^${name}=.*$`, "m"))) {
    fs.writeFileSync(envPath, current.replace(new RegExp(`^${name}=.*$`, "m"), line))
  } else {
    fs.writeFileSync(envPath, `${current.trimEnd()}\n${line}\n`)
  }
}

const code = codeFromArgs()
if (!code) {
  console.error("Usage: node scripts/ebay/oauth-exchange-code.mjs (--code <authorization-code> | --accepted-url <callback-url>) [--save]")
  process.exit(1)
}

const redirectUri = requiredEnv("EBAY_REDIRECT_URI")
const body = new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: redirectUri,
})

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
  throw new Error(`eBay authorization-code exchange failed (${response.status}): ${JSON.stringify(payload)}`)
}

console.log(`access_token_expires_in=${payload.expires_in}`)
console.log(`refresh_token_expires_in=${payload.refresh_token_expires_in}`)

if (save) {
  saveEnvValue("EBAY_REFRESH_TOKEN", payload.refresh_token)
  console.log("Saved EBAY_REFRESH_TOKEN to marketplace/Ebay/.env.local")
} else {
  console.log("\nAdd this value to marketplace/Ebay/.env.local as EBAY_REFRESH_TOKEN:")
  console.log(payload.refresh_token)
}