#!/usr/bin/env node

/**
 * Register (or update) a CJ Dropshipping logistics webhook.
 *
 * Usage:
 *   CJ_API_KEY=xxx node scripts/admin/setup-cj-webhook.mjs \
 *     --webhook-url https://your-medusa-host/admin/custom/cj-webhook
 *
 * The script calls CJ API v2.0 POST /api2.0/v1/webhook/set
 * with subscribeTopic = "LOGISTICS".
 */

import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── CLI args ──
const { values } = parseArgs({
  options: {
    "webhook-url": { type: "string" },
  },
});

const webhookUrl = values["webhook-url"];
if (!webhookUrl) {
  console.error(
    "Usage: CJ_API_KEY=xxx node scripts/admin/setup-cj-webhook.mjs --webhook-url <url>"
  );
  process.exit(1);
}

// ── CJ Auth (reuses existing cache pattern) ──
const CJ_BASE = "https://developers.cjdropshipping.com";
const __script_dir = path.dirname(fileURLToPath(import.meta.url));
const CJ_TOKEN_CACHE = path.join(__script_dir, ".cj-token-cache.json");
let cjAccessToken = null;

function loadCachedCjToken() {
  try {
    if (!fs.existsSync(CJ_TOKEN_CACHE)) return null;
    const cached = JSON.parse(fs.readFileSync(CJ_TOKEN_CACHE, "utf-8"));
    if (Date.now() - cached.ts < 23 * 60 * 60 * 1000) return cached.token;
  } catch {
    /* ignore */
  }
  return null;
}

function saveCjTokenCache(token) {
  try {
    fs.writeFileSync(
      CJ_TOKEN_CACHE,
      JSON.stringify({ token, ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;
  const cached = loadCachedCjToken();
  if (cached) {
    cjAccessToken = cached;
    return cached;
  }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY env var not set.");
  const res = await fetch(
    `${CJ_BASE}/api2.0/v1/authentication/getAccessToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    }
  );
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(
      `CJ auth failed (code ${data.code}): ${data.message || "No token"}`
    );
  }
  cjAccessToken = data.data.accessToken;
  saveCjTokenCache(cjAccessToken);
  return cjAccessToken;
}

// ── Register webhook ──
async function registerWebhook() {
  const token = await ensureCjToken();

  console.log(`Registering CJ LOGISTICS webhook → ${webhookUrl}`);

  const res = await fetch(`${CJ_BASE}/api2.0/v1/webhook/set`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: JSON.stringify({
      subscribeTopic: "LOGISTICS",
      subscribeUrl: webhookUrl,
    }),
  });

  const data = await res.json();

  if (data.result) {
    console.log("Webhook registered successfully.");
    console.log("Response:", JSON.stringify(data, null, 2));
  } else {
    console.error(`Failed (code ${data.code}): ${data.message}`);
    console.error("Full response:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

await registerWebhook();
