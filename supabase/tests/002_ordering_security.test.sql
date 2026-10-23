-- Run with: supabase test db
-- Step 3.7: Ordering flow security and abuse protection pgTAP test suite.
begin;
select plan(11);

-- Fixtures
create temp table ctx as
select (select id from locations limit 1) as loc,
       ((date_trunc('day', now() at time zone 'Asia/Kolkata') + interval '3 days 12 hours') at time zone 'Asia/Kolkata') as pickup;
grant select on ctx to anon, authenticated, service_role;

-- 1-5: Input boundaries & business rule exceptions in place_order (service_role)
set local role service_role;

-- 1. INVALID_NAME
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'X', '9845000001', null, (select pickup from ctx), null,
       (select jsonb_build_array(jsonb_build_object('product_id', id, 'weight_grams', 1000, 'egg_type', 'EGGLESS', 'quantity', 1)) from products where slug = 'black-forest')) $$,
  'INVALID_NAME', 'Customer name < 2 characters is rejected');

-- 2. INVALID_PHONE
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'Valid Name', '123', null, (select pickup from ctx), null,
       (select jsonb_build_array(jsonb_build_object('product_id', id, 'weight_grams', 1000, 'egg_type', 'EGGLESS', 'quantity', 1)) from products where slug = 'black-forest')) $$,
  'INVALID_PHONE', 'Invalid short phone is rejected');

-- 3. INVALID_ITEMS (empty array)
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'Valid Name', '9845000001', null, (select pickup from ctx), null, '[]'::jsonb) $$,
  'INVALID_ITEMS', 'Empty items array is rejected');

-- 4. INVALID_QUANTITY
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'Valid Name', '9845000001', null, (select pickup from ctx), null,
       (select jsonb_build_array(jsonb_build_object('product_id', id, 'weight_grams', 1000, 'egg_type', 'EGGLESS', 'quantity', 0)) from products where slug = 'black-forest')) $$,
  'INVALID_QUANTITY', 'Quantity of 0 is rejected');

-- 5. OPTION_NOT_AVAILABLE
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'Valid Name', '9845000001', null, (select pickup from ctx), null,
       (select jsonb_build_array(jsonb_build_object('product_id', id, 'weight_grams', 9999, 'egg_type', 'EGGLESS', 'quantity', 1)) from products where slug = 'black-forest')) $$,
  'OPTION_NOT_AVAILABLE: Black Forest', 'Non-existent weight option is rejected');

reset role;

-- 6-9: Direct table writes to orders are strictly prohibited for anon and authenticated users
set local role anon;
select throws_ok(
  $$ insert into orders (location_id, customer_name, customer_phone, requested_pickup_at)
     values ((select loc from ctx), 'Attacker', '9845000001', (select pickup from ctx)) $$,
  '42501', null, 'Anonymous users cannot insert directly into orders table');
reset role;

set local role authenticated;
select throws_ok(
  $$ insert into orders (location_id, customer_name, customer_phone, requested_pickup_at)
     values ((select loc from ctx), 'Attacker', '9845000001', (select pickup from ctx)) $$,
  '42501', null, 'Authenticated users cannot insert directly into orders table');

select throws_ok(
  $$ update orders set total_paise = 0 $$,
  '42501', null, 'Customers cannot modify order total or prices directly');

select throws_ok(
  $$ delete from orders $$,
  '42501', null, 'Customers cannot delete orders');
reset role;

-- 10-11: Token lookup security
set local role service_role;
select is(
  (select find_order_token('NB1001', '9845099999')),
  null,
  'Order lookup returns NULL when phone number does not match');

select is(
  (select get_order_by_token('non-existent-token-value-00000000000000000000000000000000000000')),
  null,
  'Order tracking returns NULL when token does not exist');
reset role;

select * from finish();
rollback;
