-- Fix for Supabase Security Advisor finding:
-- public.public_store_status - Security Definer View
--
-- Context:
-- In migration 0003, public_store_status was created as a standard Postgres view
-- over store_settings. By default in PostgreSQL, views run as the view owner (SECURITY DEFINER).
-- Supabase Security Advisor flags this because views in the public schema without
-- security_invoker = true bypass RLS on underlying tables.
--
-- Cause & Security Evaluation:
-- 1. Simply setting `security_invoker = true` on a view that queries store_settings directly
--    breaks public access: store_settings has RLS enabled with a staff-only SELECT policy
--    (settings_staff_read). Anonymous (anon) and customer (authenticated) users would receive
--    0 rows, breaking the store pause status, pause message, and slot duration checks.
-- 2. Adding a public SELECT RLS policy on store_settings would expose sensitive internal
--    capacity numbers and operational thresholds (max_orders_per_slot, max_custom_per_day,
--    quote_validity_hours, cancel_cutoff_hours, pending_alert_minutes, max_open_orders_per_phone)
--    to any client querying store_settings directly.
--
-- Hardened Architecture:
-- 1. Create a non-exposed `private` schema. PostgREST / Supabase Data API only exposes
--    schemas listed in db_schemas ('public', 'storage'). Placing internal helper functions
--    in `private` prevents them from being exposed as callable RPC endpoints (/rest/v1/rpc/...).
-- 2. Grant USAGE on schema `private` to anon, authenticated, and service_role so the invoker
--    view can resolve the function call.
-- 3. Define `private.get_public_store_status()` as a SECURITY DEFINER function with:
--    - `STABLE` volatility (reads table data; must not be IMMUTABLE).
--    - `SET search_path = ''` to prevent search path injection attacks.
--    - Fully schema-qualified references (public.store_settings).
--    - Projection of only the minimum public-safe columns: location_id, orders_paused_until,
--      pause_message, slot_minutes.
-- 4. Recreate `public.public_store_status` with `WITH (security_invoker = true)` selecting from
--    `private.get_public_store_status()`.
-- 5. Grant SELECT on `public.public_store_status` to anon and authenticated.

-- 1. Isolated private schema for internal helpers
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- 2. Hardened helper function
create or replace function private.get_public_store_status()
returns table (
  location_id uuid,
  orders_paused_until timestamptz,
  pause_message text,
  slot_minutes int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.location_id,
    s.orders_paused_until,
    s.pause_message,
    s.slot_minutes
  from public.store_settings s;
$$;

revoke all on function private.get_public_store_status() from public;
grant execute on function private.get_public_store_status() to anon, authenticated, service_role;

-- 3. Recreate public view with security_invoker = true
drop view if exists public.public_store_status;

create view public.public_store_status
with (security_invoker = true) as
  select
    location_id,
    orders_paused_until,
    pause_message,
    slot_minutes
  from private.get_public_store_status();

grant select on public.public_store_status to anon, authenticated;
