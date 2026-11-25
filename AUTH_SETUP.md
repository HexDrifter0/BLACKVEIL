# BLACKVEIL authentication setup

BLACKVEIL uses Supabase Auth for real email/password sessions and Google, Apple and GitHub OAuth. The browser bundle must contain only the Supabase project URL and publishable/anon key. Never add a Supabase service-role key, provider client secret or OpenAI client secret to Vite variables.

## 1. Select the dedicated Supabase project

Use a Supabase project dedicated to BLACKVEIL. Apply the SQL migrations in `supabase/migrations/` to that project. The profile migration creates a user-owned `profiles` table protected by row-level security (RLS).

## 2. Configure the application URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://hexdrifter0.github.io/BLACKVEIL/`
- Additional redirect URLs: `https://hexdrifter0.github.io/BLACKVEIL/**` and `http://localhost:5173/**`

The provider callback URI to register at Google, Apple and GitHub is the Supabase Auth callback, not the GitHub Pages URL:

`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

Replace `YOUR_PROJECT_REF` with the selected project's reference.

## 3. Configure social providers

In Supabase Dashboard → Authentication → Sign In / Providers, enable each provider after creating its OAuth application:

- Google: Google Cloud Console → OAuth client (Web application).
- GitHub: GitHub Developer Settings → OAuth Apps.
- Apple: Apple Developer → Services ID, Sign in with Apple capability and a generated client-secret JWT.

For each provider, enter its client ID and client secret in the Supabase dashboard. Provider secrets remain in Supabase; do not put them in GitHub or frontend environment variables. Provider configuration is not complete until the provider dashboard and Supabase both accept the callback.

Email/password sign-up, sign-in and password recovery use Supabase Auth. Email confirmation and SMTP delivery must be configured in the Supabase Auth settings for production-grade mail delivery.

## 4. Configure GitHub Pages build variables

Add these repository Actions secrets (Settings → Secrets and variables → Actions):

- `VITE_SUPABASE_URL`: the project's API URL.
- `VITE_SUPABASE_ANON_KEY`: the project's publishable key (or legacy anon key).

The deployment workflow reads these at build time. These two values are intended for browser use; no privileged secret belongs here.

For local development, copy `.env.example` to `.env.local` and set the same two values.

## 5. Sign in with ChatGPT (OpenAI)

This is a separate OpenID Connect integration; it is not a Supabase built-in social provider. It requires an OpenAI-issued OAuth client ID, registered callback URI, PKCE state handling, server-side code exchange, ID-token signature/issuer/audience/nonce verification, and creation/linking of a BLACKVEIL account. Do not use an OpenAI API key as an identity credential.

OpenAI's current website SIWC documentation states that website identity sign-in is available to selected commercial partners through a limited trial. Request access/client registration from OpenAI before enabling it. Once approved, deploy the secure backend callback and set `VITE_OPENAI_AUTH_URL` to its public start endpoint. The UI intentionally does not simulate this sign-in method.

Official references:
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/siwc/website
- https://supabase.com/docs/guides/auth/social-login
- https://supabase.com/docs/guides/auth/redirect-urls

## 6. Verify

After configuration:
1. Confirm Supabase Auth provider status is enabled.
2. Confirm the profile migration is applied.
3. Add the two GitHub Actions secrets and redeploy.
4. Test sign-up, email confirmation, sign-in, sign-out, password recovery and profile persistence in a second browser/device.
5. Test each OAuth provider with a real provider account and verify the resulting Supabase session.

A button appearing in the interface is not proof of provider configuration. BLACKVEIL must be tested end-to-end before calling authentication production-ready.
