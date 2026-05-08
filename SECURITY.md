# Security Policy

Open Specter is built for legal teams handling sensitive matters. We take
security reports seriously and appreciate the community's help in keeping the
project safe.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately via one of:

- Email: `security@quantera.ai`
- GitHub Security Advisories: use the **"Report a vulnerability"** button on
  the repository's **Security** tab.

When reporting, please include:

1. A description of the vulnerability and its potential impact.
2. Steps to reproduce (proof-of-concept code, screenshots, or curl/HTTP
   transcripts are very helpful).
3. The affected version (commit SHA or release tag).
4. Your environment (Node version, Supabase region, deployment target).
5. Any suggested mitigation, if you have one.

## What to expect

| Stage | Target turnaround |
| --- | --- |
| Acknowledgement of report | Within **2 business days** |
| Initial triage / severity assessment | Within **5 business days** |
| Fix released for high/critical issues | Within **30 days** of triage |
| Public disclosure (coordinated) | After a fix ships, or 90 days, whichever first |

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure)
and will credit reporters in the release notes unless anonymity is requested.

## Scope

In scope:

- The Open Specter Express backend (`backend/`)
- The Open Specter Next.js frontend (`frontend/`)
- The Supabase migrations and RLS policies shipped in this repository
- The bundled edge functions under `supabase/functions/`

Out of scope:

- Third-party services we integrate with (Supabase, Cloudflare R2, Gemini,
  Anthropic, OpenRouter, Resend, LegalDataHunter). Report those to the
  respective provider.
- Self-hosted deployments where the operator has modified the security
  configuration (RLS disabled, service role key exposed client-side, etc.).
- Issues requiring physical access to a user's device or that depend on
  social-engineering an authenticated user.
- Best-practice recommendations without a demonstrated impact.

## Hardening guidance for self-hosters

If you operate Open Specter for an organization, please review the following
before going to production:

1. **Never expose `SUPABASE_SECRET_KEY` to the browser.** It is a service-role
   key that bypasses Row Level Security. It belongs only in the backend
   `.env` and in trusted server processes.
2. **Apply Row Level Security**: run both
   `backend/migrations/000_one_shot_schema.sql` (or the equivalent rebuilt
   schema) and confirm that RLS is `ENABLED` on every content table in the
   Supabase Table Editor.
3. **Rotate keys on day one.** The example env files are templates — every
   production deployment should generate fresh Supabase service-role,
   Gemini, Anthropic, OpenRouter, Resend, R2 and LegalDataHunter keys.
4. **Use object storage in production.** The local-disk storage fallback is
   for development only — files do not persist across pod restarts and have
   no encryption at rest.
5. **Restrict CORS** to your real frontend origin (`FRONTEND_URL` env var)
   rather than `*` once you have stable hostnames.
6. **Pin dependency updates.** Watch GitHub Dependabot alerts; the legal-tech
   data flowing through Open Specter increases the blast radius of any
   upstream CVE.
7. **Audit logs**: forward Supabase Auth logs and the Express access logs to
   your SIEM. Anonymous (guest) sessions are subject to a 7-day cleanup; if
   you need shorter retention, edit `supabase/functions/cleanup-anonymous-users/`.

## Supported versions

We provide security fixes for the **most recent minor release** and the
previous one. Older versions are best-effort.

| Version | Supported |
| --- | --- |
| latest `main` | ✅ |
| previous minor release | ✅ |
| anything older | ❌ |
