#!/usr/bin/env node
/**
 * Select the first eBay launch candidates from existing marketplace research.
 *
 * This is read-only. It does not call eBay or Medusa. It reuses the strongest
 * Etsy-era product intelligence while applying an eBay-specific launch gate.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dir, "..", "..");
const ETSY_REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy");
const EBAY_REPORT_DIR = path.join(REPO_ROOT, "reports", "ebay");
const OPERATIONS_DIR = path.join(REPO_ROOT, ".agents", "operations", "reports");

function parseArgs(argv) {
  const args = { limit: 15, minScore: 80, includeComplex: false };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") { args.limit = Number(argv[++index]); continue; }
    if (arg === "--min-score") { args.minScore = Number(argv[++index]); continue; }
    if (arg === "--include-complex") { args.includeComplex = true; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(args.limit) || args.limit < 1 || args.limit > 100) throw new Error("--limit must be 1-100.");
  if (!Number.isFinite(args.minScore)) throw new Error("--min-score must be numeric.");
  return args;
}

function printUsage() {
  console.log([
    "Usage: node scripts/ebay/select-launch-candidates.mjs [options]",
    "  --limit N          Number of eBay candidates to output, default 15.",
    "  --min-score N      Minimum inherited candidate score, default 80.",
    "  --include-complex  Include products with high variant count or high price.",
  ].join("\n"));
}

function latestReport(prefix) {
  if (!fs.existsSync(ETSY_REPORT_DIR)) return null;
  const files = fs.readdirSync(ETSY_REPORT_DIR)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
    .map((name) => ({ name, filePath: path.join(ETSY_REPORT_DIR, name), mtime: fs.statSync(path.join(ETSY_REPORT_DIR, name)).mtimeMs }))
    .sort((left, right) => right.mtime - left.mtime);
  return files[0] || null;
}

function readCandidates() {
  const sources = [
    latestReport("alvatta-brand-candidates-"),
    latestReport("alvatta-brand-fit-candidates-"),
    latestReport("alvatta-table-floor-candidates-"),
    latestReport("alvatta-top-50-"),
  ].filter(Boolean);

  const candidates = [];
  for (const source of sources) {
    const payload = JSON.parse(fs.readFileSync(source.filePath, "utf-8"));
    const list = Array.isArray(payload.candidates) ? payload.candidates : Array.isArray(payload.collection) ? payload.collection : [];
    for (const item of list) {
      const normalized = normalizeCandidate(item, source.name);
      if (normalized) candidates.push(normalized);
    }
  }
  return candidates;
}

function normalizeCandidate(item, sourceReport) {
  const id = item.id || item.productId || item.medusaProductId;
  const title = item.title || item.product;
  if (!id || !title) return null;
  return {
    id,
    title,
    handle: item.handle || null,
    kind: item.kind || item.type || item.fixtureType || "unknown",
    price: numberOrNull(item.price),
    score: numberOrNull(item.score ?? item.curator ?? item.alvatta) ?? 0,
    brandFit: numberOrNull(item.brandFit),
    imageCount: numberOrNull(item.imageCount ?? item.images) ?? 0,
    variantCount: numberOrNull(item.variantCount ?? item.variants) ?? 0,
    reasons: item.reasons || item.brandReasons || [],
    thumbnail: item.thumbnail || item.imageUrls?.[0] || null,
    imageUrls: item.imageUrls || [],
    sourceReport,
  };
}

function numberOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") value = value.replace(/^\$/, "");
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ebayScore(candidate, args) {
  let score = 0;
  const notes = [];
  const blockers = [];

  if (candidate.score >= args.minScore) score += 25;
  else blockers.push(`Inherited score below ${args.minScore}`);

  if (candidate.imageCount >= 8) score += 20;
  else if (candidate.imageCount >= 6) { score += 12; notes.push("Acceptable image count; improve if possible."); }
  else blockers.push("Fewer than 6 known images.");

  if (candidate.variantCount <= 4) score += 18;
  else if (candidate.variantCount <= 8) { score += 10; notes.push("Variant count is manageable but needs careful mapping."); }
  else if (args.includeComplex) { score += 4; notes.push("Complex variant product included by flag."); }
  else blockers.push("Too many variants for MVP launch.");

  if (candidate.price != null && candidate.price >= 40 && candidate.price <= 250) score += 18;
  else if (candidate.price != null && candidate.price > 250 && candidate.price <= 450) { score += 8; notes.push("Premium price; verify margin and buyer trust."); }
  else if (candidate.price != null && candidate.price > 450 && args.includeComplex) { score += 3; notes.push("High-ticket product included by flag."); }
  else blockers.push("Price is missing or outside MVP comfort band.");

  if (/table lamp|floor lamp|wall sconce|pendant|chandelier|lighting|light/i.test(candidate.title)) score += 12;
  if (/glass|globe|brass|gold|black|modern|minimalist|nordic|scandinavian/i.test(candidate.title)) score += 7;

  if (/baroque|crystal|rattan|kids|flower|outdoor|solar|smart/i.test(candidate.title)) {
    score -= 15;
    notes.push("Style/category may be weaker for the eBay MVP.");
  }

  return { score, status: blockers.length ? "needs-review" : "ready", blockers, notes };
}

function selectCandidates(candidates, args) {
  const byId = new Map();
  for (const candidate of candidates) {
    const existing = byId.get(candidate.id);
    if (!existing || candidate.score > existing.score || candidate.imageCount > existing.imageCount) byId.set(candidate.id, candidate);
  }

  return [...byId.values()]
    .map((candidate) => ({ ...candidate, ebayGate: ebayScore(candidate, args) }))
    .filter((candidate) => candidate.score >= args.minScore || candidate.ebayGate.score >= 65)
    .sort((left, right) => right.ebayGate.score - left.ebayGate.score || right.score - left.score || right.imageCount - left.imageCount)
    .slice(0, args.limit);
}

function writeReports(selected, allCandidates, args) {
  fs.mkdirSync(EBAY_REPORT_DIR, { recursive: true });
  fs.mkdirSync(OPERATIONS_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const stamp = Date.now();
  const date = generatedAt.slice(0, 10);
  const jsonPath = path.join(EBAY_REPORT_DIR, `launch-candidates-${stamp}.json`);
  const mdPath = path.join(EBAY_REPORT_DIR, `launch-candidates-${stamp}.md`);
  const operationsPath = path.join(OPERATIONS_DIR, `ebay-launch-candidate-queue-${date}.md`);

  const payload = {
    generatedAt,
    strategy: "eBay MVP candidate queue from existing Etsy-era marketplace intelligence.",
    totalCandidatesScanned: allCandidates.length,
    selectedCount: selected.length,
    filters: args,
    candidates: selected,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  const lines = buildMarkdown(generatedAt, selected, args);
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`);
  fs.writeFileSync(operationsPath, `${lines.join("\n")}\n`);

  return { jsonPath, mdPath, operationsPath };
}

function buildMarkdown(generatedAt, selected, args) {
  const lines = [
    "# eBay Launch Candidate Queue",
    "",
    `Generated: ${generatedAt}`,
    `Limit: ${args.limit}`,
    `Minimum inherited score: ${args.minScore}`,
    "",
    "## Operating Goal",
    "",
    "Prepare the first eBay MVP batch from products that already showed marketplace fit in prior research, while avoiding Etsy-specific handmade positioning.",
    "",
    "## Launch Gate",
    "",
    "- Do not claim handmade, artisan-made, custom-made, locally made, or certified unless verified.",
    "- Verify item location, handling time, returns, dimensions, voltage/wattage, bulb base, and supplier shipping before publishing.",
    "- Confirm gross margin after item cost, shipping, eBay fees, payment fees, and return reserve.",
    "- Prefer simple variants and 6+ images for the first batch.",
    "",
    "## Candidates",
    "",
    "| Rank | eBay Gate | Status | Product | Type | Price | Images | Variants | Source | Product ID |",
    "| ---: | ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- |",
  ];

  selected.forEach((candidate, index) => {
    lines.push(`| ${index + 1} | ${candidate.ebayGate.score} | ${candidate.ebayGate.status} | ${escapeCell(candidate.title)} | ${escapeCell(candidate.kind)} | ${candidate.price == null ? "" : `$${candidate.price.toFixed(2)}`} | ${candidate.imageCount} | ${candidate.variantCount} | ${escapeCell(candidate.sourceReport)} | ${candidate.id} |`);
  });

  lines.push("", "## Review Notes", "");
  selected.forEach((candidate, index) => {
    const notes = [...candidate.ebayGate.blockers, ...candidate.ebayGate.notes];
    lines.push(`### ${index + 1}. ${candidate.title}`);
    lines.push("");
    lines.push(`- Product ID: ${candidate.id}`);
    if (candidate.handle) lines.push(`- Handle: ${candidate.handle}`);
    lines.push(`- Gate status: ${candidate.ebayGate.status}`);
    lines.push(`- Next action: ${candidate.ebayGate.status === "ready" ? "Build eBay listing plan and verify margin/specs." : "Resolve blockers before listing."}`);
    if (notes.length) for (const note of notes) lines.push(`- Note: ${note}`);
    lines.push("");
  });

  lines.push("## Next Steps", "");
  lines.push("1. Review the top 15 candidates manually.");
  lines.push("2. Verify supplier cost, shipping time, dimensions, and electrical specs.");
  lines.push("3. Create eBay listing plans for the candidates marked ready.");
  lines.push("4. Publish manually or add API publishing after eBay account policies/OAuth are configured.");

  return lines;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

async function main() {
  const args = parseArgs(process.argv);
  const allCandidates = readCandidates();
  const selected = selectCandidates(allCandidates, args);
  const reports = writeReports(selected, allCandidates, args);
  console.log(JSON.stringify({
    scanned: allCandidates.length,
    selected: selected.length,
    operations: path.relative(REPO_ROOT, reports.operationsPath),
    markdown: path.relative(REPO_ROOT, reports.mdPath),
    json: path.relative(REPO_ROOT, reports.jsonPath),
    top: selected.slice(0, 5).map((candidate) => ({
      ebayGate: candidate.ebayGate.score,
      status: candidate.ebayGate.status,
      title: candidate.title,
      price: candidate.price,
      imageCount: candidate.imageCount,
      variantCount: candidate.variantCount,
      id: candidate.id,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});