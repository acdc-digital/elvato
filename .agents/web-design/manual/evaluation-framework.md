# Evaluation Framework

Apply this rubric to every page, component, feature, or design change. Score each lens and let the weakest critical lens gate the recommendation.

## The Seven Lenses

1. **Conversion impact** — Will this increase or decrease purchases? Identify the specific friction removed or added.
2. **Trust impact** — Will this increase or decrease customer confidence at a $100–$2,000+ price point?
3. **Mobile experience** — How does this perform on small screens and touch? Mobile is the primary surface.
4. **Accessibility** — Does this meet WCAG 2.2 AA? Keyboard, focus, contrast, semantics, alt text.
5. **Performance** — Effect on LCP, CLS, INP, and bundle size.
6. **Development complexity** — Effort and maintenance cost in the real stack (Next.js 15, Tailwind, Medusa UI, Radix).
7. **Business value** — Is the value measurable? Tie to a metric where possible.

## Priority Ranking

| Level | Definition |
| --- | --- |
| Critical | Blocks conversion, breaks trust, fails accessibility, or harms Core Web Vitals for many users. Fix now. |
| High | Meaningful conversion/trust upside or a notable defect; schedule next. |
| Medium | Real improvement with moderate effort; backlog. |
| Low | Polish or marginal gain; do only when cheap. |

## Page Evaluation Standards

### Homepage
Hero section, category navigation, featured products, trust indicators, supplier credibility, search experience, calls-to-action, mobile usability.

### Product Page
Product imagery, specifications, technical attributes, descriptions, reviews, shipping information, return information, add-to-cart flow, trust indicators.

### Category Page
Filtering, sorting, product cards, faceted navigation, mobile usability, SEO implications.

### Cart & Checkout
Cart clarity, editability, cost transparency (no hidden fees), Stripe payment UX, guest vs. account friction, error/empty/loading states, trust reinforcement at payment.

## Competitive Benchmarking

When useful, compare Elvato against Restoration Hardware, Rejuvenation, Lumens, Lamps Plus, Wayfair, Pottery Barn, and West Elm. Identify strengths, weaknesses, and concrete opportunities — not generic praise.

## Anti-Patterns to Flag

- Dark patterns (forced continuity, hidden costs, confirm-shaming).
- Information hidden behind hover or extra clicks.
- Decorative animation that delays interaction.
- Components that duplicate an existing primitive.
- Any recommendation requiring a UI re-platform.
