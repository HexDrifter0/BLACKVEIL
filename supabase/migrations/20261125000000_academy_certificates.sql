-- BLACKVEIL Academy: server-authoritative progress and certificate orders.
-- Apply only after selecting the intended Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.academy_course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in (
    'foundations','networking','security','linux','python','websec','soc','pentest'
  )),
  completed_lessons integer not null default 0 check (completed_lessons between 0 and 3),
  lesson_total integer not null default 3 check (lesson_total = 3),
  assessment_passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.certificate_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  amount_cents integer not null default 200 check (amount_cents = 200),
  currency text not null default 'eur' check (currency = 'eur'),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  certificate_code text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.academy_course_progress enable row level security;
alter table public.certificate_orders enable row level security;

-- Users may read their own progress and their own certificate order status.
-- Writes are intentionally server-side only (Edge Functions using service role).
drop policy if exists "Read own academy progress" on public.academy_course_progress;
create policy "Read own academy progress"
  on public.academy_course_progress for select
  to authenticated using (auth.uid() = user_id);

drop policy if exists "Read own certificate orders" on public.certificate_orders;
create policy "Read own certificate orders"
  on public.certificate_orders for select
  to authenticated using (auth.uid() = user_id);

revoke insert, update, delete on public.academy_course_progress from anon, authenticated;
revoke insert, update, delete on public.certificate_orders from anon, authenticated;
grant select on public.academy_course_progress to authenticated;
grant select on public.certificate_orders to authenticated;
