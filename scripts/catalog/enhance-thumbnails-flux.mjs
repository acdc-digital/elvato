#!/usr/bin/env node

/**
 * Enhance Product Thumbnails via FLUX.2 Image Editing
 *
 * Fetches product thumbnails from ConvexFS (Bunny CDN), sends them to the
 * FLUX.2 API to generate professional e-commerce product images (upscaled,
 * gradient background, subtle enhancement), and replaces the old thumbnail in
 * ConvexFS.
 *
 * Usage:
 *   node scripts/catalog/enhance-thumbnails-flux.mjs --title "Modern Gold Wall Sconce" --dry-run
 *   node scripts/catalog/enhance-thumbnails-flux.mjs --handle "modern-gold-wall-sconce" --dry-run
 *   node scripts/catalog/enhance-thumbnails-flux.mjs --title "Modern Gold Wall Sconce" --out reports/catalog/flux-enhance-live.json
 *
 * Flags:
 *   --title <string>    Search for product by title (fuzzy match via Medusa API)
 *   --handle <string>   Target product by exact handle
 *   --dry-run           Generate the image but don't replace the thumbnail
 *   --out <path>        Write JSON report to this file
 *   --prompt <string>   Override the default FLUX.2 prompt
 *   --model <string>    FLUX.2 model endpoint (default: flux-2-pro-preview)
 *   --size <int>        Output size in px, used for both width & height (default: 1024)
 *
 * Env vars (loaded from .env.local):
 *   FLUX2_API_KEY               — BFL API key
 *   CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) — Convex deployment URL
 *   CONVEX_SITE_URL             — Convex HTTP endpoint (for file serving)
 *   MEDUSA_BACKEND_URL          — Medusa backend URL
 *   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY — Medusa publishable key
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// =============================================================================
// ENV LOADING
// =============================================================================

function loadEnv() {
  const envPaths = [
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env"),
  ];
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
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

const FLUX_API_KEY = process.env.FLUX2_API_KEY;
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "https://medusa-backend-production-d681.up.railway.app";
const MEDUSA_PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// =============================================================================
// CLI ARGS
// =============================================================================

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const titleArg = getArg("title");
const handleArg = getArg("handle");
const dryRun = hasFlag("dry-run");
const outPath = getArg("out");
const customPrompt = getArg("prompt");
const fluxModel = getArg("model") || "flux-2-pro-preview";
const outputSize = parseInt(getArg("size") || "1024", 10);

if (!titleArg && !handleArg) {
  console.error("❌ Must provide --title or --handle");
  process.exit(1);
}
if (!FLUX_API_KEY) {
  console.error("❌ FLUX2_API_KEY not set in env");
  process.exit(1);
}
if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL / NEXT_PUBLIC_CONVEX_URL not set in env");
  process.exit(1);
}

const DEFAULT_PROMPT = [
  "Subtle enhancement of this product photo. Keep the product exactly as-is — do not alter its shape, color, texture, or details.",
  "Remove the existing background and replace with a smooth radial gradient that transitions from warm light gray (#E8E4E0) at the center to soft cool gray (#D0D0D4) at the edges.",
  "The gradient should provide gentle contrast so white or light-colored products remain clearly visible and don't wash out against the background.",
  "Slightly sharpen product edges and enhance clarity. Preserve original lighting on the product, add only a very subtle soft shadow beneath for grounding.",
  "Photorealistic, centered, 1:1 aspect ratio.",
].join(" ");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
// HELPERS
// =============================================================================

/** Query Convex backend (public query endpoint). */
async function convexQuery(fnPath, fnArgs) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args: fnArgs }),
  });
  if (!res.ok) {
    throw new Error(`Convex query ${fnPath} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.value;
}

/** Call Convex mutation (public mutation endpoint). */
async function convexMutation(fnPath, fnArgs) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args: fnArgs }),
  });
  if (!res.ok) {
    throw new Error(`Convex mutation ${fnPath} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.value;
}

/** Call Convex action (public action endpoint). */
async function convexAction(fnPath, fnArgs) {
  const res = await fetch(`${CONVEX_URL}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args: fnArgs }),
  });
  if (!res.ok) {
    throw new Error(`Convex action ${fnPath} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.value;
}

/** Search Medusa Store API for a product by title, return first match. */
async function findProductByTitle(title) {
  const headers = {};
  if (MEDUSA_PK) headers["x-publishable-api-key"] = MEDUSA_PK;

  const url = new URL("/store/products", MEDUSA_URL);
  url.searchParams.set("q", title);
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "id,title,handle,thumbnail");

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Medusa search failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.products?.[0] ?? null;
}

/** Search Medusa Store API for a product by handle. */
async function findProductByHandle(handle) {
  const headers = {};
  if (MEDUSA_PK) headers["x-publishable-api-key"] = MEDUSA_PK;

  const url = new URL("/store/products", MEDUSA_URL);
  url.searchParams.set("handle", handle);
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", "id,title,handle,thumbnail");

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Medusa handle lookup failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.products?.[0] ?? null;
}

// =============================================================================
// FLUX.2 API
// =============================================================================

/**
 * Resolve a URL that may 302 redirect (e.g. ConvexFS → Bunny CDN).
 * Returns the final direct URL that FLUX.2 can fetch without redirects.
 */
async function resolveRedirect(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  return res.url || url;
}

/**
 * Submit an image editing task to FLUX.2.
 * @param {string} imageUrl  - URL of the source image
 * @param {string} prompt    - Editing instruction
 * @returns {Promise<{taskId: string, pollingUrl: string, cost: number}>}
 */
async function submitFluxEdit(imageUrl, prompt) {
  // Resolve any redirects (ConvexFS 302 → Bunny CDN) so FLUX.2 gets a direct URL
  const directUrl = await resolveRedirect(imageUrl);
  if (directUrl !== imageUrl) {
    console.log(`   ↳ Resolved redirect → ${directUrl.slice(0, 80)}...`);
  }

  const res = await fetch(`https://api.bfl.ai/v1/${fluxModel}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "x-key": FLUX_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      input_image: directUrl,
      width: outputSize,
      height: outputSize,
      output_format: "png",
      safety_tolerance: 2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FLUX.2 submit failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    taskId: data.id,
    pollingUrl: data.polling_url,
    cost: data.cost,
  };
}

/**
 * Poll FLUX.2 for task result. Returns the signed image URL.
 * @param {string} pollingUrl
 * @returns {Promise<string>} signed URL of the generated image
 */
async function pollFluxResult(pollingUrl) {
  const maxAttempts = 360; // 180 seconds max
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(500);

    const res = await fetch(pollingUrl, {
      headers: {
        "accept": "application/json",
        "x-key": FLUX_API_KEY,
      },
    });

    if (!res.ok) {
      console.log(`   ⟳ Poll HTTP ${res.status}, retrying...`);
      continue;
    }

    const data = await res.json();
    if (data.status === "Ready") {
      return data.result?.sample;
    }
    if (data.status === "Error" || data.status === "Failed") {
      throw new Error(`FLUX.2 generation failed: ${JSON.stringify(data)}`);
    }
    if (data.status === "Request Moderated" || data.status === "Content Moderated") {
      throw new Error(`FLUX.2 content moderated: ${data.status}`);
    }

    // Still pending — show progress
    if (attempt % 10 === 0 && attempt > 0) {
      const progress = data.progress != null ? `${Math.round(data.progress * 100)}%` : "...";
      console.log(`   ⏳ Generating (${progress})`);
    }
  }
  throw new Error("FLUX.2 generation timed out after 180s");
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    dryRun,
    model: fluxModel,
    outputSize,
    product: null,
    originalThumbnail: null,
    fluxTaskId: null,
    fluxCost: null,
    generatedImageUrl: null,
    newThumbnailPath: null,
    movedOldThumbnail: null,
    status: "pending",
    error: null,
  };

  try {
    // -------------------------------------------------------------------------
    // Phase 1: Resolve the target product
    // -------------------------------------------------------------------------
    console.log("\n🔍 Phase 1: Resolving product...");

    let product;
    if (handleArg) {
      // Skip Medusa API — use handle directly for ConvexFS lookup
      product = { id: null, title: handleArg, handle: handleArg };
    } else {
      product = await findProductByTitle(titleArg);
    }

    if (!product) {
      throw new Error(`Product not found: ${titleArg || handleArg}`);
    }

    console.log(`   ✓ Found: "${product.title}" (handle: ${product.handle})`);
    report.product = { id: product.id, title: product.title, handle: product.handle };

    // -------------------------------------------------------------------------
    // Phase 2: Fetch the current thumbnail from ConvexFS
    // -------------------------------------------------------------------------
    console.log("\n🖼️  Phase 2: Fetching current thumbnail from ConvexFS...");

    const images = await convexQuery("files:getProductImages", {
      productHandle: product.handle,
    });

    // Find the thumbnail, or fall back to the first gallery image
    let thumbnailImage = images?.find((i) => i.path.includes("/thumbnail."));
    if (!thumbnailImage) {
      const gallery = images
        ?.filter((i) => i.path.includes("/images/"))
        .sort((a, b) => {
          const rA = parseInt(a.path.split("/").pop()?.split(".")[0] ?? "0");
          const rB = parseInt(b.path.split("/").pop()?.split(".")[0] ?? "0");
          return rA - rB;
        });
      thumbnailImage = gallery?.[0];
    }

    if (!thumbnailImage) {
      // No CDN image at all — try the Medusa thumbnail URL directly
      if (product.thumbnail) {
        console.log("   ⚠ No ConvexFS thumbnail found, using Medusa thumbnail URL directly");
        thumbnailImage = { path: null, url: product.thumbnail };
      } else {
        throw new Error(`No thumbnail found for product "${product.title}" in ConvexFS or Medusa`);
      }
    }

    console.log(`   ✓ Thumbnail: ${thumbnailImage.path || thumbnailImage.url}`);
    report.originalThumbnail = thumbnailImage.url;

    // -------------------------------------------------------------------------
    // Phase 3: Generate enhanced image via FLUX.2
    // -------------------------------------------------------------------------
    console.log("\n🎨 Phase 3: Submitting to FLUX.2...");

    const prompt = customPrompt || DEFAULT_PROMPT;
    console.log(`   Model: ${fluxModel}`);
    console.log(`   Size: ${outputSize}x${outputSize}`);
    console.log(`   Prompt: ${prompt.slice(0, 80)}...`);

    const { taskId, pollingUrl, cost } = await submitFluxEdit(thumbnailImage.url, prompt);
    console.log(`   ✓ Task submitted: ${taskId} (cost: ${cost ?? "?"} credits)`);
    report.fluxTaskId = taskId;
    report.fluxCost = cost;

    console.log("   ⏳ Polling for result...");
    const generatedUrl = await pollFluxResult(pollingUrl);

    if (!generatedUrl) {
      throw new Error("FLUX.2 returned no image URL");
    }

    console.log(`   ✓ Image generated: ${generatedUrl.slice(0, 80)}...`);
    report.generatedImageUrl = generatedUrl;

    // Save generated image locally for review
    const localDir = path.join(ROOT, "reports", "catalog", "flux-images");
    fs.mkdirSync(localDir, { recursive: true });
    const localFile = path.join(localDir, `${product.handle}-enhanced.png`);

    const imgResponse = await fetch(generatedUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to download generated image: ${imgResponse.status}`);
    }
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    fs.writeFileSync(localFile, imgBuffer);
    console.log(`   ✓ Saved locally: ${path.relative(ROOT, localFile)}`);

    // -------------------------------------------------------------------------
    // Phase 4: Replace thumbnail in ConvexFS (skip in dry-run)
    // -------------------------------------------------------------------------
    if (dryRun) {
      console.log("\n⏭️  Phase 4: SKIPPED (dry-run mode)");
      console.log("   The generated image has been saved locally for review.");
      report.status = "dry-run-complete";
    } else {
      console.log("\n📤 Phase 4: Replacing thumbnail in ConvexFS...");

      const newThumbnailPath = `/products/${product.handle}/thumbnail.png`;

      // Find the current max gallery rank so we can slot the old thumbnail next
      const galleryImages = images?.filter((i) => i.path.includes("/images/")) || [];
      let maxRank = 0;
      for (const gi of galleryImages) {
        const filename = gi.path.split("/").pop() || "";
        const rank = parseInt(filename.split(".")[0], 10);
        if (!isNaN(rank) && rank > maxRank) maxRank = rank;
      }
      const nextRank = maxRank + 1;

      // Move old thumbnail(s) into the gallery as the next ranked image(s)
      const oldThumbs = images?.filter((i) => i.path.includes("/thumbnail.")) || [];
      for (let i = 0; i < oldThumbs.length; i++) {
        const old = oldThumbs[i];
        const ext = old.path.split(".").pop() || "jpg";
        const galleryDest = `/products/${product.handle}/images/${nextRank + i}.${ext}`;
        try {
          await convexMutation("files:moveFile", {
            sourcePath: old.path,
            destPath: galleryDest,
          });
          console.log(`   📂 Moved old thumbnail → ${galleryDest}`);
        } catch (err) {
          console.log(`   ⚠ Could not move ${old.path}: ${err.message}`);
        }
      }
      report.movedOldThumbnail = oldThumbs.length > 0
        ? `/products/${product.handle}/images/${nextRank}.${oldThumbs[0].path.split(".").pop()}`
        : null;

      // Write new thumbnail via Convex action (ingestImage)
      await convexAction("files:ingestImage", {
        sourceUrl: generatedUrl,
        destPath: newThumbnailPath,
      });

      console.log(`   ✓ New thumbnail written: ${newThumbnailPath}`);
      report.newThumbnailPath = newThumbnailPath;
      report.status = "replaced";
    }

    // -------------------------------------------------------------------------
    // Done
    // -------------------------------------------------------------------------
    report.completedAt = new Date().toISOString();
    console.log(`\n✅ Done! Status: ${report.status}`);

  } catch (err) {
    report.status = "error";
    report.error = err.message;
    console.error(`\n❌ Error: ${err.message}`);
  }

  // Write report
  if (outPath) {
    const fullOutPath = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath);
    fs.mkdirSync(path.dirname(fullOutPath), { recursive: true });
    fs.writeFileSync(fullOutPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report: ${path.relative(ROOT, fullOutPath)}`);
  } else {
    // Default report output
    const defaultOut = path.join(ROOT, "reports", "catalog", `flux-enhance-${dryRun ? "dry" : "live"}-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(defaultOut), { recursive: true });
    fs.writeFileSync(defaultOut, JSON.stringify(report, null, 2));
    console.log(`📄 Report: ${path.relative(ROOT, defaultOut)}`);
  }
}

main();
