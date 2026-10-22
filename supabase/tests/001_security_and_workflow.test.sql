-- Run with: supabase test db
-- Mirrors the assertions that were verified against Postgres 16 with plain psql.
begin;
select plan(16);

-- fixtures (run as superuser)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'cust-a@test'),
  ('00000000-0000-0000-0000-0000000000b2', 'cust-b@test'),
  ('00000000-0000-0000-0000-0000000000e3', 'employee@test'),
  ('00000000-0000-0000-0000-0000000000d4', 'admin@test');
insert into staff_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000e3', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-0000000000d4', 'ADMIN');

create temp table ctx as
select (select id from locations limit 1) as loc,
       ((date_trunc('day', now() at time zone 'Asia/Kolkata') + interval '3 days 12 hours') at time zone 'Asia/Kolkata') as pickup;
grant select on ctx to anon, authenticated, service_role;

create temp table first_order (
  order_number text
);
grant all on first_order to anon, authenticated, service_role;

-- helper: place a Black Forest 1 kg eggless order for a customer (server-side, as service_role)
create function pg_temp.place(p_customer uuid, p_phone text) returns text language sql as $$
  select order_number from place_order((select loc from ctx), p_customer, 'Test Customer', p_phone, null, (select pickup from ctx), null,
    (select jsonb_build_array(jsonb_build_object('product_id', id, 'weight_grams', 1000, 'egg_type', 'EGGLESS', 'quantity', 1)) from products where slug = 'black-forest'))
$$;
grant execute on function pg_temp.place(uuid, text) to service_role;

-- 1-3: server-side pricing and unavailable products
set local role service_role;
insert into first_order (order_number)
values (pg_temp.place('00000000-0000-0000-0000-0000000000a1', '9845000001'));
select matches((select order_number from first_order), '^NB[0-9]+$', 'order placed through place_order');
select is((select total_paise from orders where order_number = (select order_number from first_order)), 70000, 'price comes from the database (Black Forest, 1 kg, eggless = 700)');
select throws_ok(
  $$ select place_order((select loc from ctx), null, 'Test Customer', '9845000009', null, (select pickup from ctx), null,
       (select jsonb_build_array(jsonb_build_object('product_id', id, 'variant_id', (select id from product_variants where product_id = products.id limit 1), 'quantity', 1)) from products where slug = 'tomato-soup')) $$,
  'PRODUCT_UNAVAILABLE: Tomato Soup', 'products not orderable online are rejected');
reset role;

-- 4-6: customers cannot see other customers' data; anon sees no orders
select pg_temp.place('00000000-0000-0000-0000-0000000000b2', '9845000002') is not null;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select is((select count(*) from orders), 1::bigint, 'customer A sees only their own order');
select is((select count(*) from order_internal_notes), 0::bigint, 'customer cannot read internal notes');
reset role;
set local role anon;
select is((select count(*) from orders), 0::bigint, 'anonymous users see no orders');
reset role;

-- 7-9: employee boundaries
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e3', true);
select is((select count(*) from orders), 2::bigint, 'employee sees all orders');
select is((select count(*) from audit_logs), 0::bigint, 'employee cannot read audit logs');
with u as (update price_tier_rules set price_paise = 1 returning 1)
select is((select count(*) from u), 0::bigint, 'employee cannot change prices');
select throws_ok($$ insert into staff_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000a1', 'ADMIN') $$, '42501', null, 'employee cannot grant roles');

-- 10-12: state machine
select throws_ok(
  $$ select transition_order((select id from orders where order_number = (select order_number from first_order)), 'ACCEPTED') $$,
  'ESTIMATED_READY_TIME_REQUIRED', 'acceptance requires an estimated ready time');
select is((select status::text from transition_order((select id from orders where order_number = (select order_number from first_order)), 'ACCEPTED', null, (select pickup from ctx))), 'ACCEPTED', 'employee can accept a pending order');
select throws_ok(
  $$ select transition_order((select id from orders where order_number = (select order_number from first_order)), 'COMPLETED') $$,
  'INVALID_TRANSITION: ACCEPTED -> COMPLETED', 'invalid jump is refused');
reset role;

-- 13-14: customers and employees cannot call server-only functions
set local role authenticated;
select throws_ok($$ select place_order((select loc from ctx), null, 'X Y', '9845000003', null, (select pickup from ctx), null, '[]') $$,
  '42501', null, 'place_order is not callable from the browser role');
reset role;

-- 15-16: admin and last-admin protection
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d4', true);
update price_tier_rules set price_paise = price_paise + 5000 where id = (select id from price_tier_rules limit 1);
select ok((select count(*) from audit_logs where entity_type = 'price_tier_rules') > 0, 'admin price change is audit-logged');
reset role;
select throws_ok($$ delete from staff_roles where user_id = '00000000-0000-0000-0000-0000000000d4' $$,
  'cannot remove the last active admin', 'the last admin cannot be removed');

select * from finish();
rollback;
