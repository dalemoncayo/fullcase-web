# Automated PR Review

## Context

The PR diff and metadata are provided in the prompt by the GitHub Actions workflow.
Do NOT attempt to run `gh` commands or access the network — you are running in a sandboxed environment.

## Procedure

### Step 1: Review the provided diff

The PR diff is included in the prompt. Parse and understand the changes.

### Step 2: Load project rules

Read the following files:

1. `AGENTS.md` at the project root (single source of truth for architecture, Firestore data model, folder layout, style rules)
2. `.agents/skills/code-review/SKILL.md` for shared review rules
3. `.agents/skills/code-review/references/good-review.md` for quality standards
4. `.agents/skills/code-review/references/bad-review.md` for anti-patterns to avoid
5. `.codex/prompts/codex-output-schema.json` for finding quality guide (severity, priority, confidence definitions)

### Step 3: Launch 3 subagents in parallel

Spawn the following 3 subagents in parallel, passing the PR diff to each:

1. `@quality-reviewer` — Code quality, readability, maintainability
2. `@performance-reviewer` — Performance, rendering, resource efficiency
3. `@security-reviewer` — Security, authentication/authorization, storage, PII

Each subagent will independently:
- Read `AGENTS.md` and the code-review skill references
- Review the diff within its own scope
- Return findings

### Step 4: Collect and filter results

Collect results from all 3 subagents and apply the following:

**Deduplication:**
- If multiple agents flag the same file + overlapping line range, consolidate into one finding
- Keep the highest severity

**Filtering:**
- Exclude LOW (P3) findings (auto-review only reports CRITICAL / HIGH / MEDIUM)
- Apply the gating criteria from `AGENTS.md` § 17 one final time on the consolidated list

### Step 5: Output the review summary

Output ONLY the markdown summary below — nothing else. The workflow will post this as a PR comment.

**Output language:** English.

**Summary format:**

```markdown
## 🤖 Codex Auto Review

### Findings Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL | X |
| 🔴 HIGH | X |
| 🟡 MEDIUM | X |

### Findings

🔴 [CRITICAL] `path/to/file.tsx:42`
Firebase SDK is imported directly inside a React component. Move the call into a service and consume it via a hook.

🟡 [MEDIUM] `path/to/file.tsx:87`
...

### Merge Readiness

- CRITICAL / HIGH = 0 → ✅ Ready to merge
- CRITICAL / HIGH >= 1 → ⚠️ Action required

---
> This auto-review uses 3 parallel subagents (quality, performance, security).
> For detailed review, use the code-reviewer agent locally.
> Report inaccurate findings via the update-review-checklist skill.
```

When there are no findings:

```markdown
## 🤖 Codex Auto Review

✅ No issues found

### Merge Readiness: ✅ Ready to merge

---
> This auto-review uses 3 parallel subagents (quality, performance, security).
```
