/**
 * Shared price extraction + competitive pricing helpers for marketplace image
 * source reports.
 *
 * Used by:
 *   - image-asset-pipeline.mjs (enriches prices inline on every run)
 *   - enrich-image-source-prices.mjs (batch backfill across existing folders)
 *   - lib/source-report.mjs (renders the recommended pricing section)
 */

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 ElvatoMarketplacePriceReview/1.0";

const CURRENCY_SYMBOLS = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₽": "RUB",
  "₩": "KRW",
  "₺": "TRY",
  "₴": "UAH",
  "₪": "ILS",
  "zł": "PLN",
};

// Approximate FX rates to USD for normalizing competitor prices into one scale.
// These do not need to be exact for competitive positioning; refresh as needed.
export const FX_TO_USD = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.66,
  PLN: 0.25,
  JPY: 0.0064,
  INR: 0.012,
  RUB: 0.011,
  KRW: 0.00073,
  TRY: 0.031,
  UAH: 0.024,
  ILS: 0.27,
};

export function toUsd(amount, currency) {
  if (amount == null || !Number.isFinite(Number(amount))) return null;
  const rate = FX_TO_USD[(currency || "USD").toUpperCase()];
  if (!rate) return null;
  return Number(amount) * rate;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value) {
  return decodeHtmlEntities(String(value ?? ""))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#36;/g, "$")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value) {
  if (value == null) return undefined;
  const cleaned = String(value).replace(/[^0-9.,-]/g, "");
  if (!cleaned) return undefined;
  const normalized = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/,/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

function normalizeCurrency(value) {
  if (!value) return undefined;
  const text = String(value).trim().toUpperCase();
  if (text === "$") return "USD";
  if (text === "€") return "EUR";
  if (text === "£") return "GBP";
  if (["USD", "EUR", "GBP", "CAD", "AUD", "PLN", "JPY", "INR", "RUB", "KRW", "TRY", "UAH", "ILS"].includes(text)) return text;
  return text;
}

function currencyFromText(value) {
  const text = String(value || "");
  if (/\bUSD\b|US\$/i.test(text)) return "USD";
  if (/\bEUR\b/i.test(text)) return "EUR";
  if (/\bGBP\b/i.test(text)) return "GBP";
  if (/\bCAD\b|CA\$/i.test(text)) return "CAD";
  if (/\bAUD\b|AU\$/i.test(text)) return "AUD";
  if (/\bPLN\b/i.test(text)) return "PLN";
  for (const [symbol, currency] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return currency;
  }
  return undefined;
}

function formatPrice(amount, currency) {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "";
  if (currency === "USD") return `$${Number(amount).toLocaleString("en-US")}`;
  if (currency === "EUR") return `€${Number(amount).toLocaleString("en-US")}`;
  if (currency === "GBP") return `£${Number(amount).toLocaleString("en-US")}`;
  if (currency === "CAD") return `CAD ${Number(amount).toLocaleString("en-US")}`;
  if (currency === "AUD") return `AUD ${Number(amount).toLocaleString("en-US")}`;
  if (currency === "PLN") return `PLN ${Number(amount).toLocaleString("en-US")}`;
  return `${currency ? `${currency} ` : ""}${Number(amount).toLocaleString("en-US")}`;
}

function compactPrice(price) {
  if (!price?.display) return null;
  if (price.amount === undefined) return null;
  if (price.amount !== undefined && price.amount <= 0) return null;
  if (price.amount !== undefined && price.amount < 10) return null;
  if (price.amount !== undefined && price.amount > 100000) return null;
  return {
    display: price.display,
    ...(price.amount !== undefined ? { amount: price.amount } : {}),
    ...(price.currency ? { currency: price.currency } : {}),
    source: price.source,
    sourceUrl: price.sourceUrl,
    extractedAt: new Date().toISOString(),
  };
}

export function normalizePrice(input, source, sourceUrl) {
  if (!input) return null;

  if (typeof input === "object") {
    const value = input.value || input.price || input.amount || input.lowPrice || input.highPrice;
    const amount = input.extracted_value ?? input.extractedPrice ?? input.amount ?? parseAmount(value);
    const currency = normalizeCurrency(input.currency || input.currency_code || input.priceCurrency || currencyFromText(value));
    const display = formatPrice(amount, currency) || cleanText(input.value || value || "");
    if (!display && amount === undefined) return null;
    return compactPrice({ display, amount: Number.isFinite(Number(amount)) ? Number(amount) : parseAmount(display), currency, source, sourceUrl });
  }

  const text = cleanText(input);
  if (!text) return null;
  const amount = parseAmount(text);
  const currency = normalizeCurrency(currencyFromText(text));
  return compactPrice({ display: formatPrice(amount, currency) || text, amount, currency, source, sourceUrl });
}

export function priceFromExistingMetadata(candidate) {
  const raw = candidate.raw || {};
  const options = [
    raw.price,
    raw.extracted_price,
    raw.offer?.price,
    raw.offers?.price,
    raw.rich_snippet?.top?.detected_extensions?.price,
    raw.rich_snippet?.bottom?.detected_extensions?.price,
  ];

  for (const option of options) {
    const price = normalizePrice(option, "serpapi", candidate.sourceUrl);
    if (price) return price;
  }
  return null;
}

function extractMetaContent(html, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtmlEntities(match[1]);
    }
  }
  return null;
}

function extractJsonLdObjects(html) {
  const objects = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const text = decodeHtmlEntities(match[1]).trim();
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      collectJsonLd(parsed, objects);
    } catch {
      continue;
    }
  }
  return objects;
}

function collectJsonLd(value, objects) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLd(item, objects);
    return;
  }
  if (typeof value !== "object") return;
  objects.push(value);
  if (value["@graph"]) collectJsonLd(value["@graph"], objects);
}

function typeMatches(value, typeName) {
  const type = value?.["@type"];
  if (Array.isArray(type)) return type.some((item) => String(item).toLowerCase() === typeName);
  return String(type || "").toLowerCase() === typeName;
}

function priceFromOffers(offers, sourceUrl) {
  const offerList = Array.isArray(offers) ? offers : [offers].filter(Boolean);
  for (const offer of offerList) {
    if (!offer || typeof offer !== "object") continue;
    const price = normalizePrice({
      value: offer.price || offer.lowPrice || offer.highPrice || offer.priceSpecification?.price,
      currency: offer.priceCurrency || offer.priceSpecification?.priceCurrency,
    }, "json_ld", sourceUrl);
    if (price) return price;
  }
  return null;
}

function priceFromHtml(html, sourceUrl) {
  const metaAmount = extractMetaContent(html, [
    "product:price:amount",
    "og:price:amount",
    "price",
  ]);
  const metaCurrency = extractMetaContent(html, [
    "product:price:currency",
    "og:price:currency",
    "currency",
  ]);
  if (metaAmount) {
    const price = normalizePrice({ value: metaAmount, currency: metaCurrency }, "meta", sourceUrl);
    if (price) return price;
  }

  for (const object of extractJsonLdObjects(html)) {
    if (!typeMatches(object, "product") && !object.offers) continue;
    const price = priceFromOffers(object.offers, sourceUrl);
    if (price) return price;
  }

  const compactHtml = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  const pricePatterns = [
    /(?:sale price|regular price|price|from|starting at)\s*[:\-]?\s*((?:US\$|CA\$|AU\$|[$€£]|USD|EUR|GBP|CAD|AUD|PLN)\s?[0-9][0-9.,]*(?:\s?(?:USD|EUR|GBP|CAD|AUD|PLN))?)/i,
    /((?:US\$|CA\$|AU\$|[$€£]|USD|EUR|GBP|CAD|AUD|PLN)\s?[0-9][0-9.,]*(?:\s?(?:USD|EUR|GBP|CAD|AUD|PLN))?)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = compactHtml.match(pattern);
    if (match?.[1]) {
      const price = normalizePrice(match[1], "page_text", sourceUrl);
      if (price) return price;
    }
  }

  return null;
}

export async function fetchPagePrice(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) return null;
  return priceFromHtml(text, sourceUrl);
}

export function allFoundItems(sources) {
  return sources.foundDownloads || sources.discoveredCandidates?.filter((item) => item.localPath) || [];
}

function candidateKey(candidate) {
  return `${candidate.sourceUrl || ""}::${candidate.imageUrl || ""}::${candidate.localPath || ""}`;
}

function applyPriceToMatchingItems(sources, pricedItem) {
  const key = candidateKey(pricedItem);
  for (const collectionName of ["foundDownloads", "discoveredCandidates"]) {
    const collection = sources[collectionName] || [];
    for (const item of collection) {
      if (candidateKey(item) !== key) continue;
      if (pricedItem.listedPrice) item.listedPrice = pricedItem.listedPrice;
      if (pricedItem.priceLookup) item.priceLookup = pricedItem.priceLookup;
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Enrich a single sources object in place: extract competitor prices from
 * SerpApi metadata first, then optionally fetch source pages for the rest.
 * @returns {Promise<object>} Stats about how prices were resolved.
 */
export async function enrichSourcePrices(sources, options = {}) {
  const { fetchPages = true, concurrency = 4, limit = Infinity, force = false } = options;
  const items = allFoundItems(sources);
  const uniqueByUrl = new Map();
  let metadataPrices = 0;

  for (const item of items) {
    if (force) {
      delete item.listedPrice;
      delete item.priceLookup;
    }
    if (!force && item.listedPrice) continue;
    const metadataPrice = priceFromExistingMetadata(item);
    if (metadataPrice) {
      item.listedPrice = metadataPrice;
      item.priceLookup = { status: "found", method: metadataPrice.source, checkedAt: metadataPrice.extractedAt };
      applyPriceToMatchingItems(sources, item);
      metadataPrices += 1;
      continue;
    }
    if (fetchPages && item.sourceUrl) {
      if (!uniqueByUrl.has(item.sourceUrl)) uniqueByUrl.set(item.sourceUrl, []);
      uniqueByUrl.get(item.sourceUrl).push(item);
    }
  }

  const sourceUrls = [...uniqueByUrl.keys()].slice(0, limit);
  let fetchedPrices = 0;
  let missingPrices = 0;
  let fetchErrors = 0;

  await mapLimit(sourceUrls, concurrency, async (sourceUrl) => {
    let price = null;
    let error = null;
    try {
      price = await fetchPagePrice(sourceUrl);
    } catch (fetchError) {
      error = fetchError.message;
    }
    for (const item of uniqueByUrl.get(sourceUrl) || []) {
      if (price) {
        item.listedPrice = price;
        item.priceLookup = { status: "found", method: price.source, checkedAt: price.extractedAt };
        fetchedPrices += 1;
      } else if (error) {
        item.priceLookup = { status: "error", error, checkedAt: new Date().toISOString() };
        fetchErrors += 1;
      } else {
        item.priceLookup = { status: "not_found", checkedAt: new Date().toISOString() };
        missingPrices += 1;
      }
    }
  });

  for (const item of allFoundItems(sources)) applyPriceToMatchingItems(sources, item);

  return { metadataPrices, uniquePagesFetched: sourceUrls.length, fetchedPrices, missingPrices, fetchErrors };
}

function quantile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Charm-price rounding: returns a competitive ".99" style endpoint.
 */
function charmPrice(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value < 20) return Math.max(0, Math.round(value) - 0.01) || Math.floor(value) + 0.99;
  if (value < 200) return Math.round(value) - 0.01;
  // Larger items: round to the nearest $5 then drop a cent.
  return Math.round(value / 5) * 5 - 0.01;
}

function formatUsd(amount) {
  if (amount == null || !Number.isFinite(amount)) return "";
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Compute a competitive marketplace list price from the competitor prices that
 * were extracted into a sources object. All prices are normalized to USD.
 */
export function computePricingRecommendation(sources) {
  const items = allFoundItems(sources);
  const points = [];
  for (const item of items) {
    const lp = item.listedPrice;
    if (!lp || lp.amount == null) continue;
    const usd = toUsd(lp.amount, lp.currency || "USD");
    if (usd == null || !Number.isFinite(usd) || usd < 10 || usd > 100000) continue;
    points.push({
      usd,
      display: lp.display,
      currency: lp.currency || "USD",
      amount: lp.amount,
      domain: item.sourceDomain || "",
      sourceUrl: item.sourceUrl || "",
    });
  }

  if (points.length === 0) return { count: 0, points: [] };

  const sorted = points.map((point) => point.usd).sort((left, right) => left - right);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p25 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const p75 = quantile(sorted, 0.75);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;

  // Competitive target: undercut the median while staying anchored above the
  // 25th percentile so we keep margin and don't bottom out on outliers.
  const target = Math.max(p25, median * 0.92);
  const recommended = charmPrice(target);
  const rangeLow = charmPrice(Math.max(min, p25 * 0.95));
  const rangeHigh = charmPrice(Math.min(median, p75));

  return {
    count: points.length,
    currency: "USD",
    min,
    p25,
    median,
    mean,
    p75,
    max,
    target,
    recommended,
    rangeLow,
    rangeHigh,
    points: points.sort((left, right) => left.usd - right.usd),
    format: formatUsd,
  };
}

export { formatUsd };
