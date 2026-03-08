/**
 * Audit how many products have "Default" option titles or values.
 * Also check what the CJ product data has for those products' real option names.
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
  return (await r.json()).token
}

async function fetchAllProducts(token) {
  const products = []
  let offset = 0
  const limit = 100
  while (true) {
    const r = await fetch(`${BASE}/admin/products?limit=${limit}&offset=${offset}&fields=title,handle,*options.values,*variants.options`, {
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

// Count how many products have "Default" option titles or values
let defaultTitleCount = 0
let defaultValueCount = 0
let defaultTitleProducts = []
let singleOptionDefaultProducts = []

for (const p of products) {
  const options = p.options || []

  const hasDefaultTitle = options.some(o => o.title?.toLowerCase() === "default")
  const hasDefaultValue = options.some(o =>
    (o.values || []).some(v => v.value?.toLowerCase() === "default")
  )

  if (hasDefaultTitle) {
    defaultTitleCount++
    if (defaultTitleProducts.length < 10) {
      defaultTitleProducts.push({
        title: p.title,
        handle: p.handle,
        options: options.map(o => ({
          title: o.title,
          values: (o.values || []).map(v => v.value),
        })),
        variantCount: p.variants?.length || 0,
      })
    }
  }
  if (hasDefaultValue) {
    defaultValueCount++
  }

  // Products where ALL options have "Default" as only value
  const allDefault = options.length > 0 && options.every(o =>
    (o.values || []).length === 1 && (o.values || [])[0]?.value?.toLowerCase() === "default"
  )
  if (allDefault) {
    singleOptionDefaultProducts.push({
      title: p.title,
      handle: p.handle,
      options: options.map(o => o.title),
      variantCount: p.variants?.length || 0,
    })
  }
}

console.log(`\n=== "Default" Option Audit ===`)
console.log(`Total products: ${products.length}`)
console.log(`Products with "Default" as option TITLE: ${defaultTitleCount}`)
console.log(`Products with "Default" as option VALUE: ${defaultValueCount}`)
console.log(`Products where ALL option values are "Default": ${singleOptionDefaultProducts.length}`)

if (defaultTitleProducts.length > 0) {
  console.log(`\n--- Sample products with "Default" option title ---`)
  for (const p of defaultTitleProducts) {
    console.log(`  ${p.title} (${p.variantCount} variants)`)
    for (const o of p.options) {
      console.log(`    Option "${o.title}": [${o.values.join(", ")}]`)
    }
  }
}

if (singleOptionDefaultProducts.length > 0 && singleOptionDefaultProducts.length <= 20) {
  console.log(`\n--- ALL products where every option value is "Default" ---`)
  for (const p of singleOptionDefaultProducts) {
    console.log(`  ${p.title} | options: [${p.options.join(", ")}] | ${p.variantCount} variants`)
  }
}
