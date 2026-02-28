# Elvato

![Elvato Storefront](./public/README-v3.png)

## Architecture Overview

Elvato is a headless commerce platform built on Medusa.js.

### Description
- **Core backend:** Medusa.js on Railway (Store API + Admin API + Admin origin at `/app`)
- **Database:** Neon PostgreSQL
- **Cache + event infrastructure:** Upstash Redis
- **Image pipeline:** Convex + Bunny CDN
- **Storefront:** Next.js on Vercel (`elvato.shop`)
- **Admin domain:** `admin.elvato.shop` via Vercel front-door, proxied to Railway origin
- **Payments:** Stripe