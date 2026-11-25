-- Rate-limit authenticated provider lookups per user.
-- This table is service-role-only; browser roles receive no grants.

create table if not exists public.intel_request_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists intel_request_events_user_created_idx on public.intel_request_events(user_id, created_at desc);
alter table public.intel_request_events enable row level security;
revoke all on public.intel_request_events from anon, authenticated;
