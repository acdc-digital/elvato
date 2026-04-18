#!/usr/bin/env node

/**
 * CJ Certification Audit — Master Console
 *
 * Interactive orchestrator for the full certification audit pipeline.
 * Prompts you for input at each decision point so you can review results
 * before committing to the next (slower) phase.
 *
 * Usage:
 *   node scripts/catalog/run-certification-audit.mjs
 *
 * Required env vars (auto-loaded from admin/.env):
 *   CJ_API_KEY          — CJ developer API key
 *   CONVEX_URL          — Convex deployment URL (optional, has default)
 *
 * For question submission:
 *   CJ_ACCOUNT_EMAIL    — CJ account login email
 *   CJ_ACCOUNT_PASSWORD — CJ account password
 */

import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const AUDIT_SCRIPT = path.join(__dirname, "audit-cj-certifications.mjs");
const REPORTS_DIR = path.join(ROOT, "reports", "certifications");

fs.mkdirSync(REPORTS_DIR, { recursive: true });

// =============================================================================
// ENV LOADING
// =============================================================================

function loadEnv() {
  const envPaths = [
    path.join(ROOT, "admin", ".env"),
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".agents", "product-listing-analyst", ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

// =============================================================================
// ANSI COLOURS (only when stdout is a TTY)
// =============================================================================

const isTTY = process.stdout.isTTY;
const _c = (code) => (s) => isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
const bold   = _c("1");
const dim    = _c("2");
const green  = _c("32");
const yellow = _c("33");
const red    = _c("31");
const cyan   = _c("36");

function hr(char = "═", width = 56) {
  console.log(dim(char.repeat(width)));
}

// =============================================================================
// READLINE HELPERS
// =============================================================================

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question) {
  return rl.question(question);
}

/** Prompt yes/no. Returns boolean. */
async function confirm(question, defaultYes = false) {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const raw = (await ask(`${question} ${hint}: `)).trim().toLowerCase();
  if (!raw) return defaultYes;
  return raw.startsWith("y");
}

/** Pick one option from a menu. Returns the key string. */
async function menu(title, options) {
  console.log("\n" + bold(title));
  for (const { key, label, desc } of options) {
    console.log(`  ${cyan(key)}) ${label}`);
    if (desc) console.log(`     ${dim(desc)}`);
  }
  const keys = options.map((o) => o.key);
  while (true) {
    const raw = (await ask("\n> ")).trim().toLowerCase();
    if (keys.includes(raw)) return raw;
    console.log(dim(`  Enter one of: ${keys.join(", ")}`));
  }
}

/** Ask for a positive integer with a default. */
async function askNumber(question, defaultVal, min = 1) {
  while (true) {
    const raw = (await ask(`${question} [${defaultVal}]: `)).trim();
    if (!raw) return defaultVal;
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= min) return n;
    console.log(dim(`  Please enter an integer ≥ ${min}.`));
  }
}

function formatTs() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

// =============================================================================
// SUBPROCESS RUNNER
// =============================================================================

/** Run the audit script with given args, streaming output live. */
function runAudit(args) {
  return new Promise((resolve, reject) => {
    console.log();
    console.log(dim(`$ node audit-cj-certifications.mjs ${args.join(" ")}`));
    console.log();

    const proc = spawn("node", [AUDIT_SCRIPT, ...args], {
      stdio: "inherit",
      env: process.env,
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Audit script exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

// =============================================================================
// REPORT HELPERS
// =============================================================================

function readReport(outPath) {
  try {
    if (!fs.existsSync(outPath)) return null;
    return JSON.parse(fs.readFileSync(outPath, "utf-8"));
  } catch {
    return null;
  }
}

function showScanSummary(report) {
  const s = report.summary;
  const draftCount = report.results.filter((r) => r.draftQuestion).length;

  console.log();
  hr("─");
  console.log(bold("SCAN SUMMARY"));
  hr("─");
  console.log(`  Total scanned:    ${bold(s.total)}`);
  console.log(`  With certs:       ${green(bold(s.withListings))}`);
  console.log(`  No certs found:   ${s.noListings > 0 ? yellow(bold(s.noListings)) : s.noListings}`);
  if (s.apiErrors > 0)    console.log(`  API errors:       ${red(s.apiErrors)}`);
  if (s.scrapeErrors > 0) console.log(`  Scrape errors:    ${red(s.scrapeErrors)}`);
  if (draftCount > 0)     console.log(`  Draft questions:  ${yellow(bold(draftCount))} products queued`);
  hr("─");
}

function showDraftQuestions(results) {
  const drafts = results.filter((r) => r.draftQuestion && !r.questionSubmitted);
  if (drafts.length === 0) {
    console.log(green("\n  No pending draft questions."));
    return 0;
  }

  console.log();
  console.log(bold(`  Draft questions (${drafts.length} products):`));
  console.log();

  for (const r of drafts) {
    console.log(`  ${cyan(r.sku)}  ${r.nameEn || dim("(no name)")}`);
    console.log(`    ${dim(r.draftQuestion)}`);
    console.log();
  }

  return drafts.length;
}

// =============================================================================
// SCOPE SELECTOR
// =============================================================================

async function selectScope() {
  const choice = await menu("Scope:", [
    { key: "a", label: "All products" },
    { key: "l", label: "First N products" },
    { key: "r", label: "Range (offset + limit)" },
  ]);

  if (choice === "a") return {};
  if (choice === "l") {
    const limit = await askNumber("  How many?", 20);
    return { limit };
  }
  const offset = await askNumber("  Start at offset", 0, 0);
  const limit  = await askNumber("  How many?", 20);
  return { offset, limit };
}

function addScopeArgs(args, scope) {
  if (scope.offset != null && scope.offset > 0) args.push("--offset", String(scope.offset));
  if (scope.limit  != null)                     args.push("--limit",  String(scope.limit));
}

// =============================================================================
// FLOWS
// =============================================================================

// ── Flow: API-only scan ───────────────────────────────────────────────────────
async function flowApiOnly(dryRun) {
  const scope = await selectScope();
  const ts = formatTs();
  const outPath = path.join(REPORTS_DIR, `api-scan-${ts}.json`);

  const args = ["--all", "--no-scrape", "--out", outPath];
  addScopeArgs(args, scope);
  if (dryRun) args.push("--dry-run");

  console.log(`\nReport: ${dim(outPath)}`);

  await runAudit(args);

  const report = readReport(outPath);
  if (!report) { console.log(yellow("\nWarning: could not read report file.")); return; }

  showScanSummary(report);
  await offerQuestionFlow(report, dryRun);
}

// ── Flow: Full scan (API + Playwright) ────────────────────────────────────────
async function flowFullScan(dryRun) {
  const scope = await selectScope();
  const ts = formatTs();
  const outPath = path.join(REPORTS_DIR, `full-scan-${ts}.json`);

  console.log(yellow("\nNote: Playwright scraping takes ~4s per product plus batch pauses."));
  const go = await confirm("Start full scan?", true);
  if (!go) { console.log("Cancelled."); return; }

  const args = ["--all", "--out", outPath];
  addScopeArgs(args, scope);
  if (dryRun) args.push("--dry-run");

  console.log(`\nReport: ${dim(outPath)}`);

  await runAudit(args);

  const report = readReport(outPath);
  if (!report) { console.log(yellow("\nWarning: could not read report file.")); return; }

  showScanSummary(report);
  await offerQuestionFlow(report, dryRun);
}

// ── Flow: Full process (API → approval → scrape → approval → submit) ──────────
async function flowFullProcess(dryRun) {
  console.log(
    "\n" + bold("FULL PROCESS") +
    dim(": API scan → review → Playwright scrape → review questions → optionally submit")
  );

  const scope = await selectScope();
  const ts = formatTs();
  const apiOutPath  = path.join(REPORTS_DIR, `api-scan-${ts}.json`);
  const fullOutPath = path.join(REPORTS_DIR, `full-scan-${ts}.json`);

  // ── STEP 1: API scan ────────────────────────────────────────────────────────
  console.log("\n" + bold("Step 1 / 3: API Scan") + dim(" (no browser — fast)"));
  hr("─");

  const apiArgs = ["--all", "--no-scrape", "--out", apiOutPath];
  addScopeArgs(apiArgs, scope);
  if (dryRun) apiArgs.push("--dry-run");

  await runAudit(apiArgs);

  const apiReport = readReport(apiOutPath);
  if (apiReport) {
    showScanSummary(apiReport);
    const draftCount = apiReport.results.filter((r) => r.draftQuestion).length;
    if (draftCount > 0) {
      const view = await confirm(`\n${draftCount} products have no cert data yet. View the list?`);
      if (view) showDraftQuestions(apiReport.results);
    } else {
      console.log(green("\n✓ API data already shows certifications for all scanned products."));
    }
  }

  // ── STEP 2: Playwright scrape approval ────────────────────────────────────
  console.log();
  hr();
  const doScrape = await confirm(
    bold("\nStep 2 / 3: Playwright Scrape") +
    "\n  Scrapes buyer reviews & merchant Q&A for deeper cert mentions.\n" +
    `  Slower (~4s/product). Proceed?`
  );

  if (!doScrape) {
    console.log(dim("\nSkipped scrape. API results are already saved to Convex."));
    console.log(dim("Re-run this script to do a full scrape or submit questions later."));
    return;
  }

  console.log("\n" + bold("Step 2 / 3: Full Scan") + dim(" (API + Playwright)"));
  hr("─");

  const fullArgs = ["--all", "--out", fullOutPath];
  addScopeArgs(fullArgs, scope);
  if (dryRun) fullArgs.push("--dry-run");

  await runAudit(fullArgs);

  const fullReport = readReport(fullOutPath);
  if (!fullReport) { console.log(yellow("\nWarning: could not read report file.")); return; }

  showScanSummary(fullReport);

  // ── STEP 3: Question review & submission ──────────────────────────────────
  const draftCount = fullReport.results.filter((r) => r.draftQuestion).length;

  if (draftCount === 0) {
    console.log(green("\n✓ All products have at least one certification after the full scan."));
    return;
  }

  console.log("\n" + bold("Step 3 / 3: Draft Questions"));
  hr("─");
  console.log(`\n${yellow(bold(draftCount))} products still show no certifications. Draft questions are ready.`);

  await offerQuestionFlow(fullReport, dryRun);
}

// ── Flow: single SKU ─────────────────────────────────────────────────────────
async function flowSingleSku(dryRun) {
  const sku = (await ask("\n  Enter SKU: ")).trim().toUpperCase();
  if (!sku) { console.log("No SKU entered."); return; }

  const doScrape = await confirm("  Include Playwright scraping?");
  const ts = formatTs();
  const outPath = path.join(REPORTS_DIR, `sku-${sku}-${ts}.json`);

  const args = ["--sku", sku, "--out", outPath];
  if (!doScrape) args.push("--no-scrape");
  if (dryRun)    args.push("--dry-run");

  await runAudit(args);

  const report = readReport(outPath);
  if (!report) { console.log(yellow("\nWarning: could not read report file.")); return; }

  showScanSummary(report);

  const entry = report.results[0];
  if (!entry) return;

  if (entry.listings?.length > 0) {
    console.log(green(`\n  Certifications found: ${entry.listings.join(", ")}`));
  }

  if (entry.draftQuestion && !entry.questionSubmitted) {
    const view = await confirm("\n  No certs found. View draft question?");
    if (view) console.log(`\n  ${dim(entry.draftQuestion)}`);

    const doSubmit = await confirm("\n  Submit this question to the CJ merchant now?");
    if (doSubmit) await flowSubmitQuestions(dryRun);
  }
}

// ── Flow: submit pending questions ───────────────────────────────────────────
async function flowSubmitQuestions(dryRun) {
  console.log();
  console.log(bold("SUBMIT PENDING QUESTIONS"));
  hr("─");

  const hasEmail    = !!process.env.CJ_ACCOUNT_EMAIL;
  const hasPassword = !!process.env.CJ_ACCOUNT_PASSWORD;

  if (!hasEmail || !hasPassword) {
    console.log(red("\n  Missing credentials:"));
    if (!hasEmail)    console.log(red("    CJ_ACCOUNT_EMAIL not set in admin/.env"));
    if (!hasPassword) console.log(red("    CJ_ACCOUNT_PASSWORD not set in admin/.env"));
    console.log(dim("\n  Add these and retry."));
    return;
  }

  const mode = await menu("\nSubmission mode:", [
    {
      key: "m",
      label: "Manual-assisted",
      desc: "Opens each product in your normal browser, copies the question, and asks you to confirm submission.",
    },
    {
      key: "a",
      label: "Automated Chrome",
      desc: "Drives a real Google Chrome session via DevTools and submits questions automatically.",
    },
  ]);

  if (mode === "m") {
    console.log(yellow(
      "\n  The script will open each product page in your default browser and copy\n" +
      "  the drafted question to your clipboard. After you submit it manually,\n" +
      "  confirm in the terminal so Convex is updated."
    ));
  } else {
    console.log(yellow(
      "\n  The script will connect to a real Google Chrome session and try to log into\n" +
      "  your CJ account before posting draft questions automatically."
    ));
  }

  const go = await confirm("\n  Ready to proceed?");
  if (!go) { console.log("Cancelled."); return; }

  const args = [mode === "m" ? "--manual-submit-questions" : "--submit-questions"];
  if (dryRun) args.push("--dry-run");

  await runAudit(args);
}

// ── Flow: view recent reports ─────────────────────────────────────────────────
async function flowStats() {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_tmp"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log(dim("\n  No reports found in reports/certifications/"));
    return;
  }

  const shown = files.slice(0, 8);
  console.log("\n" + bold(`Recent reports (${files.length} total):`));
  console.log();

  for (const [i, f] of shown.entries()) {
    try {
      const r   = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), "utf-8"));
      const s   = r.summary;
      const draftCount = r.results?.filter((x) => x.draftQuestion)?.length ?? 0;
      console.log(`  ${cyan(String(i + 1).padStart(2))}  ${f}`);
      console.log(`      ${s.total} products | ${green(s.withListings)} with certs | ${yellow(s.noListings)} none | ${draftCount} draft questions`);
      console.log(`      generated ${dim(r.generatedAt)}`);
    } catch {
      console.log(`  --  ${f} ${dim("(unreadable)")}`);
    }
    console.log();
  }

  if (files.length > 8) console.log(dim(`  ... and ${files.length - 8} more`));

  const raw = (await ask("  Enter report number to inspect draft questions (or Enter to skip): ")).trim();
  const idx = parseInt(raw, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= shown.length) {
    const report = readReport(path.join(REPORTS_DIR, shown[idx - 1]));
    if (report) showDraftQuestions(report.results);
  }
}

// =============================================================================
// SHARED: offer to view + submit questions after any scan
// =============================================================================

async function offerQuestionFlow(report, dryRun) {
  const draftCount = report.results.filter((r) => r.draftQuestion && !r.questionSubmitted).length;
  if (draftCount === 0) return;

  const view = await confirm(`\n${draftCount} draft questions ready. View them now?`);
  if (view) showDraftQuestions(report.results);

  const doSubmit = await confirm(
    `\nSubmit ${draftCount} questions to CJ merchants?` +
    dim("\n  (This opens a browser. You may need to solve a CAPTCHA.)")
  );

  if (doSubmit) {
    await flowSubmitQuestions(dryRun);
  } else {
    console.log(dim("\nQuestions are saved in Convex. Re-run this script and choose"));
    console.log(dim("'Submit pending questions' whenever you're ready."));
  }
}

// =============================================================================
// PRE-FLIGHT CHECKS
// =============================================================================

function preflight() {
  console.log();
  const issues = [];

  if (!process.env.CJ_API_KEY) {
    issues.push({ fatal: true, msg: "CJ_API_KEY is not set (add to admin/.env)" });
  }
  if (!process.env.CONVEX_URL) {
    console.log(dim("  CONVEX_URL not set — using default https://superb-dotterel-37.convex.cloud"));
  }

  for (const { fatal, msg } of issues) {
    console.log((fatal ? red : yellow)(`  ${fatal ? "✗" : "⚠"}  ${msg}`));
  }

  return issues.filter((i) => i.fatal).length;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  // Banner
  console.log();
  hr();
  console.log(bold("  CJ Certification Audit — Master Console"));
  console.log(dim("  Checks CJ products for compliance certifications"));
  hr();

  const fatalCount = preflight();
  if (fatalCount > 0) {
    console.log(red("\nFatal errors above must be resolved before continuing.\n"));
    rl.close();
    process.exit(1);
  }

  // Dry-run toggle
  const dryRun = await confirm("\nEnable DRY RUN mode? (scans run normally but no Convex writes)", false);
  if (dryRun) console.log(yellow("  Dry run enabled — no database changes will be made."));

  // Main menu
  const choice = await menu("What would you like to do?", [
    {
      key: "1",
      label: bold("Full process"),
      desc: "API scan → review → Playwright scrape → review draft questions → optionally submit",
    },
    {
      key: "2",
      label: "API scan only",
      desc: "Fast (~250ms/product). Reads CJ API attributes & description HTML for cert mentions.",
    },
    {
      key: "3",
      label: "Full scan  (API + Playwright)",
      desc: "Adds browser scraping of buyer reviews & merchant Q&A (~4s/product).",
    },
    {
      key: "4",
      label: "Single SKU",
      desc: "Test one product end-to-end.",
    },
    {
      key: "5",
      label: "Submit pending questions",
      desc: "Post saved draft questions to CJ merchants (requires CJ_ACCOUNT_EMAIL + PASSWORD).",
    },
    {
      key: "6",
      label: "View recent reports",
      desc: "Browse previous scan summaries and draft question lists.",
    },
    {
      key: "q",
      label: "Quit",
    },
  ]);

  if (choice === "q") {
    console.log("\nBye!\n");
    rl.close();
    return;
  }

  try {
    if (choice === "1") await flowFullProcess(dryRun);
    if (choice === "2") await flowApiOnly(dryRun);
    if (choice === "3") await flowFullScan(dryRun);
    if (choice === "4") await flowSingleSku(dryRun);
    if (choice === "5") await flowSubmitQuestions(dryRun);
    if (choice === "6") await flowStats();
  } catch (err) {
    console.log(red(`\nError: ${err.message}`));
    if (process.env.DEBUG) console.error(err.stack);
  }

  console.log();
  hr();
  console.log(dim("  Done. Reports saved in: reports/certifications/"));
  hr();
  console.log();

  rl.close();
}

main().catch((err) => {
  console.error(red(`\nFATAL: ${err.message}`));
  rl.close();
  process.exit(1);
});
