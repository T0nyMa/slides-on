#!/bin/bash
# qa.sh — Unified quality gate: runs all checks for a deck or entire project
#
# Usage:
#   bash scripts/qa.sh <deck-name>              # QA single deck (e.g., "xhs-pastel-card")
#   bash scripts/qa.sh <deck-name> --old        # Include pixel diff vs old
#   bash scripts/qa.sh --all                    # QA all decks
#   bash scripts/qa.sh --all --visual           # Full QA including browser checks
#
# Layers:
#   L0: validate-slides.ts   — JSON schema + budget (instant)
#   L1: polish.ts             — CSS cascade audit + chrome consistency (instant)
#   L2: visual-diff.ts        — Browser position/balance/font audit (requires Playwright)
#   L3: qa-migrate.ts         — Old vs new content comparison (requires old.html)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DECK=""
ALL=false
OLD=false
VISUAL=false
PASSED=0
FAILED=0

for arg in "$@"; do
  case "$arg" in
    --all) ALL=true ;;
    --old) OLD=true ;;
    --visual) VISUAL=true ;;
    --help|-h)
      echo "Usage: bash scripts/qa.sh [<deck-name>] [--all] [--old] [--visual]"
      echo "  deck-name    QA single deck in templates/full-decks/<name>/"
      echo "  --all        QA all decks"
      echo "  --old        Include pixel diff vs index.old.html (if exists)"
      echo "  --visual     Include browser-based checks (visual-diff.ts)"
      exit 0 ;;
    *) DECK="$arg" ;;
  esac
done

qa_deck() {
  local name="$1"
  local dir="$ROOT/templates/full-decks/$name"
  local html="$dir/index.html"
  local old="$dir/index.old.html"
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
    bun "$ROOT/scripts/validate-slides.ts" "$slides" 2>&1 || { ((errors++)); echo "  → FAIL"; }
  fi

  # L1: Polish (cascade audit + chrome consistency)
  if [ -f "$html" ]; then
    echo ""
    echo "  [L1] polish.ts"
    bun "$ROOT/scripts/polish.ts" --input "$html" --output "$dir/polish.css" 2>&1 || { ((errors++)); echo "  → FAIL"; }
  fi

  # L2: Visual diff (browser-based)
  if $VISUAL && [ -f "$html" ]; then
    echo ""
    echo "  [L2] visual-diff.ts"
    bun "$ROOT/scripts/visual-diff.ts" --input "$html" 2>&1 || { ((errors++)); echo "  → FAIL"; }
  fi

  # L3: Pixel diff vs old
  if $OLD && [ -f "$html" ] && [ -f "$old" ]; then
    echo ""
    echo "  [L3] pixel diff (old vs new)"
    bun "$ROOT/scripts/visual-diff.ts" --old "$old" --new "$html" 2>&1 || { ((errors++)); echo "  → FAIL"; }
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
    # Skip non-deck directories
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
  echo "Usage: bash scripts/qa.sh <deck-name> | --all [--old] [--visual]"
  exit 1
fi
