# Fullcase Web — AI Agent Guidelines

This is the **single source of truth** for all AI agents working on `fullcase-web`. Read this file completely before writing or modifying any code. Do not skip sections.

---

## 1. Technology Stack

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

> **react-hook-form** and **zod** must be installed if not already present:
> `npm install react-hook-form zod @hookform/resolvers`

---

## 2. Project Structure

All internal imports use the `@/*` path alias (configured in `tsconfig.json`):
```
"paths": { "@/*": ["./*"] }
```
Always write `import { Button } from '@/components/ui/button'` — never a long relative path like `../../components/ui/button`.

```
fullcase-web/
├── app/                                  # Next.js App Router — pages and layouts only
│   ├── (auth)/                           # Route group: unauthenticated pages
│   │   ├── login/
│   │   │   └── page.tsx                  # Email/password + Google login
│   │   └── register/
│   │       └── page.tsx                  # New account registration
│   │
│   ├── (dashboard)/                      # Route group: all protected pages
│   │   ├── layout.tsx                    # Auth guard + app shell (sidebar + topbar)
│   │   ├── projects/
│   │   │   ├── page.tsx                  # List all projects the user belongs to
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx              # Project overview + module list
│   │   │       ├── settings/
│   │   │       │   └── page.tsx          # Project name, invite link, member list
│   │   │       └── modules/
│   │   │           └── [moduleId]/
│   │   │               ├── page.tsx      # Module detail + test case list
│   │   │               └── test-runs/
│   │   │                   ├── page.tsx  # All test runs for this module
│   │   │                   ├── new/
│   │   │                   │   └── page.tsx  # Create new test run form
│   │   │                   └── [testRunId]/
│   │   │                       └── page.tsx  # Execute or view a test run
│   │   └── profile/
│   │       └── page.tsx                  # User profile: name, photo, password, delete account
│   │
│   ├── invite/
│   │   └── [token]/
│   │       └── page.tsx                  # Public invite acceptance page
│   │
│   ├── layout.tsx                        # Root layout: fonts, AuthProvider, Toaster
│   ├── page.tsx                          # Root redirect → /projects or /login
│   └── globals.css                       # Tailwind base @import only — nothing else
│
├── components/
│   ├── ui/                               # shadcn CLI output — never edit manually
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── google-sign-in-button.tsx
│   ├── projects/
│   │   ├── project-list.tsx
│   │   ├── project-card.tsx
│   │   ├── project-form.tsx              # Create / edit project dialog form
│   │   └── delete-project-dialog.tsx
│   ├── modules/
│   │   ├── module-list.tsx
│   │   ├── module-card.tsx
│   │   ├── module-form.tsx
│   │   └── delete-module-dialog.tsx
│   ├── test-cases/
│   │   ├── test-case-list.tsx
│   │   ├── test-case-item.tsx
│   │   ├── test-case-form.tsx
│   │   └── delete-test-case-dialog.tsx
│   ├── test-runs/
│   │   ├── test-run-list.tsx
│   │   ├── test-run-card.tsx
│   │   ├── test-run-form.tsx             # Create run: title, version, tester, environment
│   │   ├── test-case-runner.tsx          # Step-through UI for executing a test run
│   │   └── test-result-item.tsx          # Single result row: pass/fail, notes, proof upload
│   ├── members/
│   │   ├── member-list.tsx
│   │   └── invite-link-card.tsx          # Displays link + copy button
│   ├── profile/
│   │   ├── profile-form.tsx
│   │   └── avatar-upload.tsx
│   └── shared/
│       ├── auth-provider.tsx             # Firebase auth context provider
│       ├── app-shell.tsx                 # Sidebar + topbar layout wrapper
│       ├── confirm-dialog.tsx            # Reusable destructive action confirmation
│       ├── file-upload.tsx               # Reusable drag-and-drop / file input
│       ├── loading-skeleton.tsx          # Generic skeleton placeholder
│       └── page-header.tsx              # Consistent page title + breadcrumb area
│
├── hooks/
│   ├── use-auth.ts                       # Current user, loading, signOut
│   ├── use-projects.ts                   # Project list, CRUD, membership
│   ├── use-modules.ts                    # Module list + CRUD for a given project
│   ├── use-test-cases.ts                 # Test case list + CRUD for a given module
│   └── use-test-runs.ts                  # Test runs + results CRUD for a module
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts                     # App init singleton + export db, auth, storage
│   │   ├── auth.ts                       # signInWithEmail, signInWithGoogle, signOut, etc.
│   │   ├── firestore.ts                  # Typed collection/doc ref helpers
│   │   └── storage.ts                    # uploadFile, deleteFile, getDownloadURL wrappers
│   └── utils.ts                          # cn(), generateToken(), formatDate(), etc.
│
├── services/
│   ├── project-service.ts
│   ├── module-service.ts
│   ├── test-case-service.ts
│   ├── test-run-service.ts
│   └── user-service.ts
│
└── types/
    ├── user.ts
    ├── project.ts
    ├── module.ts
    ├── test-case.ts
    ├── test-run.ts
    └── index.ts                          # Re-exports: export * from './user'; etc.
```

---

## 3. Firestore Data Model

All collection paths and field names below are **canonical**. Services and hooks must match exactly. Do not rename fields or invent new collections.

### `users/{userId}`
```ts
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
- Created on first sign-in (social or email/password).
- `id` matches the Firebase Auth UID.

---

### `projects/{projectId}`
```ts
interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;            // Firebase Auth UID of creator
  memberIds: string[];        // All member UIDs including owner — used in security rules
  inviteToken: string;        // UUID v4, generated at project creation
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
- `memberIds` is denormalized so Firestore security rules can check `request.auth.uid in resource.data.memberIds`.
- `inviteToken` is never regenerated after creation unless the owner explicitly resets it.

---

### `projects/{projectId}/members/{userId}`
```ts
interface Member {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  joinedAt: Timestamp;
}
```
- Document ID is the user's UID.
- Written when a user accepts an invite or when the owner creates the project (owner is also a member).

---

### `projects/{projectId}/modules/{moduleId}`
```ts
interface Module {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;              // 0-indexed integer for display ordering
  createdBy: string;          // Firebase Auth UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### `projects/{projectId}/modules/{moduleId}/testCases/{testCaseId}`
```ts
interface TestCase {
  id: string;
  moduleId: string;
  projectId: string;
  title: string;
  prerequisite: string;       // What must be true before running this case
  steps: string;              // Free-form text: numbered steps or prose
  expectedOutput: string;     // What a passing result looks like
  order: number;              // 0-indexed integer for display ordering
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### `projects/{projectId}/testRuns/{testRunId}`
```ts
type TestRunStatus = 'pending' | 'in_progress' | 'completed';

interface TestRun {
  id: string;
  projectId: string;
  moduleId: string;
  title: string;              // e.g. "Sprint 12 Regression"
  version: string;            // e.g. "v1.4.2"
  tester: string;             // Display name of the person executing the run
  environment: string;        // e.g. "staging", "production", "dev", "qa"
  status: TestRunStatus;
  createdBy: string;          // Firebase Auth UID
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```
- Status transitions: `pending` → `in_progress` (on first result save) → `completed` (when all results are non-pending).

---

### `projects/{projectId}/testRuns/{testRunId}/results/{testCaseId}`
```ts
type ResultStatus = 'pending' | 'pass' | 'failed' | 'skipped';

interface TestResult {
  testCaseId: string;         // Document ID matches testCaseId
  status: ResultStatus;
  notes: string;              // Tester's observations
  proofUrls: string[];        // Firebase Storage download URLs
  testedAt: Timestamp | null; // null = not yet tested
}
```
- One `TestResult` document per `TestCase` in the module, created as stubs when the run starts.
- Document ID is the `testCaseId` of the corresponding test case.

---

## 4. Firebase Storage Paths

| Content | Storage Path |
|---|---|
| User avatar | `avatars/{userId}/{filename}` |
| Test run proof file | `proofs/{projectId}/{testRunId}/{testCaseId}/{filename}` |

**Constraints:**
- Maximum file size: 10 MB per upload.
- Allowed MIME types for proof uploads: `image/*`, `application/pdf`, `video/mp4`.
- Allowed MIME types for avatars: `image/jpeg`, `image/png`, `image/webp`.
- When replacing an avatar, delete the old file from Storage before uploading the new one.

---

## 5. UI & Styling Rules

- **shadcn/ui is the only component library.** Never write raw `<input>`, `<button>`, `<select>`, `<dialog>`, `<textarea>`, etc. when a shadcn equivalent exists.
- **No CSS files, no CSS modules, no inline `style` props** (except when Tailwind cannot express the value).
- `globals.css` contains only the Tailwind `@import "tailwindcss"` line and the CSS variable block generated by shadcn. Do not add custom class definitions.
- The `components/ui/` directory is managed exclusively by the shadcn CLI. Do not manually edit these files.
- Build all feature components by composing `components/ui/` primitives.
- UI components are presentational. They receive typed props and call hooks. Zero business logic, zero direct Firebase imports.

### Expected shadcn Components
The following components should be installed and used where appropriate:

| Component | Use case |
|---|---|
| `Button` | All clickable actions |
| `Input` | Text inputs |
| `Textarea` | Multi-line text |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` | All forms (with react-hook-form) |
| `Dialog`, `DialogContent`, `DialogHeader` | Modal dialogs (create/edit/delete) |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | Content cards |
| `Badge` | Status indicators (pass, failed, pending) |
| `Avatar`, `AvatarImage`, `AvatarFallback` | User avatars |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tabbed sections |
| `Table`, `TableHeader`, `TableRow`, `TableCell` | Data tables |
| `DropdownMenu` | Action menus per row |
| `Sheet` | Slide-over panels |
| `Skeleton` | Loading placeholders |
| `Toaster`, `toast` (sonner) | Notifications and feedback |
| `Separator` | Visual dividers |
| `Tooltip` | Icon button labels |
| `Select` | Dropdown selects |
| `AlertDialog` | Destructive confirmation dialogs |

---

## 6. Firebase Integration Patterns

### 6.1 Initialization (singleton pattern)

```ts
// lib/firebase/config.ts
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

Always use the singleton guard `getApps().length` — never call `initializeApp` twice.

### 6.2 Required Environment Variables

All vars must be in `.env.local` with `NEXT_PUBLIC_` prefix. Never hardcode values.

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 6.3 Auth Context Pattern

```tsx
// components/shared/auth-provider.tsx
'use client';

import {
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { auth } from '@/lib/firebase/config';

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6.4 Data Access Pattern

```
Component → Hook → Service → Firestore SDK
```

- **Services** (`services/*.ts`): pure async functions, raw Firestore SDK calls, no React.
- **Hooks** (`hooks/*.ts`): call services, manage `loading` + `error` state, expose typed data via `useState` / `useEffect` / `onSnapshot`.
- **Components**: consume hooks, render UI, no Firebase imports.

### 6.5 Real-Time Subscriptions

Use `onSnapshot` for collections that must update live. Always return the unsubscribe function.

```ts
// hooks/use-modules.ts
export function useModules(projectId: string) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(db, 'projects', projectId, 'modules'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(
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
    return unsub;
  }, [projectId]);

  return { modules, loading, error };
}
```

### 6.6 Service Function Pattern

```ts
// services/module-service.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import type { Module } from '@/types';

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

export async function updateModule(
  projectId: string,
  moduleId: string,
  data: Partial<Pick<Module, 'name' | 'description' | 'order'>>,
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId, 'modules', moduleId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteModule(
  projectId: string,
  moduleId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'modules', moduleId));
}
```

### 6.7 File Upload Pattern

Always upload to Storage first, then persist the download URL to Firestore.

```ts
// lib/firebase/storage.ts
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { storage } from './config';

export async function uploadFile(
  path: string,
  file: File,
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteFile(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
```

### 6.8 Batch Writes & Transactions

Use a `writeBatch` whenever a single logical operation spans multiple documents (e.g., accepting an invite, creating a test run with stub results). This guarantees atomicity — all writes succeed or none do.

```ts
// services/project-service.ts — accepting an invite
import {
  arrayUnion,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function acceptInvite(
  projectId: string,
  user: User,
): Promise<void> {
  const batch = writeBatch(db);

  const memberRef = doc(db, 'projects', projectId, 'members', user.id);
  batch.set(memberRef, {
    userId: user.id,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    joinedAt: serverTimestamp(),
  });

  const projectRef = doc(db, 'projects', projectId);
  batch.update(projectRef, {
    memberIds: arrayUnion(user.id),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
```

Use a `runTransaction` when a write depends on the current value of a document (read-then-write). Plain batches cannot read.

### 6.9 Image Handling & `next/image`

- Always use `<Image>` from `next/image`. The ESLint rule `@next/next/no-img-element` is set to `error`.
- Firebase Storage download URLs use the host `firebasestorage.googleapis.com`. That host must be allowlisted in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

The second entry (`lh3.googleusercontent.com`) is required for Google OAuth profile photos.

---

## 7. Form Handling

All forms must use **react-hook-form** with **zod** schema validation via `@hookform/resolvers/zod`. Use shadcn's `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` components.

```tsx
// components/modules/module-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ModuleFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
}

export function ModuleForm({ onSubmit }: ModuleFormProps) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 8. TypeScript Standards

- `strict: true` is enforced in `tsconfig.json`. All rules apply.
- **Never use `any`**. Use `unknown` and narrow with type guards.
- All Firestore document shapes are defined in `types/`. Import exclusively from `types/index.ts`.
- Use `Timestamp` from `firebase/firestore` for all date fields. Never use `Date` or ISO strings for stored values.
- Use `serverTimestamp()` when writing to Firestore — never construct `new Date()` for Firestore writes.
- Generic collection references: `collection(db, 'projects') as CollectionReference<Project>`.
- Use discriminated union types for all status fields.
- Use `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` for "create" function payloads.
- Use `Partial<Pick<T, ...>>` for "update" function payloads.

---

## 9. Routing & Auth Guard

- App Router route groups: `(auth)` = public, `(dashboard)` = protected.
- `app/(dashboard)/layout.tsx` is the **auth gate** and must be a client component since it reads from `AuthContext`. Use `router.replace()` inside a `useEffect` — never the server-only `redirect()` helper from `next/navigation`.
- `/invite/[token]` is intentionally **outside** both route groups — it is public.

```tsx
// app/(dashboard)/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { AppShell } from '@/components/shared/app-shell';
import { useAuth } from '@/components/shared/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <Skeleton className="h-screen w-full" />;
  }

  return <AppShell>{children}</AppShell>;
}
```

- Root `app/page.tsx` follows the same client-side pattern: observe auth state, then `router.replace('/projects')` or `router.replace('/login')`.

---

## 10. Application Feature Flows

### 10.1 Auth Flow

**Register:**
1. User fills register form (email, password, display name).
2. `createUserWithEmailAndPassword` → Firebase Auth.
3. `updateProfile` with `displayName`.
4. Write `User` document to `users/{uid}` via `userService.createUser()`.
5. Redirect to `/projects`.

**Login (email):**
1. `signInWithEmailAndPassword` → Firebase Auth.
2. Redirect to `/projects`.

**Login (Google):**
1. `signInWithPopup(auth, new GoogleAuthProvider())`.
2. Upsert `User` document in Firestore (user may already exist).
3. Redirect to `/projects`.

**Logout:**
1. `signOut(auth)`.
2. Redirect to `/login`.

---

### 10.2 Invite Flow

1. Owner opens project → Settings page.
2. Page displays `{APP_URL}/invite/{project.inviteToken}` with a shadcn `Button` (Copy).
3. Owner sends link to collaborator manually.
4. Collaborator visits `/invite/[token]`.
5. **If unauthenticated** → store the token in `sessionStorage` under the key `pendingInvite` → `router.replace('/login')`. After successful login, read back from `sessionStorage`, clear the key, and navigate to `/invite/[token]`.
6. **If authenticated** → query `projects` collection `where('inviteToken', '==', token)` to resolve the project ID.
7. If the user is already in `memberIds`, skip to step 9.
8. Run a `writeBatch` (see Section 6.8):
   - `batch.set(doc(db, 'projects', projectId, 'members', userId), memberPayload)` — use `setDoc`, not `addDoc`, because the document ID must equal the user's UID.
   - `batch.update(doc(db, 'projects', projectId), { memberIds: arrayUnion(userId) })`.
   - `batch.commit()`.
9. Navigate to the project page via `router.replace('/projects/' + projectId)` (or a template literal equivalent).

---

### 10.3 Test Run Execution Flow

1. User navigates to a module → clicks "New Test Run".
2. Fills `TestRunForm`: title, version, tester name, environment.
3. `testRunService.createTestRun()`:
   - Creates the `TestRun` document (status: `pending`).
   - Creates one stub `TestResult` document per test case in the module (status: `pending`).
4. Redirect to `/projects/[id]/modules/[id]/test-runs/[runId]`.
5. `TestCaseRunner` component renders test cases one at a time (or in a list).
6. For each test case, tester:
   - Sets status: `pass`, `failed`, or `skipped`.
   - Adds notes.
   - Optionally uploads proof files (images, PDFs, videos).
7. On every result save:
   - Upload proof files → get download URLs → update `TestResult.proofUrls`.
   - Update `TestResult` document via `testRunService.updateResult()`.
   - Check if all results are non-`pending` → if yes, update `TestRun.status` to `completed` and set `completedAt`.
8. Completed runs are read-only (no further edits).

---

### 10.4 Profile Management

Available actions on `/profile`:
- **Update display name**: `updateProfile(auth.currentUser, { displayName })` + update `users/{uid}.displayName`.
- **Update avatar**: upload new file to `avatars/{uid}/{filename}` → delete old file → `updateProfile(auth.currentUser, { photoURL })` + update `users/{uid}.photoURL`.
- **Change password**: `updatePassword(auth.currentUser, newPassword)` — requires recent login (`reauthenticateWithCredential` may be needed).
- **Request account deletion**: show `AlertDialog` confirmation → `deleteUser(auth.currentUser)` + delete `users/{uid}` document. (Storage files and project data are left for Firestore TTL / cleanup rules.)

---

## 11. Error Handling & Notifications

- All async operations in components must be wrapped in `try/catch`.
- Surface user-facing errors through shadcn's **sonner toast** (`toast.error(message)`). Always provide a human-readable message — never surface raw Firebase error codes.
- Success actions (create, update, delete) confirm via `toast.success(message)`.
- Log the underlying error via `console.error` **only in development** (`process.env.NODE_ENV !== 'production'`). Production logging is reserved for observability tools and should not leak Firebase internals to end users.
- The `Toaster` component must be mounted once in `app/layout.tsx`.

```tsx
const handleDelete = async () => {
  try {
    await deleteModule(projectId, moduleId);
    toast.success('Module deleted');
    router.push(`/projects/${projectId}`);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('deleteModule failed', err);
    }
    toast.error('Failed to delete module. Please try again.');
  }
};
```

---

## 12. Loading States

- While data is loading (hook `loading === true`), render shadcn `<Skeleton>` placeholders — not spinners alone.
- Auth loading state (`loading === true` in AuthProvider) must show a full-page neutral skeleton, not a blank page or flash of login.
- Use the `disabled` prop on `Button` with loading text (`'Saving…'`, `'Deleting…'`) during async form submissions.
- Never block the entire page with an overlay spinner unless absolutely necessary (file upload progress is acceptable).

---

## 13. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files and folders | kebab-case | `test-case-form.tsx`, `use-modules.ts` |
| React components | PascalCase | `TestCaseForm`, `InviteLinkCard` |
| Custom hooks | camelCase with `use` prefix | `useTestRuns`, `useAuth` |
| Service functions | camelCase, verb + noun | `createTestRun`, `deleteModule` |
| TypeScript interfaces | PascalCase | `TestRun`, `Member`, `Project` |
| TypeScript union types | PascalCase | `TestRunStatus`, `ResultStatus` |
| Firestore collection names | camelCase | `testRuns`, `testCases`, `members` |
| Env variables | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE_BYTES` |

---

## 14. Firestore Security Rules Guidance

Security rules are managed externally but the application code is written with the following rules in mind. Do not write code that would fail under these rules.

```
// Pseudocode — actual rules live in firebase console / firestore.rules
- users/{userId}: read/write only if request.auth.uid == userId
- projects/{projectId}: read/write only if request.auth.uid in resource.data.memberIds
- projects/{projectId}/members/{memberId}: read if member of project; write only when joining
- projects/{projectId}/modules/**: read/write only if member of parent project
- projects/{projectId}/testRuns/**: read/write only if member of parent project
```

Key implication: always include `memberIds` when creating a project and keep it in sync when members join.

---

## 15. Linting & Code Style

### Commands

| Command | Purpose |
|---|---|
| `npm run lint:fix` | Auto-fix all fixable issues (formatting, import order, unused imports) |
| `npm run lint:check` | Report all errors and warnings without modifying files |

**Always run `npm run lint:fix` before committing.** Run `npm run lint:check` to confirm no remaining errors.

### Formatting — Prettier (enforced as ESLint errors)

- **Single quotes** for all strings: `'hello'` not `"hello"`
- **Semicolons** required at end of statements
- **2-space indentation**
- **Max line length: 80 characters** — this applies to comments too (no exemption)
- URLs, plain string literals, template literals, and regex are exempt from the 80-char limit
- `npm run lint:fix` formats everything automatically

### Import Order — simple-import-sort (error)

Imports must be grouped and sorted in this order within a single block:

1. Side-effect imports — `import './styles'`
2. External packages — `import { useState } from 'react'`
3. Internal absolute paths — `import { Button } from '@/components/ui/button'`
4. Relative paths — `import { formatDate } from './utils'`

`npm run lint:fix` sorts imports automatically. Never manually arrange imports.

### Unused Imports — (warn, auto-removed)

Remove all unused imports. `npm run lint:fix` removes them automatically.

### Next.js Rules (error)

- **Never use `<img>`** — always use `next/image` `<Image>` component.
  `@next/next/no-img-element` is set to `error`.

### React Hooks Rules (error)

- Only call hooks at the top level of React function components or custom hooks.
- All variables referenced inside `useEffect`, `useCallback`, or `useMemo` must appear in the dependency array (`react-hooks/exhaustive-deps`).

### TypeScript Rules (typescript-eslint recommended)

- No `any` — explicit or implicit. Enforced by `@typescript-eslint/no-explicit-any` (from the recommended preset) plus `strict: true` in `tsconfig.json`.
- No unused variables. Prefix intentionally unused parameters with `_` (e.g., `_event`).
- No `@ts-ignore` without an explanatory comment on the preceding line. Prefer `@ts-expect-error` when a suppression is genuinely required.

---

## 16. What NOT to Do

- Do not use `firebase-admin` SDK anywhere in this project.
- Do not write Next.js Server Actions or Route Handlers (`app/api/`) for Firestore or Storage operations.
- Do not write CSS class selectors, CSS modules, or `styled-components`.
- Do not use `any` type — not even temporarily.
- Do not import from `firebase/firestore`, `firebase/storage`, or `firebase/auth` inside React components.
- Do not store JavaScript `Date` objects or ISO strings in Firestore — always use `serverTimestamp()` or `Timestamp`.
- Do not store raw `File` or `Blob` objects in Firestore.
- Do not edit files inside `components/ui/` — re-run the shadcn CLI instead.
- Do not add custom class definitions to `globals.css`.
- Do not implement features not listed in this document without first updating this file.
- Do not leave `console.log` statements in committed code.

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
