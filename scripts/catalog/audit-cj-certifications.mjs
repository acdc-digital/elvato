#!/usr/bin/env node

/**
 * CJ Product Compliance Auditor
 *
 * Phase 1 — CJ API (per product):
 *   Fetches product attributes + description HTML.
 *   Extracts ALL certification / listing strings found anywhere in either field.
 *   Writes results to Convex `cjCertifications` table immediately.
 *
 * Phase 2 — Playwright browser scrape (per product, only when needed):
 *   Navigates to https://www.cjdropshipping.com/product/-p-{cjProductId}.html
 *   Scrapes ALL buyer reviews (all pages).
 *   Scrapes ALL merchant Q&A entries.
 *   Re-runs cert regex across scraped text.
 *   Updates Convex record with full scraped data.
 *
 * Phase 3 — Draft questions:
 *   Any product with 0 certifications after both phases gets a `draftQuestion`
 *   field written to Convex. Does NOT auto-post.
 *
 * Phase 4 (optional, --submit-questions):
 *   Playwright logs into your CJ account and posts the draft question
 *   in the Merchant Q&A section for each eligible product.
 *   Only runs records where questionSubmitted=false AND draftQuestion!=null.
 *
 * Usage:
 *   # Scan all products (API + scrape)
 *   node scripts/catalog/audit-cj-certifications.mjs --all
 *
 *   # API only (no browser, much faster)
 *   node scripts/catalog/audit-cj-certifications.mjs --all --no-scrape
 *
 *   # Single product
 *   node scripts/catalog/audit-cj-certifications.mjs --sku CJSN1234567
 *
 *   # Resume from offset
 *   node scripts/catalog/audit-cj-certifications.mjs --all --offset 50
 *
 *   # Limit total to process
 *   node scripts/catalog/audit-cj-certifications.mjs --all --limit 30
 *
 *   # Submit pending draft questions (Option B)
 *   node scripts/catalog/audit-cj-certifications.mjs --submit-questions

 *   # Manual-assisted question submission
 *   node scripts/catalog/audit-cj-certifications.mjs --manual-submit-questions
 *
 *   # Dry run (no Convex writes)
 *   node scripts/catalog/audit-cj-certifications.mjs --all --dry-run
 *
 *   # Write JSON report
 *   node scripts/catalog/audit-cj-certifications.mjs --all --out reports/certifications/scan-$(date +%Y-%m-%d).json
 *
 * Required env vars (auto-loaded from admin/.env):
 *   CJ_API_KEY        — CJ developer API key
 *   CONVEX_URL        — Convex deployment URL (or pass --convex-url)
 *
 * For --submit-questions, also required:
 *   CJ_ACCOUNT_EMAIL  — your CJ account login email
 *   CJ_ACCOUNT_PASSWORD — your CJ account password
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

// =============================================================================
// ENV LOADING
// =============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

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
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULTS = {
  CONVEX_URL:  "https://superb-dotterel-37.convex.cloud",
  API_BATCH:   20,   // products per CJ API batch
  SCRAPE_BATCH: 5,   // products per Playwright session batch
  API_DELAY:   250,  // ms between API calls
  SCRAPE_DELAY: 4000, // ms between Playwright page loads
  SUBMIT_DELAY: 6000, // ms between Q&A submissions
  MAX_REVIEW_PAGES: 20, // max pages of reviews to collect per product
};

const CJ_BASE = "https://developers.cjdropshipping.com";
const CJ_WEB_BASE = "https://www.cjdropshipping.com";

const CJ_TOKEN_CACHE = path.join(ROOT, "scripts", ".cj-token-cache.json");

// Draft question template
const DRAFT_QUESTION_TEMPLATE =
  "Hello! Does this product have any electrical safety or compliance certifications? " +
  "For example: UL, cUL, ETL, CSA, CE, RoHS, CCC, CQC, ENEC, GS, TÜV, PSE, SAA, EAC, " +
  "FCC, ENERGY STAR, DLC, or any IP rating. Please list any certifications that apply. " +
  "Thank you!";

// Cert regex — matches any of these tokens anywhere in text (case-insensitive)
const CERT_PATTERN = new RegExp(
  [
    // North American
    "\\bUL\\b",
    "\\bcUL\\b",
    "\\bcULus\\b",
    "\\bETL\\b",
    "\\bCSA\\b",
    "\\bNRTL\\b",
    "\\bFCC\\b",
    "\\bIC\\b",             // Industry Canada
    "\\bEnergy\\s*Star\\b",
    "\\bDLC\\b",
    "\\bTitle\\s*24\\b",
    // European
    "\\bCE\\b",
    "\\bRoHS\\b",
    "\\bWEEE\\b",
    "\\bREACH\\b",
    "\\bENEC\\b",
    "\\bGS\\b",
    "\\bTUV\\b",
    "T[Üü]V",
    "\\bCB\\b",
    "\\bEAC\\b",
    "\\bVDE\\b",
    "\\bBS\\b",             // British Standard
    // Asia-Pacific
    "\\bCCC\\b",
    "\\bCQC\\b",
    "\\bCNAS\\b",
    "\\bPSE\\b",            // Japan
    "\\bJET\\b",
    "\\bSAA\\b",            // Australia
    "\\bRCM\\b",            // Australia/NZ (formerly SAA/C-tick)
    "\\bKC\\b",             // Korea
    "\\bBIS\\b",            // India
    "\\bSIRIM\\b",          // Malaysia
    "\\bSNI\\b",            // Indonesia
    // International
    "\\bISO\\s*9001\\b",
    "\\bISO\\s*14001\\b",
    // IP ratings
    "IP[0-9X]{2}",
    // ATEX / hazardous locations
    "\\bATEX\\b",
    "\\bIECEx\\b",
  ].join("|"),
  "i"
);

// Same list but capturing all individual matches
const CERT_PATTERN_GLOBAL = new RegExp(CERT_PATTERN.source, "gi");

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs(argv) {
  const args = {
    all: false,
    sku: null,
    offset: 0,
    limit: Infinity,
    noScrape: false,
    submitQuestions: false,
    manualSubmitQuestions: false,
    dryRun: false,
    out: null,
    convexUrl: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all")               { args.all = true; continue; }
    if (arg === "--no-scrape")         { args.noScrape = true; continue; }
    if (arg === "--dry-run")           { args.dryRun = true; continue; }
    if (arg === "--submit-questions")  { args.submitQuestions = true; continue; }
    if (arg === "--manual-submit-questions") { args.manualSubmitQuestions = true; continue; }
    if (arg === "--sku")               { args.sku = argv[++i]; continue; }
    if (arg === "--offset")            { args.offset = parseInt(argv[++i], 10); continue; }
    if (arg === "--limit")             { args.limit = parseInt(argv[++i], 10); continue; }
    if (arg === "--out")               { args.out = argv[++i]; continue; }
    if (arg === "--convex-url")        { args.convexUrl = argv[++i]; continue; }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.all && !args.sku && !args.submitQuestions && !args.manualSubmitQuestions) {
    throw new Error("Specify --all, --sku <SKU>, --submit-questions, or --manual-submit-questions");
  }

  return args;
}

// =============================================================================
// UTILITIES
// =============================================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function openUrl(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn("open", [url], { stdio: "ignore" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to open browser (code ${code})`));
    });
    proc.on("error", reject);
  });
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn("pbcopy", [], { stdio: ["pipe", "ignore", "ignore"] });
    proc.stdin.end(text);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to copy text to clipboard (code ${code})`));
    });
    proc.on("error", reject);
  });
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractCerts(text) {
  const raw = (text || "").match(CERT_PATTERN_GLOBAL) || [];
  // Deduplicate, normalise to uppercase
  return [...new Set(raw.map((c) => c.trim().toUpperCase()))].sort();
}

function log(msg) {
  process.stdout.write(msg + "\n");
}

function progress(msg) {
  process.stdout.write(`  ${msg}\r`);
}

// =============================================================================
// CJ API
// =============================================================================

let cjAccessToken = null;

function loadCachedCjToken() {
  try {
    if (!fs.existsSync(CJ_TOKEN_CACHE)) return null;
    const cached = JSON.parse(fs.readFileSync(CJ_TOKEN_CACHE, "utf-8"));
    if (Date.now() - cached.ts < 23 * 60 * 60 * 1000) return cached.token;
  } catch { /* ignore */ }
  return null;
}

function saveCjTokenCache(token) {
  try { fs.writeFileSync(CJ_TOKEN_CACHE, JSON.stringify({ token, ts: Date.now() })); } catch { /* ignore */ }
}

async function ensureCjToken() {
  if (cjAccessToken) return cjAccessToken;
  const cached = loadCachedCjToken();
  if (cached) { cjAccessToken = cached; return cached; }
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY not set");
  const res = await fetch(`${CJ_BASE}/api2.0/v1/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed (${data.code}): ${data.message}`);
  }
  cjAccessToken = data.data.accessToken;
  saveCjTokenCache(cjAccessToken);
  return cjAccessToken;
}

async function cjGet(endpoint) {
  const token = await ensureCjToken();
  const res = await fetch(`${CJ_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
  });
  const data = await res.json();
  if (data.code === 1600001 || data.code === 1600002) {
    // Token expired — invalidate and retry once
    cjAccessToken = null;
    saveCjTokenCache(null);
    const newToken = await ensureCjToken();
    const retry = await fetch(`${CJ_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", "CJ-Access-Token": newToken },
    });
    return retry.json();
  }
  return data;
}

/**
 * Fetch full product detail from CJ API.
 * Returns { attributes: [], descriptionHtml: "" } or throws on error.
 */
async function fetchCjProductDetail(productSku) {
  const data = await cjGet(
    `/api2.0/v1/product/query?productSku=${encodeURIComponent(productSku)}`
  );
  if (!data.result || !data.data) {
    throw new Error(`CJ API error (${data.code}): ${data.message}`);
  }
  const product = data.data;
  return {
    // productAttributes is an array like [{ nameEn: "Certification", valuEn: "UL, CE" }]
    attributes:      Array.isArray(product.productAttributes) ? product.productAttributes : [],
    descriptionHtml: product.description || "",
    cjProductId:     product.productId || "",
    nameEn:          product.productNameEn || product.nameEn || "",
  };
}

// =============================================================================
// CERT EXTRACTION (API phase)
// =============================================================================

function extractCertsFromApiResult(attributes, descriptionHtml) {
  const sources = [];
  const certSets = [];

  // 1. Check attribute key/value pairs
  const attrText = attributes
    .map((a) => `${a.nameEn || a.name || ""} ${a.valuEn || a.value || ""}`)
    .join(" ");
  const attrCerts = extractCerts(attrText);
  if (attrCerts.length > 0) {
    sources.push("api_attributes");
    certSets.push(...attrCerts);
  }

  // 2. Scan description HTML (strip tags first, then match)
  const descPlain = stripHtml(descriptionHtml);
  const descCerts = extractCerts(descPlain);
  if (descCerts.length > 0) {
    sources.push("api_description");
    certSets.push(...descCerts);
  }

  return {
    listings: [...new Set(certSets)].sort(),
    sources,
  };
}

// =============================================================================
// PLAYWRIGHT SCRAPING (Phase 2)
// =============================================================================

/**
 * Lazily import Playwright only when needed.
 * Searches the storefront node_modules as a fallback since Playwright is
 * installed there rather than at the project root.
 */
async function getPlaywright() {
  const candidates = [
    "playwright",
    pathToFileURL(
      path.join(ROOT, "storefront", "node_modules", "playwright", "index.js")
    ).href,
  ];

  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch { /* try next */ }
  }

  throw new Error(
    "Playwright not found. Run: cd storefront && npm install -D playwright && npx playwright install chromium"
  );
}

function slugifyProductName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function cjProductPageUrl({ sku, cjProductId, nameEn }) {
  const slug = slugifyProductName(nameEn);
  if (slug && cjProductId) {
    return `${CJ_WEB_BASE}/product/${slug}-p-${cjProductId}.html`;
  }
  if (sku) {
    return `${CJ_WEB_BASE}/product/-p-${sku}.html`;
  }
  if (cjProductId) {
    return `${CJ_WEB_BASE}/product/-p-${cjProductId}.html`;
  }
  throw new Error("Missing CJ product identifiers");
}

async function gotoCjProductPage(page, { sku, cjProductId, nameEn }) {
  const directUrl = cjProductPageUrl({ sku, cjProductId, nameEn });
  await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await sleep(2500);

  if (page.url().includes("/search/") && sku) {
    const firstProductLink = page.locator('a[href*="/product/"]').first();
    if (await firstProductLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProductLink.click();
      await page.waitForURL(/\/product\//, { timeout: 15_000 }).catch(() => {});
      await sleep(2000);
    }
  }

  if (page.url().includes("/search/")) {
    throw new Error("Could not resolve CJ search results to a product detail page");
  }

  return page.url();
}

/**
 * Scrape ALL buyer reviews and ALL merchant Q&A from a CJ product page.
 * Returns { buyerReviews, buyerReviewsTotal, buyerRatingSummary, merchantComments, merchantCommentsTotal }
 */
async function scrapeProductPage(browser, { sku, cjProductId, nameEn }) {
  const url = cjProductPageUrl({ sku, cjProductId, nameEn });
  const page = await browser.newPage();
  const result = {
    buyerReviews: [],
    buyerReviewsTotal: 0,
    buyerRatingSummary: null,
    merchantComments: [],
    merchantCommentsTotal: 0,
    scrapedUrl: url,
  };

  try {
    result.scrapedUrl = await gotoCjProductPage(page, { sku, cjProductId, nameEn });
    await sleep(1500); // let JS render

    // ── BUYER REVIEWS ──────────────────────────────────────────────────────
    try {
      // Click the Reviews tab if present
      const reviewTab = page.locator('text="Reviews"').first();
      if (await reviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reviewTab.click();
        await sleep(1500);
      }

      // Rating summary
      result.buyerRatingSummary = await page.evaluate(() => {
        const avg = document.querySelector(".review-average, .rating-score, [class*='average']")?.textContent?.trim();
        const total = document.querySelector(".review-total, [class*='totalReview'], [class*='review-count']")?.textContent?.trim();
        return avg || total ? { avg, total } : null;
      });

      // Collect all review items (paginated)
      let reviewPage = 1;
      let hasMore = true;
      while (hasMore && reviewPage <= DEFAULTS.MAX_REVIEW_PAGES) {
        const items = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              ".review-item, [class*='review-list'] li, [class*='reviewItem'], [class*='review_item']"
            )
          ).map((el) => ({
            rating: el.querySelector("[class*='star'] .active, [class*='rating']")
                       ?.querySelectorAll?.("*").length ?? null,
            author: el.querySelector("[class*='author'], [class*='nickname'], [class*='name']")
                       ?.textContent?.trim() ?? null,
            date:   el.querySelector("[class*='date'], [class*='time']")
                       ?.textContent?.trim() ?? null,
            title:  el.querySelector("[class*='title'], [class*='subject']")
                       ?.textContent?.trim() ?? null,
            text:   el.querySelector(
                         "[class*='content'], [class*='comment'], [class*='desc'], p"
                       )?.textContent?.trim() ?? el.textContent?.trim() ?? "",
            images: Array.from(
                         el.querySelectorAll("img[src]")
                       ).map((img) => img.src).filter((s) => !s.includes("avatar")),
            verified: el.textContent?.includes("Verified") ?? false,
          }));
        });

        result.buyerReviews.push(...items);

        // Try to click "next page" for reviews
        const nextBtn = page.locator(
          "[class*='review'] [class*='next'], [class*='review'] .next-page, [class*='review'] button:has-text('>')"
        ).first();
        const nextEnabled =
          (await nextBtn.isVisible({ timeout: 1500 }).catch(() => false)) &&
          !(await nextBtn.isDisabled().catch(() => true));

        if (!nextEnabled || items.length === 0) {
          hasMore = false;
        } else {
          await nextBtn.click();
          await sleep(1500);
          reviewPage++;
        }
      }

      result.buyerReviewsTotal = result.buyerReviews.length;

      // Try to get the real total count from the page header
      const totalText = await page
        .locator("[class*='review-total'], [class*='reviewCount'], [class*='total-review']")
        .first()
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (totalText) {
        const num = parseInt(totalText.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num)) result.buyerReviewsTotal = num;
      }
    } catch (err) {
      // Reviews section not present or errored — continue silently
      process.stderr.write(`    [reviews] ${err.message}\n`);
    }

    // ── MERCHANT Q&A ───────────────────────────────────────────────────────
    try {
      // Click Q&A / Merchant Comment tab
      const qaTab = page.locator(
        'text="Q&A", text="Merchant Comment", [class*="qa-tab"], [class*="merchant"]'
      ).first();
      if (await qaTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await qaTab.click();
        await sleep(1500);
      }

      const qaCount = await page
        .locator("[class*='qa-count'], [class*='merchantCount'], [class*='qa_count']")
        .first()
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (qaCount) {
        const num = parseInt(qaCount.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num)) result.merchantCommentsTotal = num;
      }

      // Load all Q&A (some pages paginate, others load all)
      let hasMoreQa = true;
      let qaPage = 1;
      while (hasMoreQa && qaPage <= 50) {
        const items = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              "[class*='qa-item'], [class*='merchant-item'], [class*='qa_item'], [class*='question-item']"
            )
          ).map((el) => ({
            question:     el.querySelector("[class*='question'], [class*='ask']")
                             ?.textContent?.trim() ?? "",
            answer:       el.querySelector("[class*='answer'], [class*='reply']")
                             ?.textContent?.trim() ?? null,
            askedBy:      el.querySelector("[class*='asker'], [class*='user']")
                             ?.textContent?.trim() ?? null,
            askedDate:    el.querySelector("[class*='ask-date'], [class*='time']")
                             ?.textContent?.trim() ?? null,
            answeredDate: el.querySelector("[class*='answer-date']")
                             ?.textContent?.trim() ?? null,
          }));
        });

        result.merchantComments.push(...items);

        const nextQaBtn = page.locator(
          "[class*='qa'] [class*='next'], [class*='qa'] button:has-text('>')"
        ).first();
        const nextQaEnabled =
          (await nextQaBtn.isVisible({ timeout: 1500 }).catch(() => false)) &&
          !(await nextQaBtn.isDisabled().catch(() => true));

        if (!nextQaEnabled || items.length === 0) {
          hasMoreQa = false;
        } else {
          await nextQaBtn.click();
          await sleep(1500);
          qaPage++;
        }
      }

      if (result.merchantCommentsTotal === 0) {
        result.merchantCommentsTotal = result.merchantComments.length;
      }
    } catch (err) {
      process.stderr.write(`    [qa] ${err.message}\n`);
    }
  } finally {
    await page.close();
  }

  return result;
}

// Local Chrome profile for automated submission via Chrome DevTools Protocol.
const CJ_BROWSER_PROFILE = path.join(ROOT, "scripts", ".cj-browser-profile");
const CJ_CHROME_CDP_URL = process.env.CJ_CHROME_CDP_URL || "http://127.0.0.1:9222";

async function launchChromeDebugInstance() {
  await new Promise((resolve, reject) => {
    const proc = spawn(
      "open",
      [
        "-na",
        "Google Chrome",
        "--args",
        `--remote-debugging-port=9222`,
        `--user-data-dir=${CJ_BROWSER_PROFILE}`,
        "--no-first-run",
        "--no-default-browser-check",
      ],
      { stdio: "ignore" }
    );
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to launch Google Chrome (code ${code})`));
    });
    proc.on("error", reject);
  });
}

async function connectToChromeDebug(chromium) {
  return chromium.connectOverCDP(CJ_CHROME_CDP_URL);
}

/**
 * Launch or connect to a real Chrome instance and reuse a persistent profile.
 * This avoids Playwright's own browser fingerprint, which Cloudflare often flags.
 * Returns { browser, context, page, shouldCloseBrowser }.
 */
async function launchCjBrowser() {
  const chromium = await getPlaywright();
  let browser = null;
  let shouldCloseBrowser = false;

  try {
    browser = await connectToChromeDebug(chromium);
    log("  ✓ Connected to existing Chrome debug session.");
  } catch {
    log("  Starting Google Chrome for automated submission...");
    await launchChromeDebugInstance();
    shouldCloseBrowser = true;

    let connected = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        browser = await connectToChromeDebug(chromium);
        connected = true;
        break;
      } catch {
        await sleep(500);
      }
    }
    if (!connected) {
      throw new Error("Could not connect to Chrome debug session on http://127.0.0.1:9222");
    }
  }

  const context = browser.contexts()[0];
  if (!context) {
    throw new Error("Chrome debug session has no browser context");
  }

  const page = context.pages()[0] ?? await context.newPage();

  // Check if session is still live
  await page.goto("https://app.cjdropshipping.com/", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await sleep(2000);

  const currentUrl = page.url();
  if (!currentUrl.includes("login")) {
    log("  ✓ Session restored — already logged in.");
    return { browser, context, page, shouldCloseBrowser };
  }

  // Need to log in
  await page.goto("https://app.cjdropshipping.com/login.html", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  log("\n──────────────────────────────────────────────────");
  log("  MANUAL LOGIN REQUIRED");
  log("  A browser window is open at the CJ login page.");
  log("  1. Solve the Cloudflare 'Verify you are human' checkbox");
  log("  2. Log in with your CJ account");
  log("  The script resumes automatically after login.");
  log("  You have 5 minutes.");
  log("──────────────────────────────────────────────────\n");
  await page.waitForURL(
    (url) => !url.href.includes("login"),
    { timeout: 300_000 }
  );
  await sleep(1500);
  log("  ✓ Logged in. Session saved to profile for future runs.\n");
  return { browser, context, page, shouldCloseBrowser };
}

/**
 * Submit a question via Playwright using an already-logged-in page.
 * Returns true on success, throws on failure.
 */
async function submitMerchantQuestion(page, { sku, cjProductId, nameEn, question }) {
  await gotoCjProductPage(page, { sku, cjProductId, nameEn });
  await sleep(4000);

  const readMerchantState = async () => {
    const tabText = await page
      .locator('#descriptionTabsList div, [class*="Description-index__descriptionTabItem"]')
      .filter({ hasText: "Merchant Comment" })
      .first()
      .textContent()
      .catch(() => "");
    const sectionTitle = await page
      .locator('#description-merchant-comment [class*="Comments-index__title"]')
      .first()
      .textContent()
      .catch(() => "");
    const countText = `${tabText || ""} ${sectionTitle || ""}`;
    const countMatch = countText.match(/Merchant Comment\s*\(?\s*(\d+)\s*\)?/i);
    const count = countMatch ? parseInt(countMatch[1], 10) : null;
    const noCommentsVisible = await page
      .locator('#description-merchant-comment [class*="Comments-index__noComments"]')
      .first()
      .isVisible()
      .catch(() => false);

    return { count, noCommentsVisible };
  };

  const pageText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  if (
    pageText.includes("product removed") ||
    pageText.includes("you may post a sourcing request for us to find it for you within 48 hours")
  ) {
    throw new Error("Product page is removed or unavailable on CJ");
  }

  const merchantTab = page
    .locator('#descriptionTabsList div, [class*="Description-index__descriptionTabItem"]')
    .filter({ hasText: "Merchant Comment" })
    .first();
  if (await merchantTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await merchantTab.click({ force: true });
    await sleep(1200);
  }

  const commentSection = page.locator("#description-merchant-comment").first();
  await commentSection.waitFor({ state: "visible", timeout: 10_000 });
  const beforeState = await readMerchantState();
  const normalizedSnippet = question.trim().slice(0, 24).replace(/\s+/g, " ").toLowerCase();
  const existingQuestionVisible = await page
    .locator('#description-merchant-comment')
    .innerText()
    .then((text) => text.toLowerCase().replace(/\s+/g, " ").includes(normalizedSnippet))
    .catch(() => false);
  if (existingQuestionVisible) {
    return true;
  }

  const commentBox = page.locator(
    '#description-merchant-comment [class*="AddComment-index__addCommentsBox"], #description-merchant-comment [class*="AddComment-index__textAreaBox"], #description-merchant-comment [class*="AddComment-index__mask"]'
  ).first();
  if (await commentBox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await commentBox.click({ force: true });
    await sleep(500);
  }

  const editorExists = await page.waitForFunction(
    () => !!document.querySelector('#description-merchant-comment [contenteditable="true"]'),
    { timeout: 5000 }
  ).then(() => true).catch(() => false);

  if (editorExists) {
    const richTextEditor = page.locator('#description-merchant-comment [contenteditable="true"]').first();
    await richTextEditor.waitFor({ state: "attached", timeout: 5000 });
    await richTextEditor.click({ force: true });
    await sleep(300);

    await richTextEditor.evaluate((node, text) => {
      node.focus();
      node.textContent = "";
      node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward", data: null }));
      node.textContent = text;
      node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, question);

    await sleep(600);
  } else {
    const existingQuestionAfterOpen = await page
      .locator('#description-merchant-comment')
      .innerText()
      .then((text) => text.toLowerCase().replace(/\s+/g, " ").includes(normalizedSnippet))
      .catch(() => false);
    if (existingQuestionAfterOpen) {
      return true;
    }

    throw new Error("Merchant comment editor not found on CJ page");
  }

  const submitBtn = page.locator(
    '#description-merchant-comment [class*="submitBtn"]:has-text("Submit"), #description-merchant-comment button:has-text("Submit"), [class*="ask"] button:has-text("Submit")'
  ).first();

  await submitBtn.waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForFunction(
    (element) => {
      if (!element) return false;
      const className = typeof element.className === "string" ? element.className : "";
      const text = (element.textContent || "").trim();
      return text.includes("Submit") && !/disabled/i.test(className);
    },
    await submitBtn.elementHandle(),
    { timeout: 10_000 }
  );

  await submitBtn.click();
  await sleep(2000);

  const verificationRequired = await page
    .locator('#vcode, [class*="VerificationCode"] input[type="text"]')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (verificationRequired) {
    throw new Error("Verification code required after submit");
  }

  const editorCleared = await page
    .locator('#description-merchant-comment [contenteditable="true"]')
    .first()
    .evaluate((node) => (node.textContent || "").trim().length === 0)
    .catch(() => false);
  const submitDisabledAgain = await submitBtn
    .evaluate((node) => /disabled/i.test(typeof node.className === "string" ? node.className : ""))
    .catch(() => false);

  await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {});
  await sleep(2500);

  const merchantTabAfter = page
    .locator('#descriptionTabsList div, [class*="Description-index__descriptionTabItem"]')
    .filter({ hasText: "Merchant Comment" })
    .first();
  if (await merchantTabAfter.isVisible({ timeout: 5000 }).catch(() => false)) {
    await merchantTabAfter.click({ force: true });
    await sleep(1000);
  }

  const afterState = await readMerchantState();
  const textAppeared = await page
    .locator('#description-merchant-comment')
    .innerText()
    .then((text) => text.toLowerCase().replace(/\s+/g, " ").includes(normalizedSnippet))
    .catch(() => false);
  const countIncreased =
    beforeState.count != null && afterState.count != null && afterState.count > beforeState.count;
  const noCommentsCleared = beforeState.noCommentsVisible && !afterState.noCommentsVisible;

  if (!textAppeared && !countIncreased && !noCommentsCleared && !(editorCleared && submitDisabledAgain)) {
    throw new Error("Question may not have submitted — could not verify on page");
  }

  return true;
}

// =============================================================================
// CONVEX CLIENT
// =============================================================================

function buildConvexClient(convexUrl) {
  const url = convexUrl || process.env.CONVEX_URL || DEFAULTS.CONVEX_URL;
  return new ConvexHttpClient(url);
}

async function fetchAllCjProducts(client) {
  // Pull all cjMyProducts — the table stores up to ~500 by default; pass high limit
  const products = await client.query(api.cj.myProducts.getAll, { limit: 5000 });
  return products;
}

// =============================================================================
// RESULTS ACCUMULATOR
// =============================================================================

class Report {
  constructor() {
    this.results = [];
    this.startedAt = new Date().toISOString();
  }
  add(entry) { this.results.push(entry); }
  summary() {
    const withListings    = this.results.filter((r) => r.listings?.length > 0).length;
    const noListings      = this.results.filter((r) => r.listings?.length === 0).length;
    const apiErrors       = this.results.filter((r) => r.scanStatus === "api_error").length;
    const scrapeErrors    = this.results.filter((r) => r.scanStatus === "scrape_error").length;
    return { total: this.results.length, withListings, noListings, apiErrors, scrapeErrors };
  }
  toJson() {
    return JSON.stringify(
      { generatedAt: new Date().toISOString(), startedAt: this.startedAt, summary: this.summary(), results: this.results },
      null,
      2
    );
  }
}

// =============================================================================
// CORE SCAN LOGIC (one product)
// =============================================================================

async function scanProduct({ product, client, browser, noScrape, dryRun }) {
  const sku = product.sku;
  const cjProductId = product.cjProductId;
  const nameEn = product.nameEn;

  const entry = {
    sku,
    cjProductId,
    nameEn,
    listings: [],
    listingsSources: [],
    apiAttributes: [],
    apiDescriptionHtml: "",
    buyerReviews: null,
    buyerReviewsTotal: null,
    buyerRatingSummary: null,
    merchantComments: null,
    merchantCommentsTotal: null,
    draftQuestion: null,
    scanStatus: "ok",
    errorMessage: null,
  };

  // ── PHASE 1: CJ API ──────────────────────────────────────────────────────
  try {
    progress(`[${sku}] Phase 1: CJ API...`);
    const { attributes, descriptionHtml } = await fetchCjProductDetail(sku);
    entry.apiAttributes      = attributes;
    entry.apiDescriptionHtml = descriptionHtml;

    const { listings, sources } = extractCertsFromApiResult(attributes, descriptionHtml);
    entry.listings        = listings;
    entry.listingsSources = sources;
    entry.scanStatus = "partial"; // will upgrade to "ok" after phase 2, or stays "partial" if scraping skipped
  } catch (err) {
    process.stderr.write(`  [${sku}] API error: ${err.message}\n`);
    entry.scanStatus  = "api_error";
    entry.errorMessage = err.message;

    if (!dryRun) {
      await client.mutation(api.cj.certifications.upsert, {
        sku, cjProductId, nameEn,
        listings: [], listingsSources: [],
        scanStatus: "api_error",
        errorMessage: err.message,
      });
    }
    return entry;
  }

  // ── PHASE 2: Playwright scrape ────────────────────────────────────────────
  if (!noScrape && browser) {
    try {
      progress(`[${sku}] Phase 2: Scraping product page...`);
      const scraped = await scrapeProductPage(browser, { sku, cjProductId, nameEn });

      entry.buyerReviews         = scraped.buyerReviews;
      entry.buyerReviewsTotal    = scraped.buyerReviewsTotal;
      entry.buyerRatingSummary   = scraped.buyerRatingSummary;
      entry.merchantComments     = scraped.merchantComments;
      entry.merchantCommentsTotal = scraped.merchantCommentsTotal;

      // Re-run cert extraction over all scraped text
      const allText = [
        ...scraped.buyerReviews.map((r) => r.text || ""),
        ...scraped.merchantComments.map((m) => `${m.question || ""} ${m.answer || ""}`),
      ].join(" ");

      const scrapedCerts = extractCerts(allText);
      if (scrapedCerts.length > 0) {
        entry.listingsSources.push("scrape");
        const merged = [...new Set([...entry.listings, ...scrapedCerts])].sort();
        entry.listings = merged;
      }

      entry.scanStatus = "ok";
    } catch (err) {
      process.stderr.write(`  [${sku}] Scrape error: ${err.message}\n`);
      entry.scanStatus  = "scrape_error";
      entry.errorMessage = err.message;
    }
  } else {
    // Scraping skipped — mark partial
    entry.scanStatus = "partial";
  }

  // ── PHASE 3: Draft question ───────────────────────────────────────────────
  if (entry.listings.length === 0) {
    entry.draftQuestion = DRAFT_QUESTION_TEMPLATE;
  }

  // ── CONVEX WRITE ──────────────────────────────────────────────────────────
  if (!dryRun) {
    try {
      await client.mutation(api.cj.certifications.upsert, {
        sku,
        cjProductId,
        nameEn,
        apiAttributes:      entry.apiAttributes,
        apiDescriptionHtml: entry.apiDescriptionHtml,
        listings:           entry.listings,
        listingsSources:    entry.listingsSources,
        buyerReviews:       entry.buyerReviews ?? undefined,
        buyerReviewsTotal:  entry.buyerReviewsTotal ?? undefined,
        buyerRatingSummary: entry.buyerRatingSummary ?? undefined,
        merchantComments:      entry.merchantComments ?? undefined,
        merchantCommentsTotal: entry.merchantCommentsTotal ?? undefined,
        draftQuestion:      entry.draftQuestion ?? undefined,
        scanStatus:         entry.scanStatus,
        errorMessage:       entry.errorMessage ?? undefined,
      });
    } catch (err) {
      process.stderr.write(`  [${sku}] Convex write error: ${err.message}\n`);
    }
  }

  return entry;
}

// =============================================================================
// SUBMIT QUESTIONS MODE
// =============================================================================

async function runSubmitQuestions({ client, dryRun, sku, offset = 0, limit = Infinity }) {
  log("\n=== SUBMIT QUESTIONS MODE ===\n");

  let browser = null;
  let context = null;
  let shouldCloseBrowser = false;
  try {
    const pending = await client.query(api.cj.certifications.getNeedingQuestions, {});
    const filteredPending = pending
      .filter((record) => !sku || record.sku === sku)
      .slice(offset, Number.isFinite(limit) ? offset + limit : undefined);
    log(`Found ${pending.length} products with pending draft questions.`);
    log(`Processing ${filteredPending.length} product(s).\n`);

    if (filteredPending.length === 0) {
      log("Nothing to submit.");
      return;
    }

    if (!sku) {
      const queueStart = offset + 1;
      const queueEnd = offset + filteredPending.length;
      log(`Queue window: ${queueStart}-${queueEnd} of ${pending.length} pending products.\n`);
    }

    let submitted = 0;
    let unavailable = 0;
    let failed = 0;

    let loginPage = null;
    if (!dryRun) {
      ({ browser, context, page: loginPage, shouldCloseBrowser } = await launchCjBrowser());
    }

    for (const [index, record] of filteredPending.entries()) {
      const processedCount = index + 1;
      const queuePosition = sku
        ? `${processedCount}/${filteredPending.length}`
        : `${offset + processedCount}/${pending.length}`;

      log(`[${queuePosition}] [${record.sku}] Submitting question...`);
      try {
        if (!dryRun) {
          await submitMerchantQuestion(loginPage, {
            sku: record.sku,
            cjProductId: record.cjProductId,
            nameEn: record.nameEn,
            question: record.draftQuestion,
          });
          await client.mutation(api.cj.certifications.markQuestionSubmitted, { sku: record.sku });
        }
        log(`  ✓ Submitted`);
        submitted++;
      } catch (err) {
        if (/removed or unavailable/i.test(err.message)) {
          process.stderr.write(`  - Skipped: ${err.message}\n`);
          unavailable++;
        } else {
          process.stderr.write(`  ✗ Failed: ${err.message}\n`);
          failed++;
        }
      }
      log(`  Progress: ${processedCount}/${filteredPending.length} processed | Submitted: ${submitted} Unavailable: ${unavailable} Failed: ${failed}`);
      await sleep(DEFAULTS.SUBMIT_DELAY);
    }

    log(`\nDone. Submitted: ${submitted}, Unavailable: ${unavailable}, Failed: ${failed}`);
  } finally {
    if (shouldCloseBrowser && browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function runManualSubmitQuestions({ client, dryRun }) {
  log("\n=== MANUAL SUBMIT QUESTIONS MODE ===\n");

  const pending = await client.query(api.cj.certifications.getNeedingQuestions, {});
  log(`Found ${pending.length} products with pending draft questions.\n`);

  if (pending.length === 0) {
    log("Nothing to submit.");
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let submitted = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const [index, record] of pending.entries()) {
      const publicUrl = cjProductPageUrl(record.cjProductId);
      log(`\n[${index + 1}/${pending.length}] [${record.sku}] ${record.nameEn || "(no product name)"}`);
      log(`Product page: ${publicUrl}`);
      log(`Question:\n${record.draftQuestion}\n`);

      try {
        await copyToClipboard(record.draftQuestion);
        log("  Copied draft question to clipboard.");
      } catch (err) {
        log(`  Clipboard copy failed: ${err.message}`);
      }

      try {
        await openUrl(publicUrl);
        log("  Opened product page in your default browser.");
      } catch (err) {
        log(`  Failed to open browser automatically: ${err.message}`);
      }

      log("  Submit the question manually, then enter:");
      log("    y = mark submitted");
      log("    s = skip for now");
      log("    q = quit");

      while (true) {
        const answer = (await rl.question("> ")).trim().toLowerCase();
        if (answer === "q") {
          log(`\nStopped early. Submitted: ${submitted}, Skipped: ${skipped}, Failed: ${failed}`);
          return;
        }
        if (answer === "s") {
          skipped++;
          log(`  Progress: ${index + 1}/${pending.length} reviewed | Submitted: ${submitted} Skipped: ${skipped} Failed: ${failed}`);
          break;
        }
        if (answer === "y") {
          try {
            if (!dryRun) {
              await client.mutation(api.cj.certifications.markQuestionSubmitted, { sku: record.sku });
            }
            submitted++;
            log("  ✓ Marked submitted");
          } catch (err) {
            failed++;
            log(`  ✗ Failed to update Convex: ${err.message}`);
          }
          log(`  Progress: ${index + 1}/${pending.length} reviewed | Submitted: ${submitted} Skipped: ${skipped} Failed: ${failed}`);
          break;
        }
        log("  Enter y, s, or q.");
      }
    }
  } finally {
    rl.close();
  }

  log(`\nDone. Submitted: ${submitted}, Skipped: ${skipped}, Failed: ${failed}`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = parseArgs(process.argv);
  const client = buildConvexClient(args.convexUrl);

  // ── SUBMIT QUESTIONS mode — short-circuit ─────────────────────────────────
  if (args.submitQuestions) {
    await runSubmitQuestions({
      client,
      dryRun: args.dryRun,
      sku: args.sku,
      offset: args.offset,
      limit: args.limit,
    });
    return;
  }

  if (args.manualSubmitQuestions) {
    await runManualSubmitQuestions({ client, dryRun: args.dryRun });
    return;
  }

  // ── Fetch product list ────────────────────────────────────────────────────
  log("Fetching product list from Convex...");
  let products = await fetchAllCjProducts(client);

  if (args.sku) {
    products = products.filter((p) => p.sku === args.sku);
    if (products.length === 0) throw new Error(`SKU not found in Convex: ${args.sku}`);
  }

  // Apply offset + limit
  products = products.slice(args.offset, args.offset + args.limit);
  log(`Processing ${products.length} products (offset ${args.offset}).\n`);

  if (args.dryRun) log("DRY RUN — no Convex writes.\n");
  if (args.noScrape) log("--no-scrape: skipping Playwright phase.\n");

  // ── Launch Playwright if needed ───────────────────────────────────────────
  let browser = null;
  if (!args.noScrape) {
    try {
      const chromium = await getPlaywright();
      browser = await chromium.launch({ headless: true });
      log("Playwright browser ready.\n");
    } catch (err) {
      process.stderr.write(`WARNING: ${err.message}\nFalling back to API-only mode.\n`);
      args.noScrape = true;
    }
  }

  const report = new Report();

  try {
    // Process in batches
    const batchSize = args.noScrape ? DEFAULTS.API_BATCH : DEFAULTS.SCRAPE_BATCH;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(products.length / batchSize);

      log(`\n── Batch ${batchNum}/${totalBatches} (products ${i + 1}–${i + batch.length}) ──`);

      for (const product of batch) {
        const entry = await scanProduct({
          product, client, browser,
          noScrape: args.noScrape,
          dryRun: args.dryRun,
        });
        report.add(entry);

        const certStr = entry.listings.length > 0
          ? `✓ [${entry.listings.join(", ")}]`
          : (entry.scanStatus === "ok" || entry.scanStatus === "partial") ? "— no certs found" : `✗ ${entry.errorMessage}`;
        log(`  ${entry.sku}  ${certStr}`);

        // Delay between products
        const delay = args.noScrape ? DEFAULTS.API_DELAY : DEFAULTS.SCRAPE_DELAY;
        await sleep(delay);
      }

      // Extra pause between batches if scraping
      if (!args.noScrape && i + batchSize < products.length) {
        log(`  (pausing 5s between batches...)`);
        await sleep(5000);
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = report.summary();
  log(`\n═══ SCAN COMPLETE ═══`);
  log(`Total:           ${summary.total}`);
  log(`With listings:   ${summary.withListings}`);
  log(`No listings:     ${summary.noListings}`);
  log(`API errors:      ${summary.apiErrors}`);
  log(`Scrape errors:   ${summary.scrapeErrors}`);
  log(`Draft questions: ${report.results.filter((r) => r.draftQuestion).length} (awaiting --submit-questions)`);

  // ── Save report ───────────────────────────────────────────────────────────
  if (args.out) {
    const outPath = path.resolve(ROOT, args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, report.toJson());
    log(`\nReport saved → ${outPath}`);
  }
}

main().catch((err) => {
  process.stderr.write(`\nFATAL: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
