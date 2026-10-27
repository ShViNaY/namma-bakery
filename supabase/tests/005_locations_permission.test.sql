-- Run with: supabase test db
-- Step 005: Verify service_role permissions on public.locations
-- Verifies:
-- 1. service_role has SELECT privilege on public.locations.
-- 2. service_role can query active locations by slug without error.
-- 3. anon role retains SELECT privilege on public.locations.
-- 4. authenticated role retains SELECT privilege on public.locations.

begin;
select plan(4);

-- 1. service_role has SELECT privilege on public.locations
select ok(
  has_table_privilege('service_role', 'public.locations', 'SELECT'),
  'service_role has SELECT privilege on public.locations'
);

-- 2. service_role can select active location by slug without throwing permission denied (42501)
set local role service_role;
select lives_ok(
  $$ select id, slug, is_active from public.locations where slug = 'namma-bakery-rr-nagar' and is_active = true $$,
  'service_role can query active location by slug without permission error'
);
reset role;

-- 3. anon role retains SELECT privilege on public.locations
select ok(
  has_table_privilege('anon', 'public.locations', 'SELECT'),
  'anon role retains SELECT privilege on public.locations'
);

-- 4. authenticated role retains SELECT privilege on public.locations
select ok(
  has_table_privilege('authenticated', 'public.locations', 'SELECT'),
  'authenticated role retains SELECT privilege on public.locations'
);

select * from finish();
rollback;
