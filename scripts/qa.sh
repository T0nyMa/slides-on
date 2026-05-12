#!/bin/bash
# qa.sh — Unified quality gate: runs all checks for a deck or entire project
#
# Usage:
#   bash scripts/qa.sh <deck-name>              # QA single deck
#   bash scripts/qa.sh --all                    # QA all decks
#
# Layers:
#   L0: validate-slides.ts   — JSON schema + budget
#   L1: visual-qa.ts          — Playwright visual QA (10 detection groups)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DECK=""
ALL=false
PASSED=0
FAILED=0

for arg in "$@"; do
  case "$arg" in
    --all) ALL=true ;;
    --help|-h)
      echo "Usage: bash scripts/qa.sh [<deck-name>] [--all]"
      echo "  deck-name    QA single deck in templates/full-decks/<name>/"
      echo "  --all        QA all decks"
      echo ""
      echo "Layers:"
      echo "  L0  validate-slides.ts  — JSON schema + budget"
      echo "  L1  visual-qa.ts        — Playwright visual QA (10 groups)"
      exit 0 ;;
    *) DECK="$arg" ;;
  esac
done

qa_deck() {
  local name="$1"
  local dir="$ROOT/templates/full-decks/$name"
  local html="$dir/index.html"
  local slides="$dir/slides.json"
  local errors=0

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  QA: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # L0: Validate slides.json
  if [ -f "$slides" ]; then
    echo ""
    echo "  [L0] validate-slides.ts"
    bun "$ROOT/scripts/validate-slides.ts" --input "$slides" 2>&1 || { ((errors++)); echo "  → FAIL"; }
  fi

  # L1: Visual QA (Playwright)
  if [ -f "$html" ]; then
    echo ""
    echo "  [L1] visual-qa.ts"
    bun "$ROOT/scripts/visual-qa.ts" --input "$html" 2>&1 || { ((errors++)); echo "  → FAIL"; }
  fi

  if [ "$errors" -eq 0 ]; then
    echo ""
    echo "  ✅ $name: ALL PASS"
    return 0
  else
    echo ""
    echo "  ❌ $name: $errors FAIL(s)"
    return 1
  fi
}

if $ALL; then
  for dir in "$ROOT/templates/full-decks/"*/; do
    name=$(basename "$dir")
    [ "$name" = "README.md" ] && continue
    [ ! -f "$dir/index.html" ] && continue

    if qa_deck "$name"; then
      ((PASSED++))
    else
      ((FAILED++))
    fi
  done
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Total: $((PASSED + FAILED)) decks | ✅ $PASSED passed | ❌ $FAILED failed"
  echo "═══════════════════════════════════════════════════════════════"
elif [ -n "$DECK" ]; then
  qa_deck "$DECK" || exit 1
else
  echo "Usage: bash scripts/qa.sh <deck-name> | --all"
  exit 1
fi
