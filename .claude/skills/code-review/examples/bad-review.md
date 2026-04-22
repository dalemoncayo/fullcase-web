# Anti-Patterns to Avoid

This file defines review finding patterns that must NOT be produced in `fullcase-web` reviews.
Check your findings against these patterns in SKILL.md Step 4 (Quality Check) before outputting.

> This file is continuously updated via the `/update-review-checklist` skill.

---

## Category 1: Issues detectable by linter / formatter / type-checker

The project ships ESLint (`eslint-config-next`, `eslint-plugin-prettier`, `simple-import-sort`, `unused-imports`, `react-hooks`, `typescript-eslint`) plus `tsc --noEmit` (via `next build`). Do NOT produce findings that would be fixed by `npm run lint:fix` or caught by `tsc`.

- **Missing semicolons / wrong quotes / indentation** (Prettier)
- **Unsorted imports** (`simple-import-sort`)
- **Unused imports / variables** (`unused-imports`)
- **Missing `alt` on `next/image`** (`jsx-a11y` / Next plugin)
- **Hooks rules-of-hooks violations** (`react-hooks/rules-of-hooks`)
- **Exhaustive-deps warnings** (`react-hooks/exhaustive-deps`)
- **Explicit `any`** — ESLint + TS `strict` already error on this; only flag the deeper design issue if it matters, not the keyword itself
- **`max-len` wrapping** (Prettier/ESLint)

---

## Category 2: Preference-based style suggestions

Findings based on personal preference rather than project rules or conventions.

- **"Better name" suggestions for variables** (TypeScript)
  - Detail: Do not flag if naming follows project conventions (kebab-case files, PascalCase components, camelCase hooks/services, SCREAMING_SNAKE_CASE env/constants). "`items` should be `projectList`" is a preference, not a rule.
- **Requesting comments be added**
  - Detail: "This function needs a JSDoc" has no objective basis. If the code is clear and the names are good, comments are unnecessary. Only suggest comments when a non-obvious *why* would otherwise be lost.
- **"This is more idiomatic React" rewrite suggestions**
  - Detail: Do not flag when behavior is identical and readability difference is not objectively significant. Do not rewrite `if/else` → early return (or vice versa) when both are clear.
- **`const` vs `let` preference**
  - Detail: Only flag `let` when the variable is genuinely never reassigned and the mutability is misleading; don't flag stylistically.

---

## Category 3: Findings outside the diff

Unchanged code is out of scope.

- **"While you're at it, refactor this component too"**
  - Detail: Improvement suggestions for code not in the diff are out of scope.
- **"Existing tests need updating too"**
  - Detail: Do not flag existing tests outside the diff. Only flag if a change *in the diff* would break an existing test or is clearly tested at the wrong layer.
- **"This existing hook should expose error"**
  - Detail: Only applies when the hook is added / modified in the diff.

---

## Category 4: Severity inflation

Findings with severity disproportionate to actual risk.

- **Should NOT be CRITICAL**
  - "Naming is unclear" → LOW
  - "Error message is generic" → LOW
  - "Missing loading skeleton" → MEDIUM (unless it causes a layout flash of protected content → then HIGH)
- **Should NOT be HIGH**
  - "This should be extracted into a separate component" → MEDIUM or LOW
  - "Comment is outdated" → LOW
  - "Could use `useMemo` here" → MEDIUM only if a measurable perf impact; otherwise LOW

---

## Category 5: Findings on auto-generated / managed files

The following files/directories are auto-generated or shadcn-managed. Do not suggest manual modifications.

- `.next/` (Next.js build output)
- `next-env.d.ts` (Next.js auto-generated)
- `components/ui/*.tsx` (shadcn CLI output — re-run the CLI to update)
- `*.tsbuildinfo`
- Generated type declarations under `.next/types/`

---

## Category 6: Missing test coverage

- **"No tests were added for this change"**
  - Detail: Do not flag missing tests alone. Only flag as MEDIUM when there is a concrete bug risk AND no tests cover it.
  - Example:
    ```
    // Bad finding
    🟡 [MEDIUM] No tests were added.

    // Good finding (tied to a bug risk)
    🟡 [MEDIUM] `computeProgress()` has no boundary tests for the 0-result and all-skipped cases, both of which are reachable from the UI and would change the reported status.
    ```

---

## Category 7: Repetitive findings

- **Flagging the same pattern individually across multiple locations**
  - Detail: When the same type of issue appears in multiple places, flag one representative location and note "N other occurrences of the same issue exist in this PR".

---

## Category 8: Next.js / shadcn false positives

- **"This should be a Server Component"** (Next.js)
  - Detail: `fullcase-web` uses the client Firebase SDK. Anything that reads Firestore / Storage / Auth must be a Client Component. Do not suggest converting a Firebase-consuming component to a Server Component.
- **"Use `<a>` instead of `next/link`"** or vice-versa
  - Detail: The project uses `next/link` for in-app routing. Don't flag `next/link` usage as "unnecessary".
- **"Inline styles would be simpler"** (Tailwind)
  - Detail: The project bans inline `style` where Tailwind can express the value. Don't propose inline styles.
- **"Create your own Button wrapper"** (shadcn)
  - Detail: Feature components should compose shadcn primitives — do not suggest wrapping them in parallel abstractions that duplicate shadcn's API.
