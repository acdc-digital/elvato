# SEO Indexing Recovery Plan

**Date:** April 2026
**Trigger:** Google Search Console reporting only **9 indexed / 8 not indexed** pages for `https://elvato.shop` (a storefront with 800+ products).
**Sitemap status:** ✅ Success — all canonical URLs are being discovered.
**Indexing health:** ❌ Critical — < 2% of catalog is in the index.

---

## 1. Current GSC Symptoms

| Report bucket | Count | Examples |
|---|---|---|
| Indexed | 9 | — |
| Not indexed | 8 | — |
| Page with redirect (failed) | several | `https://elvato.shop/products/modern-creative-bedside-table-lamp-for-living-room`, `http://elvato.shop/`, `https://elvato.shop/products/modern-led-balcony-ceiling-chandelier` |
| Server error 5xx | several | `https://elvato.shop/dk/products/moroccan-hand-woven-lantern-chandelier-15866624` |
| Discovered – currently not indexed | passed | (URLs known to Google but never crawled) |
| Crawled – currently not indexed | 0 | ✅ Good — Google is not rejecting crawled pages |

The combination tells us: **Google sees the URLs, attempts to fetch them, but the fetch outcome is hostile to indexing** (redirect chain, 5xx, or duplicate-content suppression).

---

## 2. Root Cause Analysis

### Cause 1 — GeoIP middleware redirect is unstable for crawlers

`storefront/src/middleware.ts` resolves the country code in this order:

1. `?countryCode` already in the URL path
2. `x-vercel-ip-country` header (Vercel GeoIP)
3. `NEXT_PUBLIC_DEFAULT_REGION` (`us`)

Googlebot crawls from many IPs — primarily US, but increasingly from EU, APAC, and Indian datacenters. So the same bare URL `https://elvato.shop/products/x` redirects to:

- `/us/products/x` from US IPs
- `/dk/products/x` from EU IPs (or whatever region first matches)
- `/gb/products/x` from UK IPs

**Consequences:**

- The "canonical destination" of a bare URL is non-deterministic → Google flags the bare URL as "Page with redirect" and never indexes it.
- The redirect can land Googlebot on a country (`/dk/...`) where the product has no pricing → product page throws → 5xx.
- External backlinks pointing at the bare URL leak crawl budget to redirects instead of going straight to the canonical.

### Cause 2 — Multi-country pages are duplicate content with no `hreflang`

The storefront supports several country prefixes (`/us/`, `/gb/`, `/dk/`, …) but **all of them render the same English copy** — only currency and shipping change. Without `hreflang` annotations and without a canonical pointing to a single version, Google treats `/dk/products/x`, `/us/products/x`, `/gb/products/x` as three near-duplicates and indexes at most one — usually none, because no signal tells it which to keep.

The sitemap emits only `/us/` URLs, but the country switcher (`country-select-compact.tsx`) and any `LocalizedClientLink` rendering exposes alternate-country URLs to crawlers via internal navigation, so Google still discovers and competes-on `/dk/...` and `/gb/...` versions.

### Cause 3 — Unhandled exceptions surface as 5xx

`generateMetadata` and page components in `products/[handle]`, `collections/[handle]`, and `categories/[...category]` call `getRegion`, `getCategoryByHandle`, `listProducts`, and `withCdnImages` without a top-level `try/catch` around the entire flow. If Medusa on Railway cold-starts, throttles, or the convex CDN call fails, the uncaught throw becomes a 500 to Googlebot. Repeated 5xx on a URL **demotes the whole site's crawl rate** — this is the most damaging signal of the four.

### Cause 4 — Sitemap is force-dynamic and single-country

`storefront/src/app/sitemap.ts` has `export const dynamic = "force-dynamic"`. Every Googlebot request to `/sitemap.xml` triggers fresh Medusa fetches for products + collections + categories + regions. If any of those is slow, the sitemap response slows or fails. Sitemap also emits zero `<xhtml:link rel="alternate" hreflang="...">` entries, so even if other-country URLs were valid, they'd be invisible to the multilingual index.

---

## 3. Strategy

**Goal:** Treat the default region (`us`) as the **single canonical surface** for the entire catalog. Other country prefixes continue to serve users (currency, shipping) but are explicitly de-duplicated for search engines via canonical + (optional) `hreflang`.

| Decision | Rationale |
|---|---|
| Drop GeoIP from the middleware redirect | Stable, deterministic destination for crawlers and shared links. UX impact is small — non-US users still get correct currency once they enter the site (cookie/region-update flow still works). |
| Always redirect bare URLs to `${DEFAULT_REGION}` | Matches Shopify/big-box-commerce convention. Preserves link equity to one canonical URL. |
| Set canonical on every dynamic page to the **default-country** version | Tells Google "ignore the `/dk/`, `/gb/` duplicates — index `/us/`". Eliminates duplicate-content suppression. |
| Add `hreflang` (incl. `x-default`) on dynamic pages | Optional but explicit. Helps Google select the right country for users who do search in Danish/UK Google. |
| Wrap `generateMetadata` and the page body in defensive `try/catch` | Convert any backend hiccup into a clean 404 (not 5xx). Removes the worst crawl-budget penalty. |
| Switch sitemap to ISR (`revalidate = 3600`) | Sitemap rebuild once per hour, served from cache to Googlebot. No more timeout risk. |
| Sitemap emits `<xhtml:link rel="alternate" hreflang>` per URL | Optional: makes country variants discoverable without polluting the canonical. |

We do **not** need to:

- Block `/dk/`, `/gb/` etc. with `noindex` (canonical does the job and preserves user value).
- Translate the storefront to add real hreflang value (yet).
- Add per-country sitemaps until indexed page count recovers above 500.

---

## 4. Action Plan (priority order)

### P0 — Stop the bleeding (deploy ASAP)

1. **`storefront/src/middleware.ts`** — Remove GeoIP from the redirect path. Always redirect bare URLs to `${DEFAULT_REGION}` with a 301. Continue to set the `_medusa_cache_id` cookie inline (no extra redirect).
2. **`storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`** — Wrap `generateMetadata` data fetches in `try/catch`. On any throw, return minimal metadata + `notFound()`. Same treatment for the page body around `withCdnImages`.
3. **`storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`** and **`collections/[handle]/page.tsx`** — Same `try/catch` discipline; never let a Medusa hiccup become a 5xx.

### P1 — Eliminate duplicate content (deploy same day)

4. **All three dynamic pages** — Change `alternates.canonical` to always point to the **default country** version, regardless of the visited country prefix. Use a relative path so `metadataBase` resolves it.
5. **Add `alternates.languages`** (hreflang map) on all three dynamic pages including `x-default`.

### P2 — Improve crawl efficiency

6. **`storefront/src/app/sitemap.ts`** — Replace `dynamic = "force-dynamic"` with `revalidate = 3600`. Wrap each fetch independently so a single failure doesn't blank the whole sitemap.
7. (Optional) Emit per-URL `alternates` so Google sees `hreflang` from the sitemap as well as the page.

### P3 — Submission hygiene (manual, in GSC)

8. After deploy, in **Google Search Console → URL Inspection** for one product URL: confirm the canonical is now `/us/products/...` and the page returns 200.
9. **Remove the old non-prefixed URLs** from the index using **Removals → Temporarily remove** on a few high-traffic offenders — clears up the "Page with redirect" report faster than waiting for Google to re-crawl.
10. **Re-submit the sitemap** to force a new discovery pass.
11. Use **URL Inspection → Request indexing** on 5–10 representative product pages to seed re-crawling.

---

## 5. Verification (after deploy)

Run these checks 24h after the deploy lands:

- [ ] `curl -I https://elvato.shop/products/any-handle` returns `301` → `https://elvato.shop/us/products/any-handle` (single hop, no `/dk/`).
- [ ] `curl -I https://elvato.shop/dk/products/missing-product` returns `404` (not 500).
- [ ] View source on `https://elvato.shop/dk/products/some-real-product` → `<link rel="canonical" href="https://elvato.shop/us/products/some-real-product">`.
- [ ] `https://elvato.shop/sitemap.xml` returns within 2 s and lists all `/us/` product URLs.
- [ ] In GSC URL Inspection on a known-bad URL: status changes from "Page with redirect" → "URL is on Google" or "URL is on Google, but has issues" within 1–2 weeks.
- [ ] In GSC Coverage report 7–14 days post-deploy: indexed page count rises from 9 toward the 500–800 range.

If indexed count remains stuck after 2 weeks despite 200 OK + canonical + sitemap, escalate by:

- Adding rendered-HTML breadcrumbs (`<nav>` with `<a>`) on every product page so Googlebot has multiple internal-link paths to each product (currently products are reachable mainly from collection pages).
- Adding a paginated `/us/store?page=N` index that emits all 800 product links in HTML (no JS required) so crawl reach is independent of category navigation.

---

## 6. Files Changed in This Recovery

| File | Change |
|---|---|
| `storefront/src/middleware.ts` | Drop GeoIP from redirect. Always send bare → `DEFAULT_REGION`. |
| `storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx` | `try/catch` in `generateMetadata`; canonical → default region; hreflang map. |
| `storefront/src/app/[countryCode]/(main)/collections/[handle]/page.tsx` | Same: `try/catch`, canonical → default, hreflang. |
| `storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx` | Same: `try/catch`, canonical → default, hreflang. |
| `storefront/src/app/sitemap.ts` | ISR (`revalidate = 3600`); per-fetch isolation. |
| `storefront/src/lib/util/seo.ts` *(new)* | Tiny helper that builds the canonical/hreflang map from a path + the configured regions. |

---

## 7. Open Questions for Future Iterations

- Should non-default country pages be `noindex` instead of canonicalized? (Currently chose canonical because it preserves PageRank flow; revisit if Google still struggles.)
- Add real translations per region to make hreflang valuable? (Outside SEO scope.)
- Build a paginated, crawlable `/us/store/index/page-N` set (no JS) once indexed count recovers — this is the standard pattern for catalogs > 1000 items.
