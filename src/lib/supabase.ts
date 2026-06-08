import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The browser ONLY ever uses the anon key. The service-role key lives
// server-side in the delete-account Edge Function — never here.
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // The catalogue + local order still work fully without this; only
  // sign-in / saving is disabled. Warn loudly in dev so it's obvious.
  console.warn(
    '[Cargo Provisions] Supabase env vars missing — running catalogue-only ' +
      '(no sign-in / saving). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
