-- Serialize per-user provider quota consumption in the database.
-- The Edge Function calls this RPC with the service role; browser roles cannot execute it.

create index if not exists intel_request_events_created_at_idx
  on public.intel_request_events (created_at);

create or replace function public.consume_intel_request(
  p_user_id uuid,
  p_limit integer default 5,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_now timestamptz;
  v_count integer;
begin
  if p_user_id is null then
    raise exception using errcode = '22004', message = 'user_id_required';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using errcode = '22023', message = 'invalid_rate_limit';
  end if;

  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception using errcode = '22023', message = 'invalid_rate_limit_window';
  end if;

  -- Hash collisions only cause harmless extra serialization; they cannot bypass a quota.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  -- Use wall-clock time after acquiring the lock so wait time is not counted
  -- against the next caller's rolling window.
  v_now := pg_catalog.clock_timestamp();

  -- Opportunistically purge expired rows. The transaction-scoped global lock
  -- ensures only one concurrent caller performs the cleanup at a time.
  if pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('blackveil:intel-rate-limit-retention'),
    1
  ) then
    delete from public.intel_request_events
    where created_at < v_now - interval '24 hours';
  end if;

  select count(*)::integer
    into v_count
    from public.intel_request_events
   where user_id = p_user_id
     and created_at >= v_now - pg_catalog.make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into public.intel_request_events (user_id, created_at)
  values (p_user_id, v_now);

  return true;
end;
$function$;

revoke all on function public.consume_intel_request(uuid, integer, integer) from public;
revoke all on function public.consume_intel_request(uuid, integer, integer) from anon, authenticated;
grant execute on function public.consume_intel_request(uuid, integer, integer) to service_role;

comment on function public.consume_intel_request(uuid, integer, integer) is
  'Atomically consumes a per-user provider lookup quota. Service-role only; expires ledger rows after 24 hours.';
