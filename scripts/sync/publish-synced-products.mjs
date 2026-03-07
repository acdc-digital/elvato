#!/usr/bin/env node
import fs from "fs";
import path from "path";

const CONVEX_URL = process.env.CONVEX_URL || "https://superb-dotterel-37.convex.cloud";
const MEDUSA_URL = process.env.MEDUSA_URL || "https://medusa-backend-production-d681.up.railway.app";
const LIMIT = Number(process.env.LIMIT || 1200);
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function loadEnv() {
  const root = process.cwd();
  [
    path.join(root, ".env.local"),
    path.join(root, ".env"),
    path.join(root, "admin", ".env"),
    path.join(root, "storefront", ".env.local"),
  ].forEach(loadEnvFile);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function convexQuery(pathName, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: pathName, args }),
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(`Convex query failed for ${pathName}: ${JSON.stringify(json)}`);
  }
  return json.value;
}

async function getMedusaJwt() {
  const email = process.env.MEDUSA_ADMIN_EMAIL;
  const password = process.env.MEDUSA_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing MEDUSA_ADMIN_EMAIL or MEDUSA_ADMIN_PASSWORD in environment.");
  }

  const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }

  if (!res.ok || !json?.token) {
    throw new Error(`Medusa auth failed (${res.status}): ${body.slice(0, 400)}`);
  }

  return json.token;
}

async function publishProduct(jwt, productId) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: "published" }),
      });

      const body = await res.text();
      let json;
      try { json = JSON.parse(body); } catch { json = null; }

      if (!res.ok) {
        const msg = json?.message || json?.error || body.slice(0, 300);
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }

      return { ok: true };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }
  return { ok: false, error: String(lastErr?.message || lastErr) };
}

async function runWithConcurrency(items, worker, concurrency) {
  const results = [];
  let index = 0;

  async function runner() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.max(1, concurrency) }, () => runner());
  await Promise.all(runners);
  return results;
}

async function main() {
  loadEnv();

  const jwt = await getMedusaJwt();
  const synced = await convexQuery("medusa/staging:getAllProducts", {
    limit: LIMIT,
    syncStatus: "synced",
  });

  const productIds = synced
    .map((p) => p.medusaProductId)
    .filter((id) => typeof id === "string" && id.length > 0);

  if (productIds.length === 0) {
    console.log("No synced products with medusaProductId found.");
    return;
  }

  console.log(`Publishing ${productIds.length} products (concurrency=${CONCURRENCY})...`);

  let published = 0;
  let failed = 0;

  const results = await runWithConcurrency(
    productIds,
    async (productId, i) => {
      const result = await publishProduct(jwt, productId);
      if (result.ok) {
        published++;
        if ((i + 1) % 50 === 0 || i === productIds.length - 1) {
          console.log(`Progress ${i + 1}/${productIds.length} | published=${published} failed=${failed}`);
        }
      } else {
        failed++;
        console.log(`FAILED ${productId}: ${result.error}`);
      }
      return { productId, ...result };
    },
    CONCURRENCY
  );

  const failures = results.filter((r) => !r.ok);
  const out = {
    timestamp: new Date().toISOString(),
    total: productIds.length,
    published,
    failed,
    failures,
  };

  const outPath = path.join(process.cwd(), "reports", "publish-synced-products.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log("\nPublish complete:");
  console.log(JSON.stringify({ total: productIds.length, published, failed }, null, 2));
  console.log(`Report: ${outPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
