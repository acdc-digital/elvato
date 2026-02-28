# Neon PostgreSQL Database — Elvato

**Project:** `elvato-medusa`  
**Provider:** Neon (serverless PostgreSQL)  
**Region:** AWS US East 1 (N. Virginia)  
**Postgres version:** 17  
**Database name:** `neondb`  
**Branch:** `main` (default)  
**Compute:** 0.25 CU (autoscaling)  
**Status:** ✅ Active  
**Last verified:** February 2026

---

## Architecture Overview

Neon serves as the production PostgreSQL database for the Medusa e-commerce backend. It replaced the local MacBook PostgreSQL instance (`medusa-elvato`) after a full data migration.

```
┌─────────────────────┐       ┌─────────────────────────────┐
│  Medusa Backend     │       │  Neon PostgreSQL             │
│  (Railway / Local)  │──────▶│  Project: elvato-medusa      │
│                     │       │  Branch: main                │
│  medusa-config.ts   │       │  Database: neondb            │
│  DATABASE_URL ──────┼──────▶│  Compute: 0.25 CU (Active)  │
└─────────────────────┘       │  Region: us-east-1           │
                              │  Postgres 17                 │
                              └─────────────────────────────┘
```

### Connection Architecture

Neon provides two connection endpoints for each branch:

| Endpoint Type | Hostname Pattern | Purpose |
|---------------|------------------|---------|
| **Pooled** | `ep-floral-wildflower-aiom3gle-pooler.c-4.us-east-1.aws.neon.tech` | Application connections — uses PgBouncer connection pooling. Recommended for Medusa. |
| **Direct (unpooled)** | `ep-floral-wildflower-aiom3gle.c-4.us-east-1.aws.neon.tech` | Migrations, CLI tools, single long-lived connections. |

The Medusa application uses the **pooled** endpoint for all runtime connections. This is configured via `DATABASE_URL` in the environment.

---

## Current Database State

Migrated from local PostgreSQL on February 25, 2026.

| Metric | Value |
|--------|-------|
| Total tables | 133 |
| Products | 71 |
| Product categories | 477 |
| Regions | 2 |
| Database size | ~21 MB |
| Storage used (Neon) | 0.05 / 0.5 GB |
| Compute used | 0.38 / 100 CU-hrs |
| Network transfer | 0.01 / 5 GB |

---

## Connection Configuration

### `admin/medusa-config.ts`

The database connection is configured in the Medusa config with SSL and the pooled Neon endpoint:

```typescript
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      connection: { ssl: { rejectUnauthorized: false } },
    },
    // ...
  },
})
```

**Key settings:**

| Setting | Value | Reason |
|---------|-------|--------|
| `databaseUrl` | `process.env.DATABASE_URL` | Connection string from environment variable — never hardcoded |
| `ssl.rejectUnauthorized` | `false` | Required for Neon's TLS certificates. Neon terminates TLS at their proxy layer. |

### Connection String Format

```
postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require
```

Example (credentials masked):

```
postgresql://neondb_owner:***@ep-floral-wildflower-aiom3gle-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

- `sslmode=require` — enforces encrypted connections (mandatory for Neon)
- `-pooler` in the hostname — routes through PgBouncer for connection pooling

### Environment Variables

| Variable | Location | Value |
|----------|----------|-------|
| `DATABASE_URL` | `admin/.env` (local) | Pooled Neon connection string |
| `DATABASE_URL` | Railway service vars | Same pooled Neon connection string |

Both local development and Railway production point to the **same Neon database**. There is currently no staging/dev branch separation.

---

## Neon Plan & Limits (Free Tier)

| Resource | Limit | Current Usage |
|----------|-------|---------------|
| Branches | 10 | 1 (`main`) |
| Compute hours | 100 CU-hrs/month | ~0.38 CU-hrs |
| Storage | 0.5 GB | ~0.05 GB |
| Network transfer | 5 GB/month | ~0.01 GB |
| Default compute | 0.25 CU | 0.25 CU |
| History retention | 6 hours | — |
| Autosuspend | After 5 min idle | Enabled |

### Compute Autosuspend

On the free tier, the Neon compute endpoint **automatically suspends** after 5 minutes of inactivity. The first connection after suspension incurs a **cold start delay** of ~1-3 seconds. This is normal and expected for development/low-traffic workloads.

### When to Upgrade

Consider upgrading the Neon plan if:
- Cold start latency impacts user experience on the storefront
- Storage exceeds 0.5 GB (as product catalog/media references grow)
- You need longer history retention for point-in-time recovery
- You want separate database branches for staging/preview environments
- Compute hours are exhausted before month-end

---

## Migration History

### Initial Migration: Local → Neon (February 25, 2026)

**Source:** Local PostgreSQL database `medusa-elvato` on MacBook  
**Target:** Neon project `elvato-medusa`, database `neondb`  
**Method:** `pg_dump` / `pg_restore`

```bash
# 1. Dump local database
pg_dump -Fc -d medusa-elvato -f medusa-elvato.dump

# 2. Restore to Neon (using direct/unpooled endpoint)
pg_restore -d "postgresql://neondb_owner:<password>@ep-floral-wildflower-aiom3gle.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  --no-owner --no-privileges --clean --if-exists medusa-elvato.dump

# 3. Verify migration
medusa db:migrate
```

**Post-migration verification:**
- ✅ 71 products present
- ✅ 477 categories present
- ✅ 2 regions present
- ✅ `medusa db:migrate` — all modules up to date
- ✅ Medusa server starts and connects successfully

---

## Database Schema

Medusa v2 manages the schema through its own migration system. The database contains 133 tables in the `public` schema, covering:

| Domain | Key Tables | Description |
|--------|-----------|-------------|
| Products | `product`, `product_variant`, `product_option`, `product_image` | Product catalog |
| Categories | `product_category` | Hierarchical category tree |
| Pricing | `price`, `price_set`, `price_list` | Product pricing and rules |
| Inventory | `inventory_item`, `inventory_level`, `stock_location` | Stock management |
| Orders | `order`, `order_line_item`, `order_change` | Order lifecycle |
| Cart | `cart`, `cart_line_item`, `cart_shipping_method` | Shopping cart |
| Customers | `customer`, `customer_group` | Customer accounts |
| Regions | `region`, `region_country` | Geographic regions and currencies |
| Shipping | `fulfillment`, `shipping_option`, `shipping_profile` | Fulfillment |
| Auth | `auth_identity`, `provider_identity` | Authentication |
| Workflow | `workflow_execution` | Async workflow state |

> **Do not modify tables directly.** All schema changes must go through Medusa's migration system (`medusa db:migrate`).

---

## Running Migrations

Medusa uses its own migration framework. Migrations must be run whenever:
- The Medusa version is upgraded
- Custom modules with migrations are added
- Database schema drift is suspected

### Local

```bash
cd admin
npx medusa db:migrate
```

### Production (Railway)

```bash
railway run --service medusa-backend npx medusa db:migrate
```

### Checking Migration Status

```bash
cd admin
npx medusa db:migrate
# Output: "Already up to date" if no migrations are pending
```

---

## Backup & Recovery

### Neon Point-in-Time Recovery

Neon supports point-in-time recovery (PITR) within the history retention window:
- **Free tier:** 6 hours of history
- Recovery is done through the Neon dashboard: **Backup & Restore** tab

### Manual Backup

For backups beyond the retention window, create manual dumps:

```bash
# Use the DIRECT (unpooled) endpoint for pg_dump
pg_dump -Fc -d "postgresql://neondb_owner:<password>@ep-floral-wildflower-aiom3gle.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -f "elvato-backup-$(date +%Y%m%d).dump"
```

**Important:** Always use the **direct (unpooled)** endpoint for `pg_dump` and `pg_restore`. The pooled endpoint uses PgBouncer, which can interfere with dump/restore operations.

### Restore from Backup

```bash
# Restore to a Neon branch or new database
pg_restore -d "<DIRECT_CONNECTION_STRING>" \
  --no-owner --no-privileges --clean --if-exists \
  elvato-backup-YYYYMMDD.dump
```

---

## Branching Strategy

Neon supports Git-like database branching. Currently only the `main` branch is in use.

### Future Recommended Setup

| Branch | Purpose | Created From |
|--------|---------|--------------|
| `main` | Production database | — |
| `staging` | Pre-production testing | `main` (snapshot) |
| `preview/*` | PR preview environments | `main` (snapshot) |

To create a branch:
1. Go to **Neon Dashboard → Branches → Create Branch**
2. Select parent branch (`main`)
3. Use the new branch's connection string in the target environment

Branches are copy-on-write — they share storage with the parent until data diverges, so they're storage-efficient.

---

## Monitoring

### Neon Dashboard

- **Monitoring tab:** Query latency, connections, compute usage
- **SQL Editor:** Run ad-hoc queries directly in the browser
- **Usage metrics:** Storage, compute hours, network transfer (may be delayed by up to 1 hour)

### Connection Monitoring Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Largest tables
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Slow queries (if pg_stat_statements is enabled)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### `FATAL: password authentication failed for user "neondb_owner"`

**Cause:** Password has been rotated in the Neon dashboard or Vercel integration was reconnected.  
**Fix:** Get the new password from Neon dashboard → Connection Details, update `DATABASE_URL` in `admin/.env` and Railway env vars.

### `SSL connection is required`

**Cause:** Missing `?sslmode=require` in the connection string or `databaseDriverOptions.ssl` not configured.  
**Fix:** Ensure the connection string ends with `?sslmode=require` and `medusa-config.ts` includes `ssl: { rejectUnauthorized: false }`.

### `too many connections` / `remaining connection slots are reserved`

**Cause:** Exceeded the connection limit on the Neon compute endpoint (free tier: ~100 connections via pooler).  
**Fix:** Ensure you're using the **pooled** endpoint (`-pooler` in hostname). Kill idle connections from the Neon dashboard if needed.

### `endpoint is suspended` / cold start delays

**Cause:** Neon free tier suspends compute after 5 minutes of inactivity.  
**Fix:** This is expected behavior. The first query after suspension takes 1-3 seconds. For always-on compute, upgrade to Pro plan.

### `relation "product" does not exist`

**Cause:** Migrations haven't been run against this database instance.  
**Fix:** Run `npx medusa db:migrate` from the `admin/` directory.

### Connection hangs / times out

**Cause:** Firewall, network issue, or using the wrong endpoint type.  
**Fix:**
1. Verify the endpoint hostname resolves: `nslookup <endpoint>.aws.neon.tech`
2. Test with `psql`: `psql "$DATABASE_URL" -c "SELECT 1;"`
3. Ensure you're not accidentally using the direct endpoint for high-connection workloads

---

## Security Practices

- **Never commit `DATABASE_URL` to version control.** It is stored in `admin/.env` (gitignored) and Railway environment variables.
- **Rotate credentials** periodically via the Neon dashboard → Connection Details → Reset password.
- After rotation, update `DATABASE_URL` in:
  1. `admin/.env` (local development)
  2. Railway service environment variables
  3. Any CI/CD pipelines that reference it
- **Use the pooled endpoint** for application connections (connection pooling limits exposure).
- **Use the direct endpoint** only for migrations, `pg_dump`, and `pg_restore`.
- **`rejectUnauthorized: false`** is set because Neon's TLS proxy uses certificates that may not match the Node.js trust store. Neon encrypts all connections in transit regardless of this setting.

---

## Vercel Integration

Neon was provisioned through the **Vercel Neon integration**, which automatically syncs database credentials to Vercel environment variables. If the storefront is deployed to Vercel, the integration provides:

- `POSTGRES_URL` — pooled connection string
- `POSTGRES_URL_NON_POOLING` — direct connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

These Vercel-managed variables are separate from the `DATABASE_URL` used by Medusa. The Medusa backend (on Railway) uses its own `DATABASE_URL` variable pointing to the same Neon database.

---

## Related Files

| File | Purpose |
|------|---------|
| `admin/medusa-config.ts` | Database connection configuration, SSL settings |
| `admin/.env` | Local `DATABASE_URL` (gitignored) |
| `admin/.env.template` | Connection string format reference |
| `.docs/railway-admin-backend.md` | Railway deployment documentation |

## Reference Links

- [Neon Documentation](https://neon.tech/docs)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Neon Branching](https://neon.tech/docs/introduction/branching)
- [Medusa Database Configuration](https://docs.medusajs.com/learn/fundamentals/medusa-configuration)
- [pg_dump / pg_restore](https://www.postgresql.org/docs/17/app-pgdump.html)
