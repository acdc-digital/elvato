#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const CDP_URL = "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sku = process.argv[2] || "CJSN1390728";
const cjProductId = process.argv[3] || "1476745623486205952";
const nameEn = process.argv.slice(4).join(" ") || "Creativity Living Room Bedroom Bedside Aisle Lamp";

function slugifyProductName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function getPlaywright() {
  const candidates = [
    "playwright",
    pathToFileURL(path.join(ROOT, "storefront", "node_modules", "playwright", "index.js")).href,
  ];
  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch {}
  }
  throw new Error("Playwright not found");
}

async function launchChrome() {
  await new Promise((resolve, reject) => {
    const proc = spawn("open", ["-na", "Google Chrome", "--args", "--remote-debugging-port=9222", `--user-data-dir=${PROFILE_DIR}`, "--no-first-run", "--no-default-browser-check"], { stdio: "ignore" });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`open exited ${code}`))));
    proc.on("error", reject);
  });
}

async function connectChrome(chromium) {
  return chromium.connectOverCDP(CDP_URL);
}

async function ensureBrowser(chromium) {
  try {
    return await connectChrome(chromium);
  } catch {
    await launchChrome();
    for (let i = 0; i < 20; i++) {
      try {
        return await connectChrome(chromium);
      } catch {
        await sleep(500);
      }
    }
  }
  throw new Error("Could not connect to Chrome");
}

const chromium = await getPlaywright();
const browser = await ensureBrowser(chromium);
const context = browser.contexts()[0];
const page = context.pages()[0] ?? await context.newPage();

const slug = slugifyProductName(nameEn);
const directUrl = `https://www.cjdropshipping.com/product/${slug}-p-${cjProductId}.html`;
await page.goto(directUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
await sleep(4000);

if (page.url().includes('/search/') && sku) {
  const firstProductLink = page.locator('a[href*="/product/"]').first();
  if (await firstProductLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstProductLink.click();
    await page.waitForURL(/\/product\//, { timeout: 15000 }).catch(() => {});
    await sleep(3000);
  }
}

const merchantTabCandidates = [
  'text="Merchant Comment"',
  'text="Q&A"',
  'text="Ask a Question"',
  '[class*="merchant"]',
  '[class*="comment"]',
  '[class*="qa"]',
];

for (const selector of merchantTabCandidates) {
  const loc = page.locator(selector).first();
  if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log(`Clicking tab candidate: ${selector}`);
    await loc.click().catch(() => {});
    await sleep(2000);
    break;
  }
}

const data = await page.evaluate(() => {
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const summarize = (els) => els.slice(0, 80).map((el) => ({
    tag: el.tagName,
    text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160),
    cls: typeof el.className === 'string' ? el.className.slice(0, 200) : '',
    id: el.id || '',
    placeholder: el.getAttribute?.('placeholder') || '',
    type: el.getAttribute?.('type') || '',
    role: el.getAttribute?.('role') || '',
    visible: visible(el),
  }));

  return {
    url: location.href,
    title: document.title,
    textareas: summarize(Array.from(document.querySelectorAll('textarea'))),
    contentEditable: summarize(Array.from(document.querySelectorAll('[contenteditable="true"]'))),
    inputs: summarize(Array.from(document.querySelectorAll('input, textarea'))),
    buttons: summarize(Array.from(document.querySelectorAll('button, a, [role="button"], div, span')).filter((el) => {
      const text = (el.textContent || '').trim();
      return text && /merchant|comment|q&a|question|ask|submit|send|reply/i.test(text + ' ' + (el.className || ''));
    })),
    qaSections: summarize(Array.from(document.querySelectorAll('[class*="merchant"], [class*="comment"], [class*="question"], [class*="ask"], [class*="qa"], [data-testid]'))),
  };
});

console.log(JSON.stringify(data, null, 2));

const screenshot = path.join(ROOT, 'scripts', 'debug', '_tmp_merchant_form.png');
await page.screenshot({ path: screenshot, fullPage: false });
console.log(`Screenshot: ${screenshot}`);

const htmlPath = path.join(ROOT, 'scripts', 'debug', '_tmp_merchant_form.html');
fs.writeFileSync(htmlPath, await page.content(), 'utf8');
console.log(`HTML: ${htmlPath}`);
