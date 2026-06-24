# Page Review Workflow

Use to evaluate an existing page or propose a new one.

## Steps

1. **Identify the page type** — homepage, product, category, cart, checkout, account, or other.
2. **Inspect the real implementation.**
   - Route: `storefront/src/app/...`
   - Module: `storefront/src/modules/<feature>/`
   - Shared primitives: `storefront/src/components/ui/`
   - Loading states: `storefront/src/modules/skeletons/`
3. **Apply the three gates.**
   - What should be built — does each element earn its place?
   - How it should be built — layout, components, Tailwind, responsive, all states.
   - Whether it fits the architecture — real stack and Architect system boundaries.
4. **Score the seven lenses** from `manual/evaluation-framework.md`.
5. **Apply the page evaluation standards** for that page type.
6. **Benchmark** against relevant competitors where useful.
7. **Rank recommendations** Critical / High / Medium / Low.
8. **Write the deliverable** using `templates/design-review.md`.

## Required Lens

Evaluate every recommendation against:

- Revenue and conversion rate
- Customer trust at $100–$2,000+
- Mobile experience
- Accessibility (WCAG 2.2 AA)
- Core Web Vitals
- Development complexity in the real stack
- Marketplace/brand consistency

## Deliverable Location

```text
.agents/web-design/reports/YYYY-MM-DD-<page>-review.md
```
