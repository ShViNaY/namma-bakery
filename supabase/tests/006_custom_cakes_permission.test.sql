-- Run with: supabase test db
-- Step 006: Verify service_role permissions on custom cake tables
-- Verifies:
-- 1. service_role has SELECT privilege on public.custom_cake_requests.
-- 2. service_role has SELECT and INSERT privilege on public.custom_cake_images.
-- 3. service_role has SELECT privilege on public.custom_cake_quotes.
-- 4. service_role has SELECT privilege on public.request_messages.

begin;
select plan(5);

select ok(
  has_table_privilege('service_role', 'public.custom_cake_requests', 'SELECT'),
  'service_role has SELECT privilege on public.custom_cake_requests'
);

select ok(
  has_table_privilege('service_role', 'public.custom_cake_images', 'SELECT'),
  'service_role has SELECT privilege on public.custom_cake_images'
);

select ok(
  has_table_privilege('service_role', 'public.custom_cake_images', 'INSERT'),
  'service_role has INSERT privilege on public.custom_cake_images'
);

select ok(
  has_table_privilege('service_role', 'public.custom_cake_quotes', 'SELECT'),
  'service_role has SELECT privilege on public.custom_cake_quotes'
);

select ok(
  has_table_privilege('service_role', 'public.request_messages', 'SELECT'),
  'service_role has SELECT privilege on public.request_messages'
);

select * from finish();
rollback;
