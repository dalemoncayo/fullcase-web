# Good Review Examples

This file defines quality standards for review findings in `fullcase-web`.
A good finding has all of the following elements:

1. **Specific location** — File path and line number
2. **Problem description** — What is wrong and why it matters
3. **Impact statement** — What happens if left unaddressed
4. **Fix suggestion** — Concrete proposal for how to fix it

---

## Example 1: Bug / Logic Error (HIGH)

```
🔴 [HIGH] `services/module-service.ts:34`

The `await` is missing on `addDoc`. `createModule` returns `ref.id` immediately without waiting for the write to complete, so callers may render the new module using a stale reference before it exists in Firestore.

Suggestion: `addDoc(...)` → `await addDoc(...)` and read `ref.id` from the awaited result.
```

**Why this is good**: One-line fix. The impact ("UI renders before the doc exists") is concrete.

---

## Example 2: Design Violation — Firebase SDK in a Component (HIGH)

```
🔴 [HIGH] `components/projects/project-list.tsx:18`

`collection` and `onSnapshot` from `firebase/firestore` are imported directly into a React component. Project rule: components consume hooks, hooks call services, only services touch the Firebase SDK.

Suggestion: Move the subscription into `hooks/use-projects.ts` (or extend it) and have `ProjectList` consume `{ projects, loading, error }` from that hook.
```

**Why this is good**: Names the specific layering rule being broken and points to the concrete file where the fix lives. Grounded in the AGENTS.md architecture section.

---

## Example 3: Security — Sensitive Data in Logs (CRITICAL)

```
🔴 [CRITICAL] `services/user-service.ts:56`

`console.log` emits the full user object, including `email` and `displayName`. In production this ships PII to the browser console and any error-tracking collector that ingests `console.*`.

Suggestion: Remove the `console.log` entirely (project rule: no `console.log` in committed code), or — if temporary debugging is needed — log the UID's last 4 characters only: `console.error('[user] ...', user.id.slice(-4))` and gate with `process.env.NODE_ENV !== 'production'`.
```

**Why this is good**: Cites the PII rule from AGENTS.md, offers the exact allowed alternative pattern.

---

## Example 4: Firestore Data-Model Violation (HIGH)

```
🔴 [HIGH] `services/test-run-service.ts:41`

`createdAt: new Date().toISOString()` stores an ISO string; the data model mandates `Timestamp` written via `serverTimestamp()`. Downstream reads that expect `Timestamp.toDate()` will throw `.toDate is not a function`.

Suggestion: `createdAt: serverTimestamp()` (imported from `firebase/firestore`). Same treatment for `updatedAt` and `completedAt`.
```

**Why this is good**: Explains both the rule and the specific runtime failure the violation will cause.

---

## Example 5: Performance — Unnecessary Live Subscription (MEDIUM)

```
🟡 [MEDIUM] `hooks/use-project.ts:22`

The single-project fetch uses `onSnapshot`, but the page that consumes it only renders once after auth resolves and doesn't show live updates to the project doc anywhere. The listener stays open for the lifetime of the page and adds billing + memory cost for no user-visible benefit.

Suggestion: Switch to `getDoc` and drop the effect's cleanup; keep `onSnapshot` only where the UI actually reflects live changes.
```

**Why this is good**: Quantifies the tradeoff (billing/memory cost vs. no UX benefit), offers the specific SDK swap.

---

## Example 6: Improvement Suggestion (LOW)

```
🟢 [LOW] `hooks/use-test-runs.ts:28`

The generic `catch (err)` sets `error` but doesn't distinguish between offline / permission-denied / transient failures, making incident triage harder.

Suggestion: At minimum surface the `FirestoreError.code` alongside the error object in development (`process.env.NODE_ENV !== 'production'`) so future failures can be categorized.
```

**Why this is good**: LOW severity but with a clear operational payoff. Doesn't demand a refactor — proposes a small, scoped improvement.
