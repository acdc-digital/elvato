/**
 * Debug: inspect CJ Q&A form after manual login using persistent browser profile.
 * Session + Cloudflare state is saved to disk — only need to log in once.
 * Usage: node scripts/debug/_tmp_inspect_qa2.mjs
 */

import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { readFileSync } from "fs";

const ROOT = process.cwd();
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const PRODUCT_ID = "CJSN1596277";

// Load env
for (const envFile of ["admin/.env", ".env.local"]) {
  try {
    const content = readFileSync(envFile, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

// Find Playwright
const playwrightPaths = [
  "node_modules/playwright/index.js",
  "storefront/node_modules/playwright/index.js",
];
let chromium;
for (const p of playwrightPaths) {
  if (fs.existsSync(p)) {
    const mod = await import(pathToFileURL(path.resolve(p)).href);
    chromium = mod.chromium || mod.default?.chromium;
    if (chromium) { console.log("Playwright:", p); break; }
  }
}
if (!chromium) throw new Error("Playwright not found");

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Launch persistent context — saves cookies, CF tokens, session between runs
console.log(`\nProfile dir: ${PROFILE_DIR}`);
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1280, height: 900 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  args: ["--disable-blink-features=AutomationControlled"],
});

const page = await context.newPage();

// Check if already logged in to CJ supplier portal
await page.goto("https://app.cjdropshipping.com/", {
  waitUntil: "domcontentloaded",
  timeout: 30_000,
});
await sleep(2000);

if (page.url().includes("login")) {
  await page.goto("https://app.cjdropshipping.com/login.html", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  console.log("\n──────────────────────────────────────────────────");
  console.log("  MANUAL LOGIN REQUIRED");
  console.log("  1. Solve the Cloudflare 'Verify you are human' checkbox");
  console.log("  2. Log in with your CJ account");
  console.log("  Session will be saved for future runs.");
  console.log("  You have 5 minutes.");
  console.log("──────────────────────────────────────────────────\n");
  await page.waitForURL(url => !url.href.includes("login"), { timeout: 300_000 });
  await sleep(2000);
  console.log("  ✓ Logged in!\n");
} else {
  console.log("  ✓ Session restored — already logged in!\n");
}

// ── Try product pages ──────────────────────────────────────────────────────
const candidates = [
  // Supplier portal product pages
  `https://app.cjdropshipping.com/product/${PRODUCT_ID}.html`,
  `https://app.cjdropshipping.com/product/detail.html?productId=${PRODUCT_ID}`,
  `https://app.cjdropshipping.com/product-detail.html?productId=${PRODUCT_ID}`,
  `https://app.cjdropshipping.com/product-detail.html?id=${PRODUCT_ID}`,
  // Public site (may work now with persistent CF state)
  `https://www.cjdropshipping.com/product/-p-${PRODUCT_ID}.html`,
];

let foundUrl = null;
for (const url of candidates) {
  console.log(`\nTrying: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
  } catch (e) {
    console.log(`  ✗ Navigation error: ${e.message.split("\n")[0]}`);
    continue;
  }
  await sleep(3000);

  const currentUrl = page.url();
  const title = await page.title();
  console.log(`  → URL: ${currentUrl.slice(0, 100)}`);
  console.log(`  → Title: ${title.slice(0, 80)}`);

  const hasCF = await page.locator('iframe[src*="cloudflare"], iframe[src*="challenges.cloudflare"]')
    .isVisible({ timeout: 1500 }).catch(() => false);
  if (hasCF) {
    console.log("  ⚠ Cloudflare challenge on this page");
    continue;
  }

  const redirectedToLogin = currentUrl.includes("login");
  if (redirectedToLogin) {
    console.log("  ⚠ Redirected to login");
    continue;
  }

  // Look for Q&A / ask / merchant elements
  const qaEls = await page.evaluate(() => {
    const sel = "[class*='qa'], [class*='ask'], [class*='question'], [class*='comment'], [class*='merchant'], [class*='Answer']";
    return Array.from(document.querySelectorAll(sel)).slice(0, 20).map(e => ({
      tag: e.tagName,
      cls: e.className?.slice(0, 100),
      text: e.textContent?.trim().slice(0, 60),
      visible: e.offsetParent !== null,
    }));
  });
  if (qaEls.length > 0) {
    console.log(`  ✓ Found ${qaEls.length} Q&A-related elements:`);
    console.log(JSON.stringify(qaEls, null, 2));
    foundUrl = currentUrl;
    break;
  }

  // Check all textareas/inputs
  const forms = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("textarea, input[type='text']")).map(e => ({
      tag: e.tagName,
      placeholder: e.getAttribute("placeholder"),
      cls: e.className?.slice(0, 80),
      visible: e.offsetParent !== null,
    }));
  });
  if (forms.length > 0) {
    console.log(`  Found ${forms.length} form inputs:`);
    console.log(JSON.stringify(forms, null, 2));
    foundUrl = currentUrl;
    break;
  }

  console.log("  No Q&A elements or form inputs found");
}

// ── Full inspection of whatever page we landed on ─────────────────────────
if (foundUrl) {
  console.log(`\n\n=== FULL INSPECTION OF: ${foundUrl} ===`);
} else {
  console.log("\n\n=== FULL INSPECTION OF CURRENT PAGE ===");
  console.log("Current URL:", page.url());
}

// All textareas + inputs
console.log("\n── ALL FORM ELEMENTS ──");
const allForms = await page.evaluate(() =>
  Array.from(document.querySelectorAll("textarea, input")).map(e => ({
    tag: e.tagName,
    type: e.getAttribute("type"),
    placeholder: e.getAttribute("placeholder"),
    cls: e.className?.slice(0, 100),
    id: e.id,
    name: e.getAttribute("name"),
    visible: e.offsetParent !== null,
  }))
);
console.log(JSON.stringify(allForms, null, 2));

// All visible buttons
console.log("\n── ALL VISIBLE BUTTONS ──");
const allBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button, [role='button']"))
    .filter(e => e.offsetParent !== null && e.textContent?.trim())
    .map(e => ({
      text: e.textContent?.trim().slice(0, 60),
      cls: e.className?.slice(0, 80),
      type: e.getAttribute("type"),
    }))
);
console.log(JSON.stringify(allBtns, null, 2));

// Tab-like navigation links
console.log("\n── ALL TABS / NAV ITEMS ──");
const tabs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("[class*='tab'], [role='tab'], [class*='nav-item']"))
    .filter(e => e.offsetParent !== null)
    .map(e => ({ tag: e.tagName, cls: e.className?.slice(0, 80), text: e.textContent?.trim().slice(0, 60) }))
);
console.log(JSON.stringify(tabs, null, 2));

// Screenshot
const shot = "scripts/debug/_tmp_qa_screenshot2.png";
await page.screenshot({ path: shot, fullPage: false });
console.log(`\nScreenshot: ${shot}`);

console.log("\n--- Keeping browser open for 90s so you can manually inspect ---");
await sleep(90_000);
await context.close();
