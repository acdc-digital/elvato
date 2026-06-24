#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { ensureReportsDir, loadEbayEnv, optionalEnv, timestamp } from "./lib/env.mjs"

loadEbayEnv()

const args = process.argv.slice(2)

function argValue(name) {
  const index = args.indexOf(name)
  return index === -1 ? "" : args[index + 1] || ""
}

function latestCandidateReport() {
  const reportDir = path.join(process.cwd(), "reports", "ebay")
  const files = fs
    .readdirSync(reportDir)
    .filter((file) => /^launch-candidates-.*\.json$/.test(file))
    .map((file) => path.join(reportDir, file))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)

  if (!files.length) {
    throw new Error("No reports/ebay/launch-candidates-*.json files found")
  }

  return files[0]
}

function selectCandidate(candidates) {
  const id = argValue("--candidate-id")
  const handle = argValue("--handle")
  const index = argValue("--index")

  if (id) {
    return candidates.find((candidate) => candidate.id === id)
  }

  if (handle) {
    return candidates.find((candidate) => candidate.handle === handle)
  }

  if (index) {
    return candidates[Number(index)]
  }

  return candidates[0]
}

function truncateTitle(title) {
  return title.length <= 80 ? title : title.slice(0, 77).trimEnd() + "..."
}

function itemSpecificsFor(candidate) {
  const specifics = {
    Brand: "Elvato",
    Type: candidate.kind || "Light Fixture",
    Style: "Modern",
    Condition: "New",
  }

  const title = `${candidate.title} ${candidate.kind || ""}`.toLowerCase()
  if (title.includes("pendant")) specifics.Type = "Pendant Light"
  if (title.includes("chandelier")) specifics.Type = "Chandelier"
  if (title.includes("sconce") || title.includes("wall")) specifics.Type = "Wall Sconce"
  if (title.includes("table lamp")) specifics.Type = "Table Lamp"
  if (title.includes("floor lamp")) specifics.Type = "Floor Lamp"
  if (title.includes("glass")) specifics.Material = "Glass"
  if (title.includes("metal") || title.includes("iron")) specifics.Material = "Metal"

  return specifics
}

function descriptionFor(candidate) {
  const bullets = [
    "Modern lighting selected for residential interiors, dining rooms, living rooms, bedrooms, and entry spaces.",
    "Images should be reviewed before publishing to confirm finish, scale, installation requirements, and included components.",
    "Electrical installation should be completed by a qualified professional where required by local code.",
  ]

  return `${candidate.title}\n\n${bullets.map((bullet) => `- ${bullet}`).join("\n")}`
}

const sourceReport = path.resolve(argValue("--source-report") || latestCandidateReport())
const report = JSON.parse(fs.readFileSync(sourceReport, "utf8"))
const candidate = selectCandidate(report.candidates || [])

if (!candidate) {
  throw new Error("Could not find requested candidate in source report")
}

const categoryId = argValue("--category-id")
const categoryName = argValue("--category-name")
const price = Number(argValue("--price") || candidate.price)
const quantity = Number(argValue("--quantity") || 1)
const ready = Boolean(categoryId && categoryName && candidate.imageUrls?.length)

const plan = {
  source: {
    medusaProductId: candidate.id,
    handle: candidate.handle,
    title: candidate.title,
    sourceReport: path.relative(process.cwd(), sourceReport),
    cjSku: candidate.cjSku || null,
  },
  ebay: {
    marketplaceId: optionalEnv("EBAY_MARKETPLACE_ID", "EBAY_US"),
    title: truncateTitle(candidate.title),
    subtitle: null,
    price,
    currency: optionalEnv("EBAY_CURRENCY", "USD"),
    condition: optionalEnv("EBAY_DEFAULT_CONDITION", "NEW"),
    quantity,
    category: {
      id: categoryId || "REVIEW_REQUIRED",
      name: categoryName || "Review required",
    },
    itemSpecifics: itemSpecificsFor(candidate),
    description: descriptionFor(candidate),
    imageUrls: candidate.imageUrls || [candidate.thumbnail].filter(Boolean),
    sku: candidate.id,
    businessPolicies: {
      paymentPolicyId: optionalEnv("EBAY_PAYMENT_POLICY_ID", null),
      fulfillmentPolicyId: optionalEnv("EBAY_FULFILLMENT_POLICY_ID", null),
      returnPolicyId: optionalEnv("EBAY_RETURN_POLICY_ID", null),
    },
  },
  launchGate: {
    status: ready ? "ready" : "needs-review",
    checks: {
      images: candidate.imageUrls?.length ? `${candidate.imageUrls.length} images` : "missing images",
      specs: "needs category aspect review",
      margin: "needs fee and shipping review",
      shipping: "needs inventory location and fulfillment check",
      compliance: "no certification claims unless verified",
      variants: candidate.variantCount <= 1 ? "single SKU" : `${candidate.variantCount} variants need review`,
    },
    notes: ready
      ? []
      : ["Add eBay leaf category id/name before applying this plan."],
  },
}

const reportPath = path.join(
  ensureReportsDir(),
  `listing-plan-${candidate.handle}-${timestamp()}.json`
)
fs.writeFileSync(reportPath, JSON.stringify(plan, null, 2))
console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`)
console.log(`Status: ${plan.launchGate.status}`)