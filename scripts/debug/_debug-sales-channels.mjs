#!/usr/bin/env node

/**
 * Check sales channel assignments for the out-of-stock products
 * This is likely the root cause: products not assigned to the sales channel
 * that the publishable API key is linked to.
 */

import fs from "node:fs";

const MEDUSA_URL = "https://medusa-backend-production-d681.up.railway.app";
const EXPECTED_SC = "sc_01KDPCP4E0TF4SFRM4KE4W8A8Z"; // Default Sales Channel

for (const p of ["admin/.env", "storefront/.env.local"]) {
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq).trim()]) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

async function main() {
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token: jwt } = await authRes.json();

  // Check a few known out-of-stock product IDs
  const productIds = [
    "prod_01KJK5WG6WWRHXSQX9VF2M0KMD", // Modern Gold Wall Sconce
    "prod_01KJK5GY684DMQSXZWGKMV111N", // Motion Sensor LED Night Light
    "prod_01KF76F56F9D2JD3V53R6FMS2B", // Nordic Style Minimalist Floor Lamp
    "prod_01KJK5GJYJHPD5K3Q3JDK2MQ75", // Creative Art Sculptural Chandelier
    "prod_01KJK5EVXHDMBY8TWNN6F6M809", // Solar LED Garden Light
  ];

  // Also check a product that IS working
  const workingProductId = "prod_01KJJKFHGMG5W7E92QABFABSJN"; // Modern Minimalist Bedside Table Lamp

  console.log("Checking sales channel assignments...\n");

  for (const pid of [...productIds, workingProductId]) {
    const res = await fetch(
      `${MEDUSA_URL}/admin/products/${pid}?fields=id,title,status,*sales_channels`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    
    if (!res.ok) {
      console.log(`${pid}: ❌ ${res.status}`);
      continue;
    }
    
    const data = await res.json();
    const p = data.product;
    const scs = p.sales_channels || [];
    const hasExpected = scs.some(sc => sc.id === EXPECTED_SC);
    
    console.log(`${p.title}`);
    console.log(`  ID: ${pid}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Sales channels: ${scs.length > 0 ? scs.map(sc => `${sc.name} (${sc.id})`).join(", ") : "⚠ NONE"}`);
    console.log(`  Has Default SC: ${hasExpected ? "✓ YES" : "❌ NO"}`);
    console.log();
  }

  // Now count how many published products are MISSING the sales channel
  console.log("═".repeat(70));
  console.log("FULL SCAN: How many published products lack sales channel?");
  console.log("═".repeat(70) + "\n");
  
  let offset = 0;
  const limit = 100;
  let total = 0;
  let missing = 0;
  let missingList = [];

  while (true) {
    const res = await fetch(
      `${MEDUSA_URL}/admin/products?limit=${limit}&offset=${offset}&status=published&fields=id,title,*sales_channels`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const data = await res.json();
    const products = data.products || [];
    
    for (const p of products) {
      total++;
      const scs = p.sales_channels || [];
      const hasExpected = scs.some(sc => sc.id === EXPECTED_SC);
      if (!hasExpected) {
        missing++;
        missingList.push({ id: p.id, title: p.title, channels: scs.length });
      }
    }
    
    if (products.length < limit) break;
    offset += limit;
    process.stdout.write(`  Scanned ${total} products...\r`);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`  Total published products: ${total}`);
  console.log(`  Missing default sales channel: ${missing}`);
  console.log(`  Have default sales channel: ${total - missing}`);

  if (missingList.length > 0) {
    console.log(`\n  First 20 missing:`);
    for (const p of missingList.slice(0, 20)) {
      console.log(`    - ${p.title} (${p.id}) [${p.channels} channels]`);
    }
    if (missingList.length > 20) console.log(`    ... and ${missingList.length - 20} more`);
  }

  // Write full list to report
  const report = {
    timestamp: new Date().toISOString(),
    totalPublished: total,
    missingSalesChannel: missing,
    products: missingList,
  };
  fs.writeFileSync("reports/missing-sales-channel.json", JSON.stringify(report, null, 2));
  console.log(`\n📄 Full list: reports/missing-sales-channel.json`);
}

main().catch(console.error);
