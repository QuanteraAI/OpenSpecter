# Open Specter

Open Specter is an enterprise-grade AI workspace for legal teams. It helps professionals organize matters, upload and review documents, run assistant conversations, create tabular reviews, and reuse structured workflows — all with a restrained, grayscale interface designed for white-collar professional use.

<img width="1071" height="600" alt="Frame 4" src="https://github.com/user-attachments/assets/a3e9d6ec-e43d-4473-8f6d-243c22a1fce0" />


Maintained by **Quantera.ai**.

---

## What it does

- **Projects** — organize documents by matter, client, or workflow.
- **Document management** — upload files, store versions, and prepare documents for AI-assisted review.
- **Assistant chat** — ask questions, summarize, draft, and reason over selected context.
- **Tabular reviews** — extract structured answers from document sets into review tables.
- **Workflows** — save reusable prompts and tabular-review templates.
- **Recent activity** — surface the latest chats, tabular reviews, and workflow usage.
- **Keyboard shortcuts** — navigate quickly with a command-style shortcut sheet.
- **Voice input** — use browser speech-to-text in the assistant prompt where supported.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI | Radix primitives, Motion.dev, Lucide icons |
| Backend | Express + TypeScript |
| Database/Auth | Supabase Auth + Postgres |
| Storage | Cloudflare R2 / S3-compatible storage, with local fallback for development |
| AI Providers | Gemini, Anthropic, OpenRouter-compatible models |
| Legal research | [LegalDataHunter](https://legaldatahunter.com) — case law & legislation across 178 jurisdictions |
| Document tooling | LibreOffice for DOC/DOCX conversion |

---

## Repository structure

```txt
.
├── backend/
│   ├── migrations/
│   │   ├── 000_one_shot_schema.sql       # Fresh database schema + RLS
│   │   └── 001_rls_content_tables.sql    # Incremental RLS migration
│   └── src/
│       ├── routes/                       # API routers
│       ├── lib/                          # Supabase, storage, AI/document helpers
│       └── index.ts                      # Express entry point
├── frontend/
│   ├── public/                           # Static assets
│   └── src/
│       ├── app/                          # Next.js App Router pages
│       ├── components/                   # Shared UI and product components
│       ├── contexts/                     # Auth/profile/app state
│       └── lib/                          # Browser/API clients
└── README.md
```

---

## Prerequisites

- Node.js 20+
- Yarn 1.x
- Supabase project
- Optional but recommended for production:
  - Cloudflare R2 or S3-compatible storage
  - LibreOffice installed on the backend host
  - AI provider keys for the models you want to enable

> Note: some dependencies may warn about newer Node engines. The current build has been validated in the provided environment with Node 20.

---

## Environment variables

Create env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Backend

```env
PORT=3001
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key

# Optional in local/dev. If omitted, local disk fallback is used.
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=open-specter

# Enable whichever providers you plan to use.
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENROUTER_API_KEY=your-openrouter-key
RESEND_API_KEY=your-resend-key

# LegalDataHunter — required for the "Sources" panel and inline legal-research
# citations in the assistant chat. This is a paid third-party API. You MUST use
# YOUR OWN key — usage is billed against the key holder's account, and Open
# Specter ships no fallback. Sign up at https://legaldatahunter.com to get one.
# If this variable is unset, the Sources feature is silently disabled and the
# rest of the app keeps working.
LEGAL_DATA_HUNTER_API_KEY=your-legaldatahunter-key
```

### Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## Supabase setup: required first step

A new Supabase project starts with **no application tables**. If the Table Editor says **“No tables in schema”**, the app cannot create projects or upload documents yet.

If the schema has not been applied, Supabase/PostgREST will return errors like:

```json
{"detail":"Could not find the table 'public.projects' in the schema cache"}
```

That means the database is empty — not that project creation is broken.

### Apply the schema in Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Create a new query.
4. Copy the contents of:

   ```txt
   backend/migrations/000_one_shot_schema.sql
   ```

5. Paste it into the SQL Editor.
6. Click **Run**.
7. Open **Table Editor** and confirm tables exist, including:
   - `projects`
   - `documents`
   - `document_versions`
   - `chats`
   - `tabular_reviews`
   - `workflows`
   - `activity_events`

The schema includes indexes, triggers, and Row Level Security policies for content tables.

### If you already have tables

For an existing database where only RLS needs to be added or refreshed, run:

```txt
backend/migrations/001_rls_content_tables.sql
```

---

## Install

```bash
yarn --cwd backend install
yarn --cwd frontend install
```

If your package manager enforces engine checks and a dependency warns about Node versions, use:

```bash
yarn --cwd frontend install --ignore-engines
yarn --cwd backend install --ignore-engines
```

---

## Run locally

Start the backend:

```bash
yarn --cwd backend dev
```

Start the frontend:

```bash
yarn --cwd frontend dev
```

Open:

```txt
http://localhost:3000
```

---

## Build and verify

```bash
yarn --cwd backend build
yarn --cwd frontend build
```

Optional lint:

```bash
yarn --cwd frontend lint
```

Health check:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"ok":true}
```

---

## Development notes

### Storage

If R2/S3 variables are configured, uploaded files are written to object storage.

If they are not configured, Open Specter falls back to local disk storage for development:

```txt
/app/data/open-specter-storage
```

Use object storage for production deployments.

### Row Level Security

The schema enables RLS for content tables beyond user profiles. Access is based on:

- resource ownership
- project sharing via `shared_with`
- workflow sharing via `workflow_shares`
- parent-resource access for child rows such as document versions, chat messages, tabular cells, and activity events

### Keyboard shortcuts

Open the shortcuts sheet from the sidebar user menu or with:

```txt
Cmd/Ctrl + /
```

Common shortcuts:

| Shortcut | Action |
| --- | --- |
| Cmd/Ctrl + 1 | Assistant |
| Cmd/Ctrl + 2 | Projects |
| Cmd/Ctrl + 3 | Tabular Reviews |
| Cmd/Ctrl + 4 | Workflows |
| Cmd/Ctrl + B | Toggle sidebar |
| Cmd/Ctrl + J | Focus assistant prompt |
| Cmd/Ctrl + , | Settings |

---

## Troubleshooting

### `Could not find the table 'public.projects' in the schema cache`

Your Supabase database does not have the Open Specter tables yet.

Fix:

1. Go to Supabase **SQL Editor**.
2. Run `backend/migrations/000_one_shot_schema.sql`.
3. Confirm `projects` appears in Table Editor.
4. Retry creating a project or uploading a document.

### Tables were created but API still says schema cache

Supabase can take a moment to refresh PostgREST’s schema cache. If the error persists after running SQL:

- wait a minute and retry
- confirm the tables are in the `public` schema
- confirm the SQL completed without errors

### Uploads work locally but not in production

Check your R2/S3 env vars:

- `R2_ENDPOINT_URL`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

---

3 quick fixes — exact actions
Fix 1 — Replace your local README.md and push
On your laptop, replace ~/open-specter/README.md with the version from this pod. I'll paste it inline below — copy the entire block.

Open ~/open-specter/README.md in any editor, find the ## License section near the bottom, and replace EVERYTHING from ## License to end-of-file with this:
## License

GNU Affero General Public License v3.0 or later — see [`LICENSE`](./LICENSE).

Copyright (c) 2026 Quantera.ai. Open Specter is provided under **AGPL-3.0** with
strong copyleft. You may self-host, fork, and modify freely — but if you run a
modified version as a network service, you must offer your source code to
your users under the same license. See [`LICENSE`](./LICENSE) for full terms.

---

## Security

Found a vulnerability? Please report it privately. See [`SECURITY.md`](./SECURITY.md)
for the disclosure flow, scope, and hardening guidance for production
deployments.

---

## Third-party API keys are your responsibility

Open Specter integrates with paid third-party services (Supabase, Cloudflare
R2, Gemini, Anthropic, OpenRouter, Resend, LegalDataHunter). Open Specter
ships **no shared/upstream fallback** for any of them — every self-host must
provide its own credentials in `backend/.env`. Usage of each integration is
billed against the key holder's account; the project maintainers cannot be
held responsible for spend on third-party APIs. The backend logs an
integration-status summary at boot so you can see at a glance which providers
are enabled for the current deployment.

---

## Credits & inspiration

Open Specter is a fork of and is deeply inspired by **[Mike](https://mikeoss.com/)**
([willchen96/mike](https://github.com/willchen96/mike)) — the original
open-source AI legal platform created by Will Chen and contributors as an
open alternative to Harvey and Legora.

Massive thanks to the Mike OSS team for laying the foundation, releasing it
under AGPL-3.0, and proving that enterprise-grade legal AI can be self-hosted
by any firm without lock-in. Open Specter extends Mike with:

- A neutral grayscale enterprise-grade UI overhaul (Framer Motion, Apple-inspired)
- Supabase anonymous sign-ins / Guest Mode + 7-day cleanup of orphaned accounts
- 10+ additional legal workflow templates
- **LegalDataHunter** integration for jurisdiction-scoped case-law and
  legislation retrieval with inline citations across 178 jurisdictions

If you use Open Specter, please **also star the upstream Mike repo** —
[github.com/willchen96/mike](https://github.com/willchen96/mike) — it's the
project that made all of this possible.

