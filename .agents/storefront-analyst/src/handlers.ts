/**
 * Tool execution handlers for the Storefront Analyst Agent.
 * Implements: Brave Search, Playwright screenshots, page analysis, file writing.
 */

import { chromium, type Browser, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

let browser: Browser | null = null;
let page: Page | null = null;
let currentUrl: string = "";

// ─── Browser Lifecycle ──────────────────────────────────────────────

async function ensureBrowser(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  if (!page) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    page = await context.newPage();
  }
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (page) {
    await page.close().catch(() => {});
    page = null;
  }
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

// ─── Brave Search ──────────────────────────────────────────────────

async function braveSearch(
  query: string,
  count: number = 5
): Promise<string> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return JSON.stringify({
      error:
        "BRAVE_SEARCH_API_KEY not set. Add it to .env or pass via environment.",
    });
  }

  const params = new URLSearchParams({
    q: query,
    count: String(Math.min(count, 20)),
  });

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    }
  );

  if (!res.ok) {
    return JSON.stringify({
      error: `Brave Search API error: ${res.status} ${res.statusText}`,
    });
  }

  const data = await res.json();
  const results = (data.web?.results || []).map(
    (r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    })
  );

  return JSON.stringify({ query, results }, null, 2);
}

// ─── Screenshot ────────────────────────────────────────────────────

async function screenshotPage(input: {
  url: string;
  viewport_width?: number;
  viewport_height?: number;
  full_page?: boolean;
  wait_for_selector?: string;
}): Promise<{ base64: string; metadata: string }> {
  const p = await ensureBrowser();

  // Resize viewport if specified
  const width = input.viewport_width || 1280;
  const height = input.viewport_height || 800;
  await p.setViewportSize({ width, height });

  // Navigate if URL changed
  if (currentUrl !== input.url) {
    await p.goto(input.url, { waitUntil: "networkidle", timeout: 30000 });
    currentUrl = input.url;
  }

  if (input.wait_for_selector) {
    await p
      .waitForSelector(input.wait_for_selector, { timeout: 10000 })
      .catch(() => {});
  }

  // Small delay for any animations/lazy loading
  await p.waitForTimeout(1500);

  const buffer = await p.screenshot({
    fullPage: input.full_page || false,
    type: "png",
  });

  const title = await p.title();
  const url = p.url();
  const scrollHeight = await p.evaluate(
    () => document.documentElement.scrollHeight
  );

  return {
    base64: buffer.toString("base64"),
    metadata: JSON.stringify({
      title,
      url,
      viewport: { width, height },
      scrollHeight,
      capturedAt: new Date().toISOString(),
    }),
  };
}

// ─── Scroll + Screenshot ───────────────────────────────────────────

async function scrollAndScreenshot(input: {
  scroll_y: number;
  url: string;
}): Promise<{ base64: string; metadata: string }> {
  const p = await ensureBrowser();

  if (currentUrl !== input.url) {
    await p.goto(input.url, { waitUntil: "networkidle", timeout: 30000 });
    currentUrl = input.url;
  }

  await p.evaluate((y) => window.scrollTo(0, y), input.scroll_y);
  await p.waitForTimeout(1000);

  const buffer = await p.screenshot({ type: "png" });

  const scrollY = await p.evaluate(() => window.scrollY);
  const scrollHeight = await p.evaluate(
    () => document.documentElement.scrollHeight
  );

  return {
    base64: buffer.toString("base64"),
    metadata: JSON.stringify({
      url: p.url(),
      scrollY,
      scrollHeight,
      viewport: await p.viewportSize(),
      capturedAt: new Date().toISOString(),
    }),
  };
}

// ─── Page Info ──────────────────────────────────────────────────────

async function getPageInfo(url: string): Promise<string> {
  const p = await ensureBrowser();

  if (currentUrl !== url) {
    await p.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    currentUrl = url;
  }

  const info = await p.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(
      (h) => ({
        level: parseInt(h.tagName[1]),
        text: (h as HTMLElement).innerText.trim().slice(0, 100),
      })
    );

    const metaDesc =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";
    const metaOg =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") || "";

    const images = document.querySelectorAll("img");
    const imagesWithoutAlt = Array.from(images).filter(
      (img) => !img.alt || img.alt.trim() === ""
    ).length;

    return {
      title: document.title,
      metaDescription: metaDesc,
      ogTitle: metaOg,
      headings,
      linkCount: document.querySelectorAll("a").length,
      imageCount: images.length,
      imagesWithoutAlt,
      scrollHeight: document.documentElement.scrollHeight,
      bodyTextLength: document.body?.innerText?.length || 0,
    };
  });

  return JSON.stringify(info, null, 2);
}

// ─── Page Links ─────────────────────────────────────────────────────

async function getPageLinks(url: string): Promise<string> {
  const p = await ensureBrowser();

  if (currentUrl !== url) {
    await p.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    currentUrl = url;
  }

  const links = await p.evaluate(`
    (() => {
      const extractLinks = (container) => {
        if (!container) return [];
        return Array.from(container.querySelectorAll("a"))
          .map(a => ({
            text: (a.innerText || "").trim().slice(0, 80),
            href: a.getAttribute("href") || "",
          }))
          .filter(l => l.href && l.href !== "#");
      };
      return {
        header: extractLinks(
          document.querySelector("header") || document.querySelector("nav")
        ),
        footer: extractLinks(document.querySelector("footer")),
        main: extractLinks(
          document.querySelector("main") || document.querySelector('[role="main"]')
        ).slice(0, 50),
      };
    })()
  `);

  return JSON.stringify(links, null, 2);
}

// ─── Write Review ──────────────────────────────────────────────────

function writeReview(content: string, suffix: string = "review"): string {
  const reviewsDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "reviews"
  );
  fs.mkdirSync(reviewsDir, { recursive: true });

  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}${now.getFullYear()}`;

  // Find next available number for today
  const existing = fs.readdirSync(reviewsDir).filter((f: string) =>
    f.startsWith(`${suffix}-${dateStr}`)
  );
  const n = existing.length + 1;

  const filename = `${suffix}-${dateStr}-${n}.md`;
  const filepath = path.join(reviewsDir, filename);
  fs.writeFileSync(filepath, content, "utf-8");

  return JSON.stringify({
    saved: true,
    path: filepath,
    filename,
  });
}

// ─── Tool Router ───────────────────────────────────────────────────

export type ToolResult =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } };

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult[]> {
  switch (name) {
    case "brave_search": {
      const text = await braveSearch(
        input.query as string,
        (input.count as number) || 5
      );
      return [{ type: "text", text }];
    }

    case "screenshot_page": {
      const result = await screenshotPage(
        input as Parameters<typeof screenshotPage>[0]
      );
      return [
        { type: "text", text: result.metadata },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: result.base64,
          },
        },
      ];
    }

    case "scroll_and_screenshot": {
      const result = await scrollAndScreenshot(
        input as Parameters<typeof scrollAndScreenshot>[0]
      );
      return [
        { type: "text", text: result.metadata },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: result.base64,
          },
        },
      ];
    }

    case "get_page_info": {
      const text = await getPageInfo(input.url as string);
      return [{ type: "text", text }];
    }

    case "get_page_links": {
      const text = await getPageLinks(input.url as string);
      return [{ type: "text", text }];
    }

    case "write_review": {
      const text = writeReview(
        input.content as string,
        (input.filename_suffix as string) || "review"
      );
      return [{ type: "text", text }];
    }

    default:
      return [{ type: "text", text: `Unknown tool: ${name}` }];
  }
}
