#!/usr/bin/env node
/**
 * Revise "Nordic Flying Saucer Chandelier" → "Iron Saucer Chandelier Postmodern Art Design"
 *   Medusa product : prod_01KJK5G41XRXQGJWH9Z0W9ECXY
 *   CJ product SKU : CJJT1494811 (pid 1532233970593837056)
 *
 * Changes:
 *   1. Title           → "Iron Saucer Chandelier Postmodern Art Design"
 *   2. Description     → 2-paragraph rewrite
 *   3. Metadata        → packageSize + comparisonTable (matches our revised-listing pattern)
 *   4. Options         → "Color" (Black, White) + new "Light Color" (Warm White, Cool White)
 *   5. Variants        → 4 SKUs (ELV1494811-{BW,BC,WW,WC}); existing variant repurposed for BW
 *   6. Variant images  → metadata.image set per variant (Black img / White img) so the gallery
 *                        swaps the hero photo when an option is selected.
 *
 * CJ matrix (all priced $28.62 → preserved $175.71 retail = 6.14× markup):
 *   CJJT149481101AZ  Black + Warm White   img=…/938dd79a…   ← reuse current variant
 *   CJJT149481102BY  Black + Cool White   img=…/938dd79a…
 *   CJJT149481103CX  White + Warm White   img=…/75f25c6a…
 *   CJJT149481104DW  White + Cool White   img=…/75f25c6a…
 *
 * Usage:
 *   node scripts/catalog/revise-CJJT1494811.mjs            # dry-run
 *   node scripts/catalog/revise-CJJT1494811.mjs --live     # apply
 */

import fs from "node:fs"
import path from "node:path"

// ─── env ───────────────────────────────────────────────────────────────────────
for (const p of ["admin/.env", "storefront/.env.local", ".env.local"]) {
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

const PRODUCT_ID = "prod_01KJK5G41XRXQGJWH9Z0W9ECXY"

// ─── target content ────────────────────────────────────────────────────────────
const NEW_TITLE = "Iron Saucer Chandelier Postmodern Art Design"

const NEW_DESCRIPTION =
  "An iron saucer-shaped chandelier that lands somewhere between sculpture and lighting. The 400 mm disc casts an even, ambient glow, while the postmodern silhouette anchors a room without competing with the rest of your furniture.\n\n" +
  "Choose between black or white, and warm or cool white light, to suit your space. Integrated LEDs ship inside the fixture — no separate bulbs needed — and the slim profile sits flat enough for low-ceiling living rooms, dining nooks, hallways, and offices."

const PACKAGE_SIZE = "410 × 410 × 300 mm"

const COMPARISON_TABLE = {
  headers: ["Specification"],
  rows: [
    { label: "Material",          values: ["Aluminum Alloy & Iron"] },
    { label: "Style",             values: ["Postmodern / Nordic Minimalist"] },
    { label: "Light Source",      values: ["Integrated LED (no replacement bulbs needed)"] },
    { label: "Color Options",     values: ["Black, White"] },
    { label: "Color Temperature", values: ["Warm White or Cool White (per variant)"] },
    { label: "Diameter",          values: ["400 mm"] },
    { label: "Height",            values: ["300 mm"] },
    { label: "Voltage",           values: ["220V"] },
    { label: "Mounting",          values: ["Ceiling, hardwired"] },
    { label: "Installation",      values: ["Easy DIY with included hardware"] },
    { label: "Best For",          values: ["Living room, bedroom, dining area, hallway, study"] },
  ],
  shared: [],
}

// ─── variant matrix ────────────────────────────────────────────────────────────
const COLOR_BLACK = "Black"
const COLOR_WHITE = "White"
const LIGHT_WARM = "Warm White"
const LIGHT_COOL = "Cool White"

const IMG_BLACK = "https://cf.cjdropshipping.com/938dd79a-2628-4caa-ae6f-5d195b6e8076.png"
const IMG_WHITE = "https://cf.cjdropshipping.com/75f25c6a-15cb-48fa-8402-be93379c9957.png"

const WEIGHT_G = 4200
const DIMS = { length: 410, width: 410, height: 300 }

const TARGETS = [
  { sku: "ELV1494811-BW", color: COLOR_BLACK, light: LIGHT_WARM, image: IMG_BLACK, cjSku: "CJJT149481101AZ" },
  { sku: "ELV1494811-BC", color: COLOR_BLACK, light: LIGHT_COOL, image: IMG_BLACK, cjSku: "CJJT149481102BY" },
  { sku: "ELV1494811-WW", color: COLOR_WHITE, light: LIGHT_WARM, image: IMG_WHITE, cjSku: "CJJT149481103CX" },
  { sku: "ELV1494811-WC", color: COLOR_WHITE, light: LIGHT_COOL, image: IMG_WHITE, cjSku: "CJJT149481104DW" },
]

// ─── helpers ───────────────────────────────────────────────────────────────────
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
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body)
    throw new Error(`${init.method || "GET"} ${endpoint} → ${res.status}: ${detail.slice(0, 600)}`)
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

// ─── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const mode = LIVE ? "LIVE" : "DRY-RUN"
  console.log(`\n══ Revise ${PRODUCT_ID} (CJJT1494811) ── ${mode} ══\n`)

  const jwt = await login()
  const { product } = await api(
    jwt,
    `/admin/products/${PRODUCT_ID}?fields=id,title,*options,*options.values,*variants,*variants.options,*variants.prices,*variants.metadata,metadata`
  )

  console.log(`Current title:    ${product.title}`)
  console.log(`Current options:  ${product.options.map((o) => o.title).join(", ")}`)
  console.log(`Current variants:`)
  for (const v of product.variants) {
    const usd = (v.prices || []).find((p) => p.currency_code === "usd")
    console.log(`  ${v.id} sku=${v.sku} title=${v.title} $${((usd?.amount ?? 0) / 100).toFixed(2)}`)
  }

  const existing = product.variants[0]
  if (!existing) throw new Error("No existing variant — aborting.")
  const usd = (existing.prices || []).find((p) => p.currency_code === "usd")
  if (!usd) throw new Error("Existing variant has no USD price — aborting.")
  const priceCents = usd.amount
  const baseMeta = { ...(existing.metadata || {}) }

  // Option strategy: repurpose Default → Color, then create new "Light Color"
  const defaultOpt = product.options.find((o) => o.title === "Default")
  const colorOpt = product.options.find((o) => o.title === "Color")
  const lightOpt = product.options.find((o) => o.title === "Light Color")

  const plan = {
    productPatch: {
      title: NEW_TITLE,
      description: NEW_DESCRIPTION,
      metadata: {
        ...(product.metadata || {}),
        packageSize: PACKAGE_SIZE,
        comparisonTable: COMPARISON_TABLE,
      },
    },
    optionUpdates: [],
    optionCreates: [],
    variantUpdate: null,
    variantCreates: [],
    priceCents,
  }

  if (colorOpt) {
    plan.optionUpdates.push({
      id: colorOpt.id,
      title: "Color",
      values: [COLOR_BLACK, COLOR_WHITE],
    })
  } else if (defaultOpt) {
    plan.optionUpdates.push({
      id: defaultOpt.id,
      title: "Color",
      values: [COLOR_BLACK, COLOR_WHITE],
      _note: "Repurpose 'Default' → 'Color'",
    })
  } else {
    plan.optionCreates.push({ title: "Color", values: [COLOR_BLACK, COLOR_WHITE] })
  }

  if (lightOpt) {
    plan.optionUpdates.push({
      id: lightOpt.id,
      title: "Light Color",
      values: [LIGHT_WARM, LIGHT_COOL],
    })
  } else {
    plan.optionCreates.push({ title: "Light Color", values: [LIGHT_WARM, LIGHT_COOL] })
  }

  const reuse = TARGETS[0] // Black + Warm White
  plan.variantUpdate = {
    id: existing.id,
    sku: reuse.sku,
    title: `${reuse.color} / ${reuse.light}`,
    options: { Color: reuse.color, "Light Color": reuse.light },
    metadata: {
      ...baseMeta,
      image: reuse.image,
      color_image: reuse.image,
      cj_variant_sku: reuse.cjSku,
    },
  }

  for (let i = 1; i < TARGETS.length; i++) {
    const t = TARGETS[i]
    plan.variantCreates.push({
      sku: t.sku,
      title: `${t.color} / ${t.light}`,
      options: { Color: t.color, "Light Color": t.light },
      priceCents,
      weight: WEIGHT_G,
      ...DIMS,
      metadata: {
        ...baseMeta,
        image: t.image,
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
    `revise-CJJT1494811-${LIVE ? "live" : "dry"}.json`
  )
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ timestamp: new Date().toISOString(), mode, productId: PRODUCT_ID, plan }, null, 2)
  )
  console.log(`\nReport: ${reportPath}`)

  if (!LIVE) {
    console.log(`\nDry-run complete. Re-run with --live to apply.\n`)
    return
  }

  console.log(`\n── APPLYING ──`)

  // 1. Product patch (title, description, metadata)
  await api(jwt, `/admin/products/${PRODUCT_ID}`, {
    method: "POST",
    body: JSON.stringify(plan.productPatch),
  })
  console.log(`  ✓ Updated product title/description/metadata`)

  // 2. Option updates
  for (const u of plan.optionUpdates) {
    await api(jwt, `/admin/products/${PRODUCT_ID}/options/${u.id}`, {
      method: "POST",
      body: JSON.stringify({ title: u.title, values: u.values }),
    })
    console.log(`  ✓ Option → "${u.title}" (${u.values.join(", ")})`)
  }

  // 3. Option creates
  for (const c of plan.optionCreates) {
    await api(jwt, `/admin/products/${PRODUCT_ID}/options`, {
      method: "POST",
      body: JSON.stringify({ title: c.title, values: c.values }),
    })
    console.log(`  ✓ Created option "${c.title}" (${c.values.join(", ")})`)
  }

  // 4. Update reused variant (Black / Warm White)
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
  console.log(`  ✓ Updated variant ${plan.variantUpdate.id} → "${plan.variantUpdate.title}" sku=${plan.variantUpdate.sku}`)

  // 5. Create remaining 3 variants
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
    console.log(`  ✓ Created variant ${created?.id ?? "?"} "${c.title}" sku=${c.sku} $${(c.priceCents / 100).toFixed(2)}`)
  }

  console.log(`\n✅ Live changes applied. Allow ~5 min for ISR cache to refresh.\n`)
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`)
  process.exit(1)
})
