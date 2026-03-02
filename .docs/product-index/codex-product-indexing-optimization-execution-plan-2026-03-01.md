# Elvato Product Indexing Optimization Execution Plan

Date: 2026-03-01  
Companion to: `.docs/product-index/product-indexing-filtering-performance-report-2026-03-01.md`

## 1. Goal

Deliver a predictable, fast, and scalable product discovery experience across `/store`, `/collections`, and `/categories` by fixing filter correctness first, then improving freshness and performance, then adding long-term indexing scalability.

## 2. Delivery Principles

- Correctness before optimization.
- One filter contract across all listing surfaces.
- Event-driven cache freshness for publish operations.
- Observable performance with explicit SLO targets.
- Incremental rollout with feature flags and measurable checkpoints.

## 3. Scope Summary

In scope:
- Category filter logic consistency.
- Price sort correctness and scalability.
- Collection/category/store behavior alignment.
- Publish-driven cache invalidation.
- Bunny coverage completion and thumbnail lookup optimization.
- Listing/filter observability and SLO instrumentation.

Out of scope (for this plan):
- Checkout/payment flow changes.
- Admin UI redesign.
- Non-catalog pages unrelated to product discovery.

## 4. Workstreams and Tickets

## WS-1: Filter Correctness (P0)

### Ticket IDX-001: Define and lock category filter contract

Description:
- Decide single-select or multi-select category filtering as a product requirement.
- Document URL query contract and expected behavior across all listing pages.

Acceptance criteria:
- Written contract in engineering docs with examples.
- Contract approved by product/design/engineering.
- Test matrix includes `/store`, `/collections/[handle]`, `/categories/[...category]`.

Dependencies:
- None.

Estimate:
- 0.5 day.

---

### Ticket IDX-002: Implement category filtering according to contract on `/store`

Description:
- Align UI selection behavior and backend query application.
- Remove mismatch where multiple selected categories are displayed but only one is queried.

Acceptance criteria:
- Query behavior matches selected UI state 1:1.
- URL reflects active filter state accurately.
- Pagination resets correctly on filter changes.
- Unit/integration tests for add/remove/clear filter scenarios pass.

Dependencies:
- IDX-001.

Estimate:
- 1-2 days.

---

### Ticket IDX-003: Fix `/collections` filter behavior parity

Description:
- Either wire category filter through collection query path, or intentionally hide/disable category filter on collection pages until supported.

Acceptance criteria:
- No visible filter control that does not affect results.
- Collection filtering behavior documented and tested.
- UX copy updated if behavior is intentionally limited.

Dependencies:
- IDX-001.

Estimate:
- 1 day.

---

### Ticket IDX-004: Normalize behavior on `/categories`

Description:
- Ensure category pages follow the same filtering semantics (or explicitly documented exceptions).

Acceptance criteria:
- Category page behavior is consistent with contract.
- No contradictory sort/filter controls.

Dependencies:
- IDX-001.

Estimate:
- 0.5-1 day.

## WS-2: Sorting Correctness and Scale (P0/P1)

### Ticket IDX-010: Remove partial-window price sort logic

Description:
- Eliminate current `limit:100` client-side price sorting path that is incorrect at 803+ products.

Acceptance criteria:
- Price sort returns globally correct ordering across full eligible product set.
- Pagination is stable and deterministic for both price directions.
- Performance baseline captured before/after change.

Dependencies:
- None.

Estimate:
- 1-2 days (interim path), 3-5 days (full robust path).

---

### Ticket IDX-011: Implement durable server-side price sort strategy

Description:
- Implement one of:
- Denormalized min-price field sortable server-side in Medusa query path.
- Dedicated index backend (Meilisearch/OpenSearch/Algolia) for numeric sort/facets.

Acceptance criteria:
- Price sorting no longer depends on client-side full/partial sort.
- Correctness validated over full 803-product catalog and spot checks beyond 1,000 records.
- Documented fallback behavior if index service is unavailable.

Dependencies:
- IDX-010.

Estimate:
- 1-2 sprints depending on selected approach.

## WS-3: Freshness and Revalidation (P1)

### Ticket IDX-020: Add Medusa publish/update webhook to storefront revalidation endpoint

Description:
- Trigger cache revalidation when product/category/collection entities change in Medusa.

Acceptance criteria:
- Publish action causes affected listing pages to refresh within agreed freshness target.
- Revalidation endpoint secured (shared secret/signature validation).
- Failed webhook/revalidation attempts are logged and retryable.

Dependencies:
- None.

Estimate:
- 1-2 days.

---

### Ticket IDX-021: Define and implement revalidation blast-radius rules

Description:
- Revalidate only impacted tags/routes where possible (not full-site invalidation).

Acceptance criteria:
- Tag/path map documented.
- Revalidation coverage includes product detail, store listing, category, collection.
- No unnecessary high-cost global invalidations.

Dependencies:
- IDX-020.

Estimate:
- 1 day.

## WS-4: Media Path Optimization (P1)

### Ticket IDX-030: Complete Bunny/Convex ingestion coverage for all published products

Description:
- Backfill remaining products not yet using Bunny-backed image delivery.

Acceptance criteria:
- Coverage report shows ingestion rate by handle and overall percentage.
- Retry workflow exists for failed ingestions.
- Expected target: >= 99% coverage (or documented exclusions).

Dependencies:
- None.

Estimate:
- 1-2 days operational + retries.

---

### Ticket IDX-031: Optimize batch thumbnail lookup from Convex

Description:
- Replace per-handle filesystem listing loop with direct lookup structure.

Acceptance criteria:
- Reduced p95 thumbnail-lookup latency versus baseline.
- Query cost/profile improved under concurrent listing traffic.
- No regression in missing/fallback image behavior.

Dependencies:
- IDX-030 recommended.

Estimate:
- 2-3 days.

## WS-5: Observability and SLOs (P2)

### Ticket IDX-040: Add catalog-discovery performance instrumentation

Description:
- Instrument request timings and outcomes for listing/filtering pipeline.

Acceptance criteria:
- Metrics available for:
- Medusa `/store/products` latency (p50/p95)
- Convex thumbnail query latency (p50/p95)
- `/store` TTFB and LCP
- filter/sort interaction completion time
- Dashboard accessible to engineering.

Dependencies:
- None.

Estimate:
- 1-2 days.

---

### Ticket IDX-041: Define SLOs and alert thresholds

Description:
- Set measurable targets and alerting for regressions.

Acceptance criteria:
- SLO document approved.
- Alerts configured for sustained p95 and error-rate breaches.
- On-call runbook for investigation/remediation exists.

Dependencies:
- IDX-040.

Estimate:
- 1 day.

## 5. Proposed Rollout Order

## Phase A: Correctness Stabilization (Week 1)

- IDX-001
- IDX-002
- IDX-003
- IDX-004
- IDX-010

Exit criteria:
- Filter behavior is consistent and trustworthy.
- Price sort no longer incorrect at full catalog scale.

## Phase B: Freshness + Media Improvements (Week 2)

- IDX-020
- IDX-021
- IDX-030
- IDX-031

Exit criteria:
- Publish-to-storefront freshness lag meets target.
- Image delivery consistency and latency improved.

## Phase C: Scale Hardening (Week 3+)

- IDX-011
- IDX-040
- IDX-041

Exit criteria:
- Durable long-term sort/filter scalability.
- Monitoring and alerts in place for ongoing performance governance.

## 6. Release Strategy

- Use feature flags for filter-contract changes and sorting-path swap.
- Roll out to internal/staging first, then low-percentage production cohort, then full traffic.
- Keep old code path for one release cycle as fallback where practical.

## 7. Validation Plan

Functional test scenarios:
- Multi-select/single-select contract enforcement.
- Add/remove/clear category filters.
- Pagination behavior after filter/sort changes.
- Collection/category/store parity checks.
- New product publish appears in expected listing windows.

Performance test scenarios:
- Baseline vs post-change p50/p95 at 803 products.
- Load test filter/sort actions under concurrent users.
- Image-heavy listing page with warm and cold caches.

Data quality checks:
- Category counts and selection chips match actual query constraints.
- Price sort ordering validated against independent spot-check query scripts.

## 8. KPI and Success Metrics

Primary:
- Filter correctness defects: 0 open P0/P1 after rollout.
- Price sort correctness pass rate: 100% across sampled pages.
- Publish-to-visible freshness: target <= 2 minutes (or agreed SLA).
- `/store` p95 response/interaction latency: improved vs baseline.

Secondary:
- Bunny ingestion coverage >= 99%.
- Reduction in image fallback usage over time.
- Lower support/debug incidents related to "missing" or "wrong" products in filtered views.

## 9. Risks and Mitigations

Risk: Contract decision delay (single vs multi-select) blocks implementation.  
Mitigation: Timebox decision meeting to 30 minutes with fallback default (single-select) if no consensus.

Risk: Revalidation over-invalidates and increases origin load.  
Mitigation: Implement targeted tag/path map and monitor traffic impact in staged rollout.

Risk: New indexing/sort strategy introduces regressions.  
Mitigation: Feature flag, dual-run shadow validation, and rollback switch.

Risk: Bunny backfill operational failures.  
Mitigation: Retry queue + failure report by product handle + daily reconciliation.

## 10. Ownership Template (Fill In)

- Engineering lead: TBD
- Storefront owner: TBD
- Medusa/backend owner: TBD
- Convex/media owner: TBD
- QA owner: TBD
- SRE/observability owner: TBD

## 11. Definition of Done (Program Level)

- All P0 tickets accepted and deployed.
- No known filter/sort correctness gaps across listing surfaces.
- Publish freshness behavior documented and validated in production.
- Performance dashboard and alerting live.
- Post-launch review completed with baseline vs outcome metrics.

---

This execution plan is designed to be converted directly into project-management tickets (Linear/Jira/GitHub Projects) without additional restructuring.
