# SEO Code Reference

> Ready-to-use code for each SEO implementation task.  
> All code targets the App Router pattern in Next.js 15+.

---

## 1. Root Layout — Full Metadata Template

**File:** `storefront/src/app/layout.tsx`

```typescript
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import "styles/globals.css"

const fraunces = Fraunces({
  weight: "900",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-fraunces",
})

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
  // Uncomment after Google Search Console verification:
  // verification: {
  //   google: "YOUR_VERIFICATION_CODE",
  // },
}

// Organization + WebSite JSON-LD (global)
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Elvato",
  url: "https://elvato.shop",
  logo: "https://elvato.shop/brand/elvato-logo.png",
  description:
    "Contemporary lighting retailer — pendants, chandeliers, ceiling, wall, floor & table lamps.",
  sameAs: [],
}

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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className={fraunces.variable}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <main className="relative">{props.children}</main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 2. Product Page — Full Metadata + JSON-LD

**File:** `storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx`

### generateMetadata

```typescript
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const description = product.description
    ? product.description.slice(0, 155).replace(/\s+\S*$/, "…")
    : `Shop ${product.title} at Elvato — contemporary lighting delivered to your door.`

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: `/${params.countryCode}/products/${handle}`,
      images: product.thumbnail
        ? [
            {
              url: product.thumbnail,
              width: 1200,
              height: 630,
              alt: product.title,
            },
          ]
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
}
```

### Product JSON-LD (in page component or template)

```typescript
function buildProductJsonLd(
  product: HttpTypes.StoreProduct,
  countryCode: string,
  currencyCode: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? "",
    image: product.images?.map((i) => i.url) ?? [],
    sku: product.variants?.[0]?.sku ?? product.id,
    brand: {
      "@type": "Brand",
      name: "Elvato",
    },
    offers:
      product.variants?.map((v) => ({
        "@type": "Offer",
        url: `https://elvato.shop/${countryCode}/products/${product.handle}?v_id=${v.id}`,
        priceCurrency: currencyCode.toUpperCase(),
        price: v.calculated_price?.calculated_amount
          ? (v.calculated_price.calculated_amount / 100).toFixed(2)
          : undefined,
        availability:
          (v.inventory_quantity ?? 0) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      })) ?? [],
  }
}

// Usage in the page component:
export default async function ProductPage(props: Props) {
  // ...existing data fetching...

  const jsonLd = buildProductJsonLd(
    product,
    params.countryCode,
    region.currency_code ?? "usd"
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductTemplate product={product} region={region} /* ... */ />
    </>
  )
}
```

---

## 3. Collection Page — Metadata

**File:** `storefront/src/app/[countryCode]/(main)/collections/[handle]/page.tsx`

```typescript
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const title = collection.title
  const description = `Shop the ${collection.title} collection at Elvato — contemporary lighting for every space.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      canonical: `/${params.countryCode}/collections/${params.handle}`,
    },
  }
}
```

---

## 4. Category Page — Metadata + BreadcrumbList

**File:** `storefront/src/app/[countryCode]/(main)/categories/[...category]/page.tsx`

```typescript
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const description =
      productCategory.description ??
      `Shop ${productCategory.name} lighting at Elvato — contemporary designs for your space.`

    return {
      title: productCategory.name,
      description,
      alternates: {
        canonical: `/${params.countryCode}/categories/${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

// BreadcrumbList JSON-LD (in page component)
function buildBreadcrumbJsonLd(
  categorySegments: string[],
  categoryName: string,
  countryCode: string
) {
  const BASE_URL = "https://elvato.shop"
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/${countryCode}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${BASE_URL}/${countryCode}/store`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${BASE_URL}/${countryCode}/categories/${categorySegments.join("/")}`,
      },
    ],
  }
}
```

---

## 5. Sitemap

**File:** `storefront/src/app/sitemap.ts`

```typescript
import { MetadataRoute } from "next"

import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"

const BASE_URL = "https://elvato.shop"
const DEFAULT_COUNTRY = "us"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/${DEFAULT_COUNTRY}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/design-services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  // Product pages
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { response } = await listProducts({
      countryCode: DEFAULT_COUNTRY,
      queryParams: { limit: 1000, fields: "handle,updated_at" },
    })
    productPages = response.products.map((p) => ({
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/products/${p.handle}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch products", e)
  }

  // Collection pages
  let collectionPages: MetadataRoute.Sitemap = []
  try {
    const { collections } = await listCollections({ fields: "handle" })
    collectionPages = (collections ?? []).map((c) => ({
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/collections/${c.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch collections", e)
  }

  // Category pages
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await listCategories()
    categoryPages = (categories ?? []).map((cat) => ({
      url: `${BASE_URL}/${DEFAULT_COUNTRY}/categories/${cat.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error("Sitemap: failed to fetch categories", e)
  }

  return [...staticPages, ...productPages, ...collectionPages, ...categoryPages]
}
```

---

## 6. robots.ts

**File:** `storefront/src/app/robots.ts`

```typescript
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/checkout", "/account", "/cart", "/demo", "/order/"],
    },
    sitemap: ["https://elvato.shop/sitemap.xml"],
  }
}
```

---

## 7. JsonLd Utility Component

**File:** `storefront/src/modules/seo/json-ld.tsx`

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

**Usage:**

```tsx
import { JsonLd } from "@modules/seo/json-ld"

// In any server component:
<JsonLd data={productJsonLd} />
```

---

## 8. Google Analytics Setup

**Install:**
```bash
cd storefront && npm install @next/third-parties
```

**Root layout addition:**
```typescript
import { GoogleAnalytics } from "@next/third-parties/google"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      {process.env.NODE_ENV === "production" &&
        process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      <body className={fraunces.variable}>
        {/* ...existing... */}
      </body>
    </html>
  )
}
```

**Environment variable:**
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 9. noindex Pages

For pages that should not be indexed (cart, account, checkout, demo, order):

```typescript
export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
  robots: {
    index: false,
    follow: false,
  },
}
```

Apply this pattern to:
- `storefront/src/app/[countryCode]/(main)/cart/page.tsx`
- `storefront/src/app/[countryCode]/(main)/account/@login/page.tsx`
- `storefront/src/app/[countryCode]/(main)/account/@dashboard/page.tsx`
- `storefront/src/app/[countryCode]/(main)/demo/page.tsx`
- `storefront/src/app/[countryCode]/(checkout)/checkout/page.tsx`
- `storefront/src/app/[countryCode]/(main)/order/[id]/confirmed/page.tsx`

---

## 10. Truncation Helper

Reusable helper for meta descriptions (keep under ~155 characters, break at word boundary):

```typescript
// storefront/src/lib/util/seo.ts

export function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, "…")
}
```

**Usage:**
```typescript
import { truncateDescription } from "@lib/util/seo"

const description = product.description
  ? truncateDescription(product.description)
  : `Shop ${product.title} at Elvato — contemporary lighting delivered to your door.`
```
