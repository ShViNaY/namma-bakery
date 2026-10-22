-- Namma Bakery: row level security, function grants, storage.
-- Principle: deny by default. Every table has RLS on; writes to orders/requests happen only via functions.

-- ---------------------------------------------------------------- enable RLS everywhere
alter table locations             enable row level security;
alter table business_hours        enable row level security;
alter table special_closures      enable row level security;
alter table store_settings        enable row level security;
alter table profiles              enable row level security;
alter table staff_roles           enable row level security;
alter table categories            enable row level security;
alter table price_tiers           enable row level security;
alter table price_tier_rules      enable row level security;
alter table products              enable row level security;
alter table product_images        enable row level security;
alter table product_variants      enable row level security;
alter table custom_cake_requests  enable row level security;
alter table custom_cake_images    enable row level security;
alter table custom_cake_quotes    enable row level security;
alter table request_messages      enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table order_transitions     enable row level security;
alter table order_status_history  enable row level security;
alter table order_internal_notes  enable row level security;
alter table payments              enable row level security;
alter table audit_logs            enable row level security;
alter table notifications         enable row level security;

-- ---------------------------------------------------------------- public reads (catalog, store info)
create policy locations_read  on locations        for select to anon, authenticated using (is_active);
create policy hours_read      on business_hours   for select to anon, authenticated using (true);
create policy closures_read   on special_closures for select to anon, authenticated using (true);
create policy categories_read on categories       for select to anon, authenticated using ((is_visible and archived_at is null) or is_staff());
create policy tiers_read      on price_tiers      for select to anon, authenticated using (true);
create policy rules_read      on price_tier_rules for select to anon, authenticated using (is_active or is_staff());
create policy products_read   on products         for select to anon, authenticated using (archived_at is null or is_staff());
create policy images_read     on product_images   for select to anon, authenticated using (true);
create policy variants_read   on product_variants for select to anon, authenticated using (archived_at is null or is_staff());

-- Store settings contain capacity numbers: staff only. The public sees only pause state via a view.
create policy settings_staff_read on store_settings for select to authenticated using (is_staff());
create view public_store_status as
  select location_id, orders_paused_until, pause_message, slot_minutes from store_settings;   -- owner-run view (intentional)

-- ---------------------------------------------------------------- admin-only writes to catalog and configuration
create policy locations_admin_all   on locations        for all to authenticated using (is_admin()) with check (is_admin());
create policy hours_admin_all       on business_hours   for all to authenticated using (is_admin()) with check (is_admin());
create policy closures_admin_all    on special_closures for all to authenticated using (is_admin()) with check (is_admin());
create policy settings_admin_all    on store_settings   for all to authenticated using (is_admin()) with check (is_admin());
create policy categories_admin_all  on categories       for all to authenticated using (is_admin()) with check (is_admin());
create policy tiers_admin_all       on price_tiers      for all to authenticated using (is_admin()) with check (is_admin());
create policy rules_admin_all       on price_tier_rules for all to authenticated using (is_admin()) with check (is_admin());
create policy products_admin_all    on products         for all to authenticated using (is_admin()) with check (is_admin());
create policy images_admin_all      on product_images   for all to authenticated using (is_admin()) with check (is_admin());
create policy variants_admin_all    on product_variants for all to authenticated using (is_admin()) with check (is_admin());
-- Employees toggle availability through set_product_availability(); they have no direct write policy.

-- ---------------------------------------------------------------- people
create policy profiles_own_read   on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy profiles_own_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy staff_roles_read  on staff_roles for select to authenticated using (user_id = auth.uid() or is_admin());
create policy staff_roles_admin on staff_roles for all    to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- orders (no insert/update/delete policies: functions only)
create policy orders_read on orders for select to authenticated using (customer_id = auth.uid() or is_staff());
create policy order_items_read on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_staff())));
create policy order_history_read on order_status_history for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_staff())));
create policy transitions_read on order_transitions for select to authenticated using (is_staff());

create policy internal_notes_read   on order_internal_notes for select to authenticated using (is_staff());
create policy internal_notes_insert on order_internal_notes for insert to authenticated with check (is_staff() and author_id = auth.uid());

create policy payments_read on payments for select to authenticated using (is_staff());

-- ---------------------------------------------------------------- custom cakes
create policy requests_read on custom_cake_requests for select to authenticated using (customer_id = auth.uid() or is_staff());
create policy request_images_read on custom_cake_images for select to authenticated
  using (exists (select 1 from custom_cake_requests r where r.id = request_id and (r.customer_id = auth.uid() or is_staff())));
create policy quotes_read on custom_cake_quotes for select to authenticated
  using (exists (select 1 from custom_cake_requests r where r.id = request_id and (r.customer_id = auth.uid() or is_staff())));
create policy request_messages_read on request_messages for select to authenticated
  using (exists (select 1 from custom_cake_requests r where r.id = request_id and (r.customer_id = auth.uid() or is_staff())));

-- ---------------------------------------------------------------- admin-only
create policy audit_admin_read on audit_logs for select to authenticated using (is_admin());
create policy notifications_staff_read on notifications for select to authenticated using (is_staff());
---------------------------------------------------------------- table grants

-- Browser roles must not have unrestricted direct table writes.
-- RLS controls which rows can be read/updated; table grants control
-- which operations the browser roles can attempt.

revoke all on all tables in schema public from anon, authenticated;

grant select on all tables in schema public to anon, authenticated;

-- Users may update their own profile; the profiles RLS policy
-- restricts the update to the authenticated user's own row.
grant update on public.profiles to authenticated;

-- Staff may insert internal notes; RLS restricts to staff.
grant insert on public.order_internal_notes to authenticated;

-- Admin-managed tables: authenticated needs table grants so that admin RLS policies apply.
grant insert, update, delete on
  public.locations,
  public.business_hours,
  public.special_closures,
  public.store_settings,
  public.categories,
  public.price_tiers,
  public.price_tier_rules,
  public.products,
  public.product_images,
  public.product_variants,
  public.staff_roles
to authenticated;

-- Future tables should default to read-only browser access.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
-- ---------------------------------------------------------------- function grants
-- Start from nothing: functions are executable by PUBLIC by default in Postgres.
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- needed inside RLS policies, evaluated for any role
grant execute on function is_staff(), is_admin() to anon, authenticated, service_role;
grant execute on function current_actor_role() to authenticated, service_role;
-- public read helper (returns only slot times and remaining counts)
grant execute on function available_slots(uuid, date, int) to anon, authenticated, service_role;
grant execute on function slot_start(timestamptz, int, text) to anon, authenticated, service_role;

-- staff operations (role is re-checked inside each function)
grant execute on function
  transition_order(uuid, order_status, text, timestamptz), record_store_payment(uuid, int),
  set_product_availability(uuid, boolean), set_variant_availability(uuid, boolean), set_orders_pause(uuid, timestamptz, text),
  staff_review_request(uuid, request_status, text), staff_send_quote(uuid, int, int, timestamptz, text),
  post_request_message_staff(uuid, text)
  to authenticated, service_role;

-- customer / guest operations: server only (service_role). Never callable from the browser.
grant execute on function
  place_order(uuid, uuid, text, text, text, timestamptz, text, jsonb),
  get_order_by_token(text), find_order_token(text, text), customer_cancel_order(text, text),
  submit_custom_request(uuid, uuid, text, text, text, text, egg_type, int, text, text, text, text, timestamptz, text),
  get_request_by_token(text), post_request_message_customer(text, text),
  customer_accept_quote(text), customer_decline_quote(text), expire_stale_quotes(),
  slot_order_count(uuid, timestamptz, int, uuid)
  to service_role;

grant select on public_store_status to anon, authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('cake-references', 'cake-references', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Product images: public read (bucket is public), admin write.
create policy product_images_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- Cake reference images: private. Staff may read; customers/guests are served short-lived signed URLs by the server.
-- Uploads are made by the server (service_role) after validating type, size and re-encoding the image.
create policy cake_refs_staff_read on storage.objects for select to authenticated using (bucket_id = 'cake-references' and public.is_staff());
