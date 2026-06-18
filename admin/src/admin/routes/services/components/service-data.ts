import {
  Bolt,
  Buildings,
  CircleStack,
  CloudArrowUp,
  CreditCard,
  Globe,
  MagnifyingGlass,
  Photo,
  Server,
  ServerStack,
  ShoppingBag,
  type IconProps,
} from "@medusajs/icons"
import type { ComponentType } from "react"

export type ServiceTone = "section" | "host" | "app" | "paid"
export type ServiceColumn = "Admin" | "Storefront"
export type ServiceIcon = ComponentType<IconProps>

export type ServiceMeta = {
  id: string
  label: string
  detail?: string
  tone: ServiceTone
  column: ServiceColumn
  icon: ServiceIcon
  provider: string
  layer: string
  role: string
  url?: string
  docs: string
}

/**
 * Single source of truth for the Service Hierarchy panel. Ordered top-to-bottom
 * within each column; positions in the graph are derived from this order.
 */
export const SERVICES: ServiceMeta[] = [
  // Admin column ----------------------------------------------------------
  {
    id: "admin",
    label: "Admin",
    detail: "admin.elvato.shop",
    tone: "section",
    column: "Admin",
    icon: Buildings,
    provider: "Vercel — admin-frontdoor",
    layer: "Admin front door",
    role: "Public admin custom domain. Redirects / to /app and proxies all non-root paths to the Railway backend.",
    url: "admin.elvato.shop",
    docs: ".docs/railway-admin-backend.md",
  },
  {
    id: "admin-railway",
    label: "Railway Cloud",
    detail: "Backend host",
    tone: "host",
    column: "Admin",
    icon: ServerStack,
    provider: "Railway",
    layer: "Backend cloud",
    role: "Primary backend cloud hosting the Medusa Docker service and the MeiliSearch instance.",
    docs: ".docs/railway-admin-backend.md",
  },
  {
    id: "admin-medusa-docker",
    label: "Medusa Service",
    detail: "medusa-backend (Docker)",
    tone: "app",
    column: "Admin",
    icon: Server,
    provider: "Railway Docker service",
    layer: "Commerce backend",
    role: "Medusa Store API, Admin API, admin UI assets, workflows, and payment/search modules.",
    docs: ".docs/docker-container.md",
  },
  {
    id: "admin-medusa-app",
    label: "Medusa.js",
    detail: "Admin UI + APIs",
    tone: "app",
    column: "Admin",
    icon: Bolt,
    provider: "Node.js (Railway container)",
    layer: "Commerce framework",
    role: "Catalog, cart, checkout, orders, admin UI, modules, and workflow orchestration.",
    docs: "admin/medusa-config.ts",
  },
  {
    id: "admin-meilisearch",
    label: "MeiliSearch",
    detail: "Search index",
    tone: "paid",
    column: "Admin",
    icon: MagnifyingGlass,
    provider: "Railway service",
    layer: "Product search",
    role: "Typo-tolerant search, category filtering, and price + recency sorting over the catalog.",
    docs: ".docs/product-index/meilisearch-integration.md",
  },
  {
    id: "admin-convex",
    label: "Convex Cloud",
    detail: "Image metadata + functions",
    tone: "paid",
    column: "Admin",
    icon: CloudArrowUp,
    provider: "Convex Cloud",
    layer: "Image metadata + routing",
    role: "Product image metadata, the ConvexFS abstraction, HTTP actions, and signed blob URLs.",
    docs: ".docs/convex-cdn-image-layer.md",
  },
  {
    id: "admin-bunny",
    label: "Bunny.net",
    detail: "Edge Storage + CDN",
    tone: "paid",
    column: "Admin",
    icon: Photo,
    provider: "Bunny.net",
    layer: "Image storage + CDN",
    role: "Stores optimized product images and serves them at the edge after ConvexFS redirects.",
    docs: ".docs/convex-cdn-image-layer.md",
  },

  // Storefront column -----------------------------------------------------
  {
    id: "storefront",
    label: "Storefront",
    detail: "elvato.shop",
    tone: "section",
    column: "Storefront",
    icon: Globe,
    provider: "Vercel",
    layer: "Customer storefront",
    role: "Public storefront with SSR/static rendering, geo-routing middleware, and the checkout UI.",
    url: "elvato.shop",
    docs: ".docs/vercel-storefront-deployment.md",
  },
  {
    id: "storefront-vercel",
    label: "Vercel Host",
    detail: "Next.js runtime",
    tone: "host",
    column: "Storefront",
    icon: ServerStack,
    provider: "Vercel",
    layer: "Storefront host",
    role: "Next.js runtime and edge middleware that serves the storefront project.",
    docs: ".docs/vercel-storefront-deployment.md",
  },
  {
    id: "storefront-next",
    label: "Next.js Storefront",
    detail: "storefront project",
    tone: "app",
    column: "Storefront",
    icon: ShoppingBag,
    provider: "Next.js (storefront project)",
    layer: "Storefront app",
    role: "Product pages, search UI, cart, and checkout. Fetches commerce data from the Medusa Store API.",
    docs: "storefront/",
  },
  {
    id: "storefront-stripe",
    label: "Stripe",
    detail: "Payments",
    tone: "paid",
    column: "Storefront",
    icon: CreditCard,
    provider: "Stripe",
    layer: "Payments",
    role: "PaymentIntents, Stripe Elements, auto-capture, and webhook confirmation via the Medusa payment provider.",
    docs: ".docs/stripe-payment-processing.md",
  },
  {
    id: "storefront-upstash",
    label: "Upstash Redis",
    detail: "Cache + workflows",
    tone: "paid",
    column: "Storefront",
    icon: Bolt,
    provider: "Upstash Redis",
    layer: "Cache + workflows",
    role: "Medusa caching, event bus, workflow engine, and locking via REDIS_URL.",
    docs: ".docs/vercel-storefront-deployment.md",
  },
  {
    id: "storefront-neon",
    label: "Neon PostgreSQL",
    detail: "Commerce database",
    tone: "paid",
    column: "Storefront",
    icon: CircleStack,
    provider: "Neon",
    layer: "Commerce database",
    role: "Primary Medusa database: products, pricing, inventory, orders, carts, customers, and regions.",
    docs: ".docs/neon-postgresql-database.md",
  },
]

export const SERVICE_BY_ID: Record<string, ServiceMeta> = Object.fromEntries(
  SERVICES.map((service) => [service.id, service])
)

export type ToneDescriptor = {
  label: string
  badgeColor: "purple" | "orange" | "grey" | "blue"
  swatch: string
}

export const TONE_META: Record<ServiceTone, ToneDescriptor> = {
  section: { label: "Surface", badgeColor: "purple", swatch: "bg-ui-tag-purple-icon" },
  host: { label: "Host", badgeColor: "orange", swatch: "bg-ui-tag-orange-icon" },
  app: { label: "Application", badgeColor: "grey", swatch: "bg-ui-tag-neutral-icon" },
  paid: { label: "Managed service", badgeColor: "blue", swatch: "bg-ui-tag-blue-icon" },
}
