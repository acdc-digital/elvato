/**
 * Debug: inspect CJ product page Q&A form structure
 * Usage: node scripts/debug/_tmp_inspect_qa.mjs
 * Opens a browser, navigate to a product page, dumps form elements.
 */

import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { readFileSync } from "fs";

// Load env
for (const envFile of [
  "admin/.env",
  ".env.local",
]) {
  try {
    const content = readFileSync(envFile, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const playwrightPaths = [
  "node_modules/playwright/index.js",
  "storefront/node_modules/playwright/index.js",
];

let chromium;
for (const p of playwrightPaths) {
  if (fs.existsSync(p)) {
    const mod = await import(pathToFileURL(path.resolve(p)).href);
    chromium = mod.chromium || mod.default?.chromium;
    if (chromium) { console.log("Playwright found:", p); break; }
  }
}
if (!chromium) throw new Error("Playwright not found");

const PRODUCT_ID = "CJSN1596277";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Step 1: Manual login
console.log("\nOpening CJ supplier portal login...");
await page.goto("https://app.cjdropshipping.com/login.html", {
  waitUntil: "domcontentloaded", timeout: 30_000
});
console.log("  Please log in manually. Waiting up to 3 minutes...");
await page.waitForURL(url => !url.href.includes("login"), { timeout: 180_000 });
await sleep(2000);
console.log("  Logged in!");

// Step 2: Try different product page URL patterns in the supplier portal
const candidates = [
  `https://app.cjdropshipping.com/product/${PRODUCT_ID}.html`,
  `https://app.cjdropshipping.com/product/detail.html?pid=${PRODUCT_ID}`,
  `https://app.cjdropshipping.com/product/detail/${PRODUCT_ID}`,
  `https://www.cjdropshipping.com/product/-p-${PRODUCT_ID}.html`,
];

for (const url of candidates) {
  console.log(`\nTrying: ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
  await sleep(3000);
  const title = await page.title();
  const currentUrl = page.url();
  console.log(`  Title: ${title.slice(0, 80)}`);
  console.log(`  URL: ${currentUrl.slice(0, 100)}`);

  // Check for CF challenge
  const hasCF = await page.locator('iframe[src*="cloudflare"]').isVisible({ timeout: 1000 }).catch(() => false);
  if (hasCF) {
    console.log("  ⚠ Cloudflare challenge detected");
    continue;
  }

  // Check for any Q&A/ask elements
  const qaFound = await page.evaluate(() => {
    const all = document.querySelectorAll("[class*='qa'], [class*='ask'], [class*='question'], [class*='comment-'], [class*='merchant']");
    return Array.from(all).slice(0, 10).map(e => ({ tag: e.tagName, cls: e.className.slice(0, 80), text: e.textContent.trim().slice(0, 50) }));
  });
  if (qaFound.length > 0) {
    console.log("  Q&A elements found:", JSON.stringify(qaFound, null, 2));
    break;
  } else {
    console.log("  No Q&A elements found");
  }
}

// Now do full inspection of current page
console.log("\n\n=== FULL PAGE INSPECTION ===");
console.log("Current URL:", page.url());

// Dump all form-related elements
console.log("\n=== ALL FORM ELEMENTS ON PAGE ===");
const formElements = await page.evaluate(() => {
  const results = [];
  const els = document.querySelectorAll("textarea, input[type='text'], input[type='search'], [contenteditable='true']");
  for (const el of els) {
    results.push({
      tag: el.tagName,
      type: el.getAttribute("type"),
      placeholder: el.getAttribute("placeholder"),
      className: el.className,
      id: el.id,
      name: el.getAttribute("name"),
      visible: el.offsetParent !== null,
    });
  }
  return results;
});
console.log(JSON.stringify(formElements, null, 2));

// Dump all buttons
console.log("\n=== ALL BUTTONS ON PAGE ===");
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("button, [role='button'], a[class*='btn']")).map(el => ({
    text: el.textContent?.trim().slice(0, 60),
    className: el.className?.slice(0, 80),
    type: el.getAttribute("type"),
    visible: el.offsetParent !== null,
  })).filter(b => b.visible && b.text);
});
console.log(JSON.stringify(buttons, null, 2));

// Dump all elements with class containing "qa" or "ask" or "question" or "comment"
console.log("\n=== QA/ASK/QUESTION CLASS ELEMENTS ===");
const qaEls = await page.evaluate(() => {
  const results = [];
  const all = document.querySelectorAll("[class*='qa'], [class*='ask'], [class*='question'], [class*='comment'], [class*='merchant']");
  for (const el of Array.from(all).slice(0, 50)) {
    results.push({
      tag: el.tagName,
      className: el.className?.slice(0, 100),
      text: el.textContent?.trim().slice(0, 80),
      visible: el.offsetParent !== null,
    });
  }
  return results;
});
console.log(JSON.stringify(qaEls, null, 2));

// Take a screenshot
const screenshotPath = "scripts/debug/_tmp_qa_screenshot.png";
await page.screenshot({ path: screenshotPath, fullPage: false });
console.log(`\nScreenshot saved to: ${screenshotPath}`);

console.log("\n--- Press Ctrl+C to close the browser ---");
await new Promise(r => setTimeout(r, 60_000));
await browser.close();
