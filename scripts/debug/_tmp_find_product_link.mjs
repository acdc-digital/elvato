#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SKU = process.argv[2] || "CJSN1111950";
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const CDP_URL = "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const proc = spawn(
      "open",
      [
        "-na",
        "Google Chrome",
        "--args",
        "--remote-debugging-port=9222",
        `--user-data-dir=${PROFILE_DIR}`,
        "--no-first-run",
        "--no-default-browser-check",
      ],
      { stdio: "ignore" }
    );
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`open exited ${code}`))));
    proc.on("error", reject);
  });
}

async function connectChrome(chromium) {
  return chromium.connectOverCDP(CDP_URL);
}

const chromium = await getPlaywright();
let browser;
try {
  browser = await connectChrome(chromium);
} catch {
  await launchChrome();
  for (let i = 0; i < 20; i++) {
    try {
      browser = await connectChrome(chromium);
      break;
    } catch {
      await sleep(500);
    }
  }
}
if (!browser) throw new Error("Could not connect to Chrome");
const context = browser.contexts()[0];
const page = context.pages()[0] ?? await context.newPage();

await page.goto("https://app.cjdropshipping.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
await sleep(2500);

const search = page.locator('input[placeholder*="Search winning products"], input[placeholder*="keyword"], input[placeholder*="SKU"]').first();
await search.waitFor({ state: "visible", timeout: 15000 });
await search.fill(SKU);
await search.press("Enter");
await sleep(5000);

const result = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  const matches = anchors.filter((a) => /product|detail|sku|item/i.test(a.getAttribute('href') || '') || /product|detail/i.test(a.textContent || ''));
  return {
    url: location.href,
    title: document.title,
    matches: matches.slice(0, 20).map((a) => ({
      href: a.href,
      text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      cls: typeof a.className === 'string' ? a.className.slice(0, 120) : '',
    })),
  };
});

console.log(JSON.stringify(result, null, 2));
