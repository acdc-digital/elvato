#!/usr/bin/env node
/**
 * Best-effort price enrichment for marketplace image source reports.
 *
 * Reads marketplace/images/**​/sources.json, extracts competitor prices from
 * existing SerpApi metadata and source pages, writes listedPrice metadata back
 * into found/discovered candidate records, and regenerates SOURCES.md so the
 * recommended marketplace pricing section reflects the latest prices.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichSourcePrices } from "./lib/price.mjs";
import { writeSourceReport } from "./lib/source-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const IMAGE_ROOT = path.join(MARKETPLACE_DIR, "images");

function parseArgs(argv) {
  const args = {
    imageRoot: IMAGE_ROOT,
    fetchPages: true,
    force: false,
    limit: Infinity,
    concurrency: 4,
    writeReports: true,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--image-root") { args.imageRoot = path.resolve(argv[++index]); continue; }
    if (arg === "--no-fetch") { args.fetchPages = false; continue; }
    if (arg === "--force") { args.force = true; continue; }
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--concurrency") { args.concurrency = Number(argv[++index]); continue; }
    if (arg === "--no-reports") { args.writeReports = false; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node ../scripts/etsy/enrich-image-source-prices.mjs

Options:
  --no-fetch         Use existing SerpApi/raw metadata only (no page fetches).
  --force            Re-resolve prices even when listedPrice already exists.
  --limit N          Limit number of unique source pages fetched per folder.
  --concurrency N    Page fetch concurrency, default 4.
  --no-reports       Do not regenerate SOURCES.md after enrichment.
`);
}

function listSourceFiles(imageRoot) {
  if (!fs.existsSync(imageRoot)) return [];
  const directSourceFile = path.join(imageRoot, "sources.json");
  if (fs.existsSync(directSourceFile)) return [directSourceFile];
  const results = [];
  for (const entry of fs.readdirSync(imageRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const childDir = path.join(imageRoot, entry.name);
    const childSource = path.join(childDir, "sources.json");
    if (fs.existsSync(childSource)) {
      results.push(childSource);
      continue;
    }
    // Recurse one level into category subfolders (chandelier/, desk and floor lamps/).
    results.push(...listSourceFiles(childDir));
  }
  return results;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv);
  const sourceFiles = listSourceFiles(args.imageRoot);
  if (sourceFiles.length === 0) throw new Error(`No sources.json files found under ${args.imageRoot}`);

  const totals = { metadataPrices: 0, uniquePagesFetched: 0, fetchedPrices: 0, missingPrices: 0, fetchErrors: 0 };

  for (const sourceFile of sourceFiles) {
    const productDir = path.dirname(sourceFile);
    const sources = readJson(sourceFile);
    const stats = await enrichSourcePrices(sources, {
      fetchPages: args.fetchPages,
      concurrency: args.concurrency,
      limit: args.limit,
      force: args.force,
    });
    for (const key of Object.keys(totals)) totals[key] += stats[key] || 0;
    writeJson(sourceFile, sources);
    if (args.writeReports) writeSourceReport(productDir, sources);
  }

  console.log(JSON.stringify({
    sourceFiles: sourceFiles.length,
    candidatesWithMetadataPrices: totals.metadataPrices,
    uniquePagesFetched: totals.uniquePagesFetched,
    candidatesWithFetchedPrices: totals.fetchedPrices,
    candidatesWithoutPrices: totals.missingPrices,
    fetchErrors: totals.fetchErrors,
    reportsRegenerated: args.writeReports,
  }, null, 2));
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
