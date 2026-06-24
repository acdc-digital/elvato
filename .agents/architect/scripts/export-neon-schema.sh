#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STAMP="$(date +%F)"
OUT_DIR="$ROOT_DIR/.agents/architect/schema-exports/$STAMP"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Export it in your shell before running this script." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required but was not found on PATH." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found on PATH." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges > "$OUT_DIR/neon-schema.sql"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -F ',' --csv -c "
select
  schemaname,
  relname as table_name,
  n_live_tup::bigint as estimated_rows,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc;
" > "$OUT_DIR/neon-tables.csv"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -F ',' --csv -c "
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname not in ('pg_catalog', 'information_schema')
order by schemaname, tablename, indexname;
" > "$OUT_DIR/neon-indexes.csv"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -F ',' --csv -c "
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.table_schema not in ('pg_catalog', 'information_schema')
order by tc.table_schema, tc.table_name, tc.constraint_name;
" > "$OUT_DIR/neon-constraints.csv"

printf 'Wrote Neon schema export to %s\n' "$OUT_DIR"