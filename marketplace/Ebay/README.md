# eBay Marketplace

This folder owns Elvato's eBay channel setup, environment, operating notes, and command shortcuts.

The current phase is **MVP setup**, not unattended live publishing. We are using existing Medusa/Etsy candidate intelligence to create a compliant eBay launch queue, generate listing plans, validate eBay metadata, then apply/publish only after seller account, policies, OAuth, location, category, and launch gates are ready.

## Why eBay First

eBay is the next marketplace because it fits curated retail / supplier-sourced lighting better than Etsy. The positioning should be clear and factual: modern lighting, home decor, pendant lights, sconces, chandeliers, table lamps, and floor lamps. Do not use handmade, artisan-made, locally made, or custom-made claims unless they are factually true.

## Account Setup Checklist

1. Create or prepare the eBay seller account.
2. Complete seller verification and payment setup.
3. Create business policies in Seller Hub:
   - payment policy
   - fulfillment/shipping policy
   - return policy
4. Register an eBay Developer app and complete account-deletion compliance.
5. Add production credentials to `.env.local` using `.env.example` as the template once production keys are granted.
6. Confirm item location and handling-time promises match supplier reality.
7. Create or verify the eBay inventory location.
8. Generate listing plans, resolve category/aspect review, then dry-run Inventory API payloads.
9. Publish only with explicit `--apply --publish --yes` after review.

## eBay Account Closure Notification Endpoint

Production eBay apps must comply with eBay's marketplace account deletion/closure notification policy.

Use this endpoint in the eBay developer console:

```text
https://elvato.shop/api/ebay/account-deletion
```

Use the same verification token in both places:

- eBay developer account closure policy settings
- Vercel/storefront env var `EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN`

The endpoint is implemented in the storefront at:

```text
storefront/src/app/api/ebay/account-deletion/route.ts
```

Required storefront production env vars:

```text
EBAY_ACCOUNT_DELETION_ENDPOINT=https://elvato.shop/api/ebay/account-deletion
EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN=<same-token-entered-in-ebay>
```

The production endpoint has been deployed and verified. Keep the token consistent between eBay Developer settings, Vercel, and local operational notes.

## Commands

Run from this folder:

```bash
yarn ebay:select-candidates
```

This generates:

- `reports/ebay/launch-candidates-*.json`
- `reports/ebay/launch-candidates-*.md`
- `.agents/operations/reports/ebay-launch-candidate-queue-YYYY-MM-DD.md`

Select more candidates:

```bash
yarn ebay:select-candidates --limit 20
```

Check local setup and non-mutating eBay API readiness:

```bash
yarn ebay:check-setup
```

Start the eBay public API MCP server for VS Code/Copilot:

```bash
yarn ebay:mcp
```

The workspace MCP configuration registers this as `ebay-api`. The launcher reads `marketplace/Ebay/.env.local`, refreshes an access token from `EBAY_REFRESH_TOKEN`, and starts `@ebay/npm-public-api-mcp`. Keep `EBAY_ENV=production` for live APIs or set `EBAY_ENV=sandbox` for sandbox APIs.

If the refresh token is missing or belongs to another client, set `EBAY_REDIRECT_URI` to the production RuName from eBay Developer Portal, then generate a production consent URL:

```bash
yarn ebay:oauth-url
```

After approving the consent page, exchange the returned `code` value for a new refresh token:

```bash
yarn ebay:oauth-exchange-code --code "<code-from-callback-url>"
```

Create or update the configured eBay inventory location. The default command is a dry run:

```bash
yarn ebay:create-location
yarn ebay:create-location --apply
```

Get eBay leaf-category suggestions for a product title:

```bash
yarn ebay:suggest-categories --query "Modern Glass Bubble Ball Pendant Light"
```

Generate an offline listing plan from the latest launch-candidate report:

```bash
yarn ebay:generate-plan
```

Generate a plan with a reviewed eBay category:

```bash
yarn ebay:generate-plan --category-id 20706 --category-name "Chandeliers & Ceiling Fixtures"
```

Convert a reviewed listing plan into Inventory API payloads. The default command writes a dry-run report:

```bash
yarn ebay:apply-plan --plan ../../reports/ebay/listing-plan-example.json
yarn ebay:apply-plan --plan ../../reports/ebay/listing-plan-example.json --apply
yarn ebay:apply-plan --plan ../../reports/ebay/listing-plan-example.json --apply --publish --yes
```

The final publish command is intentionally explicit. Do not publish plans that still have category, aspect, image, compliance, margin, shipping, or variant review notes.

## Launch Gate

Every candidate must pass this gate before publishing:

- Clear hero image and at least 6 usable images; target 8-10.
- Accurate title with no handmade/custom/manufacturer claims unless verified.
- Dimensions, voltage, wattage, bulb base, material, and installation notes verified where applicable.
- No UL/ETL/CE/certification claim unless source documentation supports it.
- Supplier stock and shipping promise are credible.
- Gross margin clears the channel floor after item cost, shipping, eBay fees, payment fees, and return reserve.
- Variants are understandable and manageable.
- Item location, handling time, return policy, and condition are accurate.

## Next Technical Milestones

1. Candidate selector from existing reports. Done.
2. Setup checker and OAuth refresh helper. Done.
3. Listing plan generator from candidate data. Done.
4. Category metadata lookup and aspect validation.
5. Dry-run Inventory API payload generation. Done.
6. Reviewed apply/publish API integration. Scripted, gated by explicit flags.
7. KPI report for active listings, orders, revenue, margin, questions, cancellations, and returns.

## Current Status

Developer app URL compliance is complete. The remaining setup blockers are production `EBAY_CLIENT_ID`/`EBAY_CLIENT_SECRET`, valid OAuth refresh scope, and inventory-location address fields in `.env.local`.