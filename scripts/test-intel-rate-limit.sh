#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGPASSWORD:=postgres}"
: "${PGDATABASE:=postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

psql -X -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

do $roles$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$roles$;

grant usage on schema public to service_role;

insert into auth.users (id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333')
on conflict do nothing;
SQL

psql -X -v ON_ERROR_STOP=1 \
  -f "$ROOT_DIR/supabase/migrations/20261125023016_intel_provider_rate_limit.sql" \
  -f "$ROOT_DIR/supabase/migrations/20261125023117_intel_rate_limit_deny_policy.sql" \
  -f "$ROOT_DIR/supabase/migrations/20261125023221_intel_rate_limit_service_grants.sql" \
  -f "$ROOT_DIR/supabase/migrations/20261127010000_atomic_intel_rate_limit.sql"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

user_id="11111111-1111-4111-8111-111111111111"
pids=()
for i in 1 2 3 4 5 6; do
  psql -X -A -t -v ON_ERROR_STOP=1 \
    -c "select public.consume_intel_request('$user_id', 5, 60);" \
    > "$tmp_dir/$i" &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  wait "$pid"
done

accepted="$(awk '$0 == "t" { count++ } END { print count + 0 }' "$tmp_dir"/*)"
denied="$(awk '$0 == "f" { count++ } END { print count + 0 }' "$tmp_dir"/*)"
if [[ "$accepted" -ne 5 || "$denied" -ne 1 ]]; then
  echo "Expected exactly five accepted and one denied concurrent request; got accepted=$accepted denied=$denied" >&2
  exit 1
fi

second_user="$(psql -X -A -t -q -v ON_ERROR_STOP=1 <<'SQL'
set role service_role;
select public.consume_intel_request('22222222-2222-4222-8222-222222222222', 5, 60);
reset role;
SQL
)"
if [[ "$second_user" != "t" ]]; then
  echo "A separate user should have an independent quota." >&2
  exit 1
fi

if psql -X -v ON_ERROR_STOP=1 -c \
  "select public.consume_intel_request('$user_id', 0, 60);" >/dev/null 2>&1; then
  echo "Invalid limits must be rejected." >&2
  exit 1
fi

privileges="$(psql -X -A -t -F ' ' -v ON_ERROR_STOP=1 -c \
  "select has_function_privilege('anon', 'public.consume_intel_request(uuid,integer,integer)', 'execute'), has_function_privilege('authenticated', 'public.consume_intel_request(uuid,integer,integer)', 'execute'), has_function_privilege('service_role', 'public.consume_intel_request(uuid,integer,integer)', 'execute'), has_table_privilege('anon', 'public.intel_request_events', 'select'), has_table_privilege('authenticated', 'public.intel_request_events', 'select'), has_table_privilege('service_role', 'public.intel_request_events', 'select');")"
if [[ "$privileges" != "f f t f f t" ]]; then
  echo "Unexpected RPC/table grants: $privileges" >&2
  exit 1
fi

psql -X -v ON_ERROR_STOP=1 <<'SQL'
insert into public.intel_request_events (user_id, created_at)
values ('22222222-2222-4222-8222-222222222222', clock_timestamp() - interval '25 hours');
select public.consume_intel_request('33333333-3333-4333-8333-333333333333', 5, 60);
SQL
expired_rows="$(psql -X -A -t -v ON_ERROR_STOP=1 -c \
  "select count(*) from public.intel_request_events where created_at < clock_timestamp() - interval '24 hours';")"
if [[ "$expired_rows" != "0" ]]; then
  echo "Expired rate-limit events were not cleaned up." >&2
  exit 1
fi

echo "PASS: six concurrent calls yielded exactly five accepted and one denied."
echo "PASS: quotas are isolated per user; invalid limits are rejected."
echo "PASS: only service_role can execute the RPC or read the rate-limit ledger."
echo "PASS: expired ledger rows are pruned by the serialized 24-hour cleanup.";
