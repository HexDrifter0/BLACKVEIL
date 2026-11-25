-- BLACKVEIL operator profiles. Safe to apply to the dedicated BLACKVEIL Supabase project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  username text,
  bio text check (char_length(bio) <= 240),
  avatar_url text,
  preferred_profile text not null default 'Purple Hat'
    check (preferred_profile in ('White Hat','Black Hat','Red Hat','Blue Hat','Purple Hat')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username)) where username is not null and username <> '';
alter table public.profiles enable row level security;
drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
