import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { CONSENT_VERSION, ROLES, VESSEL_TYPES, USAGE_TYPES } from '../lib/constants';
import { notifyProfileUpdated } from '../lib/profile';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [vesselLength, setVesselLength] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [guests, setGuests] = useState('');
  const [crew, setCrew] = useState('');
  const [homePort, setHomePort] = useState('');
  const [region, setRegion] = useState('');
  const [usage, setUsage] = useState('');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false); // unticked by default (GDPR)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (skip: boolean) => {
    if (!user) return;
    if (!terms) {
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    const row = {
      id: user.id,
      email: user.email ?? null,
      terms_accepted_at: now,
      marketing_consent: marketing,
      marketing_consent_at: marketing ? now : null,
      consent_version: CONSENT_VERSION,
      ...(skip
        ? {}
        : {
            full_name: fullName.trim() || null,
            role: role || null,
            vessel_name: vesselName.trim() || null,
            vessel_length_m: num(vesselLength),
            vessel_type: vesselType || null,
            guest_count: num(guests),
            crew_count: num(crew),
            home_port: homePort.trim() || null,
            cruising_region: region.trim() || null,
            usage_type: usage || null,
            phone: phone.trim() || null,
          }),
    };
    const { error: err } = await supabase.from('chef_profiles').upsert(row, { onConflict: 'id' });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    notifyProfileUpdated();
    onDone();
  };

  return (
    <div className="modal-scrim">
      <div className="modal">
        <h3>Tell us about your galley</h3>
        <p className="modal-sub">
          Optional — it helps us tailor pack sizes and regional suppliers. You can change or remove
          any of this later in your account.
        </p>

        <div className="field">
          <label>Your name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">—</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Vessel name</label>
          <input type="text" value={vesselName} onChange={(e) => setVesselName(e.target.value)} />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Length (m)</label>
            <input type="number" value={vesselLength} onChange={(e) => setVesselLength(e.target.value)} />
          </div>
          <div className="field">
            <label>Vessel type</label>
            <select value={vesselType} onChange={(e) => setVesselType(e.target.value)}>
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
            <input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} />
          </div>
          <div className="field">
            <label>Crew</label>
            <input type="number" value={crew} onChange={(e) => setCrew(e.target.value)} />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Home port</label>
            <input type="text" value={homePort} onChange={(e) => setHomePort(e.target.value)} />
          </div>
          <div className="field">
            <label>Cruising region</label>
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Usage</label>
            <select value={usage} onChange={(e) => setUsage(e.target.value)}>
              <option value="">—</option>
              {USAGE_TYPES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Phone (optional)</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <label className="consent">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            I agree to the <Link to="/terms">Terms of Use</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        <label className="consent">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
          <span>Keep me posted about Cargo, the operations platform behind this tool.</span>
        </label>

        {error && <p style={{ color: '#b23b1f', fontSize: 13, marginTop: 10 }}>{error}</p>}

        <div className="mbtns">
          <button className="cancel" disabled={saving} onClick={() => save(true)}>
            Skip for now
          </button>
          <button className="save" disabled={saving} onClick={() => save(false)}>
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
