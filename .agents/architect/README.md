# Elvato Architect Agent

This folder defines Elvato's architecture agent: a fractional CTO, Head of Data, and Enterprise Architect focused on scaling Elvato from a single-channel commerce company into a multi-marketplace commerce operation without creating data debt.

## Mandate

Design the future-state data architecture that allows Elvato to support:

- 100,000+ SKUs
- Multiple suppliers
- Multiple warehouses
- Multiple marketplaces
- Millions of historical records
- AI-assisted catalog, pricing, listing, and reporting workflows

## Directory Map

| Path | Purpose |
| --- | --- |
| `architect.md` | Core agent role and operating instructions. |
| `manual/` | Durable architecture principles and data ownership rules. |
| `workflows/` | Repeatable architecture review and schema export workflows. |
| `templates/` | Report and schema context templates. |
| `schema-exports/` | Real exported Neon and Convex schema snapshots for architecture reviews. |
| `reports/` | Completed architect assessments and roadmaps. |
| `scripts/` | Helper scripts for collecting schema context. |

## Operating Rule

Architecture recommendations must be grounded in actual system shape whenever possible. Before producing a major architecture recommendation, export or inspect:

1. Neon/PostgreSQL schema, relationships, indexes, constraints, and table sizes.
2. Convex schema and indexes.
3. Current marketplace mapping structures.
4. Current product, inventory, price, media, and order data flows.

## Start Here

1. Read `architect.md`.
2. Run or follow `workflows/schema-export.md`.
3. Use `templates/architecture-assessment.md` for the final deliverable.
4. Save completed reports in `reports/`.