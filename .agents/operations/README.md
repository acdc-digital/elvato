# Elvato Operations Agent Module

This folder is the durable operating system for Elvato business development. It replaces the legacy top-level `Operations` folder and centralizes strategic analysis, operating reports, decision frameworks, role definitions, and repeatable workflows.

## Purpose

The operations agent module exists to make business decisions consistent over months and years. It should not only store reports. It should preserve the reasoning system behind the reports so future work can build on prior context instead of restarting from scratch.

## Directory Map

| Path | Purpose |
| --- | --- |
| `manual/` | Durable decision frameworks, operating principles, cadence, and governance. |
| `roles/` | Agent role charters for COO, strategy, business analysis, marketplace operations, and finance. |
| `workflows/` | Repeatable operating workflows such as marketplace launch, KPI reporting, and initiative scoring. |
| `templates/` | Reusable report, scorecard, and meeting templates. |
| `reports/` | Completed dated reports and operating artifacts. |
| `scripts/` | Operations-specific helper scripts or script notes. Code that belongs to a channel can remain in `scripts/ebay`, `scripts/etsy`, etc. |
| `logs/` | Chronological operating logs, decisions, assumptions, and postmortems. |

## Operating Rule

Business output that used to land in `Operations/` should now land in `.agents/operations/reports/` unless it is a reusable framework, template, workflow, or role definition.

## Current Priority

The active operating priority is the post-Etsy marketplace transition:

1. Treat Etsy as validated learning, not the go-forward channel.
2. Launch the eBay MVP.
3. Build a marketplace-neutral KPI loop.
4. Prepare Walmart only after eBay proves fulfillment, margin, and seller operations.

## Start Here

1. Read `manual/operating-system.md`.
2. Use `manual/decision-framework.md` for prioritization.
3. Use `workflows/marketplace-launch.md` for channel execution.
4. Store dated deliverables in `reports/`.