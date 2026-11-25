-- Explicit deny-all browser policy for the private provider rate-limit ledger.
-- The Edge Function accesses this table with the service role only.
drop policy if exists "Provider rate limit ledger is service-only" on public.intel_request_events;
create policy "Provider rate limit ledger is service-only"
on public.intel_request_events
for all to anon, authenticated
using (false)
with check (false);
