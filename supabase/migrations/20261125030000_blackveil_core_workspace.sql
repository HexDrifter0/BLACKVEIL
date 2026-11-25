-- BLACKVEIL core workspace schema
-- All user-owned records are protected by RLS and scoped to auth.uid().

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  bio text,
  avatar_url text,
  preferred_profile text not null default 'Purple Hat'
    check (preferred_profile in ('White Hat','Black Hat','Red Hat','Blue Hat','Purple Hat')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target text not null check (char_length(target) between 1 and 500),
  scope text not null check (char_length(scope) between 1 and 10000),
  authorization_confirmed boolean not null default false,
  authorized_until timestamptz,
  status text not null default 'draft' check (status in ('draft','authorized','expired','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'authorized' or (authorization_confirmed = true and authorized_until is not null))
);
create index if not exists engagements_user_created_idx on public.engagements(user_id, created_at desc);

create table if not exists public.threat_indicators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value text not null check (char_length(value) between 1 and 2048),
  indicator_type text not null check (indicator_type in ('IPv4','DOMAIN','URL','HASH','UNKNOWN')),
  enrichment jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, value)
);
create index if not exists threat_indicators_user_created_idx on public.threat_indicators(user_id, created_at desc);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 80),
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_user_created_idx on public.audit_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.engagements enable row level security;
alter table public.threat_indicators enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users manage their own engagements" on public.engagements;
create policy "Users manage their own engagements" on public.engagements
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own indicators" on public.threat_indicators;
create policy "Users manage their own indicators" on public.threat_indicators
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their own audit events" on public.audit_events;
create policy "Users read their own audit events" on public.audit_events
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users append their own audit events" on public.audit_events;
create policy "Users append their own audit events" on public.audit_events
for insert to authenticated
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles, public.engagements, public.threat_indicators to authenticated;
grant select, insert on public.audit_events to authenticated;
