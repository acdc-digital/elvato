#!/usr/bin/env node

/**
 * Quick diagnostic: check how many products have categories assigned in Medusa.
 */

import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPaths = [
    path.join(process.cwd(), "admin", ".env"),
    path.join(process.cwd(), ".env.local"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const medusaUrl = process.argv[2] || "https://medusa-backend-production-d681.up.railway.app";
const email = process.env.MEDUSA_ADMIN_EMAIL;
const password = process.env.MEDUSA_ADMIN_PASSWORD;

async function main() {
  // Auth
  const authRes = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!authRes.ok) throw new Error("Auth failed: " + authRes.status);
  const { token } = await authRes.json();

  // Paginate all products with categories
  const allProducts = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const url = new URL("/admin/products", medusaUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,title,handle,status,categories,type");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const batch = data.products || [];
    allProducts.push(...batch);
    if (allProducts.length >= (data.count || batch.length) || batch.length === 0) break;
    offset += batch.length;
  }

  console.log(`\nTotal products in Medusa: ${allProducts.length}\n`);

  let withCats = 0;
  let withoutCats = 0;
  const catUsage = new Map(); // categoryId -> count

  for (const p of allProducts) {
    const cats = p.categories || [];
    if (cats.length > 0) {
      withCats++;
      for (const c of cats) {
        catUsage.set(c.id, (catUsage.get(c.id) || 0) + 1);
      }
    } else {
      withoutCats++;
    }
  }

  console.log(`With categories:    ${withCats}`);
  console.log(`Without categories: ${withoutCats}`);
  console.log(`Unique categories used: ${catUsage.size}\n`);

  // Show sample of products without categories
  if (withoutCats > 0) {
    console.log("--- Sample products WITHOUT categories ---");
    const sample = allProducts.filter((p) => !p.categories || p.categories.length === 0).slice(0, 5);
    for (const p of sample) {
      const typeName = p.type ? p.type.value || p.type.id : "none";
      console.log(`  ${p.title?.slice(0, 60)}  [status: ${p.status}, type: ${typeName}]`);
    }
    console.log();
  }

  // Show sample of products WITH categories
  if (withCats > 0) {
    console.log("--- Sample products WITH categories ---");
    const sample = allProducts.filter((p) => p.categories && p.categories.length > 0).slice(0, 5);
    for (const p of sample) {
      const catNames = p.categories.map((c) => c.name || c.handle).join(", ");
      console.log(`  ${p.title?.slice(0, 60)}  -> [${catNames}]`);
    }
    console.log();
  }

  // Check the sync script's category resolution logic
  // Look at how categories are assigned in the transform
  console.log("--- Category assignment in sync pipeline ---");
  const sampleWithMeta = allProducts.slice(0, 3);
  for (const p of sampleWithMeta) {
    const meta = p.metadata || {};
    console.log(`  ${p.title?.slice(0, 50)}`);
    console.log(`    classification.mainType: ${meta.classification?.mainType || "MISSING"}`);
    console.log(`    cjCategoryName: ${meta.cjCategoryName || "MISSING"}`);
    console.log(`    categories assigned: ${(p.categories || []).length}`);
    console.log();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
