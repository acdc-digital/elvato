import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const REPO_ROOT = path.resolve(__dirname, "../../..")
export const EBAY_DIR = path.join(REPO_ROOT, "marketplace", "Ebay")
export const REPORTS_DIR = path.join(REPO_ROOT, "reports", "ebay")

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) {
    return null
  }

  const separatorIndex = trimmed.indexOf("=")
  if (separatorIndex === -1) {
    return null
  }

  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return [key, value]
}

export function loadEbayEnv() {
  for (const filename of [".env", ".env.local"]) {
    const envPath = path.join(EBAY_DIR, filename)
    if (!fs.existsSync(envPath)) {
      continue
    }

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    for (const line of lines) {
      const parsed = parseEnvLine(line)
      if (!parsed) {
        continue
      }

      const [key, value] = parsed
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

export function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function optionalEnv(name, fallback = "") {
  return process.env[name] || fallback
}

export function ensureReportsDir() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  return REPORTS_DIR
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}