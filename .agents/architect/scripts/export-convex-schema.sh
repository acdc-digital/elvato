#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STAMP="$(date +%F)"
OUT_DIR="$ROOT_DIR/.agents/architect/schema-exports/$STAMP"

mkdir -p "$OUT_DIR"
cp "$ROOT_DIR/convex/schema.ts" "$OUT_DIR/convex-schema.ts"

{
  echo "# Convex Schema Summary"
  echo
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "## Tables"
  grep -E '^  [A-Za-z0-9_]+: defineTable' "$ROOT_DIR/convex/schema.ts" | sed -E 's/^  ([A-Za-z0-9_]+):.*/- \1/' || true
  echo
  echo "## Indexes"
  grep -E '\.index\(' "$ROOT_DIR/convex/schema.ts" | sed -E 's/^\s+/- /' || true
} > "$OUT_DIR/convex-schema-summary.md"

printf 'Wrote Convex schema export to %s\n' "$OUT_DIR"