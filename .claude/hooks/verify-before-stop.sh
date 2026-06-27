#!/bin/bash
set -euo pipefail
# Stop hook: exit 2 = force Claude to keep working until code is clean
# Only runs verification when there are modified TS/TSX files in apps/web

CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | head -5 || true)
if [ -z "$CHANGED" ]; then exit 0; fi

cd apps/web 2>/dev/null || exit 0

# Files we changed under apps/web that still exist on disk
ALL_CHANGED=$(git diff --diff-filter=d --name-only HEAD 2>/dev/null | grep -E '^apps/web/.*\.(ts|tsx|js|jsx)$' || true)

# 1. Typecheck — only fail if errors are in files WE changed (not pre-existing)
TSC_OUTPUT=$(NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit 2>&1 || true)
OUR_ERRORS=""
for f in $(echo "$ALL_CHANGED" | sed 's|^apps/web/||'); do
  MATCH=$(echo "$TSC_OUTPUT" | grep "^${f}(" | grep "error TS" || true)
  if [ -n "$MATCH" ]; then
    OUR_ERRORS="$OUR_ERRORS
$MATCH"
  fi
done
OUR_ERRORS=$(echo "$OUR_ERRORS" | sed '/^$/d')
if [ -n "$OUR_ERRORS" ]; then
  echo "$OUR_ERRORS" | tail -10
  echo "TYPE ERRORS in changed files — fix before stopping" >&2
  exit 2
fi

# 2. Drift reminder (advisory — exit 0 so it doesn't block)
ACTION_CHANGES=$(git diff --name-only HEAD 2>/dev/null | grep -E 'apps/web/app/_actions/.*\.ts$' | head -3 || true)
SERVER_CHANGES=$(git diff --name-only HEAD 2>/dev/null | grep -E 'apps/web/lib/server/.*\.ts$' | head -3 || true)
MIGRATION_CHANGES=$(git diff --name-only HEAD 2>/dev/null | grep -E 'packages/database/supabase/migrations/.*\.sql$' | head -3 || true)
MODEL_CHANGES=$(git diff --name-only HEAD 2>/dev/null | grep -E 'apps/web/models/.*\.ts$' | head -3 || true)

if [ -n "$ACTION_CHANGES" ] || [ -n "$SERVER_CHANGES" ] || [ -n "$MIGRATION_CHANGES" ] || [ -n "$MODEL_CHANGES" ]; then
  echo "" >&2
  echo "CONTRACT SYNC REMINDER: server actions / lib/server / migrations / models changed." >&2
  echo "Consider running /update-contracts to keep apps/web/.claude/contracts/ in sync." >&2
  [ -n "$ACTION_CHANGES"    ] && echo "  Actions changed:    $ACTION_CHANGES" >&2
  [ -n "$SERVER_CHANGES"    ] && echo "  Server lib changed: $SERVER_CHANGES" >&2
  [ -n "$MIGRATION_CHANGES" ] && echo "  Migrations changed: $MIGRATION_CHANGES" >&2
  [ -n "$MODEL_CHANGES"     ] && echo "  Models changed:     $MODEL_CHANGES" >&2
fi

exit 0
