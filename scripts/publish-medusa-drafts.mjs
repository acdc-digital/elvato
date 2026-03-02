#!/usr/bin/env node
import fs from "fs";
import path from "path";

const MEDUSA_URL = process.env.MEDUSA_URL || "https://medusa-backend-production-d681.up.railway.app";
const PAGE_LIMIT = Number(process.env.PAGE_LIMIT || 100);
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 4);

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

async function medusaFetch(jwt, endpoint, options = {}) {
  const res = await fetch(`${MEDUSA_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...(options.headers || {}),
    },
  });

  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = null; }

  if (!res.ok) {
    const msg = json?.message || json?.error || body.slice(0, 300);
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return json;
}

async function getDraftProductIds(jwt) {
  const ids = [];
  let offset = 0;

  while (true) {
    const data = await medusaFetch(
      jwt,
      `/admin/products?status%5B0%5D=draft&limit=${PAGE_LIMIT}&offset=${offset}&fields=id,status`
    );

    const products = data.products || [];
    for (const p of products) {
      if (p.id) ids.push(p.id);
    }

    offset += products.length;
    if (products.length < PAGE_LIMIT) break;
  }

  return ids;
}

async function publishOne(jwt, productId) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await medusaFetch(jwt, `/admin/products/${productId}`, {
        method: "POST",
        body: JSON.stringify({ status: "published" }),
      });
      return { ok: true };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1000);
      }
    }
  }

  return { ok: false, error: String(lastError?.message || lastError) };
}

async function runWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;

  async function loop() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => loop()));
  return results;
}

async function main() {
  loadEnv();
  const jwt = await getMedusaJwt();

  const draftIds = await getDraftProductIds(jwt);
  console.log(`Found ${draftIds.length} draft products.`);

  if (draftIds.length === 0) {
    console.log("Nothing to publish.");
    return;
  }

  let published = 0;
  let failed = 0;

  const results = await runWithConcurrency(
    draftIds,
    async (id, i) => {
      const result = await publishOne(jwt, id);
      if (result.ok) {
        published++;
      } else {
        failed++;
        console.log(`FAILED ${id}: ${result.error}`);
      }

      if ((i + 1) % 50 === 0 || i === draftIds.length - 1) {
        console.log(`Progress ${i + 1}/${draftIds.length} | published=${published} failed=${failed}`);
      }

      return { id, ...result };
    },
    CONCURRENCY
  );

  const failures = results.filter((r) => !r.ok);
  const counts = await medusaFetch(jwt, "/admin/products?limit=1");
  const draftsAfter = await medusaFetch(jwt, "/admin/products?status%5B0%5D=draft&limit=1");
  const publishedAfter = await medusaFetch(jwt, "/admin/products?status%5B0%5D=published&limit=1");

  const report = {
    timestamp: new Date().toISOString(),
    draftIds: draftIds.length,
    published,
    failed,
    totalProducts: counts.count,
    draftAfter: draftsAfter.count,
    publishedAfter: publishedAfter.count,
    failures,
  };

  const outPath = path.join(process.cwd(), "reports", "publish-medusa-drafts.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\nDone:");
  console.log(JSON.stringify({
    draftBefore: draftIds.length,
    published,
    failed,
    draftAfter: draftsAfter.count,
    publishedAfter: publishedAfter.count,
    totalProducts: counts.count,
  }, null, 2));
  console.log(`Report: ${outPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
