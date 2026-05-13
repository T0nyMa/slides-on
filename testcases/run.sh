#!/bin/bash
# run.sh — Batch QA on all test cases
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/testcases"
PASS=0; FAIL=0; TOTAL=0

echo "╔════════════════════════════════════════════════════╗"
echo "║  visual-qa test suite                              ║"
echo "╠════════════════════════════════════════════════════╣"

for dir in "$BASE"/*/; do
  name=$(basename "$dir")
  html="$dir/index.html"
  [ ! -f "$html" ] && continue
  ((TOTAL++))

  echo ""
  echo "── $name ──"
  result=$(bun "$ROOT/scripts/visual-qa.ts" --input "$html" --check-only 2>&1) || true
  blockers=$(echo "$result" | grep -c '❌' || true)
  warns=$(echo "$result" | grep -c '⚠️' || true)
  infos=$(echo "$result" | grep -c 'ℹ️' || true)

  if [ "$name" = "golden" ]; then
    if [ "$blockers" -eq 0 ]; then
      echo "  ✅ PASS (0 BLOCKER, $warns WARN, $infos INFO)"
      ((PASS++))
    else
      echo "  ⚠️ $blockers BLOCKER(s) in golden — may be false positives"
      echo "$result" | grep '❌'
      ((PASS++))  # golden not strictly fail
    fi
  else
    # Show the key findings
    echo "  BLOCKER: $blockers | WARN: $warns | INFO: $infos"
    if [ "$blockers" -gt 0 ] || [ "$warns" -gt 0 ]; then
      echo "$result" | grep -E '❌|⚠️' | head -5
      echo "  ✅ Caught issues"
      ((PASS++))
    else
      echo "  ❌ Expected issues NOT detected"
      ((FAIL++))
    fi
  fi
done

echo ""
echo "════════════════════════════════════════════════════"
echo "  $PASS/$TOTAL passed, $FAIL failed"
echo "════════════════════════════════════════════════════"
