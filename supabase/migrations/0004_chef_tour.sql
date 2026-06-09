-- ============================================================
--  Cargo Provisions — remember the first-run guided tour
--  So the coachmark tour never replays for a logged-in user
--  across devices. Anonymous users use localStorage.
--  Run in the Supabase SQL editor (Provisions project only).
-- ============================================================

alter table public.chef_profiles
  add column if not exists tour_seen_at timestamptz;

-- Existing RLS already scopes chef_profiles to the owner; no new policy needed.
