-- ============================================================
--  Cargo Provisions — add favourite flag to lists
--  Lets a chef star lists; favourites sync across devices.
--  Run in the Supabase SQL editor (Provisions project only).
-- ============================================================

alter table public.chef_orders
  add column if not exists is_favorite boolean not null default false;

-- Existing RLS already scopes chef_orders to the owner (user_id = auth.uid()),
-- so the owner can read/update this column with no new policy needed.

create index if not exists chef_orders_fav_idx
  on public.chef_orders(user_id, is_favorite);
