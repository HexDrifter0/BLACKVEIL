# Certificate payments — BLACKVEIL Academy

## Product decision
- Product: private BLACKVEIL Academy certificate of completion (not an official or regulated qualification).
- Price: **€2.00 EUR**, one-time payment.
- Eligibility: all eight courses completed and all eight final assessments passed.
- Payment provider: Stripe Checkout (recommended). BLACKVEIL must never collect or store card numbers.

## Secure payment flow
1. The learner signs in through Supabase Auth.
2. The backend verifies course completion from server-side records; browser local storage is not proof of completion.
3. A Supabase Edge Function creates a Stripe Checkout Session with a server-fixed amount of 200 EUR.
4. The learner pays on Stripe-hosted Checkout.
5. A Stripe webhook verifies the signature and confirms the amount, currency, payment status and user metadata.
6. Only after verified payment does the backend mark the order paid and issue a unique certificate code.
7. The learner can retrieve their own certificate/order status under Supabase Row Level Security.

## Required configuration
- A Supabase project selected by the owner.
- Supabase Auth enabled and the Academy account UI connected.
- Stripe account with permission to accept payments.
- Supabase Edge Function secrets configured server-side: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_BASE_URL`.
- A Stripe webhook endpoint subscribed to `checkout.session.completed` and `checkout.session.expired`.

Never prefix secret values with `VITE_`. Never commit keys to GitHub. The browser must receive only the Checkout URL, not Stripe or Supabase service secrets.

## Database
The migration in `supabase/migrations/20261125000000_academy_certificates.sql` creates progress and order tables with RLS. It intentionally denies direct client writes. Trusted Edge Functions must own progress updates and payment status changes.

## Current status
The Academy course UI and local learning progress are implemented. Real checkout is **not active yet**: no Stripe account, Supabase project, authenticated learner flow, Edge Functions or verified webhook have been configured. The purchase button stays disabled rather than pretending to charge a card.
