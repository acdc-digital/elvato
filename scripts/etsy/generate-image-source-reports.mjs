#!/usr/bin/env node
/**
 * Generate per-folder image source review reports for marketplace assets.
 *
 * Reads each marketplace/images/{product}/sources.json file and writes a
 * clickable SOURCES.md report next to the images for quick source-site review.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateReport, REPO_ROOT, DEFAULT_REPORT_NAME } from "./lib/source-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const IMAGE_ROOT = path.join(MARKETPLACE_DIR, "images");
const REPORT_NAME = DEFAULT_REPORT_NAME;

function parseArgs(argv) {
  const args = {
    imageRoot: IMAGE_ROOT,
    reportName: REPORT_NAME,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--image-root") { args.imageRoot = path.resolve(argv[++index]); continue; }
    if (arg === "--report-name") { args.reportName = argv[++index]; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node ../scripts/etsy/generate-image-source-reports.mjs

Options:
  --image-root PATH    Override marketplace/images root.
  --report-name NAME   Output markdown filename, default SOURCES.md.
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
    // Recurse one level into category subfolders (e.g. chandelier/, desk and floor lamps/).
    results.push(...listSourceFiles(childDir));
  }
  return results;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  const args = parseArgs(process.argv);
  const sourceFiles = listSourceFiles(args.imageRoot);
  if (sourceFiles.length === 0) throw new Error(`No sources.json files found under ${args.imageRoot}`);

  const reports = [];
  for (const sourceFile of sourceFiles) {
    const productDir = path.dirname(sourceFile);
    const sources = readJson(sourceFile);
    const report = generateReport(productDir, sources);
    const reportPath = path.join(productDir, args.reportName);
    fs.writeFileSync(reportPath, report);
    reports.push(path.relative(REPO_ROOT, reportPath).split(path.sep).join("/"));
  }

  console.log(`Generated ${reports.length} image source reports:`);
  for (const report of reports) console.log(`- ${report}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
