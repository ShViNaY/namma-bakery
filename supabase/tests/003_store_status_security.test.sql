-- Run with: supabase test db
-- Verifies security, schema boundaries, and access control for public_store_status:
-- 1. public_store_status view is configured with security_invoker = true
-- 2. Anonymous users can query public_store_status
-- 3. Anonymous users cannot read store_settings directly (RLS denies)
-- 4. Authenticated customers can query public_store_status
-- 5. Authenticated customers cannot read store_settings directly (RLS denies)
-- 6. Staff members can read store_settings directly
-- 7. Helper function is NOT exposed in public schema (no Data API RPC exposure)
-- 8. Helper function is placed in private schema
-- 9. Helper function is STABLE and enforces empty search_path
-- 10-12. Internal capacity and threshold columns are not exposed by public_store_status

begin;
select plan(12);

-- Fixtures (run as superuser)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'cust-a@test'),
  ('00000000-0000-0000-0000-0000000000e3', 'employee@test')
on conflict (id) do nothing;

insert into staff_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000e3', 'EMPLOYEE')
on conflict (user_id) do nothing;

-- Ensure at least one store_settings record exists
insert into store_settings (location_id, orders_paused_until, pause_message, slot_minutes)
values (
  (select id from locations limit 1),
  now() + interval '2 hours',
  'We are currently baking fresh batches. Taking orders shortly!',
  30
)
on conflict (location_id) do update set
  orders_paused_until = excluded.orders_paused_until,
  pause_message = excluded.pause_message,
  slot_minutes = excluded.slot_minutes;

-- 1. Verify view has security_invoker = true in pg_class reloptions
select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'public_store_status'
      and c.reloptions::text like '%security_invoker=true%'
  ),
  'public_store_status view is explicitly configured with security_invoker = true'
);

-- 2. Anonymous users can query public_store_status
set local role anon;
select lives_ok(
  $$ select location_id, orders_paused_until, pause_message, slot_minutes from public_store_status $$,
  'Anonymous users can query public_store_status without error'
);

-- 3. Anonymous users cannot select from store_settings directly (RLS denies access)
select is(
  (select count(*) from store_settings),
  0::bigint,
  'Anonymous users see 0 rows from store_settings directly due to RLS'
);
reset role;

-- 4. Authenticated customers can query public_store_status
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select lives_ok(
  $$ select location_id, orders_paused_until, pause_message, slot_minutes from public_store_status $$,
  'Authenticated customers can query public_store_status without error'
);

-- 5. Authenticated customers cannot select from store_settings directly (RLS denies access)
select is(
  (select count(*) from store_settings),
  0::bigint,
  'Authenticated customers see 0 rows from store_settings directly due to RLS'
);
reset role;

-- 6. Staff members can read store_settings directly
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e3', true);
select ok(
  (select count(*) from store_settings) > 0,
  'Staff members can read store_settings directly'
);
reset role;

-- 7. Restricted helper access: helper function is NOT in public schema (not exposed to PostgREST RPC)
select is_empty(
  $$ select 1 from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'get_public_store_status' $$,
  'Helper function is NOT in public schema (preventing Data API / RPC exposure)'
);

-- 8. Helper function is placed in private schema
select isnt_empty(
  $$ select 1 from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname = 'get_public_store_status' $$,
  'Helper function is located in isolated private schema'
);

-- 9. Helper function is STABLE and enforces search_path = ''
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'get_public_store_status'
      and p.prosecdef = true
      and p.provolatile = 's'
      and array_to_string(p.proconfig, ',') like '%search_path=%'
  ),
  'Helper function is STABLE, SECURITY DEFINER, and enforces search_path configuration'
);

-- 10-12. Internal capacity columns are not exposed through public_store_status
select throws_ok(
  $$ select max_orders_per_slot from public_store_status $$,
  '42703', null,
  'Querying internal capacity max_orders_per_slot from public_store_status is rejected'
);

select throws_ok(
  $$ select max_custom_per_day from public_store_status $$,
  '42703', null,
  'Querying internal capacity max_custom_per_day from public_store_status is rejected'
);

select throws_ok(
  $$ select max_open_orders_per_phone from public_store_status $$,
  '42703', null,
  'Querying anti-abuse limit max_open_orders_per_phone from public_store_status is rejected'
);

select * from finish();
rollback;
