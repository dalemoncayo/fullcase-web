#!/usr/bin/env bash
set -euo pipefail

# Run the Claude review-pr flow against local changes — no PR required.
#
# Usage:
#   ./scripts/review-local.sh                   # diff vs origin/main (default)
#   ./scripts/review-local.sh main              # diff vs local main
#   ./scripts/review-local.sh origin/develop    # diff vs any ref
#
# Requires: claude CLI, git, an ANTHROPIC_API_KEY in your env (or logged-in claude CLI).

BASE="${1:-origin/main}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIFF_FILE="$REPO_ROOT/.review-diff.tmp"
trap 'rm -f "$DIFF_FILE"' INT TERM EXIT

cd "$REPO_ROOT"

git diff "$BASE" > "$DIFF_FILE"

if [[ ! -s "$DIFF_FILE" ]]; then
  echo "No changes to review against $BASE." >&2
  exit 0
fi

echo "Reviewing diff vs $BASE ($(wc -l < "$DIFF_FILE" | tr -d ' ') lines)…" >&2

claude -p --model claude-sonnet-4-6 "Follow the procedure in .claude/commands/review-pr.md with these adaptations:
- Skip Step 1 — the diff is already saved at $DIFF_FILE. Read it from there.
- Do Steps 2, 3, 4 exactly as written (load AGENTS.md + CLAUDE.md, spawn code-quality-pr-reviewer, performance-pr-reviewer, security-code-pr-reviewer in parallel, consolidate findings).
- Skip Steps 5 and 6 — no PR to comment on. Instead, print the Step 6 summary markdown to stdout."
