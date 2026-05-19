#!/bin/bash
# package.sh — Package slides-on plugin bundle
# Usage: bash scripts/package.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="/tmp/slides-on-pkg"

echo "📦 Copying project..."
rm -rf "$TMP"
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='bun.lock' \
  --exclude='.gitignore' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  --exclude='docs' \
  --exclude='testcases' \
  --exclude='examples' \
  --exclude='evals' \
  --exclude='slides-on.skill' \
  --exclude='SKILL.md.bak' \
  --exclude='CLAUDE.md' \
  "$ROOT/" "$TMP/slides-on/"

echo "📦 Creating slides-on.skill..."
cd "$TMP"
zip -r "$ROOT/slides-on.skill" slides-on/

rm -rf "$TMP"
echo "✅ Done — $ROOT/slides-on.skill"
ls -lh "$ROOT/slides-on.skill"
