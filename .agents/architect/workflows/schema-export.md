# Schema Export Workflow

## Purpose

Capture real Neon/PostgreSQL and Convex schema context before producing architecture recommendations.

## Output Location

Store schema snapshots in:

```text
.agents/architect/schema-exports/YYYY-MM-DD/
```

## Neon PostgreSQL Export

Preferred outputs:

- `neon-schema.sql`: schema-only dump.
- `neon-tables.csv`: table names, row estimates, and size.
- `neon-indexes.csv`: indexes by table.
- `neon-constraints.csv`: primary keys, foreign keys, unique constraints.

Use `scripts/export-neon-schema.sh` if `DATABASE_URL` is available in the shell environment.

## Convex Export

Preferred outputs:

- `convex-schema.ts`: copy of `convex/schema.ts`.
- `convex-schema-summary.md`: human-readable table/index summary.

Use `scripts/export-convex-schema.sh`.

## Review Rule

Do not produce a full data architecture recommendation from memory when schema exports are available. Use the exported files as the critique surface.