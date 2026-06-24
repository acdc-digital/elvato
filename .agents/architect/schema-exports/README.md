# Schema Exports

This folder stores dated schema snapshots for architecture reviews.

Run:

```bash
bash .agents/architect/scripts/export-convex-schema.sh
```

For Neon, set `DATABASE_URL` in your shell and run:

```bash
bash .agents/architect/scripts/export-neon-schema.sh
```

Do not commit secrets. Schema-only exports and CSV structure summaries are safe to use as architecture context.