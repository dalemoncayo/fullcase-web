# Fullcase Web

A Next.js 16 (App Router) + Firebase application used as a reference project for **demonstrating AI/LLM code review with Claude Code and OpenAI Codex**. The app itself is a lightweight test-case management tool (projects → modules → test cases → test runs); the interesting part of this repo is how it is reviewed.

---

## What this repo demonstrates

This repository is a working example of how to wire LLM-based code review into a real Next.js + Firebase codebase. It shows:

- **Project rules as context** — `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` at the repo root define the architecture, conventions, and review criteria that every AI reviewer reads before producing findings.
- **Custom subagents** — `.claude/agents/` and `.codex/agents/` define three specialized reviewers (quality, performance, security) that run in parallel.
- **Skills** — `.claude/skills/code-review/` contains the shared review checklist, rubric, and a `bad-review.md` of known false positives to suppress.
- **Slash commands / prompts** — `.claude/commands/review-pr.md` and `.codex/prompts/review-pr.md` define the review procedure both tools follow.
- **Tool permissions** — the Claude GitHub Action (`.github/workflows/claude-review.yml`) whitelists a narrow set of `gh` commands. The Codex Action (`.github/workflows/codex-review.yml`) runs with `sandbox: read-only` and `safety-strategy: drop-sudo`.
- **Triggered reviews** — commenting `@claude-review` or `@codex-review` on any PR runs the respective reviewer and posts a single consolidated comment back.

If you want to study the review wiring without running the app, start by reading, in this order:
1. [AGENTS.md](AGENTS.md) — canonical architecture + review rubric
2. [CLAUDE.md](CLAUDE.md) — Claude-specific guidance that extends `AGENTS.md`
3. [.claude/skills/code-review/](.claude/skills/code-review/) — the shared checklist
4. [.claude/agents/](.claude/agents/) and [.codex/agents/](.codex/agents/) — the subagent definitions
5. [.github/workflows/claude-review.yml](.github/workflows/claude-review.yml) and [.github/workflows/codex-review.yml](.github/workflows/codex-review.yml) — the CI wiring

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript 5+ (`strict: true`) |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui (Radix primitives) |
| Auth | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (client SDK) |
| Storage | Firebase Storage (client SDK) |
| Forms | react-hook-form + zod |

Full architectural rules live in [AGENTS.md](AGENTS.md).

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in Firebase values — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Firebase setup

The app uses the Firebase **client SDK only** — no `firebase-admin`, no Server Actions for Firestore, no API routes for data access. Everything is authenticated client-side.

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. Give it a name (e.g. `fullcase-web-dev`). Google Analytics is optional — disable it for local dev if you want.
3. Once the project is created, open **Project settings** (gear icon) → **General** tab.
4. Under **Your apps**, click the **</>** (Web) icon to register a web app. Give it a nickname; Firebase Hosting is not required.
5. Firebase will show a `firebaseConfig` object — keep this tab open; you'll copy those values into `.env.local` in the next section.

### 2. Enable Authentication

1. In the left sidebar, open **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab and enable:
   - **Email/Password** → toggle on → **Save**.
   - **Google** → toggle on → set a project support email → **Save**.
3. Optional: under **Settings → Authorized domains**, add any production domain you will deploy to (`localhost` is allowlisted by default).

### 3. Enable Cloud Firestore

1. In the left sidebar, open **Build → Firestore Database → Create database**.
2. Choose a region (pick one close to your users — you cannot change this later).
3. Start in **production mode** (we will paste custom rules next, don't pick "test mode").
4. Once the database is provisioned, open the **Rules** tab and paste:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. Click **Publish**.

> These are **permissive defaults** — any signed-in user can read and write any document. Tighten them before going to production. The production rule shape the application code is written against is documented in [AGENTS.md §14](AGENTS.md).

### 4. Enable Firebase Storage

1. In the left sidebar, open **Build → Storage → Get started**.
2. Accept the default bucket location (it is tied to your Firestore region).
3. Start in **production mode**.
4. Once the bucket exists, open the **Rules** tab and paste:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. Click **Publish**.

### 5. Configure `.env.local`

Create a file named `.env.local` in the repo root with the following keys. Fill in the values from the `firebaseConfig` object shown during app registration (Project settings → General → Your apps).

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are consumed by [lib/firebase/config.ts](lib/firebase/config.ts):

```ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

The `NEXT_PUBLIC_` prefix is required so Next.js exposes these values to the browser. `.env.local` is gitignored — never commit it.

---

## AI code review

Two reviewers are wired into this repo and both are triggered by PR comments:

| Trigger comment | Reviewer | Workflow |
|---|---|---|
| `@claude-review` | Anthropic Claude | [.github/workflows/claude-review.yml](.github/workflows/claude-review.yml) |
| `@codex-review` | OpenAI Codex | [.github/workflows/codex-review.yml](.github/workflows/codex-review.yml) |

Each reviewer reads the PR diff, follows its `review-pr` prompt, spawns three specialized subagents (quality, performance, security) in parallel, deduplicates findings, applies the severity rubric in [AGENTS.md §17](AGENTS.md), and posts a single consolidated comment.

### How the pieces fit together

```
.github/workflows/claude-review.yml  ──▶  Claude GitHub Action
                                            │
                                            ├─ reads CLAUDE.md + AGENTS.md
                                            ├─ runs .claude/commands/review-pr.md
                                            └─ spawns .claude/agents/*
                                                 (quality, performance, security)
                                                 using .claude/skills/code-review/

.github/workflows/codex-review.yml   ──▶  Codex GitHub Action
                                            │
                                            ├─ reads AGENTS.md
                                            ├─ runs .codex/prompts/review-pr.md
                                            └─ spawns .codex/agents/*
                                                 (quality, performance, security)
```

### Required GitHub repository secrets

Both workflows read keys from **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Used by |
|---|---|
| `ANTHROPIC_API_KEY` | `claude-review.yml` |
| `OPENAI_API_KEY` | `codex-review.yml` |
| `GITHUB_TOKEN` | both (provided automatically by Actions) |

### Generating an `ANTHROPIC_API_KEY` (Claude)

1. Sign in to the [Anthropic Console](https://console.anthropic.com/).
2. Open **Settings → API Keys** (or go directly to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)).
3. Click **Create Key**, give it a descriptive name (e.g. `fullcase-web-ci`), and choose the workspace it should belong to.
4. Copy the key immediately — it will only be shown once. It starts with `sk-ant-…`.
5. Add it to GitHub as the secret `ANTHROPIC_API_KEY`.

> You will need billing enabled on the workspace. The review action uses `claude-sonnet-4-6` by default (configured in [claude-review.yml](.github/workflows/claude-review.yml)).

### Generating an `OPENAI_API_KEY` (Codex)

1. Sign in to the [OpenAI platform dashboard](https://platform.openai.com/).
2. Open **API Keys** (or go directly to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
3. Click **Create new secret key**, give it a name (e.g. `fullcase-web-ci`), and scope it to the project you want billed.
4. Copy the key immediately — it starts with `sk-…`. It will not be shown again.
5. Add it to GitHub as the secret `OPENAI_API_KEY`.

> Codex review uses `gpt-5.3-codex` (configured in [codex-review.yml](.github/workflows/codex-review.yml)). You need an OpenAI org with billing enabled and access to the Codex model family.

### Running the reviewers locally

- **Claude Code CLI** — install from [claude.com/claude-code](https://www.claude.com/claude-code), authenticate, then run the `/review-pr` command from inside this repo. It will read `CLAUDE.md`, load `.claude/skills/code-review/`, and drive the same subagents the Action uses.
- **Codex CLI** — install per the OpenAI docs, set `CODEX_HOME=.codex`, and run the `review-pr` prompt defined in [.codex/prompts/review-pr.md](.codex/prompts/review-pr.md).

---

## Repository layout

```
app/                    # Next.js App Router pages + layouts (thin — no business logic)
components/ui/          # shadcn CLI output — do not edit manually
components/<feature>/   # Presentational feature components
hooks/                  # Data hooks with loading + error state
services/               # Pure async Firestore/Storage functions (no React)
lib/firebase/           # Singleton init + low-level helpers
types/                  # Single source of truth for domain types

.claude/                # Claude-specific agents, commands, skills, settings
.codex/                 # Codex-specific agents, prompts, rules, config
.github/workflows/      # PR review + pre-merge CI
AGENTS.md               # Canonical architecture + review rubric (read first)
CLAUDE.md               # Claude-specific extensions to AGENTS.md
GEMINI.md               # Gemini-specific extensions to AGENTS.md
```

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server on `:3000` |
| `npm run build` | Production build |
| `npm run lint:check` | Report lint errors without modifying files |
| `npm run lint:fix` | Auto-fix formatting, import order, unused imports |

Always run `npm run lint:fix` before committing.

---

## Further reading

- [Next.js docs](https://nextjs.org/docs) — App Router, `next/image`, route groups
- [Firebase docs](https://firebase.google.com/docs) — Auth, Firestore, Storage client SDKs
- [shadcn/ui](https://ui.shadcn.com/) — component CLI and primitives
- [Anthropic API docs](https://docs.anthropic.com/) — Claude API + Claude Code
- [OpenAI Codex docs](https://platform.openai.com/docs/codex) — Codex CLI + Action
