#!/usr/bin/env node
/**
 * Etsy seller taxonomy search helper.
 *
 * Usage:
 *   node scripts/etsy/taxonomy.mjs chandelier
 *   node scripts/etsy/taxonomy.mjs --set-default TAXONOMY_ID
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const ENV_LOCAL = path.join(MARKETPLACE_DIR, ".env.local");
const ETSY_BASE = "https://api.etsy.com";

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
  const args = { query: [], setDefault: null, limit: 25 };
  for (let index = 2; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--set-default") { args.setDefault = argv[++index]; continue; }
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--help" || arg === "-h") { args.help = true; continue; }
    args.query.push(arg);
  }
  return args;
}

function apiKeyHeader() {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY in marketplace/.env.local.");
  if (process.env.ETSY_API_HEADER_KEY) return process.env.ETSY_API_HEADER_KEY;
  if (!process.env.ETSY_CLIENT_SECRET) throw new Error("Set ETSY_CLIENT_SECRET in marketplace/.env.local.");
  return `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET}`;
}

async function etsyGet(endpoint) {
  const response = await fetch(new URL(endpoint, ETSY_BASE), {
    headers: { "x-api-key": apiKeyHeader() },
    signal: AbortSignal.timeout(45_000),
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`GET ${endpoint} -> ${response.status}: ${detail.slice(0, 700)}`);
  }
  return body;
}

function flattenNodes(nodes, parentPath = []) {
  const flattened = [];
  for (const node of nodes || []) {
    const pathParts = [...parentPath, node.name].filter(Boolean);
    flattened.push({
      id: node.id,
      level: node.level,
      name: node.name,
      path: pathParts.join(" > "),
      fullPathIds: node.full_path_taxonomy_ids || [],
    });
    flattened.push(...flattenNodes(node.children || [], pathParts));
  }
  return flattened;
}

function searchNodes(nodes, terms, limit) {
  const lowered = terms.map((term) => term.toLowerCase()).filter(Boolean);
  return nodes
    .filter((node) => lowered.every((term) => node.path.toLowerCase().includes(term)))
    .sort((a, b) => b.level - a.level || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function upsertEnvValue(file, key, value) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  const lines = existing.split("\n");
  let found = false;
  const updated = lines.map((line) => {
    if (!line.startsWith(`${key}=`)) return line;
    found = true;
    return `${key}=${value}`;
  });
  if (!found) {
    if (updated.length && updated[updated.length - 1] !== "") updated.push("");
    updated.push(`${key}=${value}`);
  }
  fs.writeFileSync(file, updated.join("\n").replace(/\n*$/, "\n"));
}

function printUsage() {
  console.log([
    "Usage:",
    "  node scripts/etsy/taxonomy.mjs chandelier",
    "  node scripts/etsy/taxonomy.mjs lighting chandelier",
    "  node scripts/etsy/taxonomy.mjs --set-default TAXONOMY_ID",
  ].join("\n"));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printUsage(); return; }

  if (args.setDefault) {
    const id = Number(args.setDefault);
    if (!Number.isFinite(id) || id <= 0) throw new Error("--set-default requires a numeric taxonomy ID.");
    upsertEnvValue(ENV_LOCAL, "ETSY_DEFAULT_TAXONOMY_ID", String(id));
    console.log(`Saved ETSY_DEFAULT_TAXONOMY_ID=${id} to marketplace/.env.local`);
    return;
  }

  if (!args.query.length) {
    printUsage();
    throw new Error("Provide a taxonomy search term, for example: chandelier");
  }

  const payload = await etsyGet("/v3/application/seller-taxonomy/nodes");
  const flattened = flattenNodes(payload.results || []);
  const matches = searchNodes(flattened, args.query, args.limit);

  if (!matches.length) {
    console.log(`No taxonomy matches for: ${args.query.join(" ")}`);
    return;
  }

  for (const match of matches) {
    console.log(`${match.id}\t${match.path}`);
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
