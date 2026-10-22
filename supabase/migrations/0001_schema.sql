-- Namma Bakery: core schema (V1)
-- Money is stored as integer paise. Times are timestamptz (UTC); display in location.timezone.
-- Writes to orders / requests go through SECURITY DEFINER functions (0002), never direct table writes.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- enums
create type app_role       as enum ('EMPLOYEE', 'ADMIN');
create type order_status   as enum ('PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','COMPLETED','REJECTED','CANCELLED','NO_SHOW');
create type payment_status as enum ('unpaid','payment_pending','paid','payment_failed','refunded');
create type payment_method as enum ('pay_at_store','online');
create type egg_type       as enum ('EGG','EGGLESS');
create type cake_finish    as enum ('STANDARD','RICE_PAPER','SHAPE_CAKE','GUM_PASTE');
create type product_kind   as enum ('TIERED_CAKE','SIMPLE');
create type request_status as enum ('SUBMITTED','UNDER_REVIEW','NEEDS_CLARIFICATION','QUOTED','CUSTOMER_ACCEPTED','DECLINED','CUSTOMER_DECLINED','EXPIRED','WITHDRAWN');

create sequence order_number_seq   start 1001;
create sequence request_number_seq start 1001;

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- location & scheduling
create table locations (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  address_line text,            -- NULL = to be confirmed
  locality     text,
  city         text not null default 'Bengaluru',
  state        text not null default 'Karnataka',
  pincode      text,
  phone        text,
  whatsapp     text,
  maps_url     text,
  latitude     numeric(9,6),
  longitude    numeric(9,6),
  timezone     text not null default 'Asia/Kolkata',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table business_hours (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  opens       time not null,
  closes      time not null,
  check (opens < closes),
  unique (location_id, weekday, opens)
);

create table special_closures (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references locations(id) on delete cascade,
  closure_date date not null,
  reason       text,
  unique (location_id, closure_date)
);

create table store_settings (
  location_id            uuid primary key references locations(id) on delete cascade,
  orders_paused_until    timestamptz,
  pause_message          text,
  slot_minutes           int  not null default 30 check (slot_minutes in (15,30,60)),
  max_orders_per_slot    int  not null default 6  check (max_orders_per_slot >= 0),   -- TBC with bakery
  max_custom_per_day     int  not null default 4  check (max_custom_per_day >= 0),    -- TBC with bakery
  quote_validity_hours   int  not null default 24 check (quote_validity_hours > 0),
  cancel_cutoff_hours    int  not null default 4  check (cancel_cutoff_hours >= 0),
  pending_alert_minutes  int  not null default 15 check (pending_alert_minutes > 0),
  max_open_orders_per_phone int not null default 3,
  updated_at             timestamptz not null default now()
);
create trigger trg_store_settings_updated before update on store_settings for each row execute function set_updated_at();

-- ---------------------------------------------------------------- people
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();

create table staff_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       app_role not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- ---------------------------------------------------------------- catalog
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_kn     text,
  description text,
  image_path  text,
  sort_order  int  not null default 0,
  is_visible  boolean not null default true,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Cake price tiers: flavours share a tier; admin edits one rule instead of 23 rows.
create table price_tiers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0
);

create table price_tier_rules (
  id           uuid primary key default gen_random_uuid(),
  tier_id      uuid not null references price_tiers(id) on delete cascade,
  weight_grams int  not null check (weight_grams > 0),
  egg_type     egg_type not null,
  finish       cake_finish not null default 'STANDARD',
  price_paise  int  not null check (price_paise > 0),
  is_active    boolean not null default true,
  verified     boolean not null default false,     -- owner has confirmed this price
  note         text,
  unique (tier_id, weight_grams, egg_type, finish)
);

create table products (
  id                    uuid primary key default gen_random_uuid(),
  category_id           uuid not null references categories(id),
  slug                  text not null unique,
  name                  text not null,
  name_kn               text,
  description           text,
  kind                  product_kind not null default 'SIMPLE',
  price_tier_id         uuid references price_tiers(id),
  is_available          boolean not null default true,
  orderable_online      boolean not null default true,
  requires_confirmation boolean not null default true,
  is_featured           boolean not null default false,
  is_best_seller        boolean not null default false,
  is_new_arrival        boolean not null default false,
  is_seasonal           boolean not null default false,
  lead_time_minutes     int  not null default 240 check (lead_time_minutes >= 0),   -- TBC with bakery
  load_points           int  not null default 1 check (load_points >= 0),
  keywords              text,
  seo_title             text,
  seo_description       text,
  sort_order            int  not null default 0,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check ((kind = 'TIERED_CAKE' and price_tier_id is not null) or (kind = 'SIMPLE' and price_tier_id is null))
);
create trigger trg_products_updated before update on products for each row execute function set_updated_at();
create index products_category_idx on products (category_id, sort_order) where archived_at is null;
create index products_flags_idx on products (is_best_seller, is_new_arrival, is_featured) where archived_at is null;
create index products_name_trgm on products using gin (name extensions.gin_trgm_ops);

create table product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt_text     text not null,
  sort_order   int not null default 0,
  is_primary   boolean not null default false
);
create unique index product_images_one_primary on product_images (product_id) where is_primary;

-- Variants are only for SIMPLE products (cakes use price_tier_rules).
create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  label       text not null,
  price_paise int  not null check (price_paise > 0),
  is_available boolean not null default true,
  sort_order  int not null default 0,
  archived_at timestamptz
);
create index product_variants_product_idx on product_variants (product_id);

create function enforce_variant_product_kind() returns trigger language plpgsql as $$
begin
  if (select kind from products where id = new.product_id) <> 'SIMPLE' then
    raise exception 'variants are only allowed on SIMPLE products' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger trg_variant_kind before insert or update of product_id on product_variants
  for each row execute function enforce_variant_product_kind();

-- ---------------------------------------------------------------- custom cake requests
create table custom_cake_requests (
  id                uuid primary key default gen_random_uuid(),
  request_number    text not null unique default ('CC' || nextval('request_number_seq')),
  public_token      text not null unique default (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  location_id       uuid not null references locations(id),
  customer_id       uuid references profiles(id),
  customer_name     text not null check (char_length(customer_name) between 2 and 80),
  customer_phone    text not null,
  customer_email    text,
  flavour           text not null,
  egg_type          egg_type not null,
  weight_grams      int  not null check (weight_grams between 250 and 20000),
  shape             text,
  cake_type         text,
  message_on_cake   text check (char_length(message_on_cake) <= 60),
  description       text check (char_length(description) <= 1500),
  preferred_pickup_at timestamptz not null,
  additional_notes  text check (char_length(additional_notes) <= 1000),
  status            request_status not null default 'SUBMITTED',
  decline_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_requests_updated before update on custom_cake_requests for each row execute function set_updated_at();
create index requests_status_idx on custom_cake_requests (status, created_at);
create index requests_customer_idx on custom_cake_requests (customer_id, created_at desc);

create table custom_cake_images (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references custom_cake_requests(id) on delete cascade,
  storage_path text not null,
  mime_type    text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes   int  not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at   timestamptz not null default now()
);
create index custom_cake_images_request_idx on custom_cake_images (request_id);

create table custom_cake_quotes (
  id                 uuid primary key default gen_random_uuid(),
  request_id         uuid not null references custom_cake_requests(id) on delete cascade,
  price_paise        int  not null check (price_paise > 0),
  estimated_prep_minutes int not null check (estimated_prep_minutes >= 0),
  confirmed_pickup_at timestamptz not null,
  bakery_note        text,
  valid_until        timestamptz not null,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  superseded_at      timestamptz
);
create unique index quotes_one_current on custom_cake_quotes (request_id) where superseded_at is null;

create table request_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references custom_cake_requests(id) on delete cascade,
  sender     text not null check (sender in ('CUSTOMER','STAFF')),
  staff_id   uuid references auth.users(id),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index request_messages_request_idx on request_messages (request_id, created_at);

-- ---------------------------------------------------------------- orders
create table orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique default ('NB' || nextval('order_number_seq')),
  public_token         text not null unique default (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  location_id          uuid not null references locations(id),
  customer_id          uuid references profiles(id),          -- NULL = guest
  customer_name        text not null check (char_length(customer_name) between 2 and 80),
  customer_phone       text not null,
  customer_email       text,
  status               order_status not null default 'PENDING',
  payment_status       payment_status not null default 'unpaid',
  payment_method       payment_method not null default 'pay_at_store',
  requested_pickup_at  timestamptz not null,
  confirmed_pickup_at  timestamptz,
  estimated_ready_at   timestamptz,
  total_paise          int  not null default 0 check (total_paise >= 0),   -- snapshot, set by place_order
  customer_notes       text check (char_length(customer_notes) <= 500),
  bakery_note          text,                                  -- visible to customer
  rejection_reason     text,
  cancellation_reason  text,
  cancelled_by         text check (cancelled_by in ('CUSTOMER','STAFF','ADMIN')),
  custom_request_id    uuid unique references custom_cake_requests(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  completed_at         timestamptz
);
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();
create index orders_status_pickup_idx on orders (status, requested_pickup_at);
create index orders_customer_idx on orders (customer_id, created_at desc);
create index orders_phone_idx on orders (customer_phone, status);
create index orders_pickup_idx on orders (location_id, requested_pickup_at);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  product_id       uuid references products(id) on delete set null,
  variant_id       uuid references product_variants(id) on delete set null,
  price_rule_id    uuid references price_tier_rules(id) on delete set null,
  product_name     text not null,          -- snapshots: later edits never rewrite history
  variant_label    text,
  egg_type         egg_type,
  finish           cake_finish,
  weight_grams     int,
  unit_price_paise int not null check (unit_price_paise >= 0),
  quantity         int not null check (quantity between 1 and 20),
  cake_message     text check (char_length(cake_message) <= 60),
  line_total_paise int generated always as (unit_price_paise * quantity) stored
);
create index order_items_order_idx on order_items (order_id);

create table order_transitions (
  from_status order_status not null,
  to_status   order_status not null,
  admin_only  boolean not null default false,
  primary key (from_status, to_status)
);
insert into order_transitions (from_status, to_status, admin_only) values
  ('PENDING','ACCEPTED',false), ('PENDING','REJECTED',false), ('PENDING','CANCELLED',false),
  ('ACCEPTED','PREPARING',false), ('ACCEPTED','CANCELLED',false),
  ('PREPARING','READY_FOR_PICKUP',false), ('PREPARING','CANCELLED',true),
  ('READY_FOR_PICKUP','COMPLETED',false), ('READY_FOR_PICKUP','NO_SHOW',false);

create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references auth.users(id),
  actor_role  text not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_idx on order_status_history (order_id, created_at);

create table order_internal_notes (       -- staff-only; never exposed to customers
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  author_id  uuid not null references auth.users(id),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index order_internal_notes_order_idx on order_internal_notes (order_id);

create table payments (                   -- empty of online payments in V1; in-store payments recorded here
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id),
  provider           text not null,       -- 'in_store' now; gateway name later
  provider_reference text,
  method             payment_method not null,
  status             payment_status not null,
  amount_paise       int not null check (amount_paise >= 0),
  recorded_by        uuid references auth.users(id),
  created_at         timestamptz not null default now()
);
create index payments_order_idx on payments (order_id);

-- ---------------------------------------------------------------- audit & notifications
create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  actor_role  text not null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs (created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders(id) on delete cascade,
  request_id uuid references custom_cake_requests(id) on delete cascade,
  channel    text not null default 'EMAIL' check (channel in ('EMAIL')),
  template   text not null,
  recipient  text not null,
  status     text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED')),
  created_at timestamptz not null default now()
);
