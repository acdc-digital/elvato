#!/usr/bin/env node
/**
 * Expand "Modern Aluminum Geometric Pendant" (prod_01KJK5GH9Y8E9TWGNTCZCJ75DE)
 * from a single "Default" variant into 3 color variants matching CJ master
 * SKU CJJJJTJT38609 (White / Silver / Black, all "No light").
 *
 *   White  → ELV38609W  (CJ: CJJJJTJT38609-White-No light)   ← REUSES existing variant
 *   Silver → ELV38609S  (CJ: CJJJJTJT38609-Silver-No light)
 *   Black  → ELV38609B  (CJ: CJJJJTJT38609-Black-No light)
 *
 * All 3 variants share CJ cost ($7.18), weight (1950g), and dims (300×300×330mm).
 * Pricing: existing variant is $88.41; we keep all variants at the same price.
 *
 * Per-variant images (CJ):
 *   White  → https://cf.cjdropshipping.com/2052/5759677605589.jpg
 *   Silver → https://cf.cjdropshipping.com/2052/465492009367.jpg
 *   Black  → https://cf.cjdropshipping.com/2052/1376908792603.jpg
 *
 * Image-swap convention: write to `metadata.color_image` to match siblings like
 * "Colorful Modern Bedroom Wall Light" (storefront image-gallery reads
 * `meta.image || meta.color_image`).
 *
 * Usage:
 *   node scripts/catalog/expand-variants-ELV38609.mjs            # dry-run
 *   node scripts/catalog/expand-variants-ELV38609.mjs --live     # apply
 */

import fs from "node:fs"
import path from "node:path"

for (const p of ["admin/.env", ".env.local"]) {
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim()
  }
}

const MEDUSA_URL =
  process.env.MEDUSA_BACKEND_URL ||
  "https://medusa-backend-production-d681.up.railway.app"
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@medusa-test.com"
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "supersecret"

const LIVE = process.argv.includes("--live")
const PRODUCT_ID = "prod_01KJK5GH9Y8E9TWGNTCZCJ75DE"

const TARGETS = [
  {
    color: "White",
    sku: "ELV38609W",
    cjSku: "CJJJJTJT38609-White-No light",
    image: "https://cf.cjdropshipping.com/2052/5759677605589.jpg",
  },
  {
    color: "Silver",
    sku: "ELV38609S",
    cjSku: "CJJJJTJT38609-Silver-No light",
    image: "https://cf.cjdropshipping.com/2052/465492009367.jpg",
  },
  {
    color: "Black",
    sku: "ELV38609B",
    cjSku: "CJJJJTJT38609-Black-No light",
    image: "https://cf.cjdropshipping.com/2052/1376908792603.jpg",
  },
]

const DIMS = { length: 300, width: 300, height: 330 } // mm
const WEIGHT_G = 1950

async function api(jwt, endpoint, init = {}) {
  const res = await fetch(new URL(endpoint, MEDUSA_URL), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(30_000),
  })
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body)
    throw new Error(
      `${init.method || "GET"} ${endpoint} → ${res.status}: ${detail.slice(0, 600)}`
    )
  }
  return body
}

async function login() {
  const res = await fetch(new URL("/auth/user/emailpass", MEDUSA_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Admin login failed (${res.status})`)
  const { token } = await res.json()
  return token
}

async function main() {
  const mode = LIVE ? "LIVE" : "DRY-RUN"
  console.log(`\n══ Expand color variants for ${PRODUCT_ID} ── ${mode} ══\n`)

  const jwt = await login()
  const { product } = await api(
    jwt,
    `/admin/products/${PRODUCT_ID}?fields=id,title,*options,*options.values,*variants,*variants.options,*variants.prices,*variants.metadata`
  )

  console.log(`Product: ${product.title}`)
  console.log(`Options: ${product.options.map((o) => o.title).join(", ")}`)
  console.log(`Variants:`)
  for (const v of product.variants) {
    const usd = (v.prices || []).find((p) => p.currency_code === "usd")
    console.log(
      `  ${v.id} sku=${v.sku} title=${v.title} $${((usd?.amount ?? 0) / 100).toFixed(2)}`
    )
  }

  const existing = product.variants[0]
  if (!existing) throw new Error("No existing variant — aborting.")
  const usd = (existing.prices || []).find((p) => p.currency_code === "usd")
  if (!usd) throw new Error("Existing variant has no USD price — aborting.")
  const priceCents = usd.amount
  const baseMeta = { ...(existing.metadata || {}) }

  // Decide option strategy: repurpose "Default" → "Color"
  const defaultOpt = product.options.find((o) => o.title === "Default")
  const colorOpt = product.options.find((o) => o.title === "Color")

  const plan = {
    priceCents,
    optionUpdate: null,
    variantUpdate: null,
    variantCreates: [],
  }

  if (colorOpt) {
    plan.optionUpdate = {
      id: colorOpt.id,
      title: "Color",
      values: TARGETS.map((t) => t.color),
    }
  } else if (defaultOpt) {
    plan.optionUpdate = {
      id: defaultOpt.id,
      title: "Color",
      values: TARGETS.map((t) => t.color),
      _note: "Repurpose 'Default' → 'Color'",
    }
  } else {
    throw new Error("Neither 'Default' nor 'Color' option present — manual fix needed.")
  }

  const reuse = TARGETS[0] // White
  plan.variantUpdate = {
    id: existing.id,
    sku: reuse.sku,
    title: reuse.color,
    options: { Color: reuse.color },
    metadata: {
      ...baseMeta,
      color_image: reuse.image,
      cj_variant_sku: reuse.cjSku,
    },
  }

  for (let i = 1; i < TARGETS.length; i++) {
    const t = TARGETS[i]
    plan.variantCreates.push({
      sku: t.sku,
      title: t.color,
      options: { Color: t.color },
      priceCents,
      weight: WEIGHT_G,
      ...DIMS,
      metadata: {
        // copy expedited shipping/etc from existing variant so all colors ship the same way
        ...baseMeta,
        color_image: t.image,
        cj_variant_sku: t.cjSku,
      },
    })
  }

  console.log(`\n── PLAN ──`)
  console.log(JSON.stringify(plan, null, 2))

  const reportDir = path.join(process.cwd(), "reports", "sync")
  fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(
    reportDir,
    `expand-variants-ELV38609-${LIVE ? "live" : "dry"}.json`
  )
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      { timestamp: new Date().toISOString(), mode, productId: PRODUCT_ID, plan },
      null,
      2
    )
  )
  console.log(`\nReport: ${reportPath}`)

  if (!LIVE) {
    console.log(`\nDry-run complete. Re-run with --live to apply.\n`)
    return
  }

  console.log(`\n── APPLYING ──`)

  // 1. Option update
  await api(jwt, `/admin/products/${PRODUCT_ID}/options/${plan.optionUpdate.id}`, {
    method: "POST",
    body: JSON.stringify({
      title: plan.optionUpdate.title,
      values: plan.optionUpdate.values,
    }),
  })
  console.log(
    `  ✓ Option → "${plan.optionUpdate.title}" (${plan.optionUpdate.values.join(", ")})`
  )

  // 2. Variant reuse → White
  await api(jwt, `/admin/products/${PRODUCT_ID}/variants/${plan.variantUpdate.id}`, {
    method: "POST",
    body: JSON.stringify({
      title: plan.variantUpdate.title,
      sku: plan.variantUpdate.sku,
      options: plan.variantUpdate.options,
      metadata: plan.variantUpdate.metadata,
      weight: WEIGHT_G,
      ...DIMS,
    }),
  })
  console.log(
    `  ✓ Updated variant ${plan.variantUpdate.id} → "${plan.variantUpdate.title}" sku=${plan.variantUpdate.sku}`
  )

  // 3. New variants for Silver / Black
  for (const c of plan.variantCreates) {
    const payload = {
      title: c.title,
      sku: c.sku,
      manage_inventory: false,
      allow_backorder: true,
      weight: c.weight,
      length: c.length,
      width: c.width,
      height: c.height,
      options: c.options,
      prices: [{ amount: c.priceCents, currency_code: "usd" }],
      metadata: c.metadata,
    }
    const { product: prod } = await api(
      jwt,
      `/admin/products/${PRODUCT_ID}/variants`,
      { method: "POST", body: JSON.stringify(payload) }
    )
    const created = prod?.variants?.find((v) => v.sku === c.sku)
    console.log(
      `  ✓ Created variant ${created?.id ?? "?"} "${c.title}" sku=${c.sku} $${(c.priceCents / 100).toFixed(2)}`
    )
  }

  console.log(`\n✅ Live changes applied. Allow ~5 min for ISR cache to refresh.\n`)
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`)
  process.exit(1)
})
