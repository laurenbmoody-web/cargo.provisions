import { supabase } from './supabase';

/**
 * Quiet analytics for catalogue improvement / Cargo targeting.
 * Signed-in only — anonymous logging is out of scope for the MVP (would need
 * an Edge Function since anon has no DB policies).
 */

export async function logCustomItem(
  userId: string,
  name: string,
  unit: string,
  category: string,
): Promise<void> {
  try {
    await supabase.from('chef_custom_items').insert({
      user_id: userId,
      name,
      unit: unit || null,
      category: category || null,
    });
  } catch (e) {
    console.warn('[analytics] custom item log failed', e);
  }
}

export async function logSearchMiss(userId: string, query: string): Promise<void> {
  const q = query.trim();
  if (!q) return;
  try {
    await supabase.from('chef_search_misses').insert({ user_id: userId, query: q });
  } catch (e) {
    console.warn('[analytics] search miss log failed', e);
  }
}
