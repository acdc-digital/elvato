#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const CDP_URL = "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sku = process.argv[2] || "CJSN1111950";
const cjProductId = process.argv[3] || "1389458166466613248";
const nameEn = process.argv.slice(4).join(" ") || "Bedside Lamp Wall Lamp Rotary Key Lamp Wall Lamp Background Wall Decoration";

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

const slug = slugifyProductName(nameEn);
const url = `https://www.cjdropshipping.com/product/${slug}-p-${cjProductId}.html`;
console.log(`SKU: ${sku}`);
console.log(`URL: ${url}`);

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await sleep(5000);

const text = await page.locator("body").innerText().catch(() => "");
console.log(`Current URL: ${page.url()}`);
console.log(`Title: ${await page.title()}`);
console.log("--- BODY START ---");
console.log(text.slice(0, 4000));
console.log("--- BODY END ---");
