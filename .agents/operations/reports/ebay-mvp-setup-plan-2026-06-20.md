# eBay MVP Setup Plan

Date: 2026-06-20

## Objective

Launch Elvato's post-Etsy marketplace path through eBay with a small, controlled MVP batch of 10-15 vetted lighting products.

## Start Here

1. Prepare the eBay seller account. Done.
2. Create business policies in eBay Seller Hub: payment, fulfillment, and returns. Done.
	- Payment policy ID: 293247159014
	- Fulfillment/shipping policy ID: 293247177014
	- Return policy ID: 293247185014
3. Register an eBay Developer app and store production credentials in `marketplace/Ebay/.env.local`. Submitted; pending eBay approval.
	- Sandbox developer credentials received.
	- Production account closure notification endpoint added: `https://elvato.shop/api/ebay/account-deletion`.
	- Verification token must be configured in Vercel and eBay's developer console with the same value.
4. Generate the first launch queue:

```bash
cd marketplace/Ebay
yarn ebay:select-candidates
```

5. Review `.agents/operations/reports/ebay-launch-candidate-queue-YYYY-MM-DD.md`.
6. Verify supplier cost, shipping, dimensions, voltage/wattage, bulb base, and compliance language for each product.
7. Publish the first products manually or proceed to API publishing once credentials and policies are confirmed.

## Current Blocker

eBay Developer Program access is pending approval. eBay indicates approval takes at least one business day. API OAuth, inventory publishing, and automated KPI pulls should wait until the developer account is approved and credentials are available.

## Work To Do While Developer Access Is Pending

1. Review the 15-product candidate queue.
2. Pick the first 5 products for manual readiness review.
3. Verify supplier cost, shipping time, dimensions, voltage/wattage, bulb base, materials, and compliance language.
4. Confirm the seller account's item location and handling-time promise.
5. Draft eBay-safe listing copy that avoids handmade, custom-made, local manufacturing, and unsupported certification claims.
6. Decide whether the first listings will be created manually in Seller Hub or held for API publishing after approval.

## Week 1 Definition Of Done

- eBay seller account ready. Done.
- eBay business policies created. Done.
- Developer credentials prepared. Pending eBay approval.
- 15-product launch queue generated.
- 10 products pass the launch gate.
- First listing plans are ready for manual listing or API publishing.

## Compliance Positioning

Elvato should position products as curated modern lighting, not handmade or artisan goods. Listing copy must avoid claims that are not factually supported by supplier documentation.

## Technical Deliverables Created

- `marketplace/Ebay/README.md`
- `marketplace/Ebay/.env.example`
- `marketplace/Ebay/package.json`
- `marketplace/Ebay/listing-plan.schema.json`
- `scripts/ebay/select-launch-candidates.mjs`

## Next Technical Step

After the candidate queue is reviewed, build an eBay listing-plan generator that pulls full Medusa product data and produces draft-ready listing JSON with title, category, item specifics, description, images, price, SKU, and launch-gate status.