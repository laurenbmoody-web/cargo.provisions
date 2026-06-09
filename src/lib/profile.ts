// Optional galley-profile fields used for the completion nudge.
export const PROFILE_FIELDS = [
  'full_name',
  'role',
  'vessel_name',
  'vessel_length_m',
  'vessel_type',
  'guest_count',
  'crew_count',
  'home_port',
  'cruising_region',
  'usage_type',
  'phone',
] as const;

type ProfileLike = Record<string, unknown> | null | undefined;

export function profileCompletion(p: ProfileLike) {
  const total = PROFILE_FIELDS.length;
  let filled = 0;
  if (p) {
    for (const f of PROFILE_FIELDS) {
      const v = p[f];
      const empty = v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
      if (!empty) filled++;
    }
  }
  const pct = Math.round((filled / total) * 100);
  return { filled, total, pct, complete: filled === total };
}

// Lets the nav-bar nudge refresh immediately after a profile save/onboarding,
// without remounting or polling.
export const PROFILE_UPDATED_EVENT = 'cargo:profile-updated';
export function notifyProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}
