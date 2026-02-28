# Vercel Deployment — Storefront

**Project:** `storefront`  
**Team:** `acdcdigitals-projects`  
**Custom Domain:** `https://elvato.shop`  
**Vercel URL:** `https://storefront-acdcdigitals-projects.vercel.app`  
**Alias:** `https://storefront-tawny.vercel.app`  
**Framework:** Next.js 15 (App Router)  
**Status:** ✅ Live  
**Last verified:** February 2026

---

## Overview

The Elvato storefront is a Next.js 15 application deployed to Vercel from the `storefront/` directory of the monorepo. It serves the customer-facing e-commerce experience, connecting to the Medusa backend API on Railway, Convex for CDN-optimized product images, and Stripe for payment processing.

### Architecture

```
Browser → elvato.shop (Vercel)
           ├── Next.js SSR / Static pages
           ├── Edge Middleware (geo-routing)
           ├── Medusa Store API (Railway)
           ├── Convex Image CDN (Bunny CDN via Convex)
           └── Stripe (client-side payment)
```

---

## Custom Domain

| Domain | Type | DNS Record | Provider |
|--------|------|------------|----------|
| `elvato.shop` | Apex | A → `216.198.79.1` | GoDaddy |
| `www.elvato.shop` | CNAME | `→ vercel-dns` | GoDaddy |

- The apex domain (`elvato.shop`) is the primary production domain
- `www.elvato.shop` redirects to the apex via Vercel's 307 redirect
- SSL is automatically provisioned and renewed by Vercel
- DNS TTL is set to 1 hour at GoDaddy

### Domain Changes

To update or add domains, go to **Vercel Dashboard → storefront → Settings → Domains**. If changing DNS providers, update the A record for `@` and the CNAME for `www` at the new registrar. Vercel will re-verify and provision a new SSL certificate automatically.

---

## Environment Variables

All environment variables are set via the Vercel Dashboard or CLI (`vercel env add`). They apply to **Production** deployments.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `MEDUSA_BACKEND_URL` | Server | Medusa API base URL (Railway) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Public | Medusa publishable API key for store requests |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Public | Medusa API URL (client-side) |
| `NEXT_PUBLIC_BASE_URL` | Public | Storefront canonical URL (`https://elvato.shop`) |
| `NEXT_PUBLIC_DEFAULT_REGION` | Public | Default region code (`us`) |
| `NEXT_PUBLIC_STRIPE_KEY` | Public | Stripe publishable key (test mode) |
| `NEXT_PUBLIC_CONVEX_URL` | Public | Convex production deployment URL |
| `REVALIDATE_SECRET` | Server | Secret for on-demand ISR revalidation |

### Managing Environment Variables

```bash
# List current variables
vercel env ls

# Add a new variable
vercel env add VARIABLE_NAME production

# Remove a variable
vercel env rm VARIABLE_NAME production -y
```

After changing environment variables, you must redeploy for changes to take effect:

```bash
cd storefront && vercel --prod
```

### Upstash Redis (Vercel Integration)

An Upstash Redis instance (`famous-gorilla-58125.upstash.io`) is connected via the Vercel Upstash integration. This is the **same** Redis instance used by the Medusa backend on Railway. The integration automatically injects the following variables:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`
- `REDIS_URL`

These are available for future storefront features (rate limiting, caching, sessions) but are not currently used by the Next.js application.

---

## Build & Deploy

### Manual Deployment

```bash
cd storefront

# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Build Configuration

- **Framework preset:** Next.js (auto-detected)
- **Root directory:** `storefront/` (configured in Vercel project settings)
- **Build command:** `npm run build` (default Next.js build)
- **Output directory:** `.next` (default)
- **Node.js version:** 18.x

### Build Validation

The build enforces strict checks — no errors are silently ignored:

- `typescript.ignoreBuildErrors: false` — TypeScript errors fail the build
- `eslint.ignoreDuringBuilds: false` — ESLint errors fail the build
- `check-env-variables.js` — validates `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is set at build time

---

## Middleware & Geo-Routing

The storefront uses Next.js Edge Middleware ([src/middleware.ts](../storefront/src/middleware.ts)) for automatic geo-routing:

1. Reads `x-vercel-ip-country` header (provided by Vercel's edge network)
2. Fetches available regions from Medusa's Store API
3. Maps the visitor's country to a Medusa region
4. Redirects `/` → `/{countryCode}/` (e.g., `/us/`, `/ca/`, `/gb/`)
5. Sets a `_medusa_cache_id` cookie for cache partitioning

The region map is cached for 1 hour in the Edge runtime to avoid excessive API calls.

**Fallback behavior:** If the visitor's country isn't mapped to a region, the `NEXT_PUBLIC_DEFAULT_REGION` (`us`) is used.

---

## Image Optimization

Next.js Image Optimization is configured in [next.config.js](../storefront/next.config.js) with the following allowed remote image sources:

| Hostname | Purpose |
|----------|---------|
| `localhost` / `127.0.0.1` | Local development |
| `cf.cjdropshipping.com` | CJ Dropshipping product images |
| `elvatoStorage-CDN.b-cdn.net` | Bunny CDN (primary image CDN) |
| `superb-dotterel-37.convex.site` | Convex HTTP endpoint (image serving) |
| `medusa-public-images.s3.eu-west-1.amazonaws.com` | Medusa S3 images |
| `MEDUSA_CLOUD_S3_HOSTNAME` | Dynamic S3 hostname (if configured) |

To add a new image source, add an entry to the `images.remotePatterns` array in `next.config.js` and redeploy.

---

## Speed Insights

Vercel Speed Insights is enabled via the `@vercel/speed-insights` package. The `<SpeedInsights />` component is rendered in the root layout ([src/app/layout.tsx](../storefront/src/app/layout.tsx)).

This collects Core Web Vitals (LCP, FID, CLS, TTFB, INP) from real user visits and reports them to the Vercel dashboard under **Speed Insights**.

No additional configuration is required — the component auto-detects the Vercel environment.

---

## CORS Configuration

The Medusa backend on Railway must include the storefront's domains in its CORS allow lists. The following origins are configured:

**STORE_CORS:**
```
http://localhost:8000,https://storefront-acdcdigitals-projects.vercel.app,https://storefront-tawny.vercel.app,https://elvato.shop,https://www.elvato.shop
```

**AUTH_CORS:**
```
http://localhost:8000,http://localhost:9000,https://storefront-acdcdigitals-projects.vercel.app,https://storefront-tawny.vercel.app,https://elvato.shop,https://www.elvato.shop,https://medusa-backend-production-d681.up.railway.app
```

When adding new domains (staging, preview, etc.), update both `STORE_CORS` and `AUTH_CORS` on Railway and redeploy the backend.

---

## Deployment Protection

Vercel Deployment Protection controls access to preview and production deployments:

- **Production:** Authentication is **disabled** — the site is publicly accessible
- **Preview:** May require Vercel team authentication (SSO)

If the production site starts returning 401, check **Vercel Dashboard → Settings → Deployment Protection** and ensure "Vercel Authentication" is disabled for Production.

---

## Troubleshooting

### Build Fails with TypeScript Errors

The build has strict mode enabled. Fix all TypeScript errors before deploying. Run locally first:

```bash
cd storefront && npm run build
```

### 401 Unauthorized on Production

Vercel Deployment Protection is enabled. Go to **Settings → Deployment Protection** and disable authentication for production deployments.

### CORS Errors in Browser Console

The storefront domain is missing from the Medusa backend's `STORE_CORS` or `AUTH_CORS`. Add the domain on Railway and redeploy.

### Images Not Loading

The image hostname is not in `next.config.js` `remotePatterns`. Add the hostname and redeploy.

### Geo-Routing Redirect Loop

The middleware redirects based on the `x-vercel-ip-country` header. If testing with `curl`, use a cookie jar (`-b "" -c /tmp/cookies`) to persist the `_medusa_cache_id` cookie across redirects. In a browser, this works automatically.

### Environment Variable Not Taking Effect

Vercel caches environment variables at build time. After changing a variable, you must redeploy:

```bash
vercel --prod
```

---

## Maintenance Checklist

| Task | Frequency | Action |
|------|-----------|--------|
| SSL certificate | Automatic | Vercel auto-renews — no action needed |
| Domain DNS | As needed | Verify A/CNAME records if issues arise |
| Environment variables | As needed | Update via CLI or dashboard, then redeploy |
| Speed Insights | Ongoing | Review in Vercel Dashboard → Speed Insights |
| Dependencies | Monthly | `npm update @vercel/speed-insights` |
| CORS origins | When adding domains | Update Railway `STORE_CORS` + `AUTH_CORS` |
| Stripe keys | When going live | Swap test keys for live keys in Vercel env vars |
| Convex URL | If deployment changes | Update `NEXT_PUBLIC_CONVEX_URL` in Vercel env vars |
