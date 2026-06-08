-- ============================================================
--  CARGO PROVISIONS  —  public chef ordering app
--  Supabase migration: tables + RLS + indexes + triggers
--  All tables are prefixed `chef_` and fully isolated by RLS.
--  Run in the Supabase SQL editor (or as a CC-managed migration).
-- ============================================================

-- gen_random_uuid() is available via pgcrypto (enabled by default on Supabase)
create extension if not exists pgcrypto;

-- ---------- updated_at helper ----------
create or replace function public.chef_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

-- ============================================================
--  chef_profiles  (1 row per auth user; also the lead record)
-- ============================================================
create table if not exists public.chef_profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  full_name        text,
  role             text,                       -- head chef / sole chef / sous / freelance
  vessel_name      text,
  vessel_length_m  numeric,
  vessel_type      text check (vessel_type in ('motor','sail','catamaran','other')),
  guest_count      int,
  crew_count       int,
  home_port        text,
  cruising_region  text,
  usage_type       text check (usage_type in ('charter','private','both','other')),
  phone            text,
  -- consent / GDPR
  terms_accepted_at   timestamptz,
  marketing_consent   boolean not null default false,
  marketing_consent_at timestamptz,
  consent_version     text,
  -- housekeeping
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger chef_profiles_set_updated
  before update on public.chef_profiles
  for each row execute function public.chef_set_updated_at();

-- ============================================================
--  chef_orders
-- ============================================================
create table if not exists public.chef_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Provisions order',
  status      text not null default 'open' check (status in ('open','saved','sent')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists chef_orders_user_idx on public.chef_orders(user_id);
create index if not exists chef_orders_status_idx on public.chef_orders(user_id, status);

create trigger chef_orders_set_updated
  before update on public.chef_orders
  for each row execute function public.chef_set_updated_at();

-- ============================================================
--  chef_order_items  (upsert keyed on order_id + item_key)
-- ============================================================
create table if not exists public.chef_order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.chef_orders(id) on delete cascade,
  item_key    text not null,            -- slug or custom id; unique within an order
  item_name   text not null,
  category    text,
  cuisine     text,                     -- comma-separated codes, optional
  unit        text,
  qty         numeric not null default 0,
  note        text,
  is_custom   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (order_id, item_key)
);

create index if not exists chef_order_items_order_idx on public.chef_order_items(order_id);

-- ============================================================
--  chef_custom_items   (analytics: what chefs add that we lack)
-- ============================================================
create table if not exists public.chef_custom_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  unit        text,
  category    text,
  created_at  timestamptz not null default now()
);
create index if not exists chef_custom_items_user_idx on public.chef_custom_items(user_id);

-- ============================================================
--  chef_search_misses  (analytics: demand signal / catalogue gaps)
--  Logged for signed-in users only (anon browsing writes nothing).
-- ============================================================
create table if not exists public.chef_search_misses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  query       text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chef_search_misses_user_idx on public.chef_search_misses(user_id);

-- ============================================================
--  ROW LEVEL SECURITY
--  Default-deny. Only `authenticated` users acting on their OWN
--  rows are permitted. `anon` gets NO policies => no DB access.
-- ============================================================
alter table public.chef_profiles      enable row level security;
alter table public.chef_orders        enable row level security;
alter table public.chef_order_items   enable row level security;
alter table public.chef_custom_items  enable row level security;
alter table public.chef_search_misses enable row level security;

-- chef_profiles: a user owns the row whose id = their uid
create policy "profiles_select_own" on public.chef_profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.chef_profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.chef_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.chef_profiles
  for delete to authenticated using (id = auth.uid());

-- chef_orders: owned by user_id
create policy "orders_select_own" on public.chef_orders
  for select to authenticated using (user_id = auth.uid());
create policy "orders_insert_own" on public.chef_orders
  for insert to authenticated with check (user_id = auth.uid());
create policy "orders_update_own" on public.chef_orders
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "orders_delete_own" on public.chef_orders
  for delete to authenticated using (user_id = auth.uid());

-- chef_order_items: access if the parent order belongs to the user
create policy "items_select_own" on public.chef_order_items
  for select to authenticated using (
    exists (select 1 from public.chef_orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "items_insert_own" on public.chef_order_items
  for insert to authenticated with check (
    exists (select 1 from public.chef_orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "items_update_own" on public.chef_order_items
  for update to authenticated using (
    exists (select 1 from public.chef_orders o where o.id = order_id and o.user_id = auth.uid()))
    with check (
    exists (select 1 from public.chef_orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "items_delete_own" on public.chef_order_items
  for delete to authenticated using (
    exists (select 1 from public.chef_orders o where o.id = order_id and o.user_id = auth.uid()));

-- analytics tables: user can insert/select their own; no update
create policy "custom_select_own" on public.chef_custom_items
  for select to authenticated using (user_id = auth.uid());
create policy "custom_insert_own" on public.chef_custom_items
  for insert to authenticated with check (user_id = auth.uid());

create policy "miss_insert_own" on public.chef_search_misses
  for insert to authenticated with check (user_id = auth.uid());
create policy "miss_select_own" on public.chef_search_misses
  for select to authenticated using (user_id = auth.uid());

-- ============================================================
--  NOTE ON DELETION (GDPR right to erasure)
--  Account deletion is performed by an Edge Function using the
--  SERVICE ROLE key (auth.admin.deleteUser). The ON DELETE CASCADE
--  above means deleting the auth user removes the profile, orders,
--  items, and analytics rows automatically. Never expose the
--  service role key to the browser.
-- ============================================================
