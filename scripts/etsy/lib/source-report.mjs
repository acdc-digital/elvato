/**
 * Shared SOURCES.md report generation for marketplace image folders.
 *
 * Used by both the image asset pipeline (so every processed folder gets a
 * SOURCES.md automatically) and the standalone generate-image-source-reports
 * batch script.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computePricingRecommendation } from "./price.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
export const DEFAULT_REPORT_NAME = "SOURCES.md";

function encodeMarkdownUrl(value) {
  return String(value).replace(/ /g, "%20");
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function markdownLink(label, url) {
  if (!url) return "";
  return `[${escapeCell(label)}](${encodeMarkdownUrl(url)})`;
}

function localLinkFromProductFolder(productDir, localPath) {
  if (!localPath) return "";
  const absolutePath = path.isAbsolute(localPath) ? localPath : path.join(REPO_ROOT, localPath);
  return encodeMarkdownUrl(path.relative(productDir, absolutePath).split(path.sep).join("/"));
}

function domainSummary(items) {
  const counts = new Map();
  for (const item of items) {
    const domain = item.sourceDomain || "unknown";
    counts.set(domain, (counts.get(domain) || 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function sortByRank(items) {
  return [...items].sort((left, right) => (left.rank || 9999) - (right.rank || 9999));
}

function rowForImage(productDir, item, fallbackType) {
  const local = item.localPath ? markdownLink(item.localPath.split("/").at(-1), localLinkFromProductFolder(productDir, item.localPath)) : "";
  const source = markdownLink(item.sourceDomain || "source", item.sourceUrl);
  const image = markdownLink("image url", item.imageUrl);
  const title = escapeCell(item.productTitle || item.altText || "");
  const size = [item.width && item.height ? `${item.width}x${item.height}` : "", item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : ""].filter(Boolean).join(" / ");
  const score = item.score === undefined ? "" : String(item.score);
  const status = item.approved === true ? "approved" : item.approved === false ? "pending" : fallbackType === "original" ? "original" : "pending";
  const listedPrice = item.listedPrice?.display || "";
  return `| ${item.rank || ""} | ${local} | ${source} | ${image} | ${escapeCell(item.sourceDomain || "")} | ${title} | ${escapeCell(size)} | ${score} | ${status} | ${escapeCell(listedPrice)} |`;
}

function pricingSection(sources) {
  const rec = computePricingRecommendation(sources);
  const lines = ["## Recommended Marketplace Pricing", ""];

  if (!rec.count) {
    lines.push(
      "No competitor prices were extracted from the found source pages, so a data-driven recommendation is not available yet.",
      "Re-run price enrichment (`yarn images:enrich-prices`) after discovery, or set a price manually based on the fixture's materials and size.",
      "",
    );
    return lines;
  }

  const fmt = rec.format;
  lines.push(
    `Derived from ${rec.count} competitor listing${rec.count === 1 ? "" : "s"} found via reverse image search. All prices normalized to USD${rec.count < 3 ? " (small sample — treat as directional)" : ""}.`,
    "",
    "| Competitor Metric | Value |",
    "| --- | ---: |",
    `| Lowest | ${fmt(rec.min)} |`,
    `| 25th percentile | ${fmt(rec.p25)} |`,
    `| Median | ${fmt(rec.median)} |`,
    `| Average | ${fmt(rec.mean)} |`,
    `| 75th percentile | ${fmt(rec.p75)} |`,
    `| Highest | ${fmt(rec.max)} |`,
    `| Sample size | ${rec.count} |`,
    "",
    `### Recommended list price: ${fmt(rec.recommended)}`,
    "",
    `- Competitive range: ${fmt(rec.rangeLow)} – ${fmt(rec.rangeHigh)}`,
    "- Positioned just below the competitor median to undercut comparable listings while preserving margin, anchored above the 25th percentile so outliers don't drag the price to the floor.",
    "- Adjust upward for premium materials (solid brass, mouth-blown glass) or larger fixtures; adjust downward to win the buy-box on high-competition styles.",
    "",
    "#### Reference competitor prices",
    "",
    "| USD | Listed | Currency | Domain |",
    "| ---: | ---: | --- | --- |",
  );
  for (const point of rec.points.slice(0, 20)) {
    lines.push(`| ${fmt(point.usd)} | ${escapeCell(point.display)} | ${escapeCell(point.currency)} | ${escapeCell(point.domain)} |`);
  }
  lines.push("");
  return lines;
}

export function generateReport(productDir, sources) {
  const listing = sources.etsyListing || {};
  const originals = sortByRank(sources.originals || []);
  const found = sortByRank(sources.foundDownloads || sources.discoveredCandidates?.filter((item) => item.localPath) || []);
  const candidates = sortByRank(sources.discoveredCandidates || []);
  const foundDomains = domainSummary(found);
  const candidateDomains = domainSummary(candidates);

  const lines = [
    `# Image Source Review`,
    "",
    `Product: ${listing.title || path.basename(productDir)}`,
    `Etsy listing: ${markdownLink(listing.listingId || "listing", listing.url)}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Counts",
    "",
    `- Original Etsy images: ${originals.length}`,
    `- Found/downloaded images: ${found.length}`,
    `- Discovery candidates: ${candidates.filter((item) => !item.skipped).length}`,
    "",
  ];

  if (foundDomains.length > 0) {
    lines.push("## Found Image Source Domains", "");
    for (const [domain, count] of foundDomains) lines.push(`- ${domain}: ${count}`);
    lines.push("");
  }

  lines.push(
    "## Found Images For Review",
    "",
    "Use the source-page links to inspect seller pages, product costs, article context, and image provenance. These files are downloaded for review and remain pending validation.",
    "",
    "| # | Local File | Source Page | Image URL | Domain | Source Title | Size | Score | Status | Listed Price |",
    "| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | ---: |",
  );
  if (found.length === 0) lines.push("|  |  |  |  |  | No found images downloaded. |  |  |  |  |");
  for (const item of found) lines.push(rowForImage(productDir, item, "found"));
  lines.push("");

  lines.push(
    "## Original Etsy Images",
    "",
    "| # | Local File | Source Page | Image URL | Domain | Alt / Title | Size | Score | Status | Listed Price |",
    "| ---: | --- | --- | --- | --- | --- | --- | ---: | --- | ---: |",
  );
  if (originals.length === 0) lines.push("|  |  |  |  |  | No original images found. |  |  |  |  |");
  for (const item of originals) lines.push(rowForImage(productDir, item, "original"));
  lines.push("");

  if (candidateDomains.length > 0) {
    lines.push("## All Candidate Source Domains", "");
    for (const [domain, count] of candidateDomains) lines.push(`- ${domain}: ${count}`);
    lines.push("");
  }

  lines.push(...pricingSection(sources));

  lines.push(
    "## Review Notes",
    "",
    "- `found_XX` files are review assets, not automatically approved Etsy assets.",
    "- Follow source-page links to compare pricing, product naming, dimensions, seller context, and whether images appear on product pages or editorial/blog pages.",
    "- Use image URL links when the source page blocks direct inspection or lazy-loads images.",
    "- Promote only images that match the exact fixture after visual and metadata review.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * Generate and write a SOURCES.md report for a single product folder.
 * @param {string} productDir Absolute path to the product image folder.
 * @param {object} sources Parsed sources.json contents.
 * @param {string} [reportName] Output filename, defaults to SOURCES.md.
 * @returns {string} Absolute path to the written report.
 */
export function writeSourceReport(productDir, sources, reportName = DEFAULT_REPORT_NAME) {
  const reportPath = path.join(productDir, reportName);
  fs.writeFileSync(reportPath, generateReport(productDir, sources));
  return reportPath;
}
