-- Migration: 0007_grant_service_role_custom_cakes.sql
-- Grant required privileges on custom cake tables to service_role so server-side actions
-- (like getCustomCakePublicViewAction and submitCustomCakeRequestAction) can query
-- enquiry details and record attached reference photos.

grant select on table public.custom_cake_requests to service_role;
grant select, insert on table public.custom_cake_images to service_role;
grant select on table public.custom_cake_quotes to service_role;
grant select on table public.request_messages to service_role;
