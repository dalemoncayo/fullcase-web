---
name: code-review
description: Shared review rules for automated PR reviews and local manual reviews. Triggered by review commands.
---

## Purpose

Review code changes in `fullcase-web` (Next.js 16 + TypeScript + Firebase client SDK) to detect bugs, design violations, spec violations, and security risks.
Serves as the shared ruleset for both automated PR reviews (referenced by subagents) and local manual reviews (direct invocation).

## Review Procedure

### Step 1: Obtain the review target

Obtain the diff based on the provided arguments.

**When a PR number is specified:**

```bash
gh pr diff <PR-number>
```

**When a branch is specified:**

```bash
git diff <base-branch>...<target-branch>
```

If the base branch is omitted, default to `main`.

**When nothing is specified (local review of own changes):**

```bash
git diff
git diff --cached
git status --short
```

If there are untracked new files, read the file contents directly for review.

> For PR reviews (via the review-pr orchestrator): the diff is provided by the caller. Skip this step.

### Step 2: Load project rules

Read `AGENTS.md` at the project root to understand project-specific rules. `AGENTS.md` is the canonical source of truth for the architecture, Firestore data model, folder responsibilities, and code-style rules.

### Step 3: Execute review

Review the diff based on the "Review Criteria" below.
If there are no findings, report "No issues found".

### Step 4: Quality check

Before outputting findings, self-check against the following:

- Does the finding match a pattern in `references/bad-review.md`?
- Is it something ESLint / Prettier / `tsc --noEmit` would catch?
- Is it a personal preference with no objective basis?

Exclude any findings that match.

Also reference `.codex/prompts/codex-output-schema.json` as a quality guide for finding structure (severity, priority, confidence, code location).

### Step 5: Output

Output only findings that pass the quality check.

---

## Review Criteria

### Must detect

1. **Bugs / Logic errors** — Unintended behavior, missed edge cases, unhandled `null` / `undefined`, missing `await`, stale closures, unsubscribed Firestore / Storage listeners
2. **Security** — Hardcoded secrets, unsafe input, PII leaks, auth-guard bypasses, storage path abuse, open redirects, `dangerouslySetInnerHTML` without sanitization, `firebase-admin` on client
3. **Design violations** — Firebase SDK imported directly into components, Server Actions / Route Handlers used for Firestore or Storage, types defined outside `types/`, manual edits to `components/ui/`, raw `<img>` instead of `next/image`, custom CSS in `globals.css`
4. **Firestore data-model violations** — Dates stored as `Date` / ISO strings (must be `serverTimestamp()` / `Timestamp`), missing `memberIds` update on membership change, inconsistent collection paths vs. the canonical paths in AGENTS.md, non-atomic multi-doc writes where `writeBatch` / `runTransaction` is required
5. **Flow defects** — `(dashboard)/layout.tsx` auth guard weakened, `pendingInvite` `sessionStorage` handling broken, invite token not validated before writing membership

### Must NOT flag

1. **Issues detectable by linter / formatter / type-checker** — Prettier, import sort, unused-imports, exhaustive-deps, `any` keyword alone, `max-len`
2. **Auto-generated / managed files** — `.next/`, `next-env.d.ts`, `components/ui/*`, generated type declarations
3. **Naming preferences without basis** — Do not flag if naming follows project conventions
4. **Code outside the diff** — Unchanged code is out of scope
5. **Test coverage alone** — Do not flag missing tests unless there is a concrete bug risk

---

## Severity Definitions

| Level | Priority | Icon | Definition | Examples |
|---|---|---|---|---|
| CRITICAL | P0 | 🔴 | Security vulnerability, data loss / leak risk, guaranteed production breakage | Secret leak, auth guard bypass, `dangerouslySetInnerHTML` with raw user input, `firebase-admin` used on client |
| HIGH | P1 | 🔴 | Mandatory rule violation, definite bug | Firebase SDK imported into a component, `any` used deliberately, date stored as ISO string, `<img>` instead of `next/image`, missing `await` on an async write |
| MEDIUM | P2 | 🟡 | Quality / performance improvement | Unnecessary `onSnapshot` where `getDocs` suffices, missing `loading`/`error` in a hook, N+1 Firestore reads, inline object prop causing memoized-child re-renders |
| LOW | P3 | 🟢 | Minor improvement suggestion | Small refactor opportunity, non-critical naming polish, optional comment |

---

## Output Format

Each finding must be written in English.

```
🔴 [CRITICAL] `path/to/file.tsx:42`
Firebase SDK is imported directly inside a React component. Project rule: components consume hooks; hooks call services; only services touch the Firebase SDK.
Suggestion: Move the Firestore call into `services/<feature>-service.ts` and expose it via a hook under `hooks/`.
```

When there are no findings:

```
✅ No issues found
```

---

## Project-Specific Checkpoints

### Architecture & Data Access
- Component → Hook → Service → Firestore SDK. Never skip a layer.
- `services/*` contains pure async functions with zero React imports.
- `hooks/*` always expose `loading` and `error`.
- `firebase-admin` is forbidden. Server Actions / Route Handlers are forbidden for Firestore / Storage operations.
- Types live in `types/` and are imported via `@/types`.

### Next.js 16 App Router
- Route groups: `(auth)` public, `(dashboard)` protected, `invite/[token]` public.
- `(dashboard)/layout.tsx` must be a client component and redirect via `router.replace('/login')` inside `useEffect`. Never use the server-only `redirect()` helper.
- Use `next/image` everywhere; `firebasestorage.googleapis.com` and `lh3.googleusercontent.com` must be in `next.config.ts` `remotePatterns`.
- Use `next/font` for fonts.

### TypeScript
- `strict: true`. Never `any` (explicit or implicit).
- Use `unknown` + narrowing, `Omit<T, 'id'|'createdAt'|'updatedAt'>` for create payloads, `Partial<Pick<T, ...>>` for update payloads.

### Firestore
- Always `serverTimestamp()` or `Timestamp` for date fields. Never `new Date()` or ISO strings in stored values.
- Use `writeBatch` for multi-document logical operations (e.g., invite accept).
- Use `setDoc(..., uid)` — not `addDoc` — when a document ID must equal the user's UID.
- Update `projects/{id}.memberIds` whenever a member is added/removed (security rules depend on it).

### Forms & UI
- Forms use `react-hook-form` + `zod` + shadcn `Form` primitives.
- shadcn `AlertDialog` for all destructive confirmations.
- `Skeleton` for loading states.
- No CSS files, no CSS modules, no inline `style` props. No custom classes in `globals.css`.
- `components/ui/` is shadcn CLI output — never manually edit.

### Error Handling
- All async component actions wrapped in `try/catch`.
- User-facing errors via `toast.error(...)`; never raw Firebase error codes.
- `console.error` only when `process.env.NODE_ENV !== 'production'`.
- No `console.log` in committed code.

### Security & PII
- Firebase config only via `process.env.NEXT_PUBLIC_FIREBASE_*`.
- No user emails / names / phone numbers in logs. Full UIDs too — prefer last-4-only (`...ab12`).
- Storage paths must match the documented prefixes; enforce the documented MIME/size caps.
- Validate invite tokens before writing `members` / `memberIds`.

---

## Reference Examples

Refer to the following for review quality standards:

- Good review examples: `references/good-review.md`
- Anti-patterns to avoid: `references/bad-review.md`

---

**Post-review feedback:**
If you discover missed issues or new pitfalls from this review, add them to the checklist via the update-review-checklist skill.
