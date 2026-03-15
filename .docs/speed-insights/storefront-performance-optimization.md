# Storefront Performance Optimization

**Date:** March 15, 2026  
**Scope:** `storefront/` — Next.js 15 App Router  
**Deployment:** Vercel  

---

## Baseline Metrics (Pre-Optimization)

| Metric | P75 Value | Target | Status |
|--------|-----------|--------|--------|
| Real Experience Score (RES) | 66 | ≥ 90 | Needs Improvement |
| First Contentful Paint (FCP) | 3.92 s | ≤ 1.8 s | Poor |
| Largest Contentful Paint (LCP) | 4.91 s | ≤ 2.5 s | Poor |

See [Speed-Insights.md](Speed-Insights.md), [FCP.md](FCP.md), and [LCP.md](LCP.md) for metric definitions and measurement methodology.

---

## Root Cause Analysis

### 1. SSR Data Fetching Waterfalls

The main layout (`app/[countryCode]/(main)/layout.tsx`) executed four sequential server-side fetches before any HTML could be streamed:

```
retrieveCustomer() → retrieveCart() → listRegions() → listCartOptions()
```

Each fetch waited for the previous one to complete, adding ~200–400 ms per hop. The homepage compounded this with an additional sequential loop — each product rail fetched its own collection data one at a time (5–6 collections × ~150 ms each).

### 2. No Caching or Static Generation

- **Product pages** used `export const dynamic = "force-dynamic"`, forcing full SSR on every request — no ISR, no CDN caching.
- **Homepage and store pages** had no `revalidate` export, defaulting to dynamic rendering.
- **Product detail pages** made duplicate `listProducts()` calls — once in `generateMetadata()` and again in the page component.

### 3. Unoptimized Images

- **Hero section** used 11+ bare `<img>` tags (no Next.js `<Image>`). The main hero JPG (`hero-2.jpg`) was the LCP element and was not preloaded, not served in WebP/AVIF format, and had no responsive `srcset`.
- **Secondary hero** had 7 bare `<img>` tags for product tile PNGs and SVGs.
- **Product image gallery** used Next.js `<Image>` but with the `unoptimized` prop, bypassing all optimization (no format conversion, no srcset generation).
- **Decorative overlays** (crinkle SVGs) had no `loading="lazy"`, loading eagerly even though they are off-screen or below-fold.

### 4. Oversized Client Bundles

- **Full lodash import** (`import { isEqual, pick } from "lodash"`) pulled the entire ~70 KB (gzipped) lodash library into three separate client chunks for three utility functions.
- **Hero component** had `"use client"` despite requiring no client-side interactivity (useState, useEffect, event handlers). It used `<style jsx>` for ticker animations, which forced the client directive.
- **Dead dependencies**: `react-instantsearch` and `@types/react-instantsearch-dom` were installed but never imported anywhere — the codebase uses MeiliSearch directly.
- **Unused homepage imports**: `ProductGrid` and `PhotoGrid` were imported but commented out in JSX.

---

## Implementation

### Phase 1: SSR Waterfall Elimination

**Goal:** Reduce server-side data fetching time by parallelizing independent requests and deferring personalized data behind Suspense boundaries.

#### 1.1 Layout — Suspense Streaming for Personalized Data

**File:** `storefront/src/app/[countryCode]/(main)/layout.tsx`

**Before:** Four sequential fetches blocked the entire shell:
```ts
const customer = await retrieveCustomer()
const cart = await retrieveCart()
const regions = await listRegions()
const cartOptions = await listCartOptions()
// Only then: render Nav, children, Footer
```

**After:** Only `listRegions()` remains in the critical path (needed for the Nav's country selector). Customer and cart data were extracted into a `PersonalizedBanners` async component wrapped in `<Suspense>`:

```tsx
async function PersonalizedBanners({ countryCode }: { countryCode: string }) {
  const [customer, cart] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
  ])
  // renders SaleBanner, AnnouncementBanner, etc.
}

// In layout:
<Suspense fallback={null}>
  <PersonalizedBanners countryCode={countryCode} />
</Suspense>
<Nav />
{children}
<Footer />
```

**Impact:** The HTML shell (Nav + page content + Footer) streams immediately while personalized banners load in parallel. Removes ~400–800 ms from TTFB/FCP.

#### 1.2 FeaturedProducts — Parallel Collection Fetching

**File:** `storefront/src/modules/home/components/featured-products/index.tsx`

**Before:** Each collection's products were fetched sequentially in a loop:
```ts
for (const collection of collections) {
  const products = await listProducts({ collection_id: [collection.id] })
  // render ProductRail
}
```

**After:** All collections fetched in parallel via `Promise.all`, followed by a single batched thumbnail prefetch:
```ts
const railData = await Promise.all(
  collections.map(async (collection) => {
    const { response } = await listProducts({
      queryParams: { collection_id: [collection.id], limit: 12 },
    })
    return { collection, products: response.products }
  })
)

const allHandles = railData.flatMap(({ products }) =>
  products.map((p) => p.handle).filter(Boolean)
) as string[]
await prefetchThumbnails(allHandles)
```

**Impact:** 5 sequential API calls → 1 parallel batch. Saves ~600–750 ms on homepage.

#### 1.3 ProductRail — Accept Pre-fetched Data

**File:** `storefront/src/modules/home/components/featured-products/product-rail/index.tsx`

Added an optional `products?: HttpTypes.StoreProduct[]` prop so the parent can pass pre-fetched data, with a fallback self-fetch for standalone usage.

#### 1.4 Product Page — Request Deduplication

**File:** `storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`

**Before:** `generateMetadata()` and the page component each called `listProducts()` separately — two identical API requests per product page render.

**After:** Wrapped in `React.cache()`:
```ts
const getProduct = cache(async (handle: string, regionId: string) => {
  const { response } = await listProducts({ /* ... */ })
  return response.products
})
```

Both `generateMetadata()` and the page component call `getProduct()` — React deduplicates to a single network request.

---

### Phase 2: Caching & Static Generation

**Goal:** Enable ISR (Incremental Static Regeneration) and CDN caching to serve pre-rendered pages from the edge.

#### 2.1 Product Pages — ISR + Static Params

**File:** `storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`

- Removed `export const dynamic = "force-dynamic"`
- Added `export const revalidate = 300` (5-minute ISR)
- Added `generateStaticParams()` to pre-render the top 100 products across all regions at build time:

```ts
export async function generateStaticParams() {
  const { regions } = await listRegions()
  const countryCodes = regions
    .map((r) => r.countries?.map((c) => c.iso_2))
    .flat()
    .filter(Boolean) as string[]

  const { response } = await listProducts({
    queryParams: { limit: 100, fields: "handle" },
  })

  return response.products.flatMap((product) =>
    countryCodes.map((countryCode) => ({
      countryCode,
      handle: product.handle,
    }))
  )
}
```

**Impact:** Product pages served from CDN cache after first visit. Cold miss → ISR regeneration within 5 minutes.

#### 2.2 Homepage & Store — ISR

**Files:**
- `storefront/src/app/[countryCode]/(main)/page.tsx` — added `export const revalidate = 300`
- `storefront/src/app/[countryCode]/(main)/store/page.tsx` — added `export const revalidate = 300`

Homepage data fetches also parallelized:
```ts
const [region, { collections }] = await Promise.all([
  getRegion(countryCode),
  listCollections({ fields: "id, handle, title" }),
])
```

#### 2.3 CDN Preconnect Hints

**File:** `storefront/src/app/layout.tsx`

Added early DNS/connection hints for external origins used by product images:
```html
<link rel="preconnect" href="https://elvatoStorage-CDN.b-cdn.net" />
<link rel="dns-prefetch" href="https://elvatoStorage-CDN.b-cdn.net" />
<link rel="dns-prefetch" href="https://cjdropshipping.com" />
```

**Impact:** Eliminates DNS lookup + TLS handshake latency (~100–200 ms) for the first image request to Bunny CDN.

---

### Phase 3: Image Optimization

**Goal:** Leverage Next.js image optimization pipeline for automatic WebP/AVIF conversion, responsive srcsets, and lazy loading.

#### 3.1 Hero Section — LCP Fix

**File:** `storefront/src/modules/home/components/hero/index.tsx`

The main hero image (`hero-2.jpg`) is the LCP element on the homepage. Converted from bare `<img>` to Next.js `<Image>` with `priority`:

```tsx
<Image
  src="/hero/hero-2.jpg"
  alt="Elvato"
  fill
  priority
  sizes="(max-width: 1024px) 100vw, 50vw"
  className="object-cover"
  style={{ objectPosition: '30% center' }}
/>
```

The `priority` prop triggers a `<link rel="preload">` in the document head, ensuring the LCP element begins downloading immediately.

Decorative crinkle overlay SVG received `loading="lazy"` to prevent it from competing with the hero image for bandwidth.

#### 3.2 Secondary Hero — Below-Fold Tiles

**File:** `storefront/src/modules/home/components/secondary-hero/index.tsx`

Converted 5 control product tile PNGs from bare `<img>` to `<Image fill sizes="10vw">`, enabling:
- Automatic WebP/AVIF format negotiation
- Responsive srcset generation (multiple resolutions)
- Proper dimension-based loading

The controls hero SVG and crinkle overlay SVG both received `loading="lazy"` since this entire section is below the fold.

#### 3.3 Product Image Gallery — Removed `unoptimized`

**File:** `storefront/src/modules/products/components/image-gallery/index.tsx`

The gallery was using Next.js `<Image>` but with the `unoptimized` prop on both the main image and thumbnails, which completely bypasses the optimization pipeline. Removed `unoptimized` from both:

- **Main image:** Retains `priority` for above-fold loading, now gets WebP/AVIF conversion
- **Thumbnails:** Now get `sizes="80px"` optimization, served at appropriate resolution

**Impact:** Every product detail page now serves optimized images. For a typical product with 5 images, this reduces total image payload by ~40–60%.

---

### Phase 4: Bundle Size Optimization

**Goal:** Reduce client-side JavaScript payload by eliminating unnecessary dependencies, converting components to server components, and cleaning dead code.

#### 4.1 Lodash Removal

Three files imported from the full `lodash` bundle (~70 KB gzipped). Each was replaced with native JavaScript:

**`storefront/src/lib/util/compare-addresses.ts`**

Before (lodash `isEqual` + `pick`):
```ts
import { isEqual, pick } from "lodash"
export default function compareAddresses(address1: any, address2: any) {
  return isEqual(pick(address1, [...fields]), pick(address2, [...fields]))
}
```

After (native field comparison):
```ts
const ADDRESS_FIELDS = ["first_name", "last_name", "address_1", ...] as const
export default function compareAddresses(address1: any, address2: any) {
  return ADDRESS_FIELDS.every((f) => address1?.[f] === address2?.[f])
}
```

**`storefront/src/modules/checkout/components/shipping-address/index.tsx`**

Before (lodash `mapKeys`):
```ts
mapKeys(formData, (_, key) => key.replace("shipping_address.", ""))
```

After (native `Object.fromEntries` + `Object.entries`):
```ts
Object.fromEntries(
  Object.entries(formData).map(([key, value]) => [
    key.replace("shipping_address.", ""),
    value,
  ])
)
```

**`storefront/src/modules/products/components/product-actions/index.tsx`**

Before (lodash `isEqual` for variant matching):
```ts
return isEqual(variantOptions, options)
```

After (native shallow comparison — these are flat string-keyed maps):
```ts
const keys = Object.keys(variantOptions)
return (
  keys.length === Object.keys(options).length &&
  keys.every((k) => variantOptions[k] === options[k])
)
```

#### 4.2 Hero → Server Component

**File:** `storefront/src/modules/home/components/hero/index.tsx`

The Hero component had `"use client"` solely because it used `<style jsx>` for ticker animation keyframes. The component has no interactive features (no useState, useEffect, or event handlers).

**Changes:**
1. Removed `"use client"` directive — Hero is now a server component (zero JS shipped)
2. Removed `<style jsx>` block entirely
3. Moved ticker keyframes and animation utilities to Tailwind config:

**`storefront/tailwind.config.js`** — added:
```js
keyframes: {
  ticker: {
    "0%": { transform: "translateX(0%)" },
    "100%": { transform: "translateX(-50%)" },
  },
  "ticker-vertical": {
    "0%": { transform: "translateY(0%)" },
    "100%": { transform: "translateY(-50%)" },
  },
},
animation: {
  ticker: "ticker 32s infinite linear",
  "ticker-vertical": "ticker-vertical 20s infinite linear",
},
```

The `animate-ticker` and `animate-ticker-vertical` Tailwind classes now work without any client-side CSS injection.

#### 4.3 Dead Dependencies Removed

Uninstalled from `storefront/package.json`:

| Package | Reason |
|---------|--------|
| `lodash` | Replaced with native JS (see 4.1) |
| `@types/lodash` | No longer needed |
| `react-instantsearch` | Never imported — codebase uses MeiliSearch directly |
| `@types/react-instantsearch-dom` | Unused type definitions |

#### 4.4 Dead Imports Cleaned

**File:** `storefront/src/app/[countryCode]/(main)/page.tsx`

Removed unused imports for `ProductGrid` and `PhotoGrid` — both components were imported but commented out in JSX with TODO notes.

---

## Files Modified

| File | Phase | Changes |
|------|-------|---------|
| `app/[countryCode]/(main)/layout.tsx` | 1 | Suspense streaming, parallel customer/cart fetch |
| `modules/home/components/featured-products/index.tsx` | 1 | Parallel collection fetching via Promise.all |
| `modules/home/components/featured-products/product-rail/index.tsx` | 1 | Accept pre-fetched products prop |
| `app/[countryCode]/(main)/products/[handle]/page.tsx` | 1, 2 | React.cache dedup, ISR, generateStaticParams |
| `app/[countryCode]/(main)/page.tsx` | 2, 4 | ISR, parallel fetches, removed dead imports |
| `app/[countryCode]/(main)/store/page.tsx` | 2 | ISR (revalidate=300) |
| `app/layout.tsx` | 2 | CDN preconnect hints |
| `modules/home/components/hero/index.tsx` | 3, 4 | Next/Image with priority, server component conversion |
| `modules/home/components/secondary-hero/index.tsx` | 3 | Next/Image for tiles, lazy loading overlays |
| `modules/products/components/image-gallery/index.tsx` | 3 | Removed unoptimized prop |
| `lib/util/compare-addresses.ts` | 4 | Native field comparison |
| `modules/checkout/components/shipping-address/index.tsx` | 4 | Native Object.fromEntries |
| `modules/products/components/product-actions/index.tsx` | 4 | Native shallow object comparison |
| `tailwind.config.js` | 4 | Ticker keyframes + animations |
| `package.json` | 4 | Removed lodash, react-instantsearch, types |

All paths relative to `storefront/src/`.

---

## Expected Impact

| Optimization | Estimated Savings |
|-------------|-------------------|
| Layout Suspense streaming | −400–800 ms FCP/TTFB |
| Parallel product rail fetches | −600–750 ms homepage load |
| Product page ISR + static params | −1.5–3 s for pre-rendered pages (CDN hit) |
| React.cache deduplication | −150–300 ms per product page |
| CDN preconnect hints | −100–200 ms first image load |
| Hero Image → priority + WebP/AVIF | −0.5–1.5 s LCP |
| Gallery unoptimized removal | −40–60% image payload on PDP |
| Lodash removal | −70 KB gzipped JS |
| Hero → server component | −eliminates Hero JS bundle entirely |
| Dead dependency removal | −cleaner install, faster CI |

### Target Metrics (Post-Optimization)

| Metric | Baseline | Expected | Target |
|--------|----------|----------|--------|
| RES | 66 | 85–95 | ≥ 90 |
| FCP (P75) | 3.92 s | 1.2–1.8 s | ≤ 1.8 s |
| LCP (P75) | 4.91 s | 1.8–2.5 s | ≤ 2.5 s |

---

## Verification

After deploying, monitor the following in Vercel Speed Insights:

1. **FCP P75** — should drop below 1.8 s within 24–48 hours of data collection
2. **LCP P75** — should drop below 2.5 s; verify the hero image is the LCP element and is preloaded
3. **RES** — composite score should rise above 85
4. **TTFB** — verify ISR cache hits via `x-vercel-cache: HIT` response header
5. **JS bundle size** — check in Vercel's build output or `next build` analyzer that lodash is no longer present

### Quick Validation Commands

```bash
# Check that lodash is fully removed from the bundle
cd storefront && grep -r "lodash" src/ --include="*.ts" --include="*.tsx"
# Should return 0 results

# Verify hero has no "use client"
head -1 src/modules/home/components/hero/index.tsx
# Should show "import" not "use client"

# Check ISR is configured
grep -r "revalidate" src/app/[countryCode]/ --include="*.tsx" -l
# Should list: page.tsx, products/[handle]/page.tsx, store/page.tsx
```
