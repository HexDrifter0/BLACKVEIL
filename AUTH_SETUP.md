# BLACKVEIL authentication setup

BLACKVEIL uses Supabase Auth for real email/password sessions and Google, Apple and GitHub OAuth. The browser bundle may contain only the Supabase project URL and a publishable key (or legacy anon key). Never put a Supabase secret/service-role key, provider client secret or OpenAI client secret in Vite variables.

## 1. Dedicated Supabase project

BLACKVEIL uses this Supabase project:

- Project reference: `robmzfodqbijekqxrhyd`
- API URL: `https://robmzfodqbijekqxrhyd.supabase.co`
- Region: Frankfurt (`eu-central-1`)

The project is active. Apply the SQL migrations in `supabase/migrations/` to this project. The profile migration creates a user-owned `profiles` table protected by row-level security (RLS).

## 2. Configure application redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://hexdrifter0.github.io/BLACKVEIL/`
- Additional redirect URLs:
  - `https://hexdrifter0.github.io/BLACKVEIL/`
  - `https://hexdrifter0.github.io/BLACKVEIL/**`
  - `http://localhost:5173/BLACKVEIL/`
  - `http://localhost:5173/BLACKVEIL/**`

The app's OAuth `redirectTo` is the GitHub Pages app URL (or the equivalent local Vite URL). The provider callback registered with Google, Apple and GitHub is different: it must point to Supabase Auth:

```
https://robmzfodqbijekqxrhyd.supabase.co/auth/v1/callback
```

## 3. Configure Google, GitHub and Apple

Create one OAuth application for each provider, then configure its credentials in Supabase Dashboard → Authentication → Sign In / Providers. Enable the provider and save its credentials.

- **Google:** create a Web application OAuth client in Google Cloud Console. Add the Supabase callback above to Authorized redirect URIs.
- **GitHub:** create an OAuth App in GitHub Developer Settings. Set the homepage to `https://hexdrifter0.github.io/BLACKVEIL/` and the Authorization callback URL to the Supabase callback above.
- **Apple:** configure Sign in with Apple, a Services ID and the required domain/return URL association in Apple Developer. Generate the client-secret JWT using the Apple private key, then enter the Services ID and JWT in Supabase. Apple setup has additional developer-account and domain verification requirements.

For all three providers, the client ID and client secret belong in Supabase's provider settings, not in the browser bundle or GitHub Actions. The provider callback URL is the Supabase URL above, not the GitHub Pages URL.

## 4. Configure GitHub Pages build variables

The deployment workflow reads these repository Actions secrets at build time (GitHub → repository Settings → Secrets and variables → Actions):

- `VITE_SUPABASE_URL`: `https://robmzfodqbijekqxrhyd.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (preferred), or
- `VITE_SUPABASE_ANON_KEY`: the legacy anon key (supported as a fallback).

The current frontend client also contains the project's public URL and publishable key as fallback values, so a missing Actions secret alone should not produce the backend-not-configured banner in the current source. These are public browser credentials protected by RLS; they are not privileged secrets. Never add a `service_role` or `sb_secret_` key.

For local development, copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 5. Sign in with ChatGPT (OpenAI)

This is a separate OpenID Connect integration; it is not a Supabase built-in social provider. It requires an OpenAI-issued OAuth client ID, registered callback URI, PKCE state handling, server-side code exchange, ID-token signature/issuer/audience/nonce verification, and creation/linking of a BLACKVEIL account. Do not use an OpenAI API key as an identity credential.

Website identity sign-in is available only to eligible partners. Request access/client registration from OpenAI before enabling it. Once approved, deploy the secure backend callback and set `VITE_OPENAI_AUTH_URL` to its public start endpoint. The UI intentionally does not simulate this sign-in method.

## 6. Verification checklist

1. Confirm Supabase Auth provider status is enabled for Google, Apple and GitHub.
2. Confirm each provider's client ID/secret is saved in Supabase.
3. Confirm the provider's registered callback exactly matches the Supabase callback above.
4. Confirm the Site URL and Additional Redirect URLs include the production and local app URLs above.
5. Confirm the GitHub Pages deployment uses the latest commit. A currently deployed page that still shows the old backend-not-configured banner is likely serving a stale bundle or a different deployment: the current `src/lib/supabase.ts` has non-empty public fallback credentials and should create a client.
6. Test each provider with a real account in a private browser window. Verify return to BLACKVEIL, a valid Supabase session, profile access and sign-out.
7. Test email sign-up, confirmation, password sign-in, recovery and profile persistence separately.

A button appearing in the interface is not proof of provider configuration. BLACKVEIL must pass end-to-end tests for each provider before authentication is considered production-ready.

Official references:
- https://supabase.com/docs/guides/auth/social-login
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-github
- https://supabase.com/docs/guides/auth/social-login/auth-apple
