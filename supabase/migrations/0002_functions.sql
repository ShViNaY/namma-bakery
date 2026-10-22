-- Namma Bakery: business logic in the database (atomic, race-safe).
-- Customer/guest-facing functions are executable ONLY by service_role (the Next.js server);
-- staff functions are executable by authenticated users and check the role inside.
-- Grants are in 0003.

-- ---------------------------------------------------------------- role helpers
create function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and is_active)
$$;
create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and is_active and role = 'ADMIN')
$$;
create function current_actor_role() returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role::text from staff_roles where user_id = auth.uid() and is_active),
                  case when auth.uid() is null then 'SYSTEM' else 'CUSTOMER' end)
$$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', '')) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- never leave the system without an active admin
create function protect_last_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' or new.role <> 'ADMIN' or not new.is_active) and old.role = 'ADMIN' and old.is_active then
    if (select count(*) from staff_roles where role = 'ADMIN' and is_active and user_id <> old.user_id) = 0 then
      raise exception 'cannot remove the last active admin' using errcode = 'P0001';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_protect_last_admin before update or delete on staff_roles for each row execute function protect_last_admin();

-- ---------------------------------------------------------------- audit trigger
create function audit_row_change() returns trigger language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(coalesce(new, old));
begin
  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), current_actor_role(), tg_table_name || '.' || lower(tg_op), tg_table_name,
          coalesce(j->>'id', j->>'user_id', j->>'location_id'),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_price_rules after insert or update or delete on price_tier_rules for each row execute function audit_row_change();
create trigger audit_variants    after insert or update or delete on product_variants for each row execute function audit_row_change();
create trigger audit_products    after insert or update or delete on products          for each row execute function audit_row_change();
create trigger audit_categories  after insert or update or delete on categories        for each row execute function audit_row_change();
create trigger audit_staff_roles after insert or update or delete on staff_roles       for each row execute function audit_row_change();
create trigger audit_settings    after insert or update or delete on store_settings    for each row execute function audit_row_change();
create trigger audit_hours       after insert or update or delete on business_hours    for each row execute function audit_row_change();
create trigger audit_closures    after insert or update or delete on special_closures  for each row execute function audit_row_change();

-- ---------------------------------------------------------------- scheduling helpers
-- Start of the slot containing ts, aligned to the location's local clock.
create function slot_start(p_ts timestamptz, p_minutes int, p_tz text) returns timestamptz
language sql immutable as $$
  select (date_trunc('day', p_ts at time zone p_tz)
          + make_interval(mins => (floor(extract(epoch from ((p_ts at time zone p_tz) - date_trunc('day', p_ts at time zone p_tz))) / 60 / p_minutes) * p_minutes)::int)
         ) at time zone p_tz
$$;

create function slot_order_count(p_location uuid, p_slot_start timestamptz, p_minutes int, p_exclude uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from orders
  where location_id = p_location
    and status in ('PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP')
    and coalesce(confirmed_pickup_at, requested_pickup_at) >= p_slot_start
    and coalesce(confirmed_pickup_at, requested_pickup_at) <  p_slot_start + make_interval(mins => p_minutes)
    and (p_exclude is null or id <> p_exclude)
$$;

create function available_slots(p_location uuid, p_date date, p_min_lead_minutes int default 0)
returns table (slot_start timestamptz, remaining int)
language sql stable security definer set search_path = public as $$
  select gs, greatest(s.max_orders_per_slot - slot_order_count(p_location, gs, s.slot_minutes), 0)
  from locations l
  join store_settings s on s.location_id = l.id
  join business_hours bh on bh.location_id = l.id and bh.weekday = extract(dow from p_date)::int
  cross join lateral generate_series(
      (p_date + bh.opens) at time zone l.timezone,
      (p_date + bh.closes) at time zone l.timezone - make_interval(mins => s.slot_minutes),
      make_interval(mins => s.slot_minutes)) gs
  where l.id = p_location and l.is_active
    and not exists (select 1 from special_closures c where c.location_id = l.id and c.closure_date = p_date)
    and gs >= now() + make_interval(mins => p_min_lead_minutes)
  order by gs
$$;

-- ---------------------------------------------------------------- place_order (service_role only)
create function place_order(
  p_location_id uuid, p_customer_id uuid, p_name text, p_phone text, p_email text,
  p_pickup timestamptz, p_notes text, p_items jsonb)
returns table (order_id uuid, order_number text, public_token text)
language plpgsql security definer set search_path = public as $$
declare
  loc locations; s store_settings; prod products; rule price_tier_rules; var product_variants;
  it jsonb; o orders;
  v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
  v_qty int; v_unit int; v_label text; v_egg egg_type; v_fin cake_finish; v_w int;
  v_total int := 0; v_lead int := 0; v_local timestamp;
begin
  if p_name is null or char_length(trim(p_name)) not between 2 and 80 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^\+?[0-9]{10,13}$' then raise exception 'INVALID_PHONE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'INVALID_ITEMS'; end if;

  select * into loc from locations where id = p_location_id and is_active;
  if not found then raise exception 'LOCATION_NOT_FOUND'; end if;

  -- serialise concurrent orders for this location (prevents two customers taking the last slot)
  select * into s from store_settings where location_id = p_location_id for update;
  if not found then raise exception 'LOCATION_NOT_CONFIGURED'; end if;

  if s.orders_paused_until is not null and s.orders_paused_until > now() then raise exception 'ORDERS_PAUSED'; end if;

  if (select count(*) from orders where customer_phone = v_phone and status = 'PENDING') >= s.max_open_orders_per_phone then
    raise exception 'TOO_MANY_OPEN_ORDERS';
  end if;

  v_local := p_pickup at time zone loc.timezone;
  if exists (select 1 from special_closures where location_id = loc.id and closure_date = v_local::date) then raise exception 'CLOSED_DAY'; end if;
  if not exists (select 1 from business_hours where location_id = loc.id and weekday = extract(dow from v_local)::int
                 and v_local::time >= opens and v_local::time < closes) then
    raise exception 'OUTSIDE_OPENING_HOURS';
  end if;

  insert into orders (location_id, customer_id, customer_name, customer_phone, customer_email, requested_pickup_at, customer_notes)
  values (loc.id, p_customer_id, trim(p_name), v_phone, nullif(trim(coalesce(p_email,'')), ''), p_pickup, nullif(trim(coalesce(p_notes,'')), ''))
  returning * into o;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it->>'quantity')::int;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'INVALID_QUANTITY'; end if;

    select * into prod from products where id = (it->>'product_id')::uuid and archived_at is null;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if not prod.is_available or not prod.orderable_online then raise exception 'PRODUCT_UNAVAILABLE: %', prod.name; end if;

    rule := null; var := null; v_egg := null; v_fin := null; v_w := null;
    if prod.kind = 'TIERED_CAKE' then
      v_w   := (it->>'weight_grams')::int;
      v_egg := (it->>'egg_type')::egg_type;
      v_fin := coalesce(it->>'finish', 'STANDARD')::cake_finish;
      select * into rule from price_tier_rules
       where tier_id = prod.price_tier_id and weight_grams = v_w and egg_type = v_egg and finish = v_fin and is_active;
      if not found then raise exception 'OPTION_NOT_AVAILABLE: %', prod.name; end if;
      v_unit := rule.price_paise;
      v_label := (v_w::numeric / 1000)::text || ' kg, ' || lower(v_egg::text) || case when v_fin <> 'STANDARD' then ', ' || replace(lower(v_fin::text),'_',' ') else '' end;
    else
      select * into var from product_variants
       where id = (it->>'variant_id')::uuid and product_id = prod.id and is_available and archived_at is null;
      if not found then raise exception 'OPTION_NOT_AVAILABLE: %', prod.name; end if;
      v_unit := var.price_paise; v_label := var.label;
    end if;

    insert into order_items (order_id, product_id, variant_id, price_rule_id, product_name, variant_label, egg_type, finish,
                             weight_grams, unit_price_paise, quantity, cake_message)
    values (o.id, prod.id, var.id, rule.id, prod.name, v_label, v_egg, v_fin, v_w, v_unit, v_qty,
            nullif(left(trim(coalesce(it->>'cake_message','')), 60), ''));

    v_total := v_total + v_unit * v_qty;
    v_lead  := greatest(v_lead, prod.lead_time_minutes);
  end loop;

  if p_pickup < now() + make_interval(mins => v_lead) then raise exception 'LEAD_TIME_NOT_MET'; end if;
  if slot_order_count(loc.id, slot_start(p_pickup, s.slot_minutes, loc.timezone), s.slot_minutes, o.id) >= s.max_orders_per_slot then
    raise exception 'SLOT_FULL';
  end if;

  update orders set total_paise = v_total where id = o.id returning * into o;
  insert into order_status_history (order_id, from_status, to_status, changed_by, actor_role, note)
  values (o.id, null, 'PENDING', p_customer_id, 'CUSTOMER', 'Order placed');

  return query select o.id, o.order_number, o.public_token;
end $$;

-- ---------------------------------------------------------------- order state machine (staff)
create function transition_order(p_order_id uuid, p_to order_status, p_note text default null, p_estimated_ready_at timestamptz default null)
returns orders language plpgsql security definer set search_path = public as $$
declare o orders; t order_transitions; v_admin boolean := is_admin(); v_role text := current_actor_role(); v_from order_status; v_override boolean := false;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  v_from := o.status;

  select * into t from order_transitions where from_status = o.status and to_status = p_to;
  if not found then
    if not v_admin or nullif(trim(coalesce(p_note,'')), '') is null then
      raise exception 'INVALID_TRANSITION: % -> %', o.status, p_to using errcode = 'P0001';
    end if;                                   -- admin override: requires a reason
    v_override := true;
  elsif t.admin_only and not v_admin then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;

  if p_to in ('REJECTED','CANCELLED') and nullif(trim(coalesce(p_note,'')), '') is null then
    raise exception 'REASON_REQUIRED' using errcode = 'P0001';
  end if;
  if p_to = 'ACCEPTED' and coalesce(p_estimated_ready_at, o.estimated_ready_at) is null then
    raise exception 'ESTIMATED_READY_TIME_REQUIRED' using errcode = 'P0001';
  end if;

  update orders set
    status = p_to,
    estimated_ready_at  = coalesce(p_estimated_ready_at, estimated_ready_at),
    confirmed_pickup_at = case when p_to = 'ACCEPTED' then coalesce(confirmed_pickup_at, requested_pickup_at) else confirmed_pickup_at end,
    rejection_reason    = case when p_to = 'REJECTED'  then p_note else rejection_reason end,
    cancellation_reason = case when p_to = 'CANCELLED' then p_note else cancellation_reason end,
    cancelled_by        = case when p_to = 'CANCELLED' then v_role else cancelled_by end,
    completed_at        = case when p_to = 'COMPLETED' then now() else completed_at end
  where id = o.id returning * into o;

  insert into order_status_history (order_id, from_status, to_status, changed_by, actor_role, note)
  values (o.id, v_from, p_to, auth.uid(), v_role, p_note);

  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, after_data)
  values (auth.uid(), v_role, 'order.status_changed', 'orders', o.id::text,
          jsonb_build_object('order_number', o.order_number, 'to', p_to, 'note', p_note, 'from', v_from, 'override', v_override));
  return o;
end $$;

create function record_store_payment(p_order_id uuid, p_amount_paise int) returns payments
language plpgsql security definer set search_path = public as $$
declare o orders; pay payments;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status not in ('READY_FOR_PICKUP','COMPLETED') then raise exception 'ORDER_NOT_READY_FOR_PAYMENT' using errcode = 'P0001'; end if;
  if o.payment_status = 'paid' then raise exception 'ALREADY_PAID' using errcode = 'P0001'; end if;
  if p_amount_paise is null or p_amount_paise < 0 then raise exception 'INVALID_AMOUNT'; end if;
  insert into payments (order_id, provider, method, status, amount_paise, recorded_by)
  values (o.id, 'in_store', 'pay_at_store', 'paid', p_amount_paise, auth.uid()) returning * into pay;
  update orders set payment_status = 'paid' where id = o.id;
  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, after_data)
  values (auth.uid(), current_actor_role(), 'order.payment_recorded', 'orders', o.id::text, jsonb_build_object('amount_paise', p_amount_paise));
  return pay;
end $$;

-- ---------------------------------------------------------------- guest/customer order access (service_role only)
create function get_order_by_token(p_token text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'status', o.status,
    'first_name', split_part(o.customer_name, ' ', 1),
    'requested_pickup_at', o.requested_pickup_at, 'confirmed_pickup_at', o.confirmed_pickup_at,
    'estimated_ready_at', o.estimated_ready_at, 'bakery_note', o.bakery_note,
    'rejection_reason', o.rejection_reason,
    'total_paise', o.total_paise, 'payment_status', o.payment_status, 'payment_method', o.payment_method,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.product_name, 'label', i.variant_label, 'egg_type', i.egg_type,
              'quantity', i.quantity, 'line_total_paise', i.line_total_paise, 'cake_message', i.cake_message)) from order_items i where i.order_id = o.id), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('status', h.to_status, 'at', h.created_at) order by h.created_at)
              from order_status_history h where h.order_id = o.id), '[]'::jsonb))
  from orders o where o.public_token = p_token
$$;

create function find_order_token(p_order_number text, p_phone text) returns text language sql stable security definer set search_path = public as $$
  select o.public_token from orders o
  where o.order_number = upper(trim(p_order_number))
    and right(regexp_replace(o.customer_phone, '[^0-9]', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), 10)
$$;

create function customer_cancel_order(p_token text, p_reason text default null) returns orders
language plpgsql security definer set search_path = public as $$
declare o orders; s store_settings;
begin
  select * into o from orders where public_token = p_token for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  select * into s from store_settings where location_id = o.location_id;
  if o.status not in ('PENDING','ACCEPTED') then raise exception 'CANNOT_CANCEL' using errcode = 'P0001'; end if;
  if now() > coalesce(o.confirmed_pickup_at, o.requested_pickup_at) - make_interval(hours => s.cancel_cutoff_hours) then
    raise exception 'CANCEL_CUTOFF_PASSED' using errcode = 'P0001';
  end if;
  update orders set status = 'CANCELLED', cancelled_by = 'CUSTOMER', cancellation_reason = coalesce(nullif(trim(p_reason),''), 'Cancelled by customer')
   where id = o.id returning * into o;
  insert into order_status_history (order_id, from_status, to_status, actor_role, note)
  values (o.id, case when o.confirmed_pickup_at is null then 'PENDING'::order_status else 'ACCEPTED'::order_status end, 'CANCELLED', 'CUSTOMER', p_reason);
  return o;
end $$;

-- ---------------------------------------------------------------- staff catalog / settings helpers
create function set_product_availability(p_product_id uuid, p_available boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  update products set is_available = p_available where id = p_product_id;
end $$;

create function set_variant_availability(p_variant_id uuid, p_available boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  update product_variants set is_available = p_available where id = p_variant_id;
end $$;

-- Employees may pause only until the end of today (local time); admins can pause longer.
create function set_orders_pause(p_location_id uuid, p_until timestamptz, p_message text default null) returns void
language plpgsql security definer set search_path = public as $$
declare tz text; eod timestamptz;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select timezone into tz from locations where id = p_location_id;
  eod := (date_trunc('day', now() at time zone tz) + interval '1 day') at time zone tz;
  if not is_admin() and p_until is not null and p_until > eod then raise exception 'forbidden: employees can pause until end of day only' using errcode = '42501'; end if;
  update store_settings set orders_paused_until = p_until, pause_message = p_message where location_id = p_location_id;
end $$;

-- ---------------------------------------------------------------- custom cake workflow
create function submit_custom_request(
  p_location_id uuid, p_customer_id uuid, p_name text, p_phone text, p_email text,
  p_flavour text, p_egg egg_type, p_weight_grams int, p_shape text, p_cake_type text,
  p_message text, p_description text, p_pickup timestamptz, p_notes text)
returns table (request_id uuid, request_number text, public_token text)
language plpgsql security definer set search_path = public as $$
declare r custom_cake_requests; s store_settings; v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
begin
  if v_phone !~ '^\+?[0-9]{10,13}$' then raise exception 'INVALID_PHONE'; end if;
  select * into s from store_settings where location_id = p_location_id;
  if not found then raise exception 'LOCATION_NOT_CONFIGURED'; end if;
  if s.orders_paused_until is not null and s.orders_paused_until > now() then raise exception 'ORDERS_PAUSED'; end if;
  if (select count(*) from custom_cake_requests where customer_phone = v_phone and status in ('SUBMITTED','UNDER_REVIEW','NEEDS_CLARIFICATION','QUOTED')) >= s.max_open_orders_per_phone then
    raise exception 'TOO_MANY_OPEN_REQUESTS';
  end if;
  insert into custom_cake_requests (location_id, customer_id, customer_name, customer_phone, customer_email, flavour, egg_type, weight_grams,
         shape, cake_type, message_on_cake, description, preferred_pickup_at, additional_notes)
  values (p_location_id, p_customer_id, trim(p_name), v_phone, nullif(trim(coalesce(p_email,'')),''), p_flavour, p_egg, p_weight_grams,
         p_shape, p_cake_type, p_message, p_description, p_pickup, p_notes)
  returning * into r;
  return query select r.id, r.request_number, r.public_token;
end $$;

create function staff_review_request(p_request_id uuid, p_to request_status, p_message text default null) returns custom_cake_requests
language plpgsql security definer set search_path = public as $$
declare r custom_cake_requests;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_to not in ('UNDER_REVIEW','NEEDS_CLARIFICATION','DECLINED') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  select * into r from custom_cake_requests where id = p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if r.status not in ('SUBMITTED','UNDER_REVIEW','NEEDS_CLARIFICATION','QUOTED') then raise exception 'INVALID_TRANSITION: %', r.status using errcode = 'P0001'; end if;
  if p_to in ('NEEDS_CLARIFICATION','DECLINED') and nullif(trim(coalesce(p_message,'')),'') is null then raise exception 'MESSAGE_REQUIRED' using errcode = 'P0001'; end if;
  update custom_cake_requests set status = p_to, decline_reason = case when p_to = 'DECLINED' then p_message else decline_reason end
   where id = r.id returning * into r;
  if nullif(trim(coalesce(p_message,'')),'') is not null then
    insert into request_messages (request_id, sender, staff_id, body) values (r.id, 'STAFF', auth.uid(), left(p_message, 1000));
  end if;
  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, after_data)
  values (auth.uid(), current_actor_role(), 'request.status_changed', 'custom_cake_requests', r.id::text, jsonb_build_object('to', p_to));
  return r;
end $$;

create function staff_send_quote(p_request_id uuid, p_price_paise int, p_prep_minutes int, p_confirmed_pickup timestamptz, p_note text default null)
returns custom_cake_quotes language plpgsql security definer set search_path = public as $$
declare r custom_cake_requests; s store_settings; q custom_cake_quotes;
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into r from custom_cake_requests where id = p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if r.status not in ('UNDER_REVIEW','NEEDS_CLARIFICATION','QUOTED') then raise exception 'INVALID_TRANSITION: %', r.status using errcode = 'P0001'; end if;
  if p_price_paise is null or p_price_paise <= 0 or p_price_paise > 10000000 then raise exception 'INVALID_PRICE'; end if;
  if p_confirmed_pickup < now() + make_interval(mins => greatest(coalesce(p_prep_minutes,0),0)) then raise exception 'PICKUP_BEFORE_READY'; end if;
  select * into s from store_settings where location_id = r.location_id;
  update custom_cake_quotes set superseded_at = now() where request_id = r.id and superseded_at is null;
  insert into custom_cake_quotes (request_id, price_paise, estimated_prep_minutes, confirmed_pickup_at, bakery_note, valid_until, created_by)
  values (r.id, p_price_paise, p_prep_minutes, p_confirmed_pickup, p_note, now() + make_interval(hours => s.quote_validity_hours), auth.uid())
  returning * into q;
  update custom_cake_requests set status = 'QUOTED' where id = r.id;
  insert into audit_logs (actor_id, actor_role, action, entity_type, entity_id, after_data)
  values (auth.uid(), current_actor_role(), 'request.quoted', 'custom_cake_requests', r.id::text, jsonb_build_object('price_paise', p_price_paise));
  return q;
end $$;

create function post_request_message_staff(p_request_id uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into request_messages (request_id, sender, staff_id, body) values (p_request_id, 'STAFF', auth.uid(), p_body);
end $$;

create function post_request_message_customer(p_token text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare r custom_cake_requests;
begin
  select * into r from custom_cake_requests where public_token = p_token;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  insert into request_messages (request_id, sender, body) values (r.id, 'CUSTOMER', p_body);
  if r.status = 'NEEDS_CLARIFICATION' then update custom_cake_requests set status = 'UNDER_REVIEW' where id = r.id; end if;
end $$;

create function get_request_by_token(p_token text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'request_number', r.request_number, 'status', r.status, 'first_name', split_part(r.customer_name,' ',1),
    'flavour', r.flavour, 'egg_type', r.egg_type, 'weight_grams', r.weight_grams, 'message_on_cake', r.message_on_cake,
    'preferred_pickup_at', r.preferred_pickup_at, 'decline_reason', r.decline_reason,
    'quote', (select jsonb_build_object('price_paise', q.price_paise, 'confirmed_pickup_at', q.confirmed_pickup_at,
                'bakery_note', q.bakery_note, 'valid_until', q.valid_until)
              from custom_cake_quotes q where q.request_id = r.id and q.superseded_at is null),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('sender', m.sender, 'body', m.body, 'at', m.created_at) order by m.created_at)
                from request_messages m where m.request_id = r.id), '[]'::jsonb),
    'order_token', (select o.public_token from orders o where o.custom_request_id = r.id))
  from custom_cake_requests r where r.public_token = p_token
$$;

create function customer_accept_quote(p_token text) returns table (order_number text, public_token text)
language plpgsql security definer set search_path = public as $$
declare r custom_cake_requests; q custom_cake_quotes; s store_settings; loc locations; o orders; v_local_date date;
begin
  select * into r from custom_cake_requests where public_token = p_token for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if r.status <> 'QUOTED' then raise exception 'QUOTE_NOT_ACTIVE' using errcode = 'P0001'; end if;
  select * into q from custom_cake_quotes where request_id = r.id and superseded_at is null;
  if not found or q.valid_until < now() then raise exception 'QUOTE_EXPIRED' using errcode = 'P0001'; end if;

  select * into loc from locations where id = r.location_id;
  select * into s from store_settings where location_id = r.location_id for update;     -- serialise capacity checks
  v_local_date := (q.confirmed_pickup_at at time zone loc.timezone)::date;
  if (select count(*) from orders where location_id = r.location_id and custom_request_id is not null
        and status in ('PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP')
        and (coalesce(confirmed_pickup_at, requested_pickup_at) at time zone loc.timezone)::date = v_local_date) >= s.max_custom_per_day then
    raise exception 'DAY_FULL' using errcode = 'P0001';
  end if;

  insert into orders (location_id, customer_id, customer_name, customer_phone, customer_email, status, requested_pickup_at,
                      confirmed_pickup_at, estimated_ready_at, total_paise, customer_notes, bakery_note, custom_request_id)
  values (r.location_id, r.customer_id, r.customer_name, r.customer_phone, r.customer_email, 'ACCEPTED', q.confirmed_pickup_at,
          q.confirmed_pickup_at, q.confirmed_pickup_at, q.price_paise, left(r.additional_notes, 500), q.bakery_note, r.id)
  returning * into o;
  insert into order_items (order_id, product_name, variant_label, egg_type, weight_grams, unit_price_paise, quantity, cake_message)
  values (o.id, 'Custom cake: ' || r.flavour, (r.weight_grams::numeric / 1000)::text || ' kg, ' || lower(r.egg_type::text), r.egg_type, r.weight_grams, q.price_paise, 1, r.message_on_cake);
  insert into order_status_history (order_id, from_status, to_status, actor_role, note) values (o.id, null, 'ACCEPTED', 'CUSTOMER', 'Quote accepted');
  update custom_cake_requests set status = 'CUSTOMER_ACCEPTED' where id = r.id;
  return query select o.order_number, o.public_token;
end $$;

create function customer_decline_quote(p_token text) returns void language plpgsql security definer set search_path = public as $$
begin
  update custom_cake_requests set status = 'CUSTOMER_DECLINED' where public_token = p_token and status = 'QUOTED';
  if not found then raise exception 'QUOTE_NOT_ACTIVE' using errcode = 'P0001'; end if;
end $$;

-- Run on a schedule (Vercel cron / pg_cron): expires quotes past valid_until.
create function expire_stale_quotes() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with x as (
    update custom_cake_requests r set status = 'EXPIRED'
     where r.status = 'QUOTED'
       and exists (select 1 from custom_cake_quotes q where q.request_id = r.id and q.superseded_at is null and q.valid_until < now())
    returning 1)
  select count(*) into n from x;
  return n;
end $$;
