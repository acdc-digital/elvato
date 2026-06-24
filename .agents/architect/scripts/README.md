# Architect Scripts

## Export Convex Schema

```bash
bash .agents/architect/scripts/export-convex-schema.sh
```

Outputs to:

```text
.agents/architect/schema-exports/YYYY-MM-DD/
```

## Export Neon Schema

Set `DATABASE_URL` in your shell, then run:

```bash
bash .agents/architect/scripts/export-neon-schema.sh
```

This writes schema-only SQL plus CSV summaries for tables, indexes, and constraints. Do not commit credentials.