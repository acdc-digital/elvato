#!/usr/bin/env node
/**
 * Etsy OAuth helper for marketplace setup.
 *
 * Commands:
 *   node scripts/etsy/oauth.mjs authorize
 *   node scripts/etsy/oauth.mjs exchange --code CODE --state STATE
 *   node scripts/etsy/oauth.mjs refresh
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const ENV_LOCAL = path.join(MARKETPLACE_DIR, ".env.local");
const OAUTH_STATE_FILE = path.join(MARKETPLACE_DIR, ".etsy-oauth.json");
const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
const AUTHORIZE_URL = "https://www.etsy.com/oauth/connect";
const DEFAULT_REDIRECT_URI = "https://elvato.shop/callback";
const DEFAULT_SCOPES = "profile_r shops_r listings_r listings_w";

loadEnv();

function loadEnv() {
  const paths = [
    path.join(MARKETPLACE_DIR, ".env.local"),
    path.join(MARKETPLACE_DIR, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".env"),
  ];

  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = { command: argv[2] || "help", code: null, state: null, scopes: null };
  for (let index = 3; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--code") { args.code = argv[++index]; continue; }
    if (arg === "--state") { args.state = argv[++index]; continue; }
    if (arg === "--scopes" || arg === "--scope") { args.scopes = argv[++index]; continue; }
    if (arg === "--help" || arg === "-h") { args.command = "help"; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in marketplace/.env.local.`);
  return value;
}

function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomToken(bytes = 32) {
  return base64Url(crypto.randomBytes(bytes));
}

function codeChallenge(verifier) {
  return base64Url(crypto.createHash("sha256").update(verifier).digest());
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readSavedOAuth() {
  if (!fs.existsSync(OAUTH_STATE_FILE)) {
    throw new Error("No saved OAuth request found. Run `yarn etsy:auth` first.");
  }
  return JSON.parse(fs.readFileSync(OAUTH_STATE_FILE, "utf-8"));
}

function toForm(data) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value != null && value !== "") form.set(key, String(value));
  }
  return form;
}

function buildAuthorizeUrl(args) {
  const clientId = requireEnv("ETSY_API_KEY");
  const redirectUri = process.env.ETSY_REDIRECT_URI || DEFAULT_REDIRECT_URI;
  const scopes = args.scopes || process.env.ETSY_OAUTH_SCOPES || DEFAULT_SCOPES;
  const state = randomToken(24);
  const verifier = randomToken(48);
  const challenge = codeChallenge(verifier);

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const saved = {
    createdAt: new Date().toISOString(),
    state,
    codeVerifier: verifier,
    codeChallenge: challenge,
    redirectUri,
    scopes,
    authorizeUrl: url.toString(),
  };
  writeJson(OAUTH_STATE_FILE, saved);
  return saved;
}

async function requestToken(body) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toForm(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = text; }
  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`Token request failed (${response.status}): ${detail}`);
  }
  return payload;
}

function upsertEnvValues(file, values) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  const lines = existing.split("\n");
  const pending = new Map(Object.entries(values).filter(([, value]) => value != null));
  const updated = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !pending.has(match[1])) return line;
    const value = pending.get(match[1]);
    pending.delete(match[1]);
    return `${match[1]}=${value}`;
  });

  if (pending.size) {
    if (updated.length && updated[updated.length - 1] !== "") updated.push("");
    for (const [key, value] of pending) updated.push(`${key}=${value}`);
  }

  fs.writeFileSync(file, updated.join("\n").replace(/\n*$/, "\n"));
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 12) return `${value.slice(0, 3)}...`;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

async function exchange(args) {
  if (!args.code) throw new Error("Provide --code from the Etsy callback URL.");
  const saved = readSavedOAuth();
  if (args.state && args.state !== saved.state) {
    throw new Error("Returned state does not match the saved OAuth request. Start over with `yarn etsy:auth`.");
  }

  const token = await requestToken({
    grant_type: "authorization_code",
    client_id: requireEnv("ETSY_API_KEY"),
    redirect_uri: saved.redirectUri,
    code: args.code,
    code_verifier: saved.codeVerifier,
  });

  upsertEnvValues(ENV_LOCAL, {
    ETSY_ACCESS_TOKEN: token.access_token,
    ETSY_REFRESH_TOKEN: token.refresh_token,
  });

  return token;
}

async function refresh() {
  const token = await requestToken({
    grant_type: "refresh_token",
    client_id: requireEnv("ETSY_API_KEY"),
    refresh_token: requireEnv("ETSY_REFRESH_TOKEN"),
  });

  upsertEnvValues(ENV_LOCAL, {
    ETSY_ACCESS_TOKEN: token.access_token,
    ETSY_REFRESH_TOKEN: token.refresh_token,
  });

  return token;
}

function printUsage() {
  console.log([
    "Usage:",
    "  node scripts/etsy/oauth.mjs authorize [--scopes \"profile_r shops_r listings_r listings_w\"]",
    "  node scripts/etsy/oauth.mjs exchange --code CODE --state STATE",
    "  node scripts/etsy/oauth.mjs refresh",
  ].join("\n"));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.command === "help") {
    printUsage();
    return;
  }

  if (args.command === "authorize") {
    const result = buildAuthorizeUrl(args);
    console.log("Open this Etsy authorization URL:");
    console.log(result.authorizeUrl);
    console.log(`\nSaved verifier/state to ${path.relative(REPO_ROOT, OAUTH_STATE_FILE)}`);
    console.log("After Etsy redirects back, run:");
    console.log("yarn etsy:token --code <code> --state <state>");
    return;
  }

  if (args.command === "exchange") {
    const token = await exchange(args);
    console.log("Saved Etsy OAuth tokens to marketplace/.env.local");
    console.log(`Access token: ${mask(token.access_token)}`);
    console.log(`Refresh token: ${mask(token.refresh_token)}`);
    console.log(`Expires in: ${token.expires_in}s`);
    return;
  }

  if (args.command === "refresh") {
    const token = await refresh();
    console.log("Refreshed Etsy OAuth tokens in marketplace/.env.local");
    console.log(`Access token: ${mask(token.access_token)}`);
    console.log(`Refresh token: ${mask(token.refresh_token)}`);
    console.log(`Expires in: ${token.expires_in}s`);
    return;
  }

  printUsage();
  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
