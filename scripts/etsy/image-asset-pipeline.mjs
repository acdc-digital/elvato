#!/usr/bin/env node
/**
 * Etsy draft image asset pipeline.
 *
 * Phase 1/7 runnable path:
 *   - Read Etsy draft listings and listing images.
 *   - Create marketplace/images/{title_slug}/ folders.
 *   - Download original Etsy images as original_XX.ext.
 *   - Preserve provenance in metadata.json and sources.json.
 *   - Upsert product/image records into Convex when CONVEX_URL is available.
 *   - Optionally query SerpApi Google Lens for discovered candidates.
 *   - Download found candidates as review images without auto-approving them.
 *
 * Discovery notes:
 *   SERPAPI_API_KEY enables candidate collection. Embedding validation is a
 *   separate worker phase; unvalidated candidates are stored and downloaded for
 *   manual review, but remain pending until the validation worker approves them.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeSourceReport } from "./lib/source-report.mjs";
import { enrichSourcePrices } from "./lib/price.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MARKETPLACE_DIR = path.join(REPO_ROOT, "marketplace");
const IMAGE_ROOT = path.join(MARKETPLACE_DIR, "images");
const REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy", "image-pipeline");
const LISTING_REPORT_DIR = path.join(REPO_ROOT, "reports", "etsy");
const ETSY_BASE = "https://api.etsy.com";
const DEFAULT_CONVEX_URL = "https://superb-dotterel-37.convex.cloud";
const DEFAULT_LISTING_IDS = [
  "4517219812",
  "4517219744",
  "4517219674",
  "4517219626",
  "4517219532",
  "4517224553",
  "4517219188",
  "4517224237",
  "4517218980",
  "4517218920",
];

loadEnv();

function parseArgs(argv) {
  const args = {
    listingIds: [],
    allDrafts: false,
    maxListings: 10,
    maxOriginals: 20,
    maxDiscovered: 20,
    discover: false,
    downloadFound: true,
    syncConvex: true,
    download: true,
    force: false,
    autoCategory: true,
    skipExisting: true,
    fetchPrices: true,
    convexUrl: process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || DEFAULT_CONVEX_URL,
    imageRoot: IMAGE_ROOT,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--listing-id") { args.listingIds.push(argv[++index]); continue; }
    if (arg === "--listing-ids") { args.listingIds.push(...argv[++index].split(",").map((value) => value.trim()).filter(Boolean)); continue; }
    if (arg === "--all-drafts") { args.allDrafts = true; continue; }
    if (arg === "--max-listings") { args.maxListings = Number(argv[++index]); continue; }
    if (arg === "--max-originals") { args.maxOriginals = Number(argv[++index]); continue; }
    if (arg === "--max-discovered") { args.maxDiscovered = Number(argv[++index]); continue; }
    if (arg === "--discover") { args.discover = true; continue; }
    if (arg === "--no-found-downloads") { args.downloadFound = false; continue; }
    if (arg === "--no-convex") { args.syncConvex = false; continue; }
    if (arg === "--no-download") { args.download = false; continue; }
    if (arg === "--force") { args.force = true; continue; }
    if (arg === "--no-auto-category") { args.autoCategory = false; continue; }
    if (arg === "--no-skip-existing" || arg === "--reprocess") { args.skipExisting = false; continue; }
    if (arg === "--no-prices") { args.fetchPrices = false; continue; }
    if (arg === "--convex-url") { args.convexUrl = argv[++index]; continue; }
    if (arg === "--image-root") { args.imageRoot = path.resolve(argv[++index]); args.autoCategory = false; continue; }
    if (arg === "--help" || arg === "-h") { printUsage(); process.exit(0); }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.allDrafts && args.listingIds.length === 0) {
    args.listingIds = DEFAULT_LISTING_IDS.slice(0, args.maxListings);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  yarn images:ingest
  yarn images:ingest --listing-ids 4517219812,4517219744
  yarn images:ingest --all-drafts --max-listings 10
  yarn images:discover --listing-id 4517219812

Options:
  --discover        Query configured discovery providers and store candidates.
  --no-found-downloads  Store candidate metadata only; do not download found images.
  --no-convex       Write local asset folders only.
  --no-download     Write metadata only, without downloading image files.
  --force           Re-download existing local image files.
  --reprocess       Re-run discovery even if a folder already has found images.
  --no-skip-existing  Alias for --reprocess.
  --no-prices       Skip competitor price extraction for found source pages.
  --no-auto-category  Do not route folders into chandelier/ or desk and floor lamps/.
  --convex-url URL  Override CONVEX_URL.
  --image-root PATH Write assets under this explicit folder (disables auto-category).
`);
}

function loadEnv() {
  const envPaths = [
    path.join(MARKETPLACE_DIR, ".env.local"),
    path.join(MARKETPLACE_DIR, ".env"),
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".env"),
    path.join(REPO_ROOT, "admin", ".env"),
    path.join(REPO_ROOT, "admin", ".env.local"),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function etsyHeaders() {
  if (!process.env.ETSY_API_KEY) throw new Error("Set ETSY_API_KEY in marketplace/.env.local.");
  if (!process.env.ETSY_ACCESS_TOKEN) throw new Error("Set ETSY_ACCESS_TOKEN. Run yarn etsy:refresh if needed.");
  const apiKey = process.env.ETSY_API_HEADER_KEY || `${process.env.ETSY_API_KEY}:${process.env.ETSY_CLIENT_SECRET || ""}`;
  return {
    "x-api-key": apiKey,
    Authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}`,
  };
}

async function etsyRequest(endpoint) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(new URL(endpoint, ETSY_BASE), {
      headers: etsyHeaders(),
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status !== 429) break;
    await delay(1500 * (attempt + 1));
  }
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`GET ${endpoint} -> ${response.status}: ${detail.slice(0, 700)}`);
  }
  return body;
}

async function convexMutation(convexUrl, functionPath, functionArgs) {
  const response = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args: functionArgs }),
    signal: AbortSignal.timeout(45_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== "success") {
    throw new Error(`Convex mutation ${functionPath} failed: ${JSON.stringify(body)}`);
  }
  return body.value;
}

async function listDraftListingIds(maxListings) {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID to read shop drafts.");
  const ids = [];
  let offset = 0;
  while (ids.length < maxListings) {
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings?state=draft&limit=100&offset=${offset}`);
    const results = data.results || [];
    if (results.length === 0) break;
    for (const listing of results) {
      ids.push(String(listing.listing_id));
      if (ids.length >= maxListings) break;
    }
    offset += results.length;
    if (results.length < 100) break;
  }
  return ids;
}

async function findDraftListing(listingId) {
  if (!process.env.ETSY_SHOP_ID) throw new Error("Set ETSY_SHOP_ID to read shop drafts.");
  let offset = 0;
  while (true) {
    const data = await etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings?state=draft&limit=100&offset=${offset}`);
    const results = data.results || [];
    const listing = results.find((item) => String(item.listing_id) === String(listingId));
    if (listing) return listing;
    if (results.length < 100) break;
    offset += results.length;
  }
  throw new Error(`Could not find draft listing ${listingId} in shop ${process.env.ETSY_SHOP_ID}.`);
}

async function fetchListing(listingId) {
  try {
    return await etsyRequest(`/v3/application/listings/${listingId}`);
  } catch (error) {
    if (!String(error.message || "").includes("-> 404")) throw error;
    return findDraftListing(listingId);
  }
}

async function fetchListingImages(listingId) {
  try {
    return await etsyRequest(`/v3/application/listings/${listingId}/images`);
  } catch (error) {
    if (!String(error.message || "").includes("-> 404") || !process.env.ETSY_SHOP_ID) throw error;
    return etsyRequest(`/v3/application/shops/${process.env.ETSY_SHOP_ID}/listings/${listingId}/images`);
  }
}

async function fetchListingBundle(listingId) {
  let listing;
  let images;
  try {
    [listing, images] = await Promise.all([
      fetchListing(listingId),
      fetchListingImages(listingId),
    ]);
  } catch (error) {
    return localListingBundleFromReport(listingId, error);
  }
  const imageResults = images.results || [];
  imageResults.sort((left, right) => (left.rank || 0) - (right.rank || 0));
  return { listing, images: imageResults };
}

function localListingBundleFromReport(listingId, originalError) {
  if (!fs.existsSync(LISTING_REPORT_DIR)) throw originalError;
  const files = fs.readdirSync(LISTING_REPORT_DIR)
    .filter((file) => file.startsWith("listing-") && file.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(LISTING_REPORT_DIR, file);
    let report;
    try {
      report = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      continue;
    }
    const draft = report?.result?.draft;
    if (String(draft?.listing_id || "") !== String(listingId)) continue;
    const createDraft = report?.plan?.etsy?.createDraft || {};
    const imageUrls = report?.plan?.etsy?.imageUrls || [];
    const listing = {
      listing_id: draft.listing_id,
      title: draft.title || createDraft.title,
      description: draft.description || createDraft.description,
      state: draft.state || "draft",
      url: draft.url,
      price: draft.price || createDraft.price,
      quantity: draft.quantity || createDraft.quantity,
      taxonomy_id: draft.taxonomy_id || createDraft.taxonomy_id,
      shop_section_id: draft.shop_section_id || createDraft.shop_section_id,
      _pipelineSource: relativeToRepo(filePath),
    };
    const images = imageUrls.map((url, index) => ({
      rank: index + 1,
      url_fullxfull: url,
      full_width: undefined,
      full_height: undefined,
      alt_text: listing.title,
      listing_image_id: undefined,
    }));
    return { listing, images };
  }
  throw originalError;
}

function slugifyTitle(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 90) || "etsy_product";
}

// Existing image category folders. Ceiling-hung fixtures route to chandelier/;
// table, floor, desk, bedside, and wall fixtures route to desk and floor lamps/.
const IMAGE_CATEGORIES = ["chandelier", "desk and floor lamps"];

function classifyCategory(title) {
  const text = String(title || "").toLowerCase();
  if (/chandelier|pendant|ceiling|island|linear (light|pendant|strip)|hanging|suspension|drop light/.test(text)) {
    return "chandelier";
  }
  if (/floor lamp|table lamp|desk lamp|bedside lamp|reading lamp|wall (lamp|light|sconce)|sconce|arc lamp/.test(text)) {
    return "desk and floor lamps";
  }
  return "desk and floor lamps";
}

// Detect whether a slug has already been processed (found images present) in the
// root or in any category subfolder, so discovery is not re-run needlessly.
function findExistingProcessedDir(imageRoot, slug) {
  const roots = [imageRoot, ...IMAGE_CATEGORIES.map((category) => path.join(imageRoot, category))];
  for (const root of roots) {
    const dir = path.join(root, slug);
    if (!fs.existsSync(dir)) continue;
    const hasFound = fs.readdirSync(dir).some((file) => /^found_\d+\./.test(file));
    if (hasFound) return dir;
  }
  return null;
}

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function imageUrlFromEtsyImage(image) {
  return image.url_fullxfull || image.url_570xN || image.url_170x135 || image.url_75x75;
}

function extensionFromContentType(contentType) {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const match = pathname.match(/\.([a-z0-9]{3,5})$/);
    if (match && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(match[1])) return match[1] === "jpeg" ? "jpg" : match[1];
  } catch {
    return "jpg";
  }
  return "jpg";
}

async function downloadImage(url, destPath, force) {
  if (!force && fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    return { localPath: relativeToRepo(destPath), sizeBytes: stat.size, skipped: true };
  }

  let response;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 ElvatoMarketplaceImagePipeline/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    if (response.ok) break;
    await delay(1000 * (attempt + 1));
  }
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const data = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, data);
  return {
    localPath: relativeToRepo(destPath),
    sizeBytes: data.byteLength,
    contentType,
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
    skipped: false,
  };
}

function relativeToRepo(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

async function discoverWithSerpApi(seedImageUrl, maxDiscovered) {
  if (!process.env.SERPAPI_API_KEY) return { provider: "serpapi_google_lens", enabled: false, candidates: [] };
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_lens");
  url.searchParams.set("url", seedImageUrl);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`SerpApi discovery failed ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }

  const visualMatches = body?.visual_matches || [];
  const exactMatches = body?.exact_matches || [];
  const seen = new Set();
  const seenSources = new Set();
  const candidates = [];
  for (const match of [...exactMatches, ...visualMatches]) {
    const imageUrl = match.thumbnail || match.image || match.image_url;
    const sourceUrl = match.link || match.source || match.url;
    if (!imageUrl || !sourceUrl || seen.has(imageUrl)) continue;
    // Diversify results: only one candidate per source page.
    if (seenSources.has(sourceUrl)) continue;
    seen.add(imageUrl);
    seenSources.add(sourceUrl);
    candidates.push({
      imageUrl,
      sourceUrl,
      sourceDomain: domainFromUrl(sourceUrl),
      productTitle: match.title,
      description: match.snippet,
      discoveryMethod: "reverse_image",
      provider: "serpapi_google_lens",
      raw: match,
    });
    if (candidates.length >= maxDiscovered) break;
  }
  return { provider: "serpapi_google_lens", enabled: true, candidates };
}

function initialDomainConfidence(domain) {
  if (!domain) return 0.35;
  if (/etsy|amazon|aliexpress|temu|ebay/i.test(domain)) return 0.45;
  if (/homedepot|wayfair|overstock|walmart|target|lowes/i.test(domain)) return 0.55;
  if (/lighting|lamp|chandelier|fixture|decor/i.test(domain)) return 0.65;
  return 0.5;
}

function tokenSimilarity(left, right) {
  const leftTokens = new Set(String(left || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const rightTokens = new Set(String(right || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) overlap += 1;
  return Number((overlap / Math.max(leftTokens.size, rightTokens.size)).toFixed(4));
}

function provisionalCandidateScore(listingTitle, candidate) {
  const titleSimilarity = tokenSimilarity(listingTitle, candidate.productTitle || "");
  const domainConfidence = initialDomainConfidence(candidate.sourceDomain);
  const score = Number((titleSimilarity * 0.3 + domainConfidence * 0.1).toFixed(4));
  return { titleSimilarity, domainConfidence, score };
}

async function processListing(args, listingId) {
  const { listing, images } = await fetchListingBundle(listingId);
  const title = listing.title || `Etsy listing ${listingId}`;
  const slug = slugifyTitle(title);

  // Skip listings already processed (found images present) unless reprocessing.
  if (args.skipExisting && !args.force) {
    const existing = findExistingProcessedDir(args.imageRoot, slug);
    if (existing) {
      return {
        listingId: String(listingId),
        title,
        slug,
        folder: relativeToRepo(existing),
        skipped: true,
        reason: "already processed (found images present); pass --reprocess to override",
        originalImageCount: 0,
        discoveredCandidateCount: 0,
        foundDownloadCount: 0,
        convexProductId: null,
        convexErrors: [],
      };
    }
  }

  const category = args.autoCategory ? classifyCategory(title) : null;
  const categoryRoot = category ? path.join(args.imageRoot, category) : args.imageRoot;
  const productDir = path.join(categoryRoot, slug);
  fs.mkdirSync(productDir, { recursive: true });

  const sourceImageUrls = images.map(imageUrlFromEtsyImage).filter(Boolean);
  let productId = null;
  const convexErrors = [];
  if (args.syncConvex) {
    try {
      productId = await convexMutation(args.convexUrl, "marketplace/imagePipeline:upsertProductFromEtsy", {
        etsyListingId: String(listingId),
        title,
        slug,
        status: "draft",
        etsyState: listing.state,
        etsyUrl: listing.url,
        sourceImageUrls,
        metadata: {
          price: listing.price,
          quantity: listing.quantity,
          taxonomyId: listing.taxonomy_id,
          shopSectionId: listing.shop_section_id,
          fetchedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      convexErrors.push(error.message);
    }
  }

  const originalSources = [];
  for (const [imageIndex, image] of images.slice(0, args.maxOriginals).entries()) {
    const imageUrl = imageUrlFromEtsyImage(image);
    if (!imageUrl) continue;
    const padded = String(imageIndex + 1).padStart(2, "0");
    const ext = extensionFromUrl(imageUrl);
    const destPath = path.join(productDir, `original_${padded}.${ext}`);
    let fileResult = { localPath: relativeToRepo(destPath), skipped: true };
    if (args.download) {
      try {
        fileResult = await downloadImage(imageUrl, destPath, args.force);
      } catch (error) {
        fileResult = { localPath: relativeToRepo(destPath), error: error.message };
      }
    }

    const source = {
      type: "original",
      rank: image.rank || imageIndex + 1,
      imageUrl,
      listingImageId: image.listing_image_id,
      width: image.full_width,
      height: image.full_height,
      altText: image.alt_text,
      sourceUrl: listing.url,
      sourceDomain: domainFromUrl(listing.url),
      ...fileResult,
    };
    originalSources.push(source);

    if (args.syncConvex && productId) {
      try {
        await convexMutation(args.convexUrl, "marketplace/imagePipeline:upsertProductImage", {
          productId,
          imageUrl,
          type: "original",
          sourceUrl: listing.url,
          sourceDomain: domainFromUrl(listing.url),
          localPath: source.localPath,
          rank: source.rank,
          width: source.width,
          height: source.height,
          contentType: source.contentType,
          sizeBytes: source.sizeBytes,
          validationStatus: "approved",
          confidence: 1,
          provenance: source,
        });
      } catch (error) {
        convexErrors.push(error.message);
      }
    }
    await delay(250);
  }

  const discoveries = [];
  const foundDownloads = [];
  if (args.discover && sourceImageUrls[0]) {
    const discoveryResult = await discoverWithSerpApi(sourceImageUrls[0], args.maxDiscovered);
    for (const [candidateIndex, candidate] of discoveryResult.candidates.entries()) {
      const scoring = provisionalCandidateScore(title, candidate);
      const foundRank = candidateIndex + 1;
      const candidateRecord = {
        ...candidate,
        ...scoring,
        rank: foundRank,
        approved: false,
        reason: "Pending embedding validation; provisional text/domain score only.",
      };

      if (args.download && args.downloadFound) {
        const padded = String(foundRank).padStart(2, "0");
        const ext = extensionFromUrl(candidate.imageUrl);
        const destPath = path.join(productDir, `found_${padded}.${ext}`);
        try {
          const fileResult = await downloadImage(candidate.imageUrl, destPath, args.force);
          candidateRecord.localPath = fileResult.localPath;
          candidateRecord.sizeBytes = fileResult.sizeBytes;
          candidateRecord.contentType = fileResult.contentType;
          candidateRecord.sha256 = fileResult.sha256;
          candidateRecord.skippedExisting = fileResult.skipped;
          foundDownloads.push(candidateRecord);
        } catch (error) {
          candidateRecord.downloadError = error.message;
        }
      }

      discoveries.push(candidateRecord);
      if (args.syncConvex && productId) {
        try {
          await convexMutation(args.convexUrl, "marketplace/imagePipeline:recordCandidate", {
            productId,
            sourceUrl: candidate.sourceUrl,
            sourceDomain: candidate.sourceDomain,
            imageUrl: candidate.imageUrl,
            productTitle: candidate.productTitle,
            description: candidate.description,
            discoveryMethod: candidate.discoveryMethod,
            titleSimilarity: scoring.titleSimilarity,
            domainConfidence: scoring.domainConfidence,
            score: scoring.score,
            approved: false,
            reason: candidateRecord.reason,
            provenance: candidateRecord,
          });
          if (candidateRecord.localPath) {
            await convexMutation(args.convexUrl, "marketplace/imagePipeline:upsertProductImage", {
              productId,
              imageUrl: candidate.imageUrl,
              type: "discovered",
              sourceUrl: candidate.sourceUrl,
              sourceDomain: candidate.sourceDomain,
              localPath: candidateRecord.localPath,
              rank: foundRank,
              contentType: candidateRecord.contentType,
              sizeBytes: candidateRecord.sizeBytes,
              validationStatus: "pending",
              confidence: scoring.score,
              provenance: candidateRecord,
            });
          }
        } catch (error) {
          convexErrors.push(error.message);
        }
      }
    }
    if (!discoveryResult.enabled) {
      discoveries.push({ provider: discoveryResult.provider, skipped: true, reason: "SERPAPI_API_KEY is not configured." });
    }
  }

  const metadata = {
    productId,
    etsyListingId: String(listingId),
    title,
    slug,
    etsyState: listing.state,
    etsyUrl: listing.url,
    folder: relativeToRepo(productDir),
    originalImageCount: originalSources.length,
    discoveredCandidateCount: discoveries.filter((item) => !item.skipped).length,
    foundDownloadCount: foundDownloads.length,
    maxDiscovered: args.maxDiscovered,
    generatedAt: new Date().toISOString(),
    convex: {
      enabled: args.syncConvex,
      url: args.convexUrl,
      errors: convexErrors,
    },
    validationPolicy: {
      autoApproveThreshold: 0.85,
      currentDiscoveryStatus: args.discover ? "candidates_pending_embedding_validation" : "not_run",
      downloadDiscoveredImages: args.discover && args.downloadFound ? "downloaded_as_found_pending_review" : "disabled",
    },
  };

  const sources = {
    etsyListing: {
      listingId: String(listingId),
      title,
      url: listing.url,
      state: listing.state,
      fetchedAt: metadata.generatedAt,
    },
    originals: originalSources,
    discoveredCandidates: discoveries,
    foundDownloads,
  };

  if (args.fetchPrices) {
    try {
      await enrichSourcePrices(sources, { fetchPages: true });
    } catch (error) {
      console.warn(`  Price enrichment failed for ${slug}: ${error.message}`);
    }
  }

  fs.writeFileSync(path.join(productDir, "metadata.json"), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(productDir, "sources.json"), JSON.stringify(sources, null, 2));
  writeSourceReport(productDir, sources);

  return {
    listingId: String(listingId),
    title,
    slug,
    folder: metadata.folder,
    originalImageCount: originalSources.length,
    discoveredCandidateCount: metadata.discoveredCandidateCount,
    foundDownloadCount: metadata.foundDownloadCount,
    convexProductId: productId,
    convexErrors,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.imageRoot, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const listingIds = args.allDrafts ? await listDraftListingIds(args.maxListings) : args.listingIds.slice(0, args.maxListings);
  if (listingIds.length === 0) throw new Error("No Etsy draft listing IDs found.");

  console.log(`Image asset pipeline: ${listingIds.length} listing(s)`);
  console.log(`Images: ${relativeToRepo(args.imageRoot)}`);
  console.log(`Convex sync: ${args.syncConvex ? args.convexUrl : "disabled"}`);
  console.log(`Discovery: ${args.discover ? "enabled" : "disabled"}`);

  const results = [];
  for (const listingId of listingIds) {
    console.log(`\nProcessing ${listingId}...`);
    const result = await processListing(args, listingId);
    results.push(result);
    if (result.skipped) {
      console.log(`  SKIPPED: ${result.reason} -> ${result.folder}`);
      continue;
    }
    console.log(`  ${result.originalImageCount} originals -> ${result.folder}`);
    if (result.discoveredCandidateCount) console.log(`  ${result.discoveredCandidateCount} discovery candidates stored`);
    if (result.foundDownloadCount) console.log(`  ${result.foundDownloadCount} found images downloaded for review`);
    if (result.convexErrors.length) console.log(`  Convex warnings: ${result.convexErrors.length}`);
    await delay(500);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    listingCount: results.length,
    skippedCount: results.filter((item) => item.skipped).length,
    processedCount: results.filter((item) => !item.skipped).length,
    discoveryEnabled: args.discover,
    convexEnabled: args.syncConvex,
    imageRoot: relativeToRepo(args.imageRoot),
    results,
  };
  const reportPath = path.join(REPORT_DIR, `image-pipeline-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${relativeToRepo(reportPath)}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
