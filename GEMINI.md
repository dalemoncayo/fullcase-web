# Gemini — Fullcase Web

This file contains Gemini-specific instructions for `fullcase-web`. The canonical architecture, data models, folder structure, and coding standards live in `AGENTS.md`. Read that file fully before writing any code.

---

## 1. First Steps Before Writing Code

1. Read `AGENTS.md` completely — all 16 sections.
2. Identify which types the feature touches. Check `types/` for existing definitions before creating new ones.
3. Identify which services and hooks exist. Check `services/` and `hooks/` before creating duplicates.
4. Identify which shadcn components are needed. If not yet installed, note the install command and ask before proceeding.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16+ (App Router) | Not Pages Router |
| Language | TypeScript 5+ | `.ts` / `.tsx` only, `strict: true` |
| Styling | Tailwind CSS v4 | Utility classes only, no CSS files |
| UI Components | shadcn/ui (Radix UI primitives) | Never bypass with raw HTML |
| Auth | Firebase Authentication | Email/Password + Google OAuth |
| Database | Cloud Firestore | Client-side SDK only |
| File Storage | Firebase Storage | Client-side SDK only |
| Icons | Lucide React | Only icon library to use |
| Forms | react-hook-form + zod | Required for all form validation |

---

## 3. Domain Model

```
User
 └── Project (owner + member)
      ├── Member (subcollection — all project members)
      ├── Module
      │    └── TestCase
      └── TestRun (scoped to a Module)
           └── TestResult (one per TestCase, created as stubs on run start)
```

---

## 4. Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `app/` | Route pages and layouts. Thin — no business logic. |
| `components/ui/` | shadcn CLI output. Never edit manually. |
| `components/<feature>/` | Presentational feature components. Props-in, no Firebase. |
| `components/shared/` | Cross-feature shared components (AppShell, ConfirmDialog, etc.). |
| `hooks/` | React hooks: data fetching, `loading`/`error` state, real-time subscriptions. |
| `services/` | Pure async functions: raw Firestore/Storage SDK calls. No React. |
| `types/` | TypeScript interfaces for all domain models. Single source of truth for shapes. |
| `lib/firebase/` | Firebase initialization singleton + low-level helpers. |
| `lib/utils.ts` | `cn()`, `generateToken()`, `formatDate()`, and other pure utilities. |

---

## 5. Code Patterns

### 5.1 Auth Context

```ts
// components/shared/auth-provider.tsx — 'use client'
// Wrap root layout. Exposes { user: FirebaseUser | null, loading: boolean }.
// useAuth() hook reads from this context.
```

### 5.2 Hook Template

Every hook must expose `loading` and `error`. Use `onSnapshot` for live collections.

```ts
export function useModules(projectId: string) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(db, 'projects', projectId, 'modules'),
      orderBy('order', 'asc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Module,
        );
        setModules(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
  }, [projectId]);

  return { modules, loading, error };
}
```

### 5.3 Service Function Template

```ts
// services/module-service.ts — no React imports
export async function createModule(
  data: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'projects', data.projectId, 'modules'),
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
  return ref.id;
}
```

### 5.4 Form Pattern

Use react-hook-form + zod + shadcn Form components.

```ts
const schema = z.object({ name: z.string().min(1, 'Required').max(100) });
type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({ resolver: zodResolver(schema) });
// Render with <Form>, <FormField>, <FormItem>, <FormLabel>, <FormControl>, <FormMessage>
```

### 5.5 File Upload Pattern

Upload first → store URL. Never store File/Blob in Firestore.

```ts
const path =
  `proofs/${projectId}/${testRunId}/${testCaseId}/${file.name}`;
const url = await uploadFile(path, file);
await updateResult(projectId, testRunId, testCaseId, {
  proofUrls: arrayUnion(url),
});
```

### 5.6 Error + Toast Pattern

```ts
try {
  await someService();
  toast.success('Saved successfully');
} catch {
  toast.error('Something went wrong. Please try again.');
}
```

---

## 6. Application Feature Flows

### 6.1 Auth
- **Register**: `createUserWithEmailAndPassword` → `updateProfile` → write `users/{uid}` → redirect `/projects`.
- **Login (email)**: `signInWithEmailAndPassword` → redirect `/projects`.
- **Login (Google)**: `signInWithPopup` → upsert `users/{uid}` → redirect `/projects`.
- **Logout**: `signOut` → redirect `/login`.

### 6.2 Invite
1. Project owner copies link from Settings page: `{APP_URL}/invite/{inviteToken}`.
2. Recipient visits `/invite/[token]`.
3. If unauthenticated → save token to `sessionStorage` under `pendingInvite` → `router.replace('/login')` → after login return to `/invite/[token]`.
4. Query `projects where inviteToken == token` to resolve the project ID.
5. `writeBatch`: `setDoc(doc(db, 'projects', projectId, 'members', userId), ...)` + `updateDoc(doc(db, 'projects', projectId), { memberIds: arrayUnion(userId) })` → `commit()`. Use `setDoc` (not `addDoc`) so the member doc ID equals the UID.
6. `router.replace('/projects/' + projectId)`.

### 6.3 Test Run Execution
1. Create `TestRun` doc (status: `pending`) + stub `TestResult` docs for each test case.
2. Tester works through each case: set status (`pass`/`failed`/`skipped`), add notes, upload proofs.
3. Every save: update `TestResult` → check if all results are non-`pending` → if yes, set run `status: 'completed'` + `completedAt`.
4. Completed runs are read-only.

### 6.4 Profile Management
- **Display name**: `updateProfile` + `updateDoc users/{uid}`.
- **Avatar**: upload to `avatars/{uid}/{filename}` → delete old → `updateProfile` + `updateDoc`.
- **Password**: `updatePassword` (may require `reauthenticateWithCredential`).
- **Delete account**: `AlertDialog` confirmation → `deleteUser` + `deleteDoc users/{uid}`.

---

## 7. Rules & Constraints

### Must Do
- Define TypeScript types in `types/` before writing services, hooks, or components.
- Use `Timestamp` / `serverTimestamp()` for all date fields in Firestore.
- Handle `loading` and `error` in every hook.
- Use `AlertDialog` for all destructive confirmations.
- Use `Skeleton` components while data loads.
- Keep `(dashboard)/layout.tsx` as the auth gate — must be a client component; redirect via `router.replace('/login')` inside a `useEffect` when `user === null`. Do **not** call the server-only `redirect()` from `next/navigation`.

### Must Not Do
- Do not use `firebase-admin`, Server Actions, or Route Handlers for DB/storage operations.
- Do not write CSS selectors, CSS modules, or inline `style` props.
- Do not use `any` — not even in a quick fix.
- Do not import Firebase SDK directly inside React component files.
- Do not store `Date` objects or ISO strings in Firestore.
- Do not edit `components/ui/` files manually.
- Do not add custom classes to `globals.css`.
- Do not leave `console.log` in committed code.

---

## 8. shadcn Component Quick Reference

| Need | Component |
|---|---|
| Any button or action | `Button` |
| Text input | `Input` |
| Multi-line text | `Textarea` |
| Form with validation | `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage` |
| Modal / dialog | `Dialog` |
| Destructive confirmation | `AlertDialog` |
| Slide-over panel | `Sheet` |
| Data table | `Table` |
| Status label | `Badge` |
| User photo | `Avatar` |
| Tabbed sections | `Tabs` |
| Row action menu | `DropdownMenu` |
| Notification | `toast` (sonner) |
| Loading placeholder | `Skeleton` |
| Dropdown selector | `Select` |
| Icon tooltip | `Tooltip` |

---

## 9. Linting & Code Style

### Commands

| Command | Purpose |
|---|---|
| `npm run lint:fix` | Auto-fix all fixable issues (formatting, import order, unused imports) |
| `npm run lint:check` | Report all errors and warnings without modifying files |

**Always run `npm run lint:fix` before committing.** Run `npm run lint:check` to confirm no remaining errors.

### Active Rules Summary

| Rule | Enforced by | Key requirement |
|---|---|---|
| Single quotes | Prettier + `quotes` | `'value'` not `"value"` |
| Semicolons | Prettier | Always required |
| 2-space indentation | Prettier | No tabs |
| Max 80 chars/line | `max-len` | Comments included — no exemption |
| Import order | `simple-import-sort` | Side-effects → externals → absolute → relative |
| No unused imports | `unused-imports` | Auto-removed by `lint:fix` |
| No `<img>` element | `@next/next/no-img-element` | Use `<Image>` from `next/image` |
| Hooks rules | `react-hooks` | Top-level only; exhaustive deps required |
| No `any` (explicit or implicit) | `typescript-eslint` + `strict` | Use `unknown` and narrow |

---

## 10. Gemini-Specific Behavior

- **Read `AGENTS.md` first**: treat it as a pre-prompt, not optional context. Do not generate code that contradicts any section of `AGENTS.md`.
- **No new collection paths**: only use collection and document paths defined in `AGENTS.md` Section 3. Do not invent new top-level collections or subcollections.
- **No new field names**: do not add fields to Firestore documents beyond those defined in the data model. If new fields are needed, acknowledge this and propose the addition before writing code.
- **Complete implementations only**: do not return partial code with `// TODO` or `// implement this`. If a full implementation is not possible in one response, split it into clearly labeled pieces with explicit continuation instructions.
- **shadcn install note**: if a needed shadcn component is not installed, output the install command (`npx shadcn@latest add <component>`) and ask before proceeding.
- **Types before UI**: always confirm the TypeScript type definition exists in `types/` before writing the component or hook that depends on it.
- **Explicit imports**: always include full import statements in generated code. Do not rely on auto-import assumptions.
- **`'use client'` directive**: every component file that uses React hooks, browser APIs, or Firebase client SDK must have `'use client'` as its first line.
