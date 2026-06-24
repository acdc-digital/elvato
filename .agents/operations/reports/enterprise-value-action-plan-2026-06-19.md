# Elvato Enterprise Value Action Plan

Date: 2026-06-19
Prepared from repository evidence, Etsy reports, marketplace scripts, storefront architecture notes, and current business stage provided by the operator.

## Executive Summary

Elvato is not currently constrained by technical foundation. The company has a working Medusa backend, Next.js storefront, Etsy OAuth/listing scripts, candidate selection reports, draft optimization scripts, active listing SEO tooling, and image/source-review infrastructure. The constraint is commercial throughput: converting a curated product catalogue into active marketplace inventory, measuring buyer response, and using that response to decide what to publish next.

If we could only complete one initiative this week, the highest-enterprise-value initiative is:

**Run an Etsy Revenue Sprint: fix the Etsy operations command path and OAuth/env layout, activate or relaunch the best 10-15 already-prepared listings, and start a weekly listing-level KPI report that tracks active listings, transactions, reviews, and gross-margin assumptions.**

Reason: the business is early, has 17-18 active Etsy listings, and has already generated many candidate and draft reports from a 740-product catalogue. More internal polishing has diminishing returns until real buyers create signal. Etsy is the fastest demand-validation channel already wired into the repo. The operating goal for the next 30 days should be to increase high-quality active listings, observe which fixture families get traction, and build a repeatable weekly loop from product selection to listing launch to margin/transaction review.

## Current Business Stage

- Active commercial surface: Etsy shop with roughly 17-18 active listings plus drafts, deactivated listings, and prepared candidate pools.
- Product base: approximately 740 Medusa catalogue products scanned by existing Etsy candidate tooling.
- Storefront base: Next.js/Medusa storefront exists with product pages, image handling, cart, checkout, product schema, related products, and Stripe checkout support.
- Marketplace tooling: Etsy candidate selection, draft creation, draft optimization, active listing tag SEO, image ingestion/discovery, source review, and OAuth scripts exist.
- Operating gap at the time: the legacy operations report folder was empty before this report, so the business had tooling and reports but no central operating cadence or single prioritized execution plan.

## Primary Constraint

The current constraint is **validated revenue throughput**, not catalogue size or engineering creativity.

Supporting evidence:

- Recent Etsy tag SEO report updated 16 of 17 active listings live, so basic tag coverage is no longer the main blocker.
- Candidate reports already rank dozens of high-fit products from a 740-product scan.
- Draft-review reports show 10 drafts were copy-optimized but still required manual review for missing fixture dimensions, wattage, voltage, bulb base, certification, and scale/image confidence.
- The live Etsy shop check could not run cleanly because the package command path and env layout are misaligned, and the OAuth token is expired. That blocks automated operating visibility.

## Current Bottlenecks

1. **Low active listing count relative to prepared inventory**
   - Etsy has around 17-18 active listings, while candidate reports identify many publishable candidates.
   - This limits impressions, search learning, and sales probability.

2. **No weekly performance command center**
   - Existing reports are scattered in `reports/etsy` and not rolled into an executive operating view.
   - Etsy API endpoints are available for listings, receipts, transactions, payments, and reviews, but no weekly KPI report appeared centralized in the operations agent module.

3. **Marketplace command/env reliability issue**
   - `marketplace/Etsy/package.json` commands resolve `../scripts/...`, which points to `marketplace/scripts/...` instead of repo `scripts/...`.
   - The Etsy scripts load env from `marketplace/.env*`, while the available env files are under `marketplace/Etsy/.env*`.
   - OAuth token is expired, so live checks require refresh before measurement automation.

4. **Listing confidence gaps before publishing**
   - Draft review identifies missing fixture dimensions, canopy size, cord/drop length, bulb base, wattage, voltage, certification, and image scale cues.
   - These affect buyer trust, returns risk, and Etsy listing quality.

5. **Margin uncertainty**
   - Current reports show prices, but the operating view does not yet join CJ landed cost, Etsy fees, shipping assumptions, returns, and target gross margin by SKU.

6. **Opportunity diffusion**
   - Storefront polish, catalogue refinement, price lists, new marketplaces, image-source enrichment, and product expansion are all valid workstreams, but most are second-order until the business has stronger demand data.

## Highest-Leverage Initiative

### Etsy Revenue Sprint

**Objective:** Increase active, high-quality Etsy listings from roughly 17-18 to 30-35 in 7 days, while establishing a weekly performance loop.

**Why this creates the greatest enterprise value this week:**

- Etsy is already the closest channel to revenue.
- Existing scripts and reports reduce launch cost.
- More active listings increase search surface and demand signal.
- Transaction and review data will tell us which product families deserve deeper investment.
- It creates an operating asset: a repeatable marketplace launch and measurement workflow.

**Definition of done this week:**

- Fix or document the Etsy command/env/OAuth issue so live shop checks are reliable.
- Select 15 candidates from existing high-fit reports.
- For each candidate, verify price, image count, dimensions/spec confidence, shipping profile, return policy, production partner, and margin floor.
- Activate or relaunch 10-15 listings.
- Generate the first weekly KPI report in `.agents/operations/reports` with active listing count, drafts, transactions, gross sales if available, conversion notes, and next listing queue.

## Initiative Ranking

Scoring scale: 1-10. For Time to Realize Value, 10 means fastest. For Execution Difficulty and Risk, 10 means hardest/highest risk.

Priority Score = (Revenue Impact + Profit Impact + Strategic Value) / (Execution Difficulty + Risk)

| Rank | Initiative | Revenue | Profit | Strategic | Difficulty | Time | Risk | Priority Score | Recommended Timing |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Fix Etsy operations control plane and weekly KPI report | 6 | 7 | 9 | 2 | 9 | 2 | 5.50 | First 24-48 hours |
| 2 | Etsy Revenue Sprint: activate/relaunch 10-15 best listings | 9 | 8 | 9 | 5 | 8 | 4 | 2.89 | This week |
| 3 | SKU-level margin and offer-floor audit for active/top candidate listings | 7 | 9 | 8 | 4 | 7 | 4 | 3.00 | This week, parallel to launch queue |
| 4 | Listing trust pack: dimensions, voltage/wattage, bulb base, certification, scale images | 7 | 7 | 8 | 5 | 6 | 4 | 2.44 | Week 1-2 |
| 5 | Etsy product-family test matrix: glass globe, branch/sculptural, table/floor, wall sconce | 8 | 7 | 9 | 6 | 6 | 5 | 2.18 | Week 2-3 |
| 6 | Storefront conversion hardening and marketplace-to-store bridge | 6 | 7 | 8 | 6 | 5 | 4 | 2.10 | Week 3-4 |
| 7 | Repeatable marketplace publishing workflow for eBay/Walmart/Amazon | 7 | 6 | 8 | 8 | 4 | 6 | 1.50 | After Etsy signal improves |
| 8 | Large-scale catalogue refinement of hundreds of products | 5 | 5 | 6 | 8 | 3 | 5 | 1.23 | Defer except for selected launch SKUs |
| 9 | Advanced Medusa price lists/promotions infrastructure | 4 | 6 | 6 | 7 | 3 | 4 | 1.45 | Defer until traffic/conversion baseline exists |

Note: the control-plane item ranks highest mathematically because it is low difficulty and unlocks measurement. It should not become a standalone project. Treat it as the first step of the Etsy Revenue Sprint.

## Initiative Details

### 1. Fix Etsy Operations Control Plane and Weekly KPI Report

- Impact: Restores reliable live visibility and enables weekly executive decisions.
- Cost: Low engineering time; no meaningful cash cost.
- Effort: 0.5-1 day.
- Risk: Low, but handling OAuth/env requires care.
- Dependencies: Etsy OAuth refresh, env-path decision, corrected package script paths, `transactions_r` scope for transaction reporting.
- Recommended Timing: Immediately.

Action items:

- Decide whether Etsy env belongs in `marketplace/.env.local` or `marketplace/Etsy/.env.local`; make scripts and README consistent.
- Fix package scripts so commands resolve repo `scripts/etsy/*` correctly.
- Refresh OAuth token.
- Generate `.agents/operations/reports/weekly-marketplace-kpi-YYYY-MM-DD.md` every Friday.
- Pull Etsy listing states, transactions, receipts, payments, and reviews where scopes allow.

### 2. Etsy Revenue Sprint

- Impact: Directly increases searchable inventory and sales probability.
- Cost: Etsy listing fees, review time, potential image/spec verification time.
- Effort: 2-4 focused days.
- Risk: Medium; weak specs can increase buyer hesitation or returns.
- Dependencies: OAuth fixed, candidate queue, listing review checklist, shipping/return/profile IDs.
- Recommended Timing: This week.

Action items:

- Select 15 SKUs from the strongest existing candidate reports.
- Prefer products with 8+ images, clear style fit, manageable variants, price between roughly $50-$250 unless margin supports premium pricing, and current active-listing family fit.
- Activate 10-15 after review.
- Avoid spending the week polishing non-launch catalogue items.

### 3. SKU-Level Margin and Offer-Floor Audit

- Impact: Prevents revenue growth that destroys margin.
- Cost: Low if CJ cost and shipping data are accessible; medium if supplier data is inconsistent.
- Effort: 1-2 days for the active/top candidate set.
- Risk: Medium; wrong landed-cost assumptions can create false confidence.
- Dependencies: CJ product cost, shipping estimates, Etsy fees, payment fees, refund/return assumptions.
- Recommended Timing: This week alongside listing launches.

Action items:

- For each active/top-candidate SKU, calculate: selling price, supplier cost, shipping cost, Etsy listing/transaction/payment fees, expected gross margin dollars, gross margin percentage.
- Set minimum gross margin thresholds by category.
- Mark products below threshold as price-adjust, supplier-review, or do-not-launch.

### 4. Listing Trust Pack

- Impact: Improves conversion and reduces buyer uncertainty.
- Cost: Manual review time and possible supplier lookup.
- Effort: 1-2 days for 10-15 listings.
- Risk: Medium; inaccurate specs create return and reputation risk.
- Dependencies: Supplier specs, product images, Etsy listing fields.
- Recommended Timing: Week 1-2.

Action items:

- Create a launch checklist for dimensions, drop/cord length, canopy size, bulb base, voltage, wattage, certification, materials, room/use cases, and image scale.
- Do this only for launch candidates, not the full catalogue.

### 5. Etsy Product-Family Test Matrix

- Impact: Turns marketplace activity into strategic learning.
- Cost: Low.
- Effort: 1 day to define, ongoing weekly review.
- Risk: Medium; sample size will be small early.
- Dependencies: Active listing expansion and KPI report.
- Recommended Timing: Week 2-3.

Action items:

- Assign each active listing to a test family: glass globe pendant/chandelier, branch/sculptural chandelier, table/floor lamp, wall sconce, linear/bar fixture.
- Track listing count, views if available, transactions, favorites if available, price band, and margin.
- Promote families with buyer signal; pause weak families before overbuilding them.

### 6. Storefront Conversion Hardening and Marketplace-to-Store Bridge

- Impact: Builds owned-channel asset value, but traffic likely remains the limiting factor.
- Cost: Engineering time.
- Effort: 3-5 days.
- Risk: Medium; premature storefront work can absorb time before Etsy demand is validated.
- Dependencies: Analytics, product availability, checkout/payment confidence, brand trust content.
- Recommended Timing: Week 3-4.

Action items:

- Ensure active Etsy winners are also refined and visible on the storefront.
- Add trust content and policies where missing.
- Confirm checkout works in production and analytics captures product/page/cart events.

### 7. New Marketplace Expansion

- Impact: Potentially high future revenue, but premature before Etsy signal.
- Cost: Medium to high due to channel-specific taxonomy, policy, images, fulfillment, and listing format work.
- Effort: 1-3 weeks per marketplace for a useful first version.
- Risk: High; duplicates work if product-market signal is unclear.
- Dependencies: Etsy winners, margin audit, repeatable listing data model.
- Recommended Timing: After 30 days of Etsy signal, unless a specific marketplace has a fast low-effort importer.

### 8. Large-Scale Catalogue Refinement

- Impact: Builds asset depth but does not immediately solve sales.
- Cost: High time cost.
- Effort: Large.
- Risk: High opportunity cost.
- Dependencies: Clear winning product families and margin thresholds.
- Recommended Timing: Defer; refine only selected launch SKUs.

### 9. Advanced Pricing/Promotions Infrastructure

- Impact: Useful later for promotions and channel-specific pricing.
- Cost: Engineering time.
- Effort: Medium.
- Risk: Medium; premature complexity.
- Dependencies: Traffic, conversion baseline, margin model.
- Recommended Timing: Defer until active listings and demand data justify campaign pricing.

## 30-Day Action Plan

### Week 1: Restore Control and Launch Revenue Surface

Goal: Increase active listing count and create the weekly decision loop.

- Fix Etsy command/env/OAuth reliability.
- Generate the first weekly KPI report in `.agents/operations/reports`.
- Select 15 top candidates from existing reports.
- Complete listing trust review for those 15.
- Activate or relaunch 10-15 listings.
- Create a margin floor spreadsheet/report for active plus launch-candidate SKUs.

Success metrics:

- 30-35 active Etsy listings.
- 0 blocked Etsy commands needed for reporting.
- 100% of new listings have 13 tags, adequate images, shipping profile, return policy, production partner, and margin status.

### Week 2: Learn From the First Expanded Surface

Goal: Turn activity into learning.

- Segment active listings into product families.
- Identify top and bottom performers by impressions/transactions/reviews/favorites if accessible.
- Launch second batch of 5-10 listings only from families that match early signal or fill deliberate test gaps.
- Fix weak listings with poor titles, weak hero images, missing dimensions, or price/margin problems.

Success metrics:

- Product-family matrix exists.
- At least 35-40 active listings if Week 1 quality is maintained.
- Every listing has a keep/fix/deactivate status.

### Week 3: Build the Owned-Channel Bridge

Goal: Use Etsy signal to improve storefront and owned asset value.

- Push winning or high-signal Etsy products into refined storefront presentation.
- Confirm production checkout, Stripe payment, shipping, and order confirmation flow.
- Add analytics checks for product view, add to cart, checkout start, and purchase if not already reliable.
- Build a small homepage/category surface around the strongest product family rather than the whole catalogue.

Success metrics:

- Storefront displays active winners cleanly.
- Product and checkout analytics are verified.
- Top marketplace SKUs have coherent storefront equivalents.

### Week 4: Decide the Next Growth Vector

Goal: Make a capital-allocation decision based on signal.

- Review 30-day Etsy data: active count, views, sales, favorites, reviews, conversion, margin.
- Choose one next growth vector: more Etsy depth, paid Etsy ads test, storefront SEO/content, or second marketplace pilot.
- Document stop/continue rules for weak product families.
- Create next 30-day execution plan in `.agents/operations/reports`.

Success metrics:

- Clear winner/loser product-family read.
- Next month plan is based on data, not backlog pressure.
- No major workstream proceeds without a measurable enterprise-value thesis.

## Risks

- **False progress risk:** Publishing many listings without measurement could create activity but not learning.
- **Margin risk:** Supplier cost, shipping, Etsy fees, and returns may make some attractive products economically weak.
- **Trust risk:** Missing dimensions/certifications can reduce conversion or increase returns.
- **Operational risk:** Broken Etsy env/command paths and expired OAuth block live reporting.
- **Channel risk:** Etsy demand may not generalize to owned storefront or other marketplaces.
- **Focus risk:** Catalogue refinement and website polish can consume the week without increasing revenue surface.

## Opportunity Costs

- Choosing storefront polish this week delays marketplace demand validation.
- Choosing broad catalogue refinement delays active listing expansion.
- Choosing new marketplaces now duplicates Etsy workflow complexity before the company knows which product families sell.
- Choosing advanced pricing infrastructure now delays the simpler margin-floor audit that prevents bad launches immediately.

## Dependencies

- Etsy OAuth refresh and consistent env file location.
- Valid Etsy scopes: `listings_r`, `listings_w`, `transactions_r`, and shop-related scopes where needed.
- Reliable product source data: images, dimensions, material, voltage/wattage, bulb base, certification, variants, supplier SKUs.
- CJ supplier cost and shipping estimates.
- A single operating cadence: weekly KPI report and weekly product-family decision meeting.

## Most Important Missing Information

1. Etsy revenue to date: orders, gross sales, net proceeds, refunds, cancellations, and traffic by listing.
2. Listing-level funnel data: impressions, clicks, favorites, conversion rate, and search terms if available from Etsy dashboard/export.
3. Gross margin by SKU: CJ cost, shipping, Etsy transaction/payment/listing/ad fees, expected returns, and target margin floor.
4. Current active/draft/deactivated listing IDs and reasons for deactivation.
5. Which products have reliable dimensions, voltage/wattage, certification, and scale images.
6. Customer profile hypothesis: residential decor buyer, interior designer, hospitality/commercial buyer, or gift/decor buyer.
7. Fulfillment promise accuracy: actual processing time, shipping time, return handling, and supplier reliability.
8. Storefront production analytics and checkout success data.
9. Available weekly labor budget for listing review, customer support, engineering, and supplier verification.
10. Cash budget for Etsy listing fees, promoted listings, samples, image work, and refunds.

## COO Decision

Do not spend this week broadly refining the catalogue or expanding to a second marketplace.

Spend this week converting the strongest existing product intelligence into active Etsy revenue surface, while installing the measurement loop that will tell us what to do next. The company needs buyer signal more than it needs more internal inventory polish.