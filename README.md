# Elvato

![Elvato Storefront](./public/README-v3.png)

## Architecture Overview

Elvato is a headless commerce system built on `Medusa.js` with a `Next.js` storefront, designed as a decoupled service mesh where commerce logic, web delivery, media distribution, and payments are isolated and independently scalable.

### Platform Composition
- **Commerce framework:** `Medusa.js` provides catalog, cart, checkout, order, and admin domain logic.
- **Storefront runtime:** `Next.js` application deployed on Vercel.
- **Payment provider:** Stripe handles payment authorization, capture, and webhook-driven reconciliation.

### Production Topology
- **Storefront edge endpoint:** Vercel hosts the production storefront at `https://elvato.shop`.
- **Core commerce origin:** Railway hosts the Medusa backend, including Store API and Admin API surfaces.
- **Admin access path:** `https://admin.elvato.shop` is served via a Vercel front-door and routed to the Railway admin origin at `/app`.
- **Persistence layer:** Neon hosts PostgreSQL as the primary transactional datastore for the Medusa backend.
- **Cache and event infrastructure:** Upstash Redis (via Vercel integration) supports caching and event-driven backend workloads.
- **Image pipeline:** Convex manages image metadata and file workflows, with Bunny.net CDN serving optimized storefront media at edge.

### Operational Value
- **Separation of concerns:** Web delivery (Vercel), commerce runtime (Railway), and data services (Neon/Upstash/Convex) can be scaled and operated independently.
- **Performance profile:** Edge-rendered storefront delivery plus CDN-backed media distribution reduces latency and origin load.
- **Reliability posture:** Managed platforms (Vercel, Railway, Neon, Upstash, Stripe) reduce operational overhead while preserving production-grade observability and elasticity.