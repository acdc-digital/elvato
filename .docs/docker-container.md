# Docker Container (Railway)

The Medusa admin backend runs as a Docker container on Railway, built from `admin/Dockerfile` and orchestrated via `railway.json`.

## Container Configuration

### Dockerfile (`admin/Dockerfile`)

| Layer | Purpose |
|-------|---------|
| Base image | `node:20-slim` (pinned digest) |
| Install | `npm ci` with production flags |
| Build | `npm run build` → compiles Medusa to `.medusa/server/` |
| Runtime deps | `cd .medusa/server && npm install --omit=dev` |
| Working dir | `/app/.medusa/server` |
| Port | `9000` |

### Railway Config (`railway.json`)

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "admin/Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Railway uses the Dockerfile builder (not Nixpacks) because `railway.json` explicitly sets `builder: "DOCKERFILE"`. The `nixpacks.toml` in the repo is ignored.

## Startup Sequence

The container `CMD` runs three steps sequentially on every deploy/restart:

```sh
npx medusa db:migrate && npx medusa exec ./src/scripts/bootstrap-meilisearch.ts && npm run start
```

### Step 1: Database Migration

```sh
npx medusa db:migrate
```

Applies pending migrations to the Neon PostgreSQL database. Safe to run repeatedly — only applies new migrations.

### Step 2: MeiliSearch Bootstrap

```sh
npx medusa exec ./src/scripts/bootstrap-meilisearch.ts
```

Runs inside the Medusa container context with access to all registered modules. Performs two operations:

1. **Configure index** — sets searchable, filterable, sortable, and displayed attributes; adds stop words and synonyms
2. **Full product sync** — iterates all products in batches of 50, enriches each with facet data (main_category, sub_categories, materials, styles, room_types), and indexes into MeiliSearch

This step is required because MeiliSearch on Railway uses **ephemeral storage** — the index is wiped on every service restart.

### Step 3: Start Server

```sh
npm run start
```

Starts the Medusa server on port 9000. The server does not accept traffic until this step completes, so there is no window where the storefront hits an empty MeiliSearch index.

## Ephemeral Storage Problem

Railway does not provide persistent volumes for the MeiliSearch service. This means:

- Every deploy, restart, or scaling event wipes MeiliSearch data
- The bootstrap step in the admin container repopulates the index automatically
- The storefront has a fallback to the Medusa Store API if MeiliSearch is temporarily unavailable

### If bootstrap fails

The server still starts (`&&` chains, but `npm run start` runs regardless of bootstrap exit code in the current CMD). Products will still appear on the storefront via the Medusa API fallback, but search quality and facet filters will be unavailable.

To manually trigger a re-sync without redeploying:
- **Admin UI:** Navigate to the MeiliSearch page and click "Sync All Products"
- **API:** `POST /admin/meilisearch/sync` (requires admin auth)
- **CLI:** `npx medusa exec ./src/scripts/bootstrap-meilisearch.ts` (if you have Railway CLI access)

## Key Files

| File | Purpose |
|------|---------|
| `admin/Dockerfile` | Container image definition |
| `railway.json` | Railway build/deploy configuration |
| `admin/src/scripts/bootstrap-meilisearch.ts` | Configure + full sync script (runs on startup) |
| `admin/src/scripts/configure-meilisearch.ts` | Index settings only (configure without sync) |
| `admin/src/modules/meilisearch/service.ts` | MeiliSearch module service wrapper |
| `admin/src/modules/meilisearch/facet-mapping.ts` | Facet extraction logic (materials, styles, room types, sub-categories) |
| `admin/src/workflows/sync-products-to-meilisearch.ts` | Medusa workflow for batch product sync |
| `admin/src/api/admin/meilisearch/sync/route.ts` | Admin API endpoint for manual full re-index |

## Monitoring

Docker Desktop on your local machine has **no connection** to Railway containers. All monitoring is done via the Railway dashboard:

- **Deploy logs** — build output + startup sequence (migrate → bootstrap → start)
- **Runtime logs** — live application logs from the Medusa server
- **Metrics** — CPU, memory, and network usage
- **Status** — "Online" (green) confirms the container is running

## Maintenance Notes

- **Adding new startup steps:** Append to the `CMD` line in `admin/Dockerfile` with `&&`
- **Changing index settings:** Edit `admin/src/scripts/configure-meilisearch.ts` and/or `bootstrap-meilisearch.ts` — takes effect on next deploy
- **Adding new facets:** Update `admin/src/modules/meilisearch/facet-mapping.ts` with new extraction maps, add fields to the configure script's filterable/searchable attributes, and update the storefront filter components
- **Node version:** Pinned to Node 20 in the Dockerfile base image. Update the `FROM` line to change.
