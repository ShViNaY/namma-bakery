-- Namma Bakery: Function Security & Search Path Hardening
-- Migration: 0005_harden_function_security.sql
--
-- Addresses Supabase Security Advisor findings:
-- 1. "Public Can Execute SECURITY DEFINER Function" for:
--    - public.available_slots(uuid, date, integer)
--    - public.is_admin()
--    - public.is_staff()
-- 2. "Function Search Path Mutable" for:
--    - public.set_updated_at()
--    - public.enforce_variant_product_kind()
--    - public.slot_start(timestamptz, integer, text)
--
-- Security Analysis & Access Model:
-- - In PostgreSQL, the 'PUBLIC' pseudo-role represents every database role.
--   Supabase separates unauthenticated callers ('anon'), authenticated callers ('authenticated'),
--   and server-side operations ('service_role').
--
-- - public.is_admin():
--   RLS audit confirms that all policies checking is_admin() are defined 'to authenticated'
--   (store settings, audit logs, staff roles, product/category/price management).
--   No anonymous RLS policy or client application call depends on is_admin().
--   Action: Revoke EXECUTE from PUBLIC and anon. Retain authenticated and service_role.
--
-- - public.is_staff():
--   Public storefront RLS policies ('categories_read', 'products_read', 'variants_read', 'rules_read')
--   are defined 'to anon, authenticated' with expressions like:
--   ((is_visible and archived_at is null) or is_staff())
--   When anonymous users browse the catalog, PostgreSQL evaluates this policy under the 'anon' role.
--   If EXECUTE is revoked from 'anon', catalog browsing fails with permission denied errors.
--   Action: Revoke EXECUTE from the database pseudo-role 'PUBLIC'. Retain explicit grant to 'anon',
--   'authenticated', and 'service_role'.
--
-- - public.available_slots(uuid, date, integer):
--   Required during checkout by both anonymous guests and logged-in customers to select pickup slots.
--   The function returns only slot timestamps and remaining slot counts, without exposing
--   internal capacity thresholds.
--   Action: Revoke EXECUTE from PUBLIC. Retain explicit grant to 'anon', 'authenticated', and 'service_role'.
--
-- - public.current_actor_role():
--   Used for audit logs and order workflow. Anonymous callers do not need direct execution.
--   Action: Revoke EXECUTE from PUBLIC and anon. Retain authenticated and service_role.
--
-- - Search path pinning:
--   Enforce 'set search_path = '''' on set_updated_at, enforce_variant_product_kind, and slot_start,
--   using schema-qualified references to prevent search-path injection while preserving existing
--   signatures, time calculations, and trigger behavior.

-- ----------------------------------------------------------------
-- 1. Pin mutable function search paths & schema-qualify references
-- ----------------------------------------------------------------

-- Trigger helper: updates updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;


-- Trigger helper: validates variant attachment to SIMPLE products
create or replace function public.enforce_variant_product_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select p.kind from public.products p where p.id = new.product_id) <> 'SIMPLE'::public.product_kind then
    raise exception 'variants are only allowed on SIMPLE products' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_variant_product_kind() from public;


-- Scheduling helper: computes slot boundary aligned to location timezone
create or replace function public.slot_start(p_ts timestamptz, p_minutes integer, p_tz text)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select (date_trunc('day', p_ts at time zone p_tz)
          + make_interval(mins => (floor(extract(epoch from ((p_ts at time zone p_tz) - date_trunc('day', p_ts at time zone p_tz))) / 60 / p_minutes) * p_minutes)::int)
         ) at time zone p_tz
$$;

revoke all on function public.slot_start(timestamptz, integer, text) from public;
grant execute on function public.slot_start(timestamptz, integer, text) to anon, authenticated, service_role;


-- ----------------------------------------------------------------
-- 2. Correct function execution permissions
-- ----------------------------------------------------------------

-- is_admin(): admin authorization check; anonymous execution not permitted
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- is_staff(): evaluated by storefront RLS policies for anonymous & authenticated callers
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to anon, authenticated, service_role;

-- available_slots(): required for public guest & authenticated checkout slot selection
revoke all on function public.available_slots(uuid, date, integer) from public;
grant execute on function public.available_slots(uuid, date, integer) to anon, authenticated, service_role;

-- current_actor_role(): audit & context helper; anonymous execution not permitted
revoke all on function public.current_actor_role() from public, anon;
grant execute on function public.current_actor_role() to authenticated, service_role;
