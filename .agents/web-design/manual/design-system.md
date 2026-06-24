# Design System

The agent works within Elvato's real front-end stack. Build within these primitives; do not introduce a competing UI library or re-platform.

## Stack of Record

| Concern | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js 15 App Router, React 19 | `storefront/src/app/` routes, server components by default. |
| Language | TypeScript | All new code. |
| Styling | Tailwind CSS + `@medusajs/ui-preset` | Tailwind config extends the Medusa preset. |
| UI components | `@medusajs/ui` | Buttons, inputs, badges, tables, toasts. Prefer these first. |
| Headless primitives | Radix (`react-accordion`, `react-slot`), `@headlessui/react` | Use for accessible menus, dialogs, disclosure. |
| Class composition | `class-variance-authority`, `clsx`, `tailwind-merge` | The cva + `cn()` pattern. |
| Icons | `lucide-react`, Medusa icons | No new icon dependencies. |
| Search | MeiliSearch via `@meilisearch/instant-meilisearch` | Derived index, never source of truth. |
| Payments | Stripe (`@stripe/react-stripe-js`) | Checkout UI must respect Stripe Elements constraints. |
| Realtime (catalogue) | Convex | `catalogue/` app only. |

## Hard Rules

- **No ShadCN.** The storefront is not a ShadCN project. Do not recommend installing it or migrating to it.
- **Prefer existing primitives.** Reach for `@medusajs/ui` first, then Radix/Headless UI, before building a custom component.
- **Server components by default.** Add `"use client"` only when interactivity requires it.
- **Compose classes with `cn()`.** Use `clsx` + `tailwind-merge`; use `class-variance-authority` for variant-driven components.
- **No new heavy dependencies** without a measurable conversion, trust, or performance justification.

## File & Module Conventions

- Routes live in `storefront/src/app/`.
- Feature UI lives in `storefront/src/modules/<feature>/` (account, cart, categories, checkout, collections, common, home, layout, order, products, shipping, skeletons, store).
- Shared primitives live in `storefront/src/components/ui/`.
- Loading states use the `skeletons/` module.

## Responsive Standard

- Mobile-first. Design the smallest breakpoint first, enhance upward.
- Touch targets ≥ 44×44px.
- Never hide critical product or trust information behind hover or desktop-only affordances.

## Accessibility Standard

- Target WCAG 2.2 AA.
- Semantic HTML first; ARIA only to fill gaps left by semantics.
- Visible focus states on all interactive elements.
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI affordances.
- All imagery has meaningful `alt`; decorative images use empty `alt`.
- Use Radix/Headless UI for menus, dialogs, and disclosures to inherit keyboard and focus management.

## Performance Standard

- Protect Core Web Vitals: LCP, CLS, INP.
- Use `next/image` with correct `sizes`; reserve space to prevent layout shift.
- Prefer server components and streaming; minimize client JS.
- Lazy-load below-the-fold and non-critical interactive modules.
- Avoid animations that block input or cause layout thrash.

## Marketplace Consistency

The storefront sets the brand reference. Product imagery, naming, and trust language should stay consistent with eBay (and future Walmart/Wayfair/Amazon) listings so customers experience one Elvato brand across channels.
