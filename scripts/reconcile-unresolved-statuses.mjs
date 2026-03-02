#!/usr/bin/env node
import fs from "fs";
import path from "path";

const CONVEX_URL = process.env.CONVEX_URL || "https://superb-dotterel-37.convex.cloud";
const MEDUSA_URL = process.env.MEDUSA_URL || "https://medusa-backend-production-d681.up.railway.app";
const MAX_PER_STATUS = Number(process.env.MAX_PER_STATUS || 300);

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
  const files = [
    path.join(root, ".env.local"),
    path.join(root, ".env"),
    path.join(root, "admin", ".env"),
    path.join(root, "storefront", ".env.local"),
  ];
  files.forEach(loadEnvFile);
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

async function convexMutation(pathName, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: pathName, args }),
  });
  const json = await res.json();
  if (!res.ok || json.status !== "success") {
    throw new Error(`Convex mutation failed for ${pathName}: ${JSON.stringify(json)}`);
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

async function findInMedusa(jwt, product) {
  if (product.externalId) {
    const byExternal = new URL("/admin/products", MEDUSA_URL);
    byExternal.searchParams.set("q", product.externalId);
    byExternal.searchParams.set("limit", "20");
    byExternal.searchParams.set("fields", "id,handle,title,metadata");

    const extRes = await fetch(byExternal, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (extRes.ok) {
      const extData = await extRes.json();
      const match = (extData.products || []).find((p) => p.metadata?.external_id === product.externalId);
      if (match) return match;
    }
  }

  if (product.handle) {
    const byHandle = new URL("/admin/products", MEDUSA_URL);
    byHandle.searchParams.set("handle", product.handle);
    byHandle.searchParams.set("limit", "1");
    byHandle.searchParams.set("fields", "id,handle,title,metadata");

    const handleRes = await fetch(byHandle, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (handleRes.ok) {
      const handleData = await handleRes.json();
      return handleData.products?.[0] || null;
    }
  }

  return null;
}

async function run() {
  loadEnv();
  const jwt = await getMedusaJwt();

  const failed = await convexQuery("medusa/staging:getAllProducts", {
    limit: MAX_PER_STATUS,
    syncStatus: "failed",
  });

  const syncing = await convexQuery("medusa/staging:getAllProducts", {
    limit: MAX_PER_STATUS,
    syncStatus: "syncing",
  });

  const unresolved = [...failed, ...syncing];

  if (unresolved.length === 0) {
    console.log("No unresolved products found.");
    return;
  }

  let duplicates = 0;
  let exhausted = 0;

  for (let i = 0; i < unresolved.length; i++) {
    const p = unresolved[i];
    const found = await findInMedusa(jwt, p);

    if (found) {
      await convexMutation("medusa/staging:updateSyncStatus", {
        medusaProductId: p._id,
        status: "duplicate",
        medusaId: found.id,
        error: "Exists in Medusa; marked duplicate during reconciliation",
      });
      duplicates++;
      console.log(`[${i + 1}/${unresolved.length}] DUPLICATE ${p.title?.slice(0, 60)} -> ${found.id}`);
    } else {
      const attempts = Number(p.syncAttempts || 0);
      await convexMutation("medusa/staging:updateSyncStatus", {
        medusaProductId: p._id,
        status: "exhausted",
        syncAttempts: attempts >= 5 ? attempts : 5,
        error: "Not found in Medusa after retries; marked exhausted during reconciliation",
      });
      exhausted++;
      console.log(`[${i + 1}/${unresolved.length}] EXHAUSTED ${p.title?.slice(0, 60)}`);
    }
  }

  const stats = await convexQuery("medusa/staging:getSyncStats", {});

  console.log("\nReconciliation complete:");
  console.log(JSON.stringify({
    processed: unresolved.length,
    markedDuplicate: duplicates,
    markedExhausted: exhausted,
    finalProducts: stats.products,
  }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
