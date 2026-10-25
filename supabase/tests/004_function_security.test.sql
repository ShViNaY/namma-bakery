-- Run with: supabase test db
-- Step 004: Function security hardening verification
-- Verifies:
-- 1. Unnecessary PUBLIC execution privileges are removed.
-- 2. Anonymous users cannot invoke admin or actor role functions.
-- 3. Anonymous users cannot invoke staff-restricted RPC functions.
-- 4. Guest checkout (available_slots, slot_start) and public catalog browsing remain functional.
-- 5. Authenticated customer boundaries are preserved.
-- 6. Staff and Admin authorization checks remain enforced.
-- 7. Search paths are pinned on set_updated_at, enforce_variant_product_kind, slot_start.
-- 8. Trigger behaviors (set_updated_at, enforce_variant_product_kind) and slot_start calculation are intact.

begin;
select plan(34);

-- Fixtures (run as superuser)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'cust-a@test'),
  ('00000000-0000-0000-0000-0000000000e3', 'employee@test'),
  ('00000000-0000-0000-0000-0000000000d4', 'admin@test')
on conflict (id) do nothing;

insert into staff_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000e3', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-0000000000d4', 'ADMIN')
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------
-- 1. Unnecessary PUBLIC execution privileges are removed
-- ----------------------------------------------------------------
select ok(not has_function_privilege('public', 'public.is_admin()', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute is_admin()');

select ok(not has_function_privilege('public', 'public.is_staff()', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute is_staff()');

select ok(not has_function_privilege('public', 'public.available_slots(uuid, date, integer)', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute available_slots()');

select ok(not has_function_privilege('public', 'public.current_actor_role()', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute current_actor_role()');

select ok(not has_function_privilege('public', 'public.slot_start(timestamptz, integer, text)', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute slot_start()');

select ok(not has_function_privilege('public', 'public.set_updated_at()', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute set_updated_at()');

select ok(not has_function_privilege('public', 'public.enforce_variant_product_kind()', 'EXECUTE'),
  'PUBLIC pseudo-role cannot execute enforce_variant_product_kind()');

-- ----------------------------------------------------------------
-- 2. Anonymous role boundaries
-- ----------------------------------------------------------------
select ok(not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
  'Anonymous role has no EXECUTE privilege on is_admin()');

select ok(not has_function_privilege('anon', 'public.current_actor_role()', 'EXECUTE'),
  'Anonymous role has no EXECUTE privilege on current_actor_role()');

set local role anon;

select throws_ok(
  $$ select is_admin() $$,
  '42501', null,
  'Anonymous execution of is_admin() is rejected with permission denied'
);

select throws_ok(
  $$ select current_actor_role() $$,
  '42501', null,
  'Anonymous execution of current_actor_role() is rejected with permission denied'
);

select throws_ok(
  $$ select transition_order('00000000-0000-0000-0000-000000000000'::uuid, 'ACCEPTED'::order_status) $$,
  '42501', null,
  'Anonymous execution of staff RPC transition_order() is rejected'
);

-- Guest checkout and catalog reading still work
select lives_ok(
  $$ select * from available_slots((select id from locations limit 1), current_date, 0) $$,
  'Anonymous guest can execute available_slots() for pickup selection'
);

select lives_ok(
  $$ select slot_start(now(), 30, 'Asia/Kolkata') $$,
  'Anonymous guest can execute slot_start()'
);

-- Catalog RLS queries succeed (evaluating is_staff() for anon without permission error)
select ok((select count(*) from products) > 0,
  'Anonymous users can read public products catalog');

select ok((select count(*) from categories) > 0,
  'Anonymous users can read public categories catalog');

reset role;

-- ----------------------------------------------------------------
-- 3. Authenticated customer role boundaries
-- ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select is(is_admin(), false,
  'Authenticated customer is not admin');

select is(is_staff(), false,
  'Authenticated customer is not staff');

select is(current_actor_role(), 'CUSTOMER',
  'Authenticated customer current_actor_role resolves to CUSTOMER');

select lives_ok(
  $$ select * from available_slots((select id from locations limit 1), current_date, 0) $$,
  'Authenticated customer can execute available_slots()'
);

select throws_ok(
  $$ select transition_order('00000000-0000-0000-0000-000000000000'::uuid, 'ACCEPTED'::order_status) $$,
  '42501', null,
  'Customer cannot execute staff RPC transition_order()'
);

reset role;

-- ----------------------------------------------------------------
-- 4. Staff employee authorization boundaries
-- ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e3', true);

select is(is_staff(), true,
  'Staff employee is_staff resolves to true');

select is(is_admin(), false,
  'Staff employee is_admin resolves to false');

select is(current_actor_role(), 'EMPLOYEE',
  'Staff employee current_actor_role resolves to EMPLOYEE');

select throws_ok(
  $$ select set_orders_pause((select id from locations limit 1), now() + interval '3 days', 'Employee long pause') $$,
  '42501', 'forbidden: employees can pause until end of day only',
  'Employee cannot pause orders beyond end of day'
);

reset role;

-- ----------------------------------------------------------------
-- 5. Admin authorization capabilities
-- ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d4', true);

select is(is_admin(), true,
  'Admin user is_admin resolves to true');

select is(is_staff(), true,
  'Admin user is_staff resolves to true');

select is(current_actor_role(), 'ADMIN',
  'Admin user current_actor_role resolves to ADMIN');

reset role;

-- ----------------------------------------------------------------
-- 6. Pinned search paths
-- ----------------------------------------------------------------
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
      and array_to_string(p.proconfig, ',') like '%search_path=%'
  ),
  'set_updated_at() has explicitly configured search_path'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'enforce_variant_product_kind'
      and array_to_string(p.proconfig, ',') like '%search_path=%'
  ),
  'enforce_variant_product_kind() has explicitly configured search_path'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'slot_start'
      and array_to_string(p.proconfig, ',') like '%search_path=%'
  ),
  'slot_start() has explicitly configured search_path'
);

-- ----------------------------------------------------------------
-- 7. Trigger and scheduling logic integrity
-- ----------------------------------------------------------------
-- Trigger: set_updated_at updates timestamp
do $$
declare
  v_loc uuid := (select id from locations limit 1);
  v_old timestamptz;
  v_new timestamptz;
begin
  select updated_at into v_old from store_settings where location_id = v_loc;
  perform pg_sleep(0.01);
  update store_settings set pause_message = pause_message where location_id = v_loc;
  select updated_at into v_new from store_settings where location_id = v_loc;
  if v_new <= v_old then
    raise exception 'set_updated_at trigger failed to advance updated_at';
  end if;
end $$;
select pass('set_updated_at() trigger successfully updates updated_at column on UPDATE');

-- Trigger: enforce_variant_product_kind blocks variant creation on TIERED_CAKE
select throws_ok(
  $$ insert into product_variants (product_id, label, price_paise)
     values ((select id from products where kind = 'TIERED_CAKE' limit 1), 'Invalid Variant', 50000) $$,
  '23514', 'variants are only allowed on SIMPLE products',
  'enforce_variant_product_kind() blocks variants on TIERED_CAKE products'
);

-- Scheduling: slot_start rounds down to nearest slot boundary
select is(
  slot_start('2026-10-25 14:27:45+05:30'::timestamptz, 30, 'Asia/Kolkata'),
  '2026-10-25 14:00:00+05:30'::timestamptz,
  'slot_start() correctly aligns timestamp to slot boundary'
);

select * from finish();
rollback;
