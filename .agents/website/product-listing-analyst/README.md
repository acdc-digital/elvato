# Product Listing Analyst Agent

AI agent that audits and fixes product listings in Elvato's Neon PostgreSQL / Medusa backend. Uses Claude to orchestrate SQL reads, Medusa Admin API writes, and CJ Dropshipping stock checks.

## Quick Start

```bash
cd .agents/product-listing-analyst
cp .env.example .env   # fill in real credentials
npm install
```

## Usage

```bash
# Fix out-of-stock inventory for all products (batch mode)
npx tsx src/agent.ts --mode inventory-fix

# Fix a single product
npx tsx src/agent.ts --mode inventory-fix --product-id prod_01KF76AWCX76RKY4ZR8XJCPZAM

# Audit listing quality
npx tsx src/agent.ts --mode audit

# Full pass: inventory fix + audit + CJ stock check
npx tsx src/agent.ts --mode full

# Dry run (no writes)
npx tsx src/agent.ts --mode inventory-fix --dry-run

# Custom batch size and verbosity
npx tsx src/agent.ts --mode inventory-fix --batch-size 100 --max-turns 200 --verbose
```

### CLI Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--mode` | `full` | `inventory-fix`, `audit`, or `full` |
| `--model` | `claude-sonnet-4-20250514` | Anthropic model ID |
| `--max-turns` | `100` | Max tool-use turns before stopping |
| `--product-id` | — | Target a single product by Medusa ID |
| `--batch-size` | `50` | Products per batch in batch mode |
| `--verbose` | off | Show full tool inputs/outputs |
| `--dry-run` | off | Read-only mode, no API writes |

## Tools

The agent has 10 tools:

| Tool | Purpose |
|------|---------|
| `query_products` | SQL search/filter across all products |
| `get_product_detail` | Full product + variants + inventory + prices |
| `check_inventory_levels` | Diagnose the 3-layer inventory chain |
| `fix_inventory` | Create missing `inventory_level` via Medusa Admin API |
| `check_cj_stock` | Real-time CJ supplier stock by variant ID |
| `get_cj_product_detail` | Full CJ product info |
| `audit_listing` | 14-point listing completeness scorecard |
| `list_stock_locations` | Discover Medusa stock locations |
| `update_product` | Update product fields via Medusa Admin API |
| `write_report` | Save markdown report to `reports/` |

## Architecture

```
Claude (claude-sonnet-4-20250514)
  ├─ reads → Neon PostgreSQL (direct SQL via pg)
  ├─ writes → Medusa Admin API (JWT auth, Railway deployment)
  └─ checks → CJ Dropshipping API (token auth)
```

### Inventory Model

The root cause of "out of stock" bugs is a missing link in the 3-layer chain:

```
product_variant
  → product_variant_inventory_item
    → inventory_item
      → inventory_level  ← THIS is what's usually missing
          (location_id + stocked_quantity)
```

The `fix_inventory` tool creates the missing `inventory_level` records via `POST /admin/inventory-items/{id}/location-levels`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `MEDUSA_BACKEND_URL` | Railway deployment URL |
| `MEDUSA_ADMIN_EMAIL` | Medusa admin email |
| `MEDUSA_ADMIN_PASSWORD` | Medusa admin password |
| `CJ_API_KEY` | CJ Dropshipping API key |

## Reports

Reports are saved to `reports/` as markdown files with timestamps. Each run generates a report with:
- Summary statistics
- Per-product results
- Errors and warnings
- Cost tracking (input/output tokens)
