#!/usr/bin/env node
import { spawn } from "node:child_process"
import { optionalEnv } from "./lib/env.mjs"
import { ebayEnvironment, refreshUserAccessToken } from "./lib/ebay-client.mjs"

function ebayApiEnvironment() {
  return optionalEnv("EBAY_API_ENV", ebayEnvironment()).toLowerCase() === "sandbox"
    ? "sandbox"
    : "production"
}

async function resolveAccessToken() {
  if (process.env.EBAY_CLIENT_TOKEN) {
    return process.env.EBAY_CLIENT_TOKEN
  }

  if (process.env.EBAY_ACCESS_TOKEN) {
    return process.env.EBAY_ACCESS_TOKEN
  }

  const token = await refreshUserAccessToken()
  return token.access_token
}

const accessToken = await resolveAccessToken()
const server = spawn(
  "npx",
  ["-y", "@ebay/npm-public-api-mcp@latest"],
  {
    env: {
      ...process.env,
      EBAY_API_ENV: ebayApiEnvironment(),
      EBAY_CLIENT_TOKEN: accessToken,
    },
    stdio: "inherit",
  }
)

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

server.on("error", (error) => {
  console.error(`Failed to start eBay API MCP server: ${error.message}`)
  process.exit(1)
})