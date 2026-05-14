#!/bin/bash
# package.sh — Release a clean slides-on.skill
# Usage: bash scripts/package.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="/tmp/slides-on"

# 1. Clean copy with explicit exclusions
echo "📦 Copying project..."
rm -rf "$TMP"
rsync -a \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='node_modules' \
  --exclude='bun.lock' \
  --exclude='.gitignore' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  --exclude='docs' \
  --exclude='testcases' \
  --exclude='examples' \
  --exclude='tests' \
  --exclude='evals' \
  --exclude='slides-on.skill' \
  --exclude='CLAUDE.md' \
  "$ROOT/" "$TMP/"

# 2. Package with skill-creator tool
echo "📦 Packaging..."
SKILL_CREATOR="$HOME/.claude/skills/skill-creator"
cd "$SKILL_CREATOR" && python -m scripts.package_skill "$TMP" "$ROOT"

# 3. Cleanup
rm -rf "$TMP"
echo "✅ Done — $ROOT/slides-on.skill"
