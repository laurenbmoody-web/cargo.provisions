-- ============================================================
--  Cargo Provisions — active-list flag for browser-style tabs
--  Lets a chef keep several lists and mark which one is current.
--  Run in the Supabase SQL editor (Provisions project only).
-- ============================================================

alter table public.chef_orders
  add column if not exists is_active boolean not null default false;

-- At most one active list per user (DB-enforced).
create unique index if not exists chef_orders_one_active
  on public.chef_orders(user_id)
  where is_active;

-- Adopt the most recently updated non-sent list as active for users who have
-- one but no active flag yet (so existing accounts get a sensible default).
update public.chef_orders o
set is_active = true
where o.id = (
  select id from public.chef_orders
  where user_id = o.user_id and status <> 'sent'
  order by updated_at desc
  limit 1
)
and not exists (
  select 1 from public.chef_orders a where a.user_id = o.user_id and a.is_active
);
