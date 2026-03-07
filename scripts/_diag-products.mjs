#!/usr/bin/env node

/**
 * Quick diagnostic: check products without type_id to understand what data they have.
 */

import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const ep of ["admin/.env", ".env.local"]) {
    const full = path.join(process.cwd(), ep);
    if (fs.existsSync(full)) {
      for (const line of fs.readFileSync(full, "utf-8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        const v = t.slice(eq + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

loadEnv();

const medusaUrl = "https://medusa-backend-production-d681.up.railway.app";

async function main() {
  const authRes = await fetch(new URL("/auth/user/emailpass", medusaUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  });
  const { token } = await authRes.json();

  // Get a sample of products that DON'T have type_id (offset past the 39 that do)
  const url = new URL("/admin/products", medusaUrl);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", "40");
  url.searchParams.set("fields", "id,title,handle,status,type_id,type,metadata,tags,collection_id,external_id");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  console.log(`\nSample of products (offset=40, should be ones without type_id):\n`);

  for (const p of data.products) {
    console.log(`Title: ${p.title}`);
    console.log(`  type_id: ${p.type_id || "NONE"}`);
    console.log(`  metadata: ${JSON.stringify(p.metadata)}`);
    console.log(`  tags: ${JSON.stringify(p.tags)}`);
    console.log(`  collection_id: ${p.collection_id || "NONE"}`);
    console.log(`  external_id: ${p.external_id || "NONE"}`);
    console.log(`  handle: ${p.handle}`);
    console.log();
  }

  // Now check: do these products exist in Convex with classification data?
  // Let's check the handle pattern
  console.log("Total product count:", data.count);
}

main().catch((e) => console.error(e));
