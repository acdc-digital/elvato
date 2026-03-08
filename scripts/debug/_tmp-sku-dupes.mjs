const BASE = "https://medusa-backend-production-d681.up.railway.app"
const EMAIL = "admin@medusa-test.com"
const PASSWORD = "supersecret"

const authR = await fetch(`${BASE}/auth/user/emailpass`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
const token = (await authR.json()).token

// Search for both Nordic Floor Lamp products
const r = await fetch(`${BASE}/admin/products?q=Nordic+Style+Minimalist+Floor+Lamp&fields=id,title,handle,status,*variants.sku,*variants.options&limit=10`, {
  headers: { Authorization: `Bearer ${token}` },
})
const { products } = await r.json()
for (const p of products) {
  console.log(`\n${p.title}`)
  console.log(`  ID:      ${p.id}`)
  console.log(`  Handle:  ${p.handle}`)
  console.log(`  Status:  ${p.status}`)
  console.log(`  Variants: ${p.variants?.length}`)
  for (const v of (p.variants || []).slice(0, 3)) {
    console.log(`    SKU: ${JSON.stringify(v.sku)} | options: ${v.options?.map(o => o.value).join(", ")}`)
  }
  if (p.variants?.length > 3) console.log(`    ... and ${p.variants.length - 3} more`)
}

// Also check the other missing product
const r2 = await fetch(`${BASE}/admin/products?q=Modern+Creative+Bedside+Table+Lamp&fields=id,title,handle,status,*variants.sku&limit=10`, {
  headers: { Authorization: `Bearer ${token}` },
})
const { products: p2 } = await r2.json()
console.log("\n--- Modern Creative Bedside Table Lamp ---")
for (const p of p2) {
  console.log(`  ${p.handle} | status: ${p.status} | variants: ${p.variants?.length} | first SKU: ${JSON.stringify(p.variants?.[0]?.sku)}`)
}
