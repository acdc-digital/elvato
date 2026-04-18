#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PRODUCT_ID = process.argv[2] || "CJSN1233564";
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const CDP_URL = "http://127.0.0.1:9222";
const PRODUCT_URL = `https://www.cjdropshipping.com/product/-p-${PRODUCT_ID}.html`;

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

async function ensureChrome(chromium) {
  try {
    return { browser: await connectChrome(chromium), launched: false };
  } catch {
    await launchChrome();
    for (let i = 0; i < 20; i++) {
      try {
        return { browser: await connectChrome(chromium), launched: true };
      } catch {
        await sleep(500);
      }
    }
    throw new Error("Could not connect to Chrome on 9222");
  }
}

const chromium = await getPlaywright();
const { browser, launched } = await ensureChrome(chromium);
const context = browser.contexts()[0];
if (!context) throw new Error("No Chrome context available");
const page = context.pages()[0] ?? await context.newPage();

console.log(`Using product: ${PRODUCT_ID}`);
console.log(`Using page: ${PRODUCT_URL}`);

await page.goto(PRODUCT_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
await sleep(4000);

console.log(`Current URL: ${page.url()}`);
console.log(`Title: ${await page.title()}`);

const info = await page.evaluate(() => {
  const bySel = (sel) => Array.from(document.querySelectorAll(sel));
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const summarize = (els) => els.slice(0, 50).map((el) => ({
    tag: el.tagName,
    text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
    cls: typeof el.className === "string" ? el.className.slice(0, 160) : "",
    id: el.id || "",
    placeholder: el.getAttribute?.("placeholder") || "",
    type: el.getAttribute?.("type") || "",
    href: el.getAttribute?.("href") || "",
    visible: visible(el),
  }));

  return {
    textareas: summarize(bySel("textarea")),
    textInputs: summarize(bySel("input[type='text'], input:not([type])")),
    buttons: summarize(bySel("button, [role='button'], a, div, span").filter((el) => {
      const text = (el.textContent || "").trim();
      if (!text) return false;
      return /q&a|question|ask|merchant|comment|submit|send/i.test(text) || /qa|ask|comment|question|merchant/i.test(el.className || "");
    })),
    tabs: summarize(bySel("[class*='tab'], [role='tab'], [class*='comment'], [class*='question'], [class*='qa'], [class*='ask'], [class*='merchant']")),
    iframes: summarize(bySel("iframe")),
    contentEditable: summarize(bySel("[contenteditable='true']")),
  };
});

console.log("\n=== TEXTAREAS ===");
console.log(JSON.stringify(info.textareas, null, 2));
console.log("\n=== TEXT INPUTS ===");
console.log(JSON.stringify(info.textInputs, null, 2));
console.log("\n=== BUTTONS / LINKS / CANDIDATES ===");
console.log(JSON.stringify(info.buttons, null, 2));
console.log("\n=== TABS / QA-RELATED ===");
console.log(JSON.stringify(info.tabs, null, 2));
console.log("\n=== IFRAMES ===");
console.log(JSON.stringify(info.iframes, null, 2));
console.log("\n=== CONTENTEDITABLE ===");
console.log(JSON.stringify(info.contentEditable, null, 2));

const screenshot = path.join(ROOT, "scripts", "debug", "_tmp_submit_dom.png");
await page.screenshot({ path: screenshot, fullPage: false });
console.log(`\nScreenshot: ${screenshot}`);

const htmlPath = path.join(ROOT, "scripts", "debug", "_tmp_submit_dom.html");
fs.writeFileSync(htmlPath, await page.content(), "utf8");
console.log(`HTML dump: ${htmlPath}`);

if (launched) {
  await browser.close().catch(() => {});
}
