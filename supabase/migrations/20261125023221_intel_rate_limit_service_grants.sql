-- Grant only the private Edge Function service role access to the rate-limit ledger.
grant select, insert on public.intel_request_events to service_role;
