-- Namma Bakery SEED (development / demo only)
-- SOURCE: photographs of the in-store cake price sheet and counter menu. NOTHING here is confirmed by the bakery.
-- Every price rule is inserted with verified = false; the owner confirms them in the admin before launch.
-- PLACEHOLDERS (marked TBC): opening hours, slot capacity, lead times. Phone / address / pincode are left NULL on purpose.

insert into locations (slug, name, locality, maps_url) values
  ('namma-bakery-rr-nagar', 'Namma Bakery', 'BEML Layout 3rd Stage, Rajarajeshwari Nagar', null);

insert into store_settings (location_id)
select id from locations where slug = 'namma-bakery-rr-nagar';

-- TBC: PLACEHOLDER hours (the counter sign shows 10:00 am to 9:30 pm; bakery hours not yet confirmed)
insert into business_hours (location_id, weekday, opens, closes)
select l.id, d, '10:00', '21:30' from locations l, generate_series(0, 6) d where l.slug = 'namma-bakery-rr-nagar';

-- ---------------------------------------------------------------- categories
insert into categories (slug, name, name_kn, sort_order) values
  ('cakes',       'Cakes',       'ಕೇಕ್',          1),
  ('sandwiches',  'Sandwiches',  'ಸ್ಯಾಂಡ್ವಿಚ್',    2),
  ('mini-pizzas', 'Mini pizzas', 'ಪಿಜ್ಜಾ ಜೂನಿಯರ್', 3),
  ('soups',       'Soups',       'ಸೂಪ್',          4);

-- ---------------------------------------------------------------- cake price tiers (rupees x 100 = paise)
insert into price_tiers (name, sort_order) values
  ('T1',1), ('T2',2), ('T3',3), ('T4',4), ('T5',5), ('T6',6), ('SPECIAL_RED_VELVET',7), ('SPECIAL_RAINBOW',8);

-- columns: 1/2 kg egg, 1/2 kg eggless, 1 kg egg, 1 kg eggless, then rice paper / shape cake / gum paste (egg, eggless)
-- ASSUMPTION (unverified): rice paper, shape cake and gum paste columns are 1 kg prices.
with t(tier, h_e, h_l, k_e, k_l, rp_e, rp_l, sh_e, sh_l, gp_e, gp_l) as (values
  ('T1', 275, 325, 550, 650, 650, 750, 700, 800, 750, 850),
  ('T2', 300, 350, 600, 700, 700, 800, 750, 850, 800, 900),
  ('T3', 325, 375, 650, 750, 750, 850, 800, 900, 850, 950),
  ('T4', 350, 400, 700, 800, 800, 900, 850, 950, 900, 1000),
  ('T5', 375, 425, 750, 850, 850, 950, 900, 1000, 950, 1050),
  ('T6', 400, 450, 800, 900, 900, 1000, 950, 1050, 1000, 1100))
insert into price_tier_rules (tier_id, weight_grams, egg_type, finish, price_paise, note)
select pt.id, r.w, r.e::egg_type, r.f::cake_finish, r.p * 100,
       case when r.f <> 'STANDARD' then 'Assumed 1 kg price from price sheet; owner to confirm' end
from t
join price_tiers pt on pt.name = t.tier
cross join lateral (values
  (500,  'EGG',     'STANDARD',   t.h_e), (500,  'EGGLESS', 'STANDARD',   t.h_l),
  (1000, 'EGG',     'STANDARD',   t.k_e), (1000, 'EGGLESS', 'STANDARD',   t.k_l),
  (1000, 'EGG',     'RICE_PAPER', t.rp_e), (1000, 'EGGLESS', 'RICE_PAPER', t.rp_l),
  (1000, 'EGG',     'SHAPE_CAKE', t.sh_e), (1000, 'EGGLESS', 'SHAPE_CAKE', t.sh_l),
  (1000, 'EGG',     'GUM_PASTE',  t.gp_e), (1000, 'EGGLESS', 'GUM_PASTE',  t.gp_l)
) as r(w, e, f, p);

-- Special rows: the photographed sheet is misaligned for these, so only unambiguous values are seeded.
-- Red Velvet is eggless only. Its shape-cake / gum-paste prices are NOT seeded (owner to confirm).
insert into price_tier_rules (tier_id, weight_grams, egg_type, finish, price_paise, note)
select id, w, 'EGGLESS', f::cake_finish, p * 100, 'Seeded from price sheet; owner to confirm'
from price_tiers, (values (500,'STANDARD',475), (1000,'STANDARD',875), (1000,'RICE_PAPER',975)) v(w, f, p)
where name = 'SPECIAL_RED_VELVET';
-- Rainbow is a 1.5 kg eggless cake only.
insert into price_tier_rules (tier_id, weight_grams, egg_type, finish, price_paise, note)
select id, 1500, 'EGGLESS', 'STANDARD', 150000, 'Seeded from price sheet; owner to confirm' from price_tiers where name = 'SPECIAL_RAINBOW';

-- ---------------------------------------------------------------- cake products (one per flavour)
-- lead_time_minutes = 240 is a PLACEHOLDER (TBC).
insert into products (category_id, slug, name, kind, price_tier_id, sort_order, lead_time_minutes)
select (select id from categories where slug = 'cakes'),
       lower(regexp_replace(f.name, '[^a-zA-Z0-9]+', '-', 'g')), f.name, 'TIERED_CAKE', pt.id, f.ord, 240
from (values
  ('Vanilla','T1',1), ('Pineapple','T1',2), ('Mango','T1',3), ('Litchi','T1',4),
  ('Pineapple Exotic','T2',5), ('Blueberry','T2',6), ('Black Forest','T2',7), ('Strawberry','T2',8),
  ('Irish Coffee','T3',9), ('White Forest','T3',10), ('Butterscotch','T3',11), ('Choco Delight','T3',12),
  ('Chocolate Truffle','T4',13), ('Choco Oreo','T4',14), ('Choco Fantasy','T4',15), ('Choco Vanilla','T4',16),
  ('German Black Forest','T5',17), ('Choco Irish Coffee','T5',18),
  ('Death by Chocolate','T6',19), ('Choco Hazelnut','T6',20), ('Biscoff','T6',21),
  ('Red Velvet','SPECIAL_RED_VELVET',22), ('Rainbow','SPECIAL_RAINBOW',23)
) as f(name, tier, ord)
join price_tiers pt on pt.name = f.tier;

-- ---------------------------------------------------------------- counter items (from the counter sign)
-- Soups are not orderable online by default (TBC with the bakery: takeaway containers, packaging fee).
with c(cat, slug, name, name_kn, price, ord, online) as (values
  ('sandwiches', 'veg-sandwich',          'Veg Sandwich (baby size)',          'ವೆಜ್ ಸ್ಯಾಂಡ್ವಿಚ್',            35, 1, true),
  ('sandwiches', 'chilli-cheese-sandwich','Chilli Cheese Sandwich (baby size)','ಚಿಲ್ಲಿ ಚೀಸ್ ಸ್ಯಾಂಡ್ವಿಚ್',      45, 2, true),
  ('sandwiches', 'paneer-sandwich',       'Paneer Sandwich (baby size)',       'ಪನೀರ್ ಸ್ಯಾಂಡ್ವಿಚ್',          45, 3, true),
  ('sandwiches', 'chocolate-sandwich',    'Chocolate Sandwich (baby size)',    'ಚಾಕೋಲೆಟ್ ಸ್ಯಾಂಡ್ವಿಚ್',      45, 4, true),
  ('mini-pizzas','cheesy-pizza',          'Cheesy Pizza (junior)',             'ಚೀಸಿ ಪಿಜ್ಜಾ',                 35, 1, true),
  ('mini-pizzas','spicy-paneer-pizza',    'Spicy Paneer Pizza (junior)',       'ಸ್ಪೈಸಿ ಪನೀರ್',               45, 2, true),
  ('mini-pizzas','veggie-paradise-pizza', 'Veggie Paradise Pizza (junior)',    'ವೆಜ್ಜಿ ಪ್ಯಾರಡೈಸ್',            45, 3, true),
  ('soups',      'tomato-soup',           'Tomato Soup',                       'ಟೊಮೇಟೊ ಸೂಪ್',                15, 1, false),
  ('soups',      'sweet-corn-soup',       'Sweet Corn Soup',                   'ಸ್ವೀಟ್ ಕಾರ್ನ್ ಸೂಪ್',          20, 2, false)
), ins as (
  insert into products (category_id, slug, name, name_kn, kind, sort_order, lead_time_minutes, orderable_online, requires_confirmation)
  select (select id from categories where slug = c.cat), c.slug, c.name, c.name_kn, 'SIMPLE', c.ord, 60, c.online, true from c
  returning id, slug
)
insert into product_variants (product_id, label, price_paise)
select ins.id, 'Regular', c.price * 100 from ins join c on c.slug = ins.slug;
