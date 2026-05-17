#!/bin/bash
# qa.sh — Compatibility wrapper: delegates to unified qa.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ $# -eq 0 ]; then
  exec bun "$ROOT/scripts/qa.ts" --help
fi

# Map old flags to new CLI
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --all) ARGS+=(--check) ;;
    --help|-h) ARGS+=(--help) ;;
    *)
      ARGS+=(--deck "$1")
      ARGS+=(--check)
      ;;
  esac
  shift
done

exec bun "$ROOT/scripts/qa.ts" "${ARGS[@]}"
