# SEO Verification & Testing Checklist

> Use this checklist after each implementation phase to confirm correctness before moving on.

---

## Phase 1: Core Metadata & Branding

### Automated Checks

- [ ] Build completes without errors: `cd storefront && npm run build`
- [ ] No TypeScript errors in modified files

### Manual Checks — View Page Source

For each page type, open in browser → View Page Source → verify:

#### Homepage (`/us`)
- [ ] `<title>` contains "Elvato" (not "Medusa Store")
- [ ] `<meta name="description">` is present and descriptive
- [ ] `<meta property="og:site_name" content="Elvato">`
- [ ] `<meta property="og:type" content="website">`
- [ ] `<meta name="twitter:card" content="summary_large_image">`
- [ ] `<link rel="canonical">` is present with absolute URL

#### Product Page (`/us/products/{any-handle}`)
- [ ] `<title>` ends with "| Elvato" (not "| Medusa Store")
- [ ] `<meta name="description">` uses product description, not title
- [ ] `<meta property="og:title">` matches page title
- [ ] `<meta property="og:description">` is descriptive
- [ ] `<meta property="og:image">` is present (product thumbnail)
- [ ] `<link rel="canonical">` points to correct URL
- [ ] No "Medusa Store" text in any meta tag

#### Collection Page (`/us/collections/{any-handle}`)
- [ ] `<title>` ends with "| Elvato"
- [ ] `<meta name="description">` is descriptive (not just "collection")
- [ ] `<link rel="canonical">` is present

#### Category Page (`/us/categories/{any-handle}`)
- [ ] `<title>` does NOT contain double branding (e.g., "| Elvato | Elvato")
- [ ] `<link rel="canonical">` is an absolute URL (not relative path)

#### noindex Pages
- [ ] Cart (`/us/cart`): `<meta name="robots" content="noindex, nofollow">`
- [ ] Account Login: `<meta name="robots" content="noindex, nofollow">`
- [ ] Demo: `<meta name="robots" content="noindex, nofollow">`

---

## Phase 2: Sitemap & robots.txt

### Sitemap Checks

- [ ] `https://elvato.shop/sitemap.xml` returns valid XML (HTTP 200)
- [ ] Sitemap contains homepage URL: `https://elvato.shop/us`
- [ ] Sitemap contains product URLs: `https://elvato.shop/us/products/{handle}`
- [ ] Sitemap contains collection URLs: `https://elvato.shop/us/collections/{handle}`
- [ ] Sitemap contains category URLs: `https://elvato.shop/us/categories/{handle}`
- [ ] Sitemap contains static pages: `/about`, `/store`, `/design-services`, `/how-it-works`
- [ ] Sitemap does NOT contain: `/cart`, `/checkout`, `/account`, `/demo`, `/order`
- [ ] `<lastmod>` dates are present and reasonable
- [ ] Total URL count is reasonable (expect 800+ products + collections + categories + static)
- [ ] Validate with: https://www.xml-sitemaps.com/validate-xml-sitemap.html

### robots.txt Checks

- [ ] `https://elvato.shop/robots.txt` returns valid text (HTTP 200)
- [ ] Contains `User-agent: *`
- [ ] Contains `Allow: /`
- [ ] Contains `Disallow: /checkout`
- [ ] Contains `Disallow: /account`
- [ ] Contains `Disallow: /cart`
- [ ] Contains `Disallow: /demo`
- [ ] Contains `Disallow: /order/`
- [ ] Contains `Sitemap: https://elvato.shop/sitemap.xml`

### Cleanup

- [ ] `next-sitemap.js` removed from storefront
- [ ] No stale `public/sitemap*.xml` or `public/robots.txt` files
- [ ] No `next-sitemap` in `package.json` dependencies

---

## Phase 3: JSON-LD Structured Data

### Google Rich Results Test

Use https://search.google.com/test/rich-results for each:

#### Product Page
- [ ] Valid `Product` schema detected
- [ ] `name` matches product title
- [ ] `description` is present
- [ ] `image` URLs resolve (not broken)
- [ ] `offers` array present with at least one offer
- [ ] Each offer has `price`, `priceCurrency`, `availability`
- [ ] `availability` correctly reflects stock status (InStock / OutOfStock)
- [ ] No errors or warnings in Rich Results Test

#### Root Layout (any page)
- [ ] Valid `Organization` schema detected
- [ ] `name` = "Elvato"
- [ ] `url` = "https://elvato.shop"
- [ ] `logo` URL resolves

- [ ] Valid `WebSite` schema detected
- [ ] `SearchAction` target URL template is correct

#### Category Page
- [ ] Valid `BreadcrumbList` schema detected
- [ ] Breadcrumb items in correct order (Home → Shop → Category)
- [ ] All `item` URLs are valid

### Schema.org Validator

For deeper validation: https://validator.schema.org/
- [ ] Paste page URL → no critical errors

---

## Phase 4: Open Graph & Twitter

### OG Preview Tools

Test each page type with https://www.opengraph.xyz/ :

- [ ] Homepage shows branded card with title, description, image
- [ ] Product page shows product name, description, product image
- [ ] Collection page shows collection name and description
- [ ] About page shows relevant title and description

### Twitter Card Validator

Test with https://cards-dev.twitter.com/validator :
- [ ] Product page shows `summary_large_image` card
- [ ] Image displays correctly (not broken, not cropped oddly)
- [ ] Title and description are rendered

### Facebook Sharing Debugger

Test with https://developers.facebook.com/tools/debug/ :
- [ ] OG tags detected correctly
- [ ] Image preview renders
- [ ] No warnings about missing tags

---

## Phase 5: Google Analytics & Search Console

### Google Analytics

- [ ] `@next/third-parties` installed in `package.json`
- [ ] `NEXT_PUBLIC_GA_ID` set in Vercel env (production)
- [ ] GA script only loads in production (not dev)
- [ ] Visit site in production → open GA4 → Real-time → confirm page_view events appear
- [ ] Navigate between pages → confirm client-side transitions log events
- [ ] Check no script in local dev (`NODE_ENV !== "production"`)

### Google Search Console

- [ ] Property added: `https://elvato.shop`
- [ ] Verification method: HTML meta tag
- [ ] `verification.google` set in root layout metadata
- [ ] Verification successful in GSC dashboard
- [ ] Sitemap submitted: `https://elvato.shop/sitemap.xml`
- [ ] Sitemap status shows "Success" (may take a few hours)
- [ ] Request indexing for: homepage, 2-3 top collections, 5 top products

---

## Phase 6: Advanced

### Image Alt Text

Spot-check 10 product pages:
- [ ] Product thumbnails have descriptive `alt` text (product title)
- [ ] Image gallery images have meaningful `alt` (not empty or "image")
- [ ] Homepage hero images have descriptive `alt`

### Lighthouse SEO Audit

Run Lighthouse (Chrome DevTools → Lighthouse → SEO category) on:

- [ ] Homepage: score ≥ 90
- [ ] A product page: score ≥ 90
- [ ] A collection page: score ≥ 90
- [ ] A category page: score ≥ 90

Common Lighthouse SEO failures to watch for:
- Missing meta description
- Links without descriptive text
- Images without alt attributes
- Page not crawlable (blocked by robots)
- Invalid canonical URL

### Core Web Vitals

Check Vercel Speed Insights dashboard after deployment:

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] INP (Interaction to Next Paint) < 200ms

If any metric is poor, investigate:
- LCP: check if hero images have `priority` prop on `<Image>`
- CLS: check for elements that shift on load (fonts, images without dimensions)
- INP: profile with Chrome DevTools → Performance panel

---

## Ongoing Monitoring

### Weekly (after all phases complete)

- [ ] Check GSC Coverage report for new errors
- [ ] Review GSC Performance report: impressions, clicks, average position
- [ ] Review Vercel Speed Insights for Core Web Vitals regressions
- [ ] Check GA4 for traffic trends

### Monthly

- [ ] Re-run Lighthouse on key pages — confirm scores haven't degraded
- [ ] Validate sitemap still includes all new products/collections
- [ ] Test OG cards for any newly added pages
- [ ] Review GSC "Links" report for internal linking health
- [ ] Check for any 404 errors in GSC Coverage

### After Major Changes

After adding new pages, changing URL structure, or updating the product catalog:

- [ ] Verify new pages appear in sitemap
- [ ] Request indexing for new pages in GSC
- [ ] Test metadata on new pages (view source)
- [ ] Run Rich Results Test on any new page type
