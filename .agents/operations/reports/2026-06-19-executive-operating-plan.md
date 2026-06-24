# Elvato Executive Operating Plan

Generated: 2026-06-19
Operating hub: Operations

## Executive Summary

Elvato is past the pure build phase. The company has a real technical foundation: Medusa backend, Next.js storefront, product page/cart/checkout infrastructure, Convex image pipeline, Etsy publishing tooling, candidate scoring scripts, active listing SEO tooling, and a 740-product catalogue history. The binding constraint is no longer lack of software or lack of ideas. The binding constraint is converting prepared product assets into live marketplace demand tests, then measuring which products deserve more capital, polish, and distribution.

If we could only complete one initiative this week, the highest-enterprise-value action is an Etsy Revenue Activation Sprint: fix the Etsy operating workflow, refresh credentials, publish the strongest reviewed drafts, and create a weekly listing-level KPI report that ties active listings to transactions, revenue, and estimated margin.

This recommendation is intentionally narrow. The business does not need another broad catalogue push, another storefront redesign, or a large automation project before it has stronger sales signals. The fastest path to enterprise value is to increase the number of high-fit live listings, collect marketplace conversion data, and use that data to decide what to refine, advertise, duplicate, or kill.

## Current Business Stage

Elvato is an early-stage commerce operator with a strong technical footprint and limited validated demand. Current facts from repo evidence and operating reports:

- Etsy has roughly 17-18 active listings. The latest local active tag SEO report found 17 active listings and updated 16 of them live.
- There are optimized Etsy drafts and ready-for-review artifacts, including 10 launch drafts with SEO copy and tags prepared.
- The catalogue was previously much larger: candidate reports scanned 740 products, and product-listing memory shows hundreds of products still need deeper polish if they are to become storefront-grade.
- The storefront product experience is materially built: dynamic product routes, product schema, variant selection, pricing, inventory state, add-to-cart, related products, CDN image handling, and checkout/payment infrastructure exist.
- Marketplace tooling exists but is operationally fragmented. The Etsy package command from marketplace/Etsy currently resolves to a non-existent script path, and the root Etsy publisher does not load marketplace/Etsy/.env.local by default. A live check also found the Etsy access token expired.

Conclusion: Elvato has enough infrastructure to sell. The current stage is demand validation and revenue systemization, not platform expansion.

## Primary Constraint

The primary constraint is focus and operating cadence: too many possible activities compete for attention before a reliable sales loop exists.

The practical bottlenecks are:

1. Active marketplace surface area is too small. With only about 18 active Etsy listings, the shop has limited search coverage and limited data.
2. Publishing flow is not fully frictionless. Existing scripts and env locations are close, but command path, env loading, and OAuth refresh issues interrupt execution.
3. Measurement is incomplete. There are listing optimization reports, but no single weekly operating report that ranks listings by traffic proxy, transactions, revenue, margin, and next action.
4. The catalogue backlog is large. The repo has evidence of 740 products and hundreds needing polish, but polishing all of them before demand validation would be a high-opportunity-cost trap.
5. Storefront value is under-leveraged until there is more product-market signal. The website is useful, but the marketplace is currently the better discovery channel.

## Highest-Leverage Initiative

### Etsy Revenue Activation Sprint

Complete one focused sprint this week:

1. Fix Etsy command and env workflow so checks, refreshes, draft creation, publishing, and tag optimization run from one documented path.
2. Refresh Etsy OAuth and verify shop access.
3. Review the existing ready-for-review drafts using a strict go/no-go checklist: hero image, price/margin, shipping profile, return policy, missing dimensions/certification risk, and variant clarity.
4. Activate the strongest 8-10 drafts that pass the gate.
5. Create a weekly KPI report from Etsy listings, receipts, transactions, payments, and reviews.
6. Use the first seven days of data to choose the next 10 listings from existing candidate reports.

### Reason

This is the highest-leverage initiative because it turns existing assets into market exposure and measurable learning. The company already spent effort building the tools, candidate lists, SEO scripts, image pipeline, and storefront. The enterprise value unlock now is not more inventory theory; it is a repeatable marketplace revenue loop.

### Expected Outcome

By the end of Week 1:

- Etsy active listings increase from about 18 to about 26-28 if drafts pass review.
- Etsy operations workflow becomes reliable enough to repeat weekly.
- Management has one source of truth for active listing count, listing-level transactions, revenue, and estimated margin.
- The company can make evidence-based decisions about which categories, aesthetics, prices, and products deserve more investment.

## Initiative Ranking

Scoring scale: 1-10. For Revenue, Profit, Strategic Value, Time to Realize Value, and Risk, higher means more. For Execution Difficulty, higher means harder. Priority Score = (Revenue Impact + Profit Impact + Strategic Value) / (Execution Difficulty + Risk).

| Rank | Initiative | Revenue | Profit | Strategic | Difficulty | Time to Value | Risk | Priority Score | Recommended Timing |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Etsy Revenue Activation Sprint | 9 | 8 | 9 | 4 | 9 | 3 | 3.71 | Week 1 |
| 2 | Weekly Marketplace KPI and Margin Dashboard | 8 | 8 | 8 | 4 | 8 | 2 | 4.00 | Week 1, immediately after OAuth fix |
| 3 | Publish Next 10 Brand-Fit Listings from Existing Candidate Reports | 8 | 7 | 8 | 5 | 7 | 4 | 2.56 | Week 2 |
| 4 | Product Economics Gate: Price, Shipping, Supplier Cost, Return Risk | 7 | 9 | 8 | 5 | 7 | 4 | 2.67 | Week 1-2 |
| 5 | Etsy Conversion Optimization Loop for Active Listings | 7 | 7 | 7 | 4 | 6 | 3 | 3.00 | Week 2-3 |
| 6 | Storefront Trust and Checkout Readiness Audit | 6 | 7 | 7 | 5 | 5 | 3 | 2.50 | Week 3 |
| 7 | CJ Supplier Reliability and Fulfillment Risk Audit | 5 | 8 | 8 | 6 | 5 | 5 | 1.91 | Week 3 |
| 8 | Expand to Second Marketplace | 8 | 7 | 8 | 8 | 4 | 7 | 1.53 | Week 4 or later |
| 9 | Broad Catalogue Refinement of Hundreds of Products | 5 | 6 | 7 | 9 | 3 | 5 | 1.29 | Defer until sales signals justify it |
| 10 | Advanced Storefront Feature Expansion | 4 | 5 | 6 | 7 | 3 | 4 | 1.36 | Defer unless it fixes a measured conversion constraint |

Note: The dashboard scores higher mathematically than the publishing sprint because it has low difficulty and risk. However, the dashboard should serve the publishing sprint, not replace it. Measurement without more active listings will not create enough new signal.

## Ranked Initiative Detail

### 1. Etsy Revenue Activation Sprint

Impact: Highest immediate path to revenue and learning. Increases marketplace search surface, product data, and buyer exposure using already prepared assets.

Cost: Low cash cost. Main cost is operator time and Etsy listing/renewal fees.

Effort: Moderate. Requires OAuth refresh, command cleanup, draft review, and publishing discipline.

Risk: Medium-low. Risks are inaccurate specs, weak supplier reliability, poor hero images, and publishing products with unclear dimensions or certification claims.

Dependencies: Etsy OAuth, working package scripts/env loading, shipping profile, return policy, readiness state, product partner settings, active draft review.

Recommended Timing: Start immediately. This is the one initiative to complete this week.

### 2. Weekly Marketplace KPI and Margin Dashboard

Impact: Converts activity into management control. Prevents running in circles by forcing every listing into one of four actions: keep, improve, duplicate, or kill.

Cost: Low. Uses Etsy endpoints and local reports.

Effort: Moderate. Requires a script/report that pulls active listings and transaction data, then joins pricing and estimated cost assumptions.

Risk: Low. Main risk is incomplete Etsy metrics if OAuth scopes are missing. Etsy API endpoints identified as relevant: getListingsByShop, getShopReceiptTransactionsByListing, getShopReceipts, getPayments, getReviewsByShop.

Dependencies: OAuth with listings_r and transactions_r; margin assumptions from CJ/supplier data; consistent SKU/listing mapping.

Recommended Timing: Build in Week 1 after Etsy access is refreshed.

### 3. Publish Next 10 Brand-Fit Listings from Existing Candidate Reports

Impact: Expands search coverage around a coherent aesthetic: glass globes, smoked/opal glass, brass/black hardware, modern/nordic/minimalist lighting.

Cost: Low to moderate. Mostly listing fees and review time.

Effort: Moderate. Candidate reports already exist; work is review, draft creation, image check, and publishing.

Risk: Medium. Risk rises if variants are complex or specs are missing.

Dependencies: Week 1 publishing workflow; active listing performance; candidate reports in reports/etsy.

Recommended Timing: Week 2.

### 4. Product Economics Gate

Impact: Protects margin and customer experience. Early revenue is not valuable if it creates unprofitable orders, return exposure, or fulfillment issues.

Cost: Low. Requires supplier price, shipping cost, Etsy fees, ad assumptions, and return reserve.

Effort: Moderate. Some supplier/CJ data may need API pulls or manual verification.

Risk: Medium. Data may be incomplete, and dropship shipping costs can change.

Dependencies: CJ product truth, Etsy listing price, shipping profile, payment/transaction fee assumptions.

Recommended Timing: Start Week 1 for listings being published; formalize in Week 2.

### 5. Etsy Conversion Optimization Loop

Impact: Improves existing listing performance through title, tag, hero image, price, and offer tests.

Cost: Low.

Effort: Moderate. Requires disciplined weekly changes and avoiding too many simultaneous edits.

Risk: Low-medium. Over-editing can blur causality.

Dependencies: KPI dashboard, active listings, enough impressions/clicks/orders to compare.

Recommended Timing: Week 2-3.

### 6. Storefront Trust and Checkout Readiness Audit

Impact: Ensures marketplace visitors who click through to Elvato.shop can trust and buy. Storefront becomes more valuable once Etsy creates demand signal.

Cost: Low-moderate.

Effort: Moderate. Audit product pages, checkout, shipping clarity, return policy, contact/trust signals, analytics, and abandoned checkout visibility.

Risk: Medium. Can become a design rabbit hole if not constrained.

Dependencies: Current storefront deployment, payment provider health, analytics, product availability.

Recommended Timing: Week 3, after marketplace activation.

### 7. CJ Supplier Reliability and Fulfillment Risk Audit

Impact: Protects customer satisfaction and margin before scaling winners.

Cost: Low-moderate.

Effort: Moderate-high depending on CJ API access and supplier data quality.

Risk: Medium-high because supplier truth may conflict with marketplace promises.

Dependencies: CJ API access, product SKU mapping, shipping times, stock levels, defect/return assumptions.

Recommended Timing: Week 3 for products that show buyer intent.

### 8. Expand to Second Marketplace

Impact: Potential revenue growth and channel diversification.

Cost: Moderate. Each marketplace adds listing rules, image requirements, order handling, support, and inventory sync complexity.

Effort: High.

Risk: High. Premature expansion can multiply operational complexity before the offer is proven.

Dependencies: Repeatable Etsy publishing and measurement loop, product economics gate, source-of-truth SKU mapping.

Recommended Timing: Week 4 or later. Do not start before Etsy has a stable weekly operating cadence.

### 9. Broad Catalogue Refinement

Impact: Long-term asset creation, but low immediate ROI if done before demand validation.

Cost: High opportunity cost.

Effort: Very high. Repo memory indicates hundreds of products still need deeper polish.

Risk: Medium. The business could spend weeks polishing products no one wants.

Dependencies: Sales data to prioritize products, refinement scripts, CJ source truth.

Recommended Timing: Defer. Refine only products selected by marketplace data or strong candidate fit.

### 10. Advanced Storefront Feature Expansion

Impact: Useful later, but currently less urgent than traffic and product-market signal.

Cost: Moderate-high.

Effort: High.

Risk: Medium. Risks consuming engineering time without measurable demand.

Dependencies: Known conversion bottlenecks, analytics, enough traffic.

Recommended Timing: Defer except for checkout-blocking bugs or trust issues.

## 30-Day Action Plan

### Week 1: Activate Revenue Surface

Primary objective: turn prepared assets into live listings and measurable data.

Actions:

- Fix Etsy operating workflow:
  - Correct marketplace/Etsy package script paths or move command ownership to the actual script location.
  - Make Etsy scripts load marketplace/Etsy/.env.local or consolidate env files into a single expected location.
  - Refresh OAuth token and verify shop access.
- Publish the strongest existing ready-for-review drafts after a go/no-go review.
- Create a simple weekly Etsy KPI report in Operations.
- Define the product economics gate for every active or soon-to-publish listing.

Week 1 success metric:

- 8-10 additional listings activated, or every blocked listing has a specific missing-field reason.
- A report exists that shows active listing count, transactions, revenue, and estimated gross margin by listing.

### Week 2: Scale the Proven Loop

Primary objective: repeat the publishing process with the next best candidates.

Actions:

- Use candidate reports to select the next 10 highest-fit listings.
- Draft and review them using the same gate.
- Apply active-listing SEO and image ranking checks.
- Start first conversion optimization cycle on listings with impressions or transactions.

Week 2 success metric:

- 10 more publish-ready listings or drafts with clear go/no-go status.
- KPI report compares Week 1 vs Week 2.

### Week 3: Protect Margin and Customer Experience

Primary objective: reduce fulfillment and conversion risk around any products showing demand.

Actions:

- Audit CJ/supplier reliability for listings with buyer activity or strong traffic.
- Verify shipping times, stock, dimensions, voltage/wattage/certification claims, and return exposure.
- Audit storefront trust and checkout readiness.
- Fix only issues that directly block purchase confidence or order completion.

Week 3 success metric:

- Every demand-positive listing has a margin and fulfillment confidence score.
- Storefront checkout and trust blockers are either fixed or documented.

### Week 4: Decide Scaling Path

Primary objective: allocate next month’s work based on observed signal.

Actions:

- Rank active listings by revenue, margin, conversion proxy, and strategic fit.
- Choose whether to deepen Etsy, expand to another marketplace, or invest in storefront conversion based on data.
- Create the next 30-day operating plan with explicit kill/keep/improve/duplicate decisions.

Week 4 success metric:

- A decision memo identifies top products/categories, products to stop investing in, and the next channel bet.

## Operating Rules Going Forward

1. Do not polish broad catalogue batches without a marketplace or sales reason.
2. Do not expand channels until Etsy publishing and measurement can run weekly without friction.
3. Do not optimize the storefront beyond trust and checkout basics until there is traffic worth converting.
4. Every new listing must pass the product economics gate before publishing.
5. Every week ends with a decision report: keep, improve, duplicate, or kill.

## Immediate Workflow Recommendations

### Workflow 1: Etsy Weekly Operating Report

Purpose: create the management cockpit.

Inputs:

- Active Etsy listings
- Listing-level transactions
- Shop receipts
- Payments
- Reviews
- Product/listing mapping
- Estimated supplier cost and shipping cost

Outputs in Operations:

- Active listing count
- New listings published this week
- Orders/transactions by listing
- Gross revenue by listing
- Estimated gross margin by listing
- Listings needing action
- Next 10 product candidates

### Workflow 2: Listing Publish Gate

Purpose: prevent low-quality or risky listings from going live.

Checklist:

- Hero image is strong and clear.
- At least 6 images; target 8-10.
- Title and tags use all important search surface.
- Price clears target gross margin after supplier cost, shipping, Etsy fees, payment fees, and return reserve.
- Dimensions and electrical specs are verified or intentionally disclosed as unavailable.
- Shipping profile and processing time match supplier reality.
- Variant names and images are understandable.
- Return policy and production partner are correct.

Decision states:

- Publish now
- Needs spec verification
- Needs image work
- Needs pricing adjustment
- Reject for risk/low fit

### Workflow 3: Candidate Selection Loop

Purpose: avoid duplicating effort across catalogue, storefront, and marketplaces.

Weekly process:

1. Pull the highest-fit candidates from existing reports.
2. Exclude products already drafted or active.
3. Apply product economics gate.
4. Create drafts for the top 10.
5. Publish only those that pass review.
6. Feed results back into the next selection cycle.

## Key Risks

- Publishing risky listings too quickly: mitigated by the publish gate.
- Spending weeks on infrastructure while active listing count remains low: mitigated by weekly active listing target.
- Margin erosion from shipping, supplier changes, Etsy fees, or returns: mitigated by product economics gate.
- Channel sprawl: mitigated by delaying second marketplace expansion until Etsy cadence is repeatable.
- Poor measurement: mitigated by a weekly KPI report using Etsy transaction endpoints.
- Operational fragility: currently visible in command path/env/OAuth issues; fix this before scaling listing volume.

## Opportunity Costs

- Every week spent polishing unvalidated catalogue products delays marketplace learning.
- Every week spent redesigning the storefront before traffic exists delays revenue validation.
- Every new marketplace added before Etsy is operationally stable multiplies work and support complexity.
- Every listing published without margin and fulfillment checks can create negative-value orders.

## Most Important Missing Information

1. Current Etsy shop metrics: views, visits, favorites, conversion rate, orders, revenue, and ad spend by listing.
2. Current exact active/draft/deactivated listing counts from live Etsy, refreshed after OAuth renewal.
3. Supplier landed cost per product: item cost, shipping cost, processing time, and stock reliability.
4. Target gross margin threshold by category.
5. Actual order/return/refund history, even if small.
6. Current storefront analytics: traffic sources, product page views, add-to-cart events, checkout starts, checkout completion.
7. Brand positioning decision: ALVATTA vs Elvato naming strategy and whether marketplace listings should drive to the storefront.
8. Advertising budget and payback tolerance.
9. Capacity constraint: how many listings can be reviewed, published, and supported per week without quality decay.
10. Compliance posture for electrical lighting products: certification claims, voltage compatibility, installation disclaimers, and liability tolerance.

## COO Decision

The company should spend this week on Etsy Revenue Activation, not broad catalogue cleanup, not a storefront redesign, and not second-marketplace expansion.

The operating question for the week is simple: can Elvato reliably publish more high-fit listings and measure whether buyers respond?

If yes, the business earns the right to scale listing volume and channel expansion. If no, the constraint is not product supply or website polish; it is the operating system for turning product assets into revenue.
