# Marketplace

Marketplace-specific configuration and command shortcuts for external sales channels.

The executable Etsy publisher lives in `../scripts/etsy/publish-etsy-listing.mjs`. This folder owns the channel-specific environment and command entry points so the storefront/catalog polish workflow stays separate.

## Setup

Copy the example env file and fill in the real values:

```bash
cp marketplace/.env.example marketplace/.env.local
```

The Etsy script auto-loads environment variables from `marketplace/.env.local` and `marketplace/.env` before falling back to the broader repo/admin env files.

Use `https://elvato.shop/callback` as the Etsy OAuth callback URL. The storefront route exists at `storefront/src/app/callback/page.tsx` and is only used to receive Etsy authorization responses.

## Etsy Commands

Run from this folder:

```bash
yarn etsy:auth
```

Open the generated Etsy URL. It includes the required `state` and PKCE `code_challenge` values, and saves the matching verifier to `marketplace/.etsy-oauth.json`.

After Etsy redirects to `https://elvato.shop/callback`, copy the `code` and `state` values from the page and exchange them for OAuth tokens:

```bash
yarn etsy:token --code returned-code --state returned-state
```

That writes `ETSY_ACCESS_TOKEN` and `ETSY_REFRESH_TOKEN` to `marketplace/.env.local`.

Refresh an expired Etsy access token:

```bash
yarn etsy:refresh
```

Verify Etsy API access:

```bash
yarn etsy:check
```

That verifies Etsy API access, resolves the shop, and writes a `reports/etsy/check-shop-*.json` report.

Search Etsy seller taxonomy nodes:

```bash
yarn etsy:taxonomy chandelier
```

Save a selected taxonomy ID as the default for draft listings:

```bash
yarn etsy:taxonomy --set-default taxonomy-id
```

Generate a dry-run listing plan without touching Etsy:

```bash
yarn etsy:plan --handle product-handle
```

Create an Etsy draft listing:

```bash
yarn etsy:draft --handle product-handle
```

Create and activate a listing only after reviewing the draft plan:

```bash
yarn etsy:publish --handle product-handle
```

## Notes

- Keep real Etsy credentials in `marketplace/.env.local` or `marketplace/.env`.
- `ETSY_API_KEY` is required, but listing writes also require an OAuth `ETSY_ACCESS_TOKEN` with the right scopes.
- `ETSY_SHOP_ID`, `ETSY_DEFAULT_TAXONOMY_ID`, and `ETSY_SHIPPING_PROFILE_ID` are required for draft creation.
- The original storefront polish script remains `../scripts/catalog/refine-listing.mjs` and should not be used for marketplace publishing.
