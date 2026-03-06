# SEO Implementation Plan

**Domain:** `https://elvato.shop`  
**Storefront path:** `storefront/`  
**Approach:** Phased rollout — fix critical issues first, then layer in structured data, analytics, and advanced optimizations.

---

## Phase 1: Core Metadata & Branding

> **Goal:** Every page renders correct titles, descriptions, OG tags, and canonical URLs with "Elvato" branding.  
> **Blocked by:** Nothing — can start immediately.

### 1.1 Fix `getBaseURL()` fallback

**File:** `storefront/src/lib/util/env.ts`

Change the hardcoded fallback from `https://localhost:8000` to `https://elvato.shop` so that `metadataBase` resolves correctly in all environments.

```typescript
// BEFORE
export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}

// AFTER
export const getBaseURL = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://elvato.shop"
}
```

Also verify production environment has `NEXT_PUBLIC_BASE_URL=https://elvato.shop` set in Vercel dashboard.

---

### 1.2 Add default metadata template in root layout

**File:** `storefront/src/app/layout.tsx`

Add a comprehensive default metadata export that provides fallbacks for every page. The `template` pattern means child pages can export just `title: "About"` and it automatically becomes `"About | Elvato"`.

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Elvato | Contemporary Lighting for Your Next Project",
    template: "%s | Elvato",
  },
  description:
    "Shop contemporary, affordable lighting designs — pendants, chandeliers, ceiling, wall, floor & table lamps, outdoor lighting, and smart controls.",
  applicationName: "Elvato",
  openGraph: {
    siteName: "Elvato",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
}
```

**Why this matters:** With the `template` in place, child pages only need to export `title: "About"` and it renders as `"About | Elvato"`. Without it, each page must include the full brand name manually, leading to inconsistency (as we have now with "Medusa Store").

---

### 1.3 Fix "Medusa Store" → "Elvato" on dynamic pages

#### Product pages

**File:** `storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`

```typescript
// BEFORE
return {
  title: `${product.title} | Medusa Store`,
  description: `${product.title}`,
  openGraph: {
    title: `${product.title} | Medusa Store`,
    description: `${product.title}`,
    images: product.thumbnail ? [product.thumbnail] : [],
  },
}

// AFTER
const description = product.description
  ? product.description.slice(0, 155).replace(/\s+\S*$/, "…")
  : `Shop ${product.title} at Elvato — contemporary lighting delivered to your door.`

return {
  title: product.title,  // template adds " | Elvato"
  description,
  openGraph: {
    title: product.title,
    description,
    type: "website",
    images: product.thumbnail
      ? [{ url: product.thumbnail, width: 1200, height: 630, alt: product.title }]
      : [],
  },
  twitter: {
    card: "summary_large_image",
    title: product.title,
    description,
    images: product.thumbnail ? [product.thumbnail] : [],
  },
  alternates: {
    canonical: `/${params.countryCode}/products/${handle}`,
  },
}
```

#### Collection pages

**File:** `storefront/src/app/[countryCode]/(main)/collections/[handle]/page.tsx`

```typescript
// AFTER
return {
  title: collection.title,
  description: `Shop the ${collection.title} collection at Elvato — contemporary lighting for every space.`,
  openGraph: {
    title: collection.title,
    description: `Shop the ${collection.title} collection at Elvato.`,
  },
  alternates: {
    canonical: `/${params.countryCode}/collections/${params.handle}`,
  },
}
```

#### Category pages

**File:** `storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`

```typescript
// BEFORE (BUGGY — title doubled)
const title = productCategory.name + " | Medusa Store"
return {
  title: `${title} | Medusa Store`,   // "Pendants | Medusa Store | Medusa Store"
  description,
  alternates: {
    canonical: `${params.category.join("/")}`,  // relative
  },
}

// AFTER
return {
  title: productCategory.name,  // template adds " | Elvato"
  description: productCategory.description
    ?? `Shop ${productCategory.name} lighting at Elvato — contemporary designs for your space.`,
  alternates: {
    canonical: `/${params.countryCode}/categories/${params.category.join("/")}`,
  },
}
```

#### Account login page

**File:** `storefront/src/app/[countryCode]/(main)/account/@login/page.tsx`

```typescript
// BEFORE
description: "Sign in to your Medusa Store account."

// AFTER
description: "Sign in to your Elvato account."
```

---

### 1.4 Add canonical URLs to static pages

Add `alternates.canonical` to every static page. With `metadataBase` set, relative paths are resolved to absolute URLs automatically by Next.js.

| File | Canonical |
|------|-----------|
| Homepage `page.tsx` | `/${countryCode}` |
| About `about/page.tsx` | `/${countryCode}/about` |
| Store `store/page.tsx` | `/${countryCode}/store` |
| Design Services `design-services/page.tsx` | `/${countryCode}/design-services` |

**Note:** For static pages that don't have access to `params.countryCode`, the canonical can default to the `/us/` prefix or be omitted (the root layout's `metadataBase` will handle the domain portion).

---

### 1.5 Mark non-indexable pages as `noindex`

These pages should not appear in search results:

```typescript
// Cart, Account, Checkout, Demo, Order pages
export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
}
```

**Pages to mark `noindex`:**
- `cart/page.tsx`
- `account/@login/page.tsx`
- `account/@dashboard/page.tsx` (and all dashboard sub-pages)
- `(checkout)/checkout/page.tsx`
- `demo/page.tsx`
- `order/[id]/confirmed/page.tsx`
- `order/[id]/transfer/*/page.tsx`

---

## Phase 2: Sitemap & robots.txt

> **Goal:** Replace legacy `next-sitemap.js` with native App Router `sitemap.ts` and `robots.ts` that dynamically generate from live data.  
> **Blocked by:** Nothing — can run in parallel with Phase 1.

### 2.1 Create `storefront/src/app/sitemap.ts`

Generate a dynamic sitemap that queries Medusa for all products, collections, and categories.

```typescript
import { MetadataRoute } from "next"
import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = "https://elvato.shop"

  // Get all country codes
  const regions = await listRegions()
  const countryCodes = regions
    .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
    .filter(Boolean)

  const defaultCountry = "us"

  // Static pages (for default country only)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/${defaultCountry}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/${defaultCountry}/store`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/${defaultCountry}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/${defaultCountry}/design-services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/${defaultCountry}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  // Products (for default country)
  const { response } = await listProducts({
    countryCode: defaultCountry,
    queryParams: { limit: 1000, fields: "handle,updated_at" },
  })
  const productPages: MetadataRoute.Sitemap = response.products.map((p) => ({
    url: `${BASE_URL}/${defaultCountry}/products/${p.handle}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Collections
  const { collections } = await listCollections({ fields: "handle" })
  const collectionPages: MetadataRoute.Sitemap = (collections ?? []).map((c) => ({
    url: `${BASE_URL}/${defaultCountry}/collections/${c.handle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // Categories
  const categories = await listCategories()
  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${BASE_URL}/${defaultCountry}/categories/${cat.handle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...collectionPages, ...categoryPages]
}
```

**Scaling note:** If the sitemap grows beyond 50,000 URLs (800+ products × multiple countries), implement `generateSitemaps()` to produce a sitemap index with multiple child sitemaps. See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps

---

### 2.2 Create `storefront/src/app/robots.ts`

```typescript
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: [
        "/checkout",
        "/account",
        "/cart",
        "/demo",
        "/order/",
      ],
    },
    sitemap: ["https://elvato.shop/sitemap.xml"],
  }
}
```

---

### 2.3 Deprecate `next-sitemap.js`

1. Remove `storefront/next-sitemap.js`
2. Remove any `next-sitemap` postbuild script from `storefront/package.json`
3. Remove `next-sitemap` package if installed: `npm uninstall next-sitemap`
4. Delete any generated `public/sitemap*.xml` and `public/robots.txt` files from previous builds

---

## Phase 3: JSON-LD Structured Data

> **Goal:** Add machine-readable structured data so search engines can display rich results (price, availability, ratings, breadcrumbs).  
> **Blocked by:** Phase 1 (needs correct brand/URL values).

### 3.1 Create reusable `JsonLd` component

**File:** `storefront/src/modules/seo/json-ld.tsx`

A thin component that serializes any schema.org object as a `<script type="application/ld+json">` tag. Server-rendered — no client-side JS required.

```typescript
type JsonLdProps = {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

---

### 3.2 Product schema

**Where:** Product detail page or `ProductTemplate` component.

Use data already fetched by the page — no additional API calls needed.

```typescript
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.title,
  description: product.description,
  image: product.images?.map((i) => i.url) ?? [],
  sku: product.variants?.[0]?.sku ?? product.id,
  brand: {
    "@type": "Brand",
    name: "Elvato",
  },
  offers: product.variants?.map((v) => ({
    "@type": "Offer",
    url: `https://elvato.shop/${countryCode}/products/${product.handle}?v_id=${v.id}`,
    priceCurrency: region.currency_code?.toUpperCase() ?? "USD",
    price: v.calculated_price?.calculated_amount
      ? (v.calculated_price.calculated_amount / 100).toFixed(2)
      : undefined,
    availability: (v.inventory_quantity ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
  })) ?? [],
}
```

**Fields map:**

| Schema field | Medusa source |
|-------------|---------------|
| `name` | `product.title` |
| `description` | `product.description` |
| `image` | `product.images[].url` |
| `sku` | `product.variants[0].sku` or `product.id` |
| `price` | `variant.calculated_price.calculated_amount / 100` |
| `priceCurrency` | `region.currency_code` |
| `availability` | `variant.inventory_quantity > 0` → `InStock` / `OutOfStock` |

---

### 3.3 Organization schema

**Where:** Root layout (`storefront/src/app/layout.tsx`) — renders on every page.

```typescript
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Elvato",
  url: "https://elvato.shop",
  logo: "https://elvato.shop/brand/elvato-logo.png",
  description: "Contemporary lighting retailer — pendants, chandeliers, ceiling, wall, floor & table lamps.",
  sameAs: [
    // Add social media URLs when accounts are created
  ],
}
```

---

### 3.4 WebSite schema with SearchAction

**Where:** Root layout — enables sitelinks search box in Google SERPs.

```typescript
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Elvato",
  url: "https://elvato.shop",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://elvato.shop/us/store?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
}
```

---

### 3.5 BreadcrumbList schema

**Where:** Category pages — renders breadcrumb trail for SERPs.

```typescript
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://elvato.shop/us" },
    { "@type": "ListItem", position: 2, name: "Categories", item: "https://elvato.shop/us/store" },
    { "@type": "ListItem", position: 3, name: categoryName, item: `https://elvato.shop/us/categories/${categoryHandle}` },
  ],
}
```

---

## Phase 4: Open Graph & Twitter Enrichment

> **Goal:** Every shared link displays a rich social card with title, description, and image.  
> **Blocked by:** Phase 1 (needs correct metadata values).

### What Next.js does automatically

- The static files `opengraph-image.jpg` and `twitter-image.jpg` in `storefront/src/app/` provide automatic fallback images for any page without explicit OG config
- When `openGraph` is defined in `generateMetadata`, it overrides the static fallback
- The root layout's `openGraph.siteName` and `twitter.card` provide defaults inherited by all pages

### Pages needing explicit OG metadata

| Page | `openGraph` needed | Notes |
|------|-------------------|-------|
| Homepage | `title`, `description`, `url`, `images` | Use hero image or brand image |
| Product | `title`, `description`, `images` (with dimensions), `type` | Already partially done — enrich |
| Collection | `title`, `description`, `images` | Use first product thumbnail |
| Category | `title`, `description` | Use default OG image |
| About | `title`, `description`, `images` | Use about hero image |
| Design Services | `title`, `description` | Use default OG image |
| Store | `title`, `description` | Use default OG image |

### Image requirements for OG/Twitter

- **Format:** PNG or JPG (some platforms don't support WebP for OG images)
- **Dimensions:** 1200×630px recommended for `summary_large_image`
- **Always include:** `alt` text, `width`, `height` in the image object

---

## Phase 5: Google Analytics & Search Console

> **Goal:** Track user behavior and monitor search performance.  
> **Blocked by:** Phase 2 (sitemap must exist before submitting to GSC).

### 5.1 Google Analytics 4

1. Create a GA4 property at https://analytics.google.com
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
3. Install `@next/third-parties`:
   ```bash
   cd storefront && npm install @next/third-parties
   ```
4. Add to root layout:
   ```typescript
   import { GoogleAnalytics } from "@next/third-parties/google"

   export default function RootLayout(props: { children: React.ReactNode }) {
     return (
       <html lang="en" data-mode="light">
         {process.env.NODE_ENV === "production" && (
           <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
         )}
         <body className={fraunces.variable}>
           {/* ... */}
         </body>
       </html>
     )
   }
   ```
5. Add `NEXT_PUBLIC_GA_ID` to Vercel environment variables

### 5.2 Google Search Console

1. Go to https://search.google.com/search-console
2. Add property → URL prefix → `https://elvato.shop`
3. Choose **HTML tag** verification method — copy the `content` value
4. Add to root layout metadata:
   ```typescript
   export const metadata: Metadata = {
     // ...existing...
     verification: {
       google: "YOUR_VERIFICATION_CODE",
     },
   }
   ```
5. Deploy and verify in GSC
6. Submit sitemap: **Sitemaps → Add → `https://elvato.shop/sitemap.xml`**
7. Request indexing for key pages: homepage, top collections, top product pages

### 5.3 Post-Setup Monitoring (GSC)

After verification, monitor these reports weekly:

| Report | What to check |
|--------|---------------|
| **Coverage** | Errors, warnings, excluded pages — fix any `noindex` mistakes |
| **Sitemaps** | Confirm all URLs discovered, no errors |
| **Core Web Vitals** | LCP, CLS, INP scores — correlate with Vercel Speed Insights |
| **Performance** | Impressions, clicks, CTR, average position — track over time |
| **Links** | Internal and external links — identify linking gaps |

---

## Phase 6: Advanced Optimizations

> **Goal:** Polish and refine after the fundamentals are in place.  
> **Blocked by:** Phases 1–5 completion.

### 6.1 Image alt text audit

Audit every `<Image>` component to ensure `alt` text is descriptive:

| Component | Current `alt` | Action |
|-----------|---------------|--------|
| `thumbnail/index.tsx` | `"Thumbnail"` or similar | Use `product.title` |
| `image-gallery/index.tsx` | Varies | Use `product.title + " - Image {n}"` |
| `product-preview/index.tsx` | Varies | Use `product.title` |
| Homepage hero images | Check manually | Describe the scene |

### 6.2 Hreflang for multi-region

If the storefront serves multiple countries (e.g., `/us/`, `/ca/`, `/gb/`), add hreflang to avoid duplicate content penalties:

```typescript
// In generateMetadata for dynamic pages
alternates: {
  canonical: `/${countryCode}/products/${handle}`,
  languages: {
    "en-US": `/us/products/${handle}`,
    "en-CA": `/ca/products/${handle}`,
    "en-GB": `/gb/products/${handle}`,
  },
}
```

**Decision:** Defer until we determine which country codes are actively used and how products/pricing differ per region.

### 6.3 Core Web Vitals focus areas

| Metric | Concern | Mitigation |
|--------|---------|------------|
| **LCP** (Largest Contentful Paint) | Hero image on homepage | Add `priority` prop to above-fold `<Image>` components |
| **CLS** (Cumulative Layout Shift) | Product images loading | Already handled by `next/image` width/height |
| **INP** (Interaction to Next Paint) | Variant selector, add-to-cart | Profile with DevTools; ensure no blocking JS |

### 6.4 Internal linking improvements

- Verify breadcrumb components use `<Link>` (not just styled `<span>`)
- Add "Related categories" links to product pages
- Add "You may also like" section with proper `<Link>` wrapping
- Ensure footer contains links to all major categories and static pages

### 6.5 Content quality

Product descriptions pulled from Medusa are often thin or duplicated across variants. For SEO:

- Unique, descriptive text for each product (minimum 100 words)
- Include material, dimensions, use-case context
- Avoid manufacturer copy that appears on other retailer sites (duplicate content penalty)

This may require a content enrichment workflow in Medusa admin or automated copy generation.

### 6.6 Future: Blog/content section

Adding `/{countryCode}/blog` or `/{countryCode}/guides` with lighting-related content (e.g., "How to Choose a Pendant for Your Kitchen Island") would:

- Target long-tail keywords
- Provide internal linking anchors to product and category pages
- Improve domain authority through linkable content

This is beyond the scope of the current plan but worth planning for.

---

## Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Core Metadata & Branding                          │
│  ├── 1.1  Fix getBaseURL() fallback                         │
│  ├── 1.2  Root layout metadata template                     │
│  ├── 1.3  Fix "Medusa Store" branding on all pages          │
│  ├── 1.4  Add canonical URLs to static pages                │
│  └── 1.5  Mark non-indexable pages as noindex               │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Sitemap & robots.txt (parallel with Phase 1)      │
│  ├── 2.1  Create app/sitemap.ts                             │
│  ├── 2.2  Create app/robots.ts                              │
│  └── 2.3  Deprecate next-sitemap.js                         │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: JSON-LD Structured Data                           │
│  ├── 3.1  Create JsonLd component                           │
│  ├── 3.2  Product schema on PDP                             │
│  ├── 3.3  Organization schema in root layout                │
│  ├── 3.4  WebSite + SearchAction in root layout             │
│  └── 3.5  BreadcrumbList on category pages                  │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: OG & Twitter enrichment                           │
│  ├── 4.1  Enhance product OG tags                           │
│  ├── 4.2  Add OG to collection pages                        │
│  └── 4.3  Add OG to static pages                            │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: Google Analytics & Search Console                 │
│  ├── 5.1  Install GA4                                       │
│  ├── 5.2  Set up GSC + submit sitemap                       │
│  └── 5.3  Begin weekly monitoring                           │
├─────────────────────────────────────────────────────────────┤
│  Phase 6: Advanced                                          │
│  ├── 6.1  Image alt text audit                              │
│  ├── 6.2  Hreflang for multi-region                         │
│  ├── 6.3  Core Web Vitals tuning                            │
│  ├── 6.4  Internal linking improvements                     │
│  ├── 6.5  Content quality / product descriptions            │
│  └── 6.6  Blog / content section                            │
└─────────────────────────────────────────────────────────────┘
```
