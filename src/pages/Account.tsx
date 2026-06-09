import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { Spinner } from '../components/Spinner';
import { ROLES, VESSEL_TYPES, USAGE_TYPES } from '../lib/constants';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  vessel_name: string | null;
  vessel_length_m: number | null;
  vessel_type: string | null;
  guest_count: number | null;
  crew_count: number | null;
  home_port: string | null;
  cruising_region: string | null;
  usage_type: string | null;
  phone: string | null;
  marketing_consent: boolean;
}

const FN_URL = (() => {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return base ? `${base}/functions/v1/delete-account` : '';
})();

export function Account() {
  const { user, configured, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (configured && !user) navigate('/', { replace: true });
  }, [configured, user, navigate]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: p } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(
      (p as ProfileRow) ?? {
        id: user.id,
        email: user.email ?? null,
        full_name: null,
        role: null,
        vessel_name: null,
        vessel_length_m: null,
        vessel_type: null,
        guest_count: null,
        crew_count: null,
        home_port: null,
        cruising_region: null,
        usage_type: null,
        phone: null,
        marketing_consent: false,
      },
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const setField = <K extends keyof ProfileRow>(k: K, v: ProfileRow[K]) =>
    setProfile((p) => (p ? { ...p, [k]: v } : p));

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('chef_profiles').upsert(
      {
        id: user.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        vessel_name: profile.vessel_name,
        vessel_length_m: profile.vessel_length_m,
        vessel_type: profile.vessel_type,
        guest_count: profile.guest_count,
        crew_count: profile.crew_count,
        home_port: profile.home_port,
        cruising_region: profile.cruising_region,
        usage_type: profile.usage_type,
        phone: profile.phone,
      },
      { onConflict: 'id' },
    );
    setSavingProfile(false);
    toast(error ? error.message : 'Profile saved');
  };

  const toggleMarketing = async () => {
    if (!user || !profile) return;
    const next = !profile.marketing_consent;
    setField('marketing_consent', next);
    const { error } = await supabase
      .from('chef_profiles')
      .update({
        marketing_consent: next,
        marketing_consent_at: next ? new Date().toISOString() : null,
      })
      .eq('id', user.id);
    toast(error ? error.message : next ? 'Marketing consent on' : 'Marketing consent off');
  };

  /* ---------- account actions ---------- */
  const logOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const exportData = async () => {
    if (!user) return;
    const { data: prof } = await supabase.from('chef_profiles').select('*').eq('id', user.id).maybeSingle();
    const { data: ords } = await supabase.from('chef_orders').select('*').eq('user_id', user.id);
    const orderIds = (ords ?? []).map((o: { id: string }) => o.id);
    let items: unknown[] = [];
    if (orderIds.length) {
      const { data: its } = await supabase.from('chef_order_items').select('*').in('order_id', orderIds);
      items = its ?? [];
    }
    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      profile: prof ?? null,
      lists: ords ?? [],
      list_items: items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cargo-provisions-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Your data has been exported');
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Permanently delete your account and all your lists? This cannot be undone.'))
      return;
    setDeleting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      await signOut();
      toast('Account deleted');
      navigate('/', { replace: true });
    } catch (e) {
      setDeleting(false);
      toast('Could not delete account: ' + (e instanceof Error ? e.message : 'error'));
    }
  };

  if (!configured) {
    return (
      <div className="account">
        <h1>Account &amp; profile</h1>
        <p style={{ color: 'var(--ink-soft)' }}>Sign-in isn't configured in this environment.</p>
        <Link className="btn" to="/">
          Back to catalogue
        </Link>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="loading-center">
        <Spinner size={48} />
        <p>Loading your account…</p>
      </div>
    );
  }

  return (
    <>
      <div className="account">
        <h1>Account &amp; profile</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          {profile.email} · <Link to="/lists">My lists</Link> · <Link to="/">Back to catalogue</Link>
        </p>

        {/* Profile */}
        <div className="panel">
          <h2>Galley profile</h2>
          <div className="grid2">
            <div className="field">
              <label>Your name</label>
              <input value={profile.full_name ?? ''} onChange={(e) => setField('full_name', e.target.value)} />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={profile.role ?? ''} onChange={(e) => setField('role', e.target.value || null)}>
                <option value="">—</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Vessel name</label>
            <input value={profile.vessel_name ?? ''} onChange={(e) => setField('vessel_name', e.target.value)} />
          </div>
          <div className="grid2">
            <div className="field">
              <label>Length (m)</label>
              <input
                type="number"
                value={profile.vessel_length_m ?? ''}
                onChange={(e) => setField('vessel_length_m', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Vessel type</label>
              <select value={profile.vessel_type ?? ''} onChange={(e) => setField('vessel_type', e.target.value || null)}>
                <option value="">—</option>
                {VESSEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label>Guests</label>
              <input
                type="number"
                value={profile.guest_count ?? ''}
                onChange={(e) => setField('guest_count', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Crew</label>
              <input
                type="number"
                value={profile.crew_count ?? ''}
                onChange={(e) => setField('crew_count', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label>Home port</label>
              <input value={profile.home_port ?? ''} onChange={(e) => setField('home_port', e.target.value)} />
            </div>
            <div className="field">
              <label>Cruising region</label>
              <input value={profile.cruising_region ?? ''} onChange={(e) => setField('cruising_region', e.target.value)} />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label>Usage</label>
              <select value={profile.usage_type ?? ''} onChange={(e) => setField('usage_type', e.target.value || null)}>
                <option value="">—</option>
                {USAGE_TYPES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={profile.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} />
            </div>
          </div>
          <button className="btn primary" disabled={savingProfile} onClick={saveProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </div>

        {/* Consent + account actions */}
        <div className="panel">
          <h2>Privacy &amp; account</h2>
          <label className="consent" style={{ color: 'var(--ink)' }}>
            <input type="checkbox" checked={profile.marketing_consent} onChange={toggleMarketing} />
            <span>Keep me posted about Cargo, the operations platform behind this tool.</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn" onClick={exportData}>
              Export my data
            </button>
            <button className="btn" onClick={logOut}>
              Log out
            </button>
            <button className="btn danger" disabled={deleting} onClick={deleteAccount}>
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 12 }}>
            Export downloads a JSON of your profile and all your lists. Deleting your account removes
            everything permanently. See our <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
