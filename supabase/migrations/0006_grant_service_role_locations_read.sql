-- Migration: 0006_grant_service_role_locations_read.sql
-- Grant SELECT on public.locations to service_role so server-side actions
-- (order placement, custom cake submissions) can resolve active bakery location details.

grant select on table public.locations to service_role;
