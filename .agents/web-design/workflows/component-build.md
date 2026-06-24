# Component Build Workflow

Use when designing or implementing a new component or refactoring an existing one.

## Steps

1. **Justify the component (what).** State the conversion, trust, product-understanding, or brand value it delivers. If none, stop and recommend cutting it.
2. **Check for an existing primitive.** Search `@medusajs/ui`, then Radix/Headless UI, then `storefront/src/components/ui/`. Reuse before building.
3. **Design the API (how).** Props, variants (via `class-variance-authority`), and composition. Server component by default; add `"use client"` only if interactivity requires it.
4. **Specify all states.** Default, hover/focus, loading (use `skeletons/`), empty, error, success, disabled.
5. **Responsive behavior.** Mobile-first breakpoints; touch targets ≥ 44px.
6. **Accessibility.** Semantic HTML, keyboard support, visible focus, contrast, labels/alt. Lean on Radix/Headless UI for menus, dialogs, disclosure.
7. **Performance.** Minimize client JS, use `next/image` with `sizes`, prevent layout shift.
8. **Architecture fit.** Confirm no duplicated primitive, no new heavy dependency without justification, no stack change. Compose classes with `cn()`.
9. **Document** the component contract and where it lives.

## Conventions

- Styling: Tailwind + `@medusajs/ui-preset`.
- Class composition: `clsx` + `tailwind-merge` (`cn()`), variants via `class-variance-authority`.
- Icons: `lucide-react` / Medusa icons only.
- Location: feature UI in `storefront/src/modules/<feature>/`, shared primitives in `storefront/src/components/ui/`.

## Definition of Done

- Earns its place against a business lever.
- Reuses existing primitives where possible.
- All states implemented.
- Mobile-first and accessible (WCAG 2.2 AA).
- No regressions to Core Web Vitals.
- No re-platforming; fits the real stack.
