/**
 * Audit SKU coverage across all Medusa products via Admin API.
 * Reports: products with all SKUs, some SKUs, no SKUs, and SKU format breakdown.
 */

const BASE = "https://medusa-backend-production-d681.up.railway.app"
const EMAIL = "admin@medusa-test.com"
const PASSWORD = "supersecret"

async function getAdminToken() {
  const r = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const d = await r.json()
  return d.token
}

async function fetchAllProducts(token) {
  const products = []
  let offset = 0
  const limit = 100
  while (true) {
    const r = await fetch(`${BASE}/admin/products?limit=${limit}&offset=${offset}&fields=title,handle,*variants.sku,*variants.options`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await r.json()
    products.push(...d.products)
    if (products.length >= d.count || d.products.length === 0) break
    offset += limit
  }
  return products
}

const token = await getAdminToken()
const products = await fetchAllProducts(token)

let allSkus = 0      // products where ALL variants have SKU
let someSkus = 0     // products where SOME variants have SKU
let noSkus = 0       // products where NO variants have SKU
let noVariants = 0   // products with no variants

const skuFormats = { cj: 0, elv: 0, other: 0, empty: 0 }
let totalVariants = 0
let variantsWithSku = 0
let variantsWithoutSku = 0

const noSkuExamples = []

for (const p of products) {
  const variants = p.variants || []
  if (variants.length === 0) {
    noVariants++
    continue
  }

  totalVariants += variants.length
  const withSku = variants.filter(v => v.sku)
  const withoutSku = variants.filter(v => !v.sku)
  variantsWithSku += withSku.length
  variantsWithoutSku += withoutSku.length

  for (const v of withSku) {
    if (v.sku.startsWith("CJ") || v.sku.startsWith("cj")) skuFormats.cj++
    else if (v.sku.startsWith("ELV")) skuFormats.elv++
    else skuFormats.other++
  }
  skuFormats.empty += withoutSku.length

  if (withSku.length === variants.length) allSkus++
  else if (withSku.length > 0) someSkus++
  else {
    noSkus++
    if (noSkuExamples.length < 5)
      noSkuExamples.push({ title: p.title, handle: p.handle, variantCount: variants.length })
  }
}

console.log(`\n=== SKU Coverage Audit ===`)
console.log(`Total products: ${products.length}`)
console.log(`  All variants have SKU:  ${allSkus}`)
console.log(`  Some variants have SKU: ${someSkus}`)
console.log(`  No variants have SKU:   ${noSkus}`)
console.log(`  No variants at all:     ${noVariants}`)
console.log(`\nTotal variants: ${totalVariants}`)
console.log(`  With SKU:    ${variantsWithSku} (${(variantsWithSku/totalVariants*100).toFixed(1)}%)`)
console.log(`  Without SKU: ${variantsWithoutSku} (${(variantsWithoutSku/totalVariants*100).toFixed(1)}%)`)
console.log(`\nSKU format breakdown:`)
console.log(`  CJ* format:  ${skuFormats.cj}`)
console.log(`  ELV* format: ${skuFormats.elv}`)
console.log(`  Other:       ${skuFormats.other}`)
console.log(`  Empty/null:  ${skuFormats.empty}`)

if (noSkuExamples.length > 0) {
  console.log(`\nSample products with NO SKU:`)
  for (const ex of noSkuExamples) {
    console.log(`  - ${ex.title} (${ex.handle}) — ${ex.variantCount} variants`)
  }
}
