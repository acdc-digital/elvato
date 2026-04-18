#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PROFILE_DIR = path.join(ROOT, "scripts", ".cj-browser-profile");
const CDP_URL = "http://127.0.0.1:9222";
const PRODUCT_URL =
  process.argv[2] ||
  "https://www.cjdropshipping.com/product/bedside-lamp-wall-lamp-rotary-key--lamp-wall-lamp-background-wall-decoration-p-1389458166466613248.html";

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

async function ensureChrome(chromium) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await chromium.connectOverCDP(CDP_URL);
    } catch {
      if (attempt === 0) {
        await launchChrome();
        await sleep(1500);
      }
    }
  }

  throw new Error("Could not connect to Chrome on 9222");
}

function summarize(entries) {
  return entries.slice(0, 40).map((entry) => ({
    tag: entry.tag,
    text: entry.text,
    cls: entry.cls,
    id: entry.id,
    placeholder: entry.placeholder,
    visible: entry.visible,
  }));
}

const chromium = await getPlaywright();
const browser = await ensureChrome(chromium);
const context = browser.contexts()[0];
if (!context) throw new Error("No Chrome context available");

const page = context.pages()[0] ?? await context.newPage();
await page.goto(PRODUCT_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
await sleep(4000);

const merchantTab = page
  .locator('#descriptionTabsList >> text="Merchant Comment"')
  .or(page.locator('text="Merchant Comment"'))
  .first();

if (await merchantTab.isVisible().catch(() => false)) {
  await merchantTab.click();
  await sleep(1200);
}

const field = page.locator(
  '#description-merchant-comment [contenteditable="true"], #description-merchant-comment [placeholder*="Leave a comment here"], [contenteditable="true"][placeholder*="Leave a comment here"]'
).first();
await field.waitFor({ state: "visible", timeout: 10000 });

const before = await page.evaluate(() => {
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const interesting = Array.from(document.querySelectorAll("button, [role='button'], div, span, a, input, textarea, [contenteditable='true']"))
    .filter((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ");
      const cls = typeof el.className === "string" ? el.className : "";
      const placeholder = el.getAttribute?.("placeholder") || "";
      return /submit|send|comment|reply|publish|post|confirm/i.test(text) ||
        /comment|reply|send|submit|verification/i.test(cls) ||
        /Leave a comment here/i.test(placeholder) ||
        el.id === "vcode";
    })
    .map((el) => ({
      tag: el.tagName,
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      cls: typeof el.className === "string" ? el.className.slice(0, 160) : "",
      id: el.id || "",
      placeholder: el.getAttribute?.("placeholder") || "",
      visible: visible(el),
    }));

  return {
    url: location.href,
    title: document.title,
    activeElement: document.activeElement?.outerHTML?.slice(0, 240) || null,
    interesting,
  };
});

await field.click();
await sleep(300);
await page.keyboard.insertText("tmp automation probe");
await sleep(1200);

const after = await page.evaluate(() => {
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const interesting = Array.from(document.querySelectorAll("button, [role='button'], div, span, a, input, textarea, [contenteditable='true']"))
    .filter((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ");
      const cls = typeof el.className === "string" ? el.className : "";
      const placeholder = el.getAttribute?.("placeholder") || "";
      return /submit|send|comment|reply|publish|post|confirm/i.test(text) ||
        /comment|reply|send|submit|verification/i.test(cls) ||
        /Leave a comment here/i.test(placeholder) ||
        el.id === "vcode";
    })
    .map((el) => ({
      tag: el.tagName,
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      cls: typeof el.className === "string" ? el.className.slice(0, 160) : "",
      id: el.id || "",
      placeholder: el.getAttribute?.("placeholder") || "",
      visible: visible(el),
    }));

  const editor = document.querySelector('#description-merchant-comment [contenteditable="true"]');
  return {
    activeElement: document.activeElement?.outerHTML?.slice(0, 240) || null,
    editorText: editor?.textContent || null,
    interesting,
  };
});

const screenshotPath = path.join(ROOT, "scripts", "debug", "_tmp_probe_comment_flow.png");
await page.screenshot({ path: screenshotPath, fullPage: false });

console.log(JSON.stringify({
  before: { ...before, interesting: summarize(before.interesting) },
  after: { ...after, interesting: summarize(after.interesting) },
  screenshotPath,
}, null, 2));