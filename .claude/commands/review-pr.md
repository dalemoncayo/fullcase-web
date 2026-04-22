---
allowed-tools: Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh pr comment:*),mcp__github_inline_comment__create_inline_comment
description: Run automated PR review. Reviews with 3 parallel subagents and posts inline comments and a summary.
---

## Arguments

Extract the following from $ARGUMENTS:

- 1st argument: `owner/repo` (e.g., `myorg/fullcase-web`)
- 2nd argument: PR number (e.g., `123`)

## Procedure

### Step 1: Fetch PR information

```bash
gh pr view <PR-number> --repo <owner/repo> --json title,body,baseRefName,headRefName,additions,deletions
gh pr diff <PR-number> --repo <owner/repo>
```

If the diff cannot be fetched, report the error and stop.

### Step 2: Load project rules

Read `AGENTS.md` and `CLAUDE.md` at the project root. `AGENTS.md` is the single source of truth for architecture, data model, and coding standards; `CLAUDE.md` adds Claude-specific behavior notes.

### Step 3: Launch 3 subagents in parallel

Launch the following 3 subagents **in parallel**.
Include the PR diff from Step 1 in each subagent's prompt.

- `code-quality-pr-reviewer` — Code quality, readability, maintainability
- `performance-pr-reviewer` — Performance, rendering, resource efficiency
- `security-code-pr-reviewer` — Security, authentication/authorization, PII, storage

### Step 4: Collect and filter results

Collect results from all 3 subagents and apply the following filters:

- Deduplicate findings (if multiple agents flag the same location, consolidate into one)
- Exclude LOW findings (auto-review only reports CRITICAL / HIGH / MEDIUM)

### Step 5: Post inline comments

For each finding that passes filtering, use `mcp__github_inline_comment__create_inline_comment`
to post an inline comment on the relevant code line in the PR.

Comment format:

```
🔴 [CRITICAL]
Firebase SDK is imported directly inside a React component; the project requires going through a hook → service.
Suggestion: Move the Firestore call into a service under `services/` and consume it via a hook under `hooks/`.
```

### Step 6: Post summary comment

Post a top-level summary comment on the PR with the consolidated results from all subagents.

```bash
gh pr comment <PR-number> --repo <owner/repo> --body "<summary>"
```

Summary format:

```markdown
## 🤖 Claude Auto Review

### Findings Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL | X |
| 🔴 HIGH | X |
| 🟡 MEDIUM | X |

### Merge Readiness

- CRITICAL / HIGH = 0 → ✅ Ready to merge
- CRITICAL / HIGH >= 1 → ⚠️ Action required

---
> This auto-review runs once on PR creation only.
> For detailed review, use the code-reviewer agent locally.
> Report inaccurate findings via `/update-review-checklist`.
```
