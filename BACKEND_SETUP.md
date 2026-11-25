# BLACKVEIL backend setup

## Dedicated backend

BLACKVEIL is connected to its dedicated Supabase project in the Frankfurt region:

- Project ref: `robmzfodqbijekqxrhyd`
- API URL: `https://robmzfodqbijekqxrhyd.supabase.co`
- Browser key: Supabase publishable key (public by design; never use a secret/service-role key in Vite)

The frontend has a public publishable-key fallback so GitHub Pages can connect without a private build secret. You may override it with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in GitHub Actions secrets. The database must remain protected by RLS.

## Authentication configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://hexdrifter0.github.io/BLACKVEIL/`
- Add the exact callback URL above to the redirect allow list.
- For local development, add `http://localhost:5173/BLACKVEIL/`.

Email/password authentication is implemented in the app. Email confirmation and SMTP deliverability depend on the project's Auth settings.

Google, GitHub and Apple buttons call Supabase OAuth, but each provider still requires provider credentials and its callback URL configured in Supabase Dashboard → Authentication → Providers. Do not assume a provider works until a real login round-trip is tested.

The ChatGPT button is deliberately disabled unless `VITE_OPENAI_AUTH_URL` is configured with a valid, approved OAuth authorization URL and a corresponding secure callback implementation. It is not a generic OpenAI login shortcut.

## Database schema

Migration: `supabase/migrations/20261125022608_blackveil_core_workspace.sql`

- `profiles`: account profile and preferences.
- `engagements`: owner-scoped assessment records, explicit authorization and expiry.
- `threat_indicators`: owner-scoped IOC register and enrichment.
- `audit_events`: append-only client event trail (users can read and insert their own events; no update/delete policy).

RLS is enabled on every table. All user data policies scope access to `auth.uid()`. The Supabase security advisor returned no lints immediately after migration.

## Connected app features

- Account registration, login, password recovery and session persistence.
- Profile reads/writes through Supabase.
- Operations engagements synchronize to Supabase for signed-in users; guest records remain in the browser.
- Threat indicators synchronize to Supabase for signed-in users; guest records remain local.
- Engagement creation/deletion and IOC ingestion emit audit events.

## Provider integrations and active scanning

Public DNS, RDAP, Certificate Transparency and NVD lookups are currently performed against public providers.

The authenticated Supabase Edge Function `intel-enrichment` is deployed and called by the Internet Intelligence screen. It supports:
- VirusTotal for IPv4, domains and file hashes.
- Shodan, Censys and AbuseIPDB for IPv4 addresses.
- Supabase Auth JWT verification, a per-user limit of five lookups per minute, and audit events.
- Server-side API keys only; provider secrets are never returned to the browser.

The function is live, but provider results remain `not_configured` until the following secrets are added in Supabase Dashboard → Edge Functions → Secrets:
- `VIRUSTOTAL_API_KEY`
- `SHODAN_API_KEY`
- `CENSYS_API_ID` and `CENSYS_API_SECRET`
- `ABUSEIPDB_API_KEY`

Never add these keys to GitHub Pages, Vite environment variables, this repository, or chat messages.

Nmap/Nuclei/ZAP are not running from GitHub Pages. They require a separate hardened worker, target allowlisting, server-side authorization checks, DNS/SSRF controls, resource limits and a deployment target. Do not treat an engagement checkbox or a database record as proof that a scanner has been deployed.

Nmap/Nuclei/ZAP are not running from GitHub Pages. They require a separate hardened worker, target allowlisting, server-side authorization checks, DNS/SSRF controls, resource limits and a deployment target. Do not treat an engagement checkbox or a database record as proof that a scanner has been deployed.

## Verification

The migration was applied to the BLACKVEIL Supabase project, all four tables were confirmed present with RLS enabled, and the Supabase security advisor returned no lints. GitHub Actions typecheck/build must also pass after each code change. OAuth providers, email delivery, the public Pages UI and any remote scanner still require end-to-end deployment testing.
