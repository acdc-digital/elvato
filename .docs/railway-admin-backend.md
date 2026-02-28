# Railway Deployment — Medusa Admin & Backend API

**Service:** `medusa-backend`  
**URL:** `https://medusa-backend-production-d681.up.railway.app`  
**Admin panel:** `https://medusa-backend-production-d681.up.railway.app/app`  
**Health check:** `https://medusa-backend-production-d681.up.railway.app/health`  
**Status:** ✅ Live  
**Last verified:** February 2026

---

## Overview

The Medusa backend is a single Railway service that hosts both:

- **The backend API** — all Store API (`/store/*`) and Admin API (`/admin/*`) endpoints
- **The Admin UI** — a React/Vite SPA served by the backend at `/app`

Medusa v2 builds and bundles the admin frontend as a static asset during `medusa build`, so there is no separate frontend service. Both the API and the admin panel run from the same process on port `9000`.

### Infrastructure at a Glance

| Layer | Service | Provider |
|-------|---------|----------|
| Backend + Admin | `medusa-backend` | Railway |
| PostgreSQL database | Neon pooled connection | Neon |
| Redis cache, event bus, workflow engine | Upstash Redis | Upstash |
| Storefront | Next.js | Vercel |
| Catalogue manager | Next.js + Convex | Vercel + Convex |

---

## Architecture: How the Build Works

Railway builds the service using the `admin/Dockerfile` specified in the root `railway.json`. The Docker image follows a **build-inside-container** pattern — there is no prebuilt output committed to the repository.

```
Source code (admin/)
    │
    ├── npm ci                          [install all deps, incl. devDependencies needed for build]
    │
    ├── npm run build                   [medusa build → compiles TS + Vite admin → .medusa/server/]
    │
    ├── cd .medusa/server               [switch to build output directory]
    │
    └── npm install --omit=dev          [install only production dependencies in the output dir]
                │
                └── CMD: npm run start  [medusa start from .medusa/server]
```

The `medusa build` command produces a `.medusa/server/` output directory containing:
- Compiled TypeScript backend source
- Compiled + bundled admin UI static assets (`public/admin/`)
- A `package.json` used for runtime

---

## Repository Files

### `admin/Dockerfile`

The primary build and runtime specification used by Railway.

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:20-slim@sha256:d8a35d586fad3af7abb6fdb9ba972388395405f4d462da9e4a4ddcde67b5e0fb

WORKDIR /app

ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

COPY package*.json ./
RUN npm ci --no-audit --no-fund --loglevel=warn

COPY . ./
RUN npm run build && cd .medusa/server && npm install --omit=dev --no-audit --no-fund --loglevel=warn

WORKDIR /app/.medusa/server

ENV NODE_ENV=production

EXPOSE 9000

CMD ["npm", "run", "start"]
```

Key decisions:

| Decision | Reason |
|----------|--------|
| Node image pinned by digest | Reproducible builds — prevents silent base image changes |
| `npm_config_audit/fund/update_notifier=false` | Suppresses noisy network checks during install |
| `--no-audit --no-fund --loglevel=warn` | Reduces build output noise; prevents false-positive audit failures |
| No BuildKit cache mounts | Railway's builder requires `--mount=type=cache,id=<cache-id>` with a specific prefix — removed to avoid parse errors |
| Migrations **not** run at startup | Running `medusa db:migrate` at boot caused Railway timeout failures; run manually as a one-off command |
| `WORKDIR` switched to `.medusa/server` | `npm run start` must execute inside the build output directory |

### `admin/.dockerignore`

Controls which files are sent to the Docker build context. Source-build-friendly — excludes generated artifacts and secrets.

```
node_modules
.git
.gitignore
.medusa
.cache
coverage
dist
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.DS_Store
```

> `.medusa` is excluded because the build generates it fresh inside the container; it must not be copied in.

### `railway.json` (repo root)

Pins the Railway builder to Dockerfile and prevents auto-detection of other builders (e.g., the Yarn/Nixpacks build that was being triggered by `storefront/yarn.lock`).

```json
{
  "$schema": "https://railway.app/railway.schema.json",
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

### `admin/nixpacks.toml`

Fallback Nixpacks configuration present in case the Railway service is ever switched away from Dockerfile mode. Ensures npm is used instead of Yarn if Nixpacks auto-detects the project.

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm-10_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build", "cd .medusa/server && npm install --omit=dev"]

[start]
cmd = "cd .medusa/server && npx medusa db:migrate && npm run start"
```

### `admin/src/api/route.ts`

A Medusa custom API route that redirects `GET /` to `/app`. Follows Medusa v2's file-based routing convention — the file path maps directly to the URL path.

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.redirect(302, "/app")
}
```

---

## Environment Variables

All variables must be set in the Railway service's **Variables** tab. Never commit secrets to the repository.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@endpoint-pooler.region.aws.neon.tech/dbname?sslmode=require` |
| `REDIS_URL` | Upstash Redis connection string | `rediss://default:token@host.upstash.io:6379` |
| `STORE_CORS` | Allowed origins for Store API requests | `https://elvato.com,https://www.elvato.com` |
| `ADMIN_CORS` | Allowed origins for Admin API requests | `https://medusa-backend-production-d681.up.railway.app` |
| `AUTH_CORS` | Allowed origins for auth endpoints | `https://medusa-backend-production-d681.up.railway.app` |
| `JWT_SECRET` | Secret for signing JWTs | *(strong random string — never `supersecret` in production)* |
| `COOKIE_SECRET` | Secret for signing cookies | *(strong random string — never `supersecret` in production)* |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MEDUSA_BACKEND_URL` | Public URL of this service (used by admin UI build) | Not set |
| `MEDUSA_WORKER_MODE` | `shared`, `server`, or `worker` | `shared` |
| `DISABLE_MEDUSA_ADMIN` | Set `true` to disable admin UI | Not set (admin enabled) |
| `NODE_ENV` | Runtime environment | `production` (set in Dockerfile) |

> ⚠️ **Do not set `DISABLE_MEDUSA_ADMIN=true`** unless you intentionally want to disable the admin panel. This was the root cause of an early deployment issue where the admin UI was missing.

### Local Development Template

See `admin/.env.template` for a development-ready reference. Copy to `admin/.env` and fill in your values — never commit `.env` to version control.

---

## Running Database Migrations

Migrations are **not run automatically at container startup** (removed to prevent Railway boot timeouts). Run them manually using the Railway CLI:

```bash
railway run --service medusa-backend npm run predeploy
```

The `predeploy` script in `admin/package.json` maps to `medusa db:migrate`.

---

## Railway Service Configuration

| Setting | Value |
|---------|-------|
| Service name | `medusa-backend` |
| Builder | Dockerfile |
| Dockerfile path | `admin/Dockerfile` (set in `railway.json`) |
| Private domain | `medusa-backend.railway.internal` |
| Public domain | `medusa-backend-production-d681.up.railway.app` |
| Internal port | `9000` |
| Restart policy | On failure — max 10 retries |

### Networking

- `medusa-backend.railway.internal` is a **private** hostname — only accessible from within the Railway project (e.g., for service-to-service calls).
- The public domain is what external clients, the storefront, and browsers use.
- Railway terminates TLS and proxies to internal port `9000`; no `:9000` suffix is needed in public URLs.

---

## Live Endpoint Reference

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /health` | `200 OK` | Railway health check target |
| `GET /app` | `200 OK` | Admin UI (React SPA) |
| `GET /` | `302 → /app` | Root redirect via custom Medusa route |
| `GET /admin/*` | `401 Unauthorized` | Admin REST API — requires auth token |
| `GET /store/*` | Varies | Store REST API — public or publishable key |

---

## Troubleshooting

### `yarn install --check-cache` fails at build time

**Cause:** Railway's Nixpacks auto-detected `storefront/yarn.lock` and selected a Yarn builder, bypassing the Dockerfile.  
**Fix:** Ensure `railway.json` at repo root pins `"builder": "DOCKERFILE"`. If builder is set to Nixpacks in the Railway UI, override it back to Dockerfile.

### `Cache mounts MUST be in the format --mount=type=cache,id=<cache-id>`

**Cause:** Railway's BuildKit parser requires explicit `id=` suffix on cache mounts; mounts without `id=` or with non-prefixed IDs are rejected.  
**Fix:** Remove all `--mount=type=cache` flags from Dockerfile `RUN` commands. Standard `npm ci` without mounts is fully supported.

### `Cache mount ID is not prefixed with cache key`

**Cause:** Even with `id=` present, Railway validates that the cache ID matches a specific prefix format.  
**Fix:** Remove cache mounts entirely — they are an optimisation only and their absence does not affect correctness.

### `Application failed to respond` — 502 on all routes

**Cause:** Container crashed or timed out during startup, often because `medusa db:migrate` at boot took too long before Railway's health check deadline.  
**Fix:** Remove `npx medusa db:migrate &&` from the `CMD`. Run migrations as a separate one-off command. Current `CMD` is `npm run start` only.

### `/app` returns 404 after deploy

**Cause:** `DISABLE_MEDUSA_ADMIN=true` is set in Railway environment variables.  
**Fix:** Delete the `DISABLE_MEDUSA_ADMIN` variable in Railway Variables tab, then redeploy.

### `Cannot GET /`

**Cause:** Normal Medusa behaviour — no route is defined for `/` by default.  
**Status:** Addressed by `admin/src/api/route.ts` which adds a `302` redirect to `/app`. If this still appears after deploy, ensure the route file was included in the build.

---

## Deployment Workflow

### Standard Deploy

```bash
# Make changes inside admin/
git add .
git commit -m "Your change description"
git push origin main
# Railway auto-deploys on push to main
```

### Verify After Deploy

1. Check Railway **Deploy logs** — confirm Dockerfile path is used (not Nixpacks/Yarn).
2. Confirm the build log shows `medusa build` completing both backend and frontend steps.
3. Hit the health endpoint:
   ```bash
   curl https://medusa-backend-production-d681.up.railway.app/health
   # Expected: 200 OK
   ```
4. Open the admin panel: `https://medusa-backend-production-d681.up.railway.app/app`

### Updating the Base Image

The Dockerfile pins Node 20 by digest for reproducibility. To update:

1. Find the latest `node:20-slim` digest on Docker Hub.
2. Update line 2 of `admin/Dockerfile`.
3. Test build locally: `cd admin && npm run build`
4. Commit and push.

---

## Related Files

| File | Purpose |
|------|---------|
| `admin/Dockerfile` | Docker build + runtime definition |
| `admin/.dockerignore` | Files excluded from Docker build context |
| `admin/nixpacks.toml` | Nixpacks fallback if Dockerfile builder is disabled |
| `admin/medusa-config.ts` | Medusa module configuration (DB, Redis, CORS) |
| `admin/.env.template` | Local development environment variable template |
| `admin/src/api/route.ts` | Root `/` → `/app` redirect |
| `railway.json` | Railway project-level build configuration |

## Reference Links

- [Medusa Build & Deploy docs](https://docs.medusajs.com/learn/deployment)
- [Medusa API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes)
- [Railway Dockerfile deployments](https://docs.railway.com/guides/dockerfiles)
