---
name: code-review
description: Run code review in an independent agent. Automatically used after code implementation or fixes. Triggered by "review this", "code review", "code check", "look at this PR", "check the diff", "is this code OK?".
context: fork
agent: Explore
---

## Purpose

Review code changes to detect bugs, design violations, spec violations, and security risks in the `fullcase-web` Next.js 16 + TypeScript + Firebase client-SDK app.
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

> For PR reviews (via the review-pr command): the diff is provided by the caller. Skip this step.

### Step 2: Load project rules

Read `AGENTS.md` and `CLAUDE.md` at the project root to understand project-specific rules. `AGENTS.md` is the canonical source of truth for architecture, data model, folder layout, and code-style rules.

### Step 3: Execute review

Review the diff based on the "Review Criteria" below.
If there are no findings, report "No issues found".

### Step 4: Quality check

Before outputting findings, self-check against the following:

- Does the finding match a pattern in `examples/bad-review.md`?
- Is it something ESLint / Prettier / `tsc --noEmit` would catch?
- Is it a personal preference with no objective basis?

Exclude any findings that match.

### Step 5: Output

Output only findings that pass the quality check.

---

## Review Criteria

### Must detect

1. **Bugs / Logic errors** — Unintended behavior, missed edge cases, unhandled `null` / `undefined`, missing `await`, stale closures, unsubscribed listeners
2. **Security** — Hardcoded secrets, unsafe input, PII leaks, auth-guard bypasses, storage path abuse, open redirects, `dangerouslySetInnerHTML` without sanitization
3. **Design violations** — Firebase SDK called directly from React components, `firebase-admin` usage, Server Actions / Route Handlers used for Firestore or Storage, types defined outside `types/`, manual edits to `components/ui/`, raw `<img>` instead of `next/image`
4. **Firestore data-model violations** — Writing date as `new Date()` / ISO strings instead of `serverTimestamp()` / `Timestamp`; missing `memberIds` update when adding a member; inconsistent collection paths (e.g., `testcases` vs `testCases`)
5. **Invite / Auth flow defects** — Incorrect handling of `pendingInvite` in `sessionStorage`; invite batch not atomic; `(dashboard)/layout.tsx` guard weakened or replaced with server `redirect()`

### Must NOT flag

1. **Issues detectable by linter / formatter** — Prettier formatting, semicolons, single-quote rule, `simple-import-sort`, unused-imports, `max-len` wrapping
2. **Auto-generated files** — `.next/`, `next-env.d.ts`, generated types
3. **Naming preferences without basis** — Do not flag if naming follows project conventions (kebab-case files, PascalCase components, camelCase hooks/services, SCREAMING_SNAKE_CASE env/constants)
4. **Code outside the diff** — Unchanged code is out of scope
5. **Test coverage alone** — Do not flag missing tests unless there is a concrete bug risk

---

## Severity Definitions

| Level | Icon | Definition | Examples |
|---|---|---|---|
| CRITICAL | 🔴 | Security vulnerability, data loss / leak risk, guaranteed production breakage | Secret leak, auth guard bypass, `dangerouslySetInnerHTML` with raw user input, `firebase-admin` used on client |
| HIGH | 🔴 | Mandatory rule violation, definite bug | Firebase SDK imported into a component, `any` type, date stored as ISO string, `<img>` instead of `next/image`, missing `await` on async write |
| MEDIUM | 🟡 | Quality / performance improvement | Unnecessary `onSnapshot` where `getDocs` suffices, missing `loading`/`error` in a hook, N+1 Firestore reads, inline object prop causing memoized-child re-renders |
| LOW | 🟢 | Minor improvement suggestion | Small refactor opportunity, non-critical naming polish, optional comment |

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
- Use `next/font` for fonts; never add raw `<link>` font tags.

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
- `Skeleton` for loading states — not spinner-only screens.
- No CSS files, no CSS modules, no inline `style` props (unless Tailwind cannot express the value). No custom classes in `globals.css`.
- `components/ui/` is shadcn CLI output — never manually edit.

### Error Handling
- All async component actions wrapped in `try/catch`.
- User-facing errors via `toast.error(...)` with a human-readable message; never raw Firebase error codes.
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

- Good review examples: `examples/good-review.md`
- Anti-patterns to avoid: `examples/bad-review.md`

---

**Post-review feedback:**
If you discover missed issues or new pitfalls from this review, add them to the checklist via `/update-review-checklist`.
