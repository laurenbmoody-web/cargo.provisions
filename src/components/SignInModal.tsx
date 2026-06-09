import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { TURNSTILE_SITE_KEY } from '../lib/supabase';

/* ---------- Cloudflare Turnstile loader ---------- */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    const render = () => {
      if (!ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => onToken(t),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
      });
    };
    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if (window.turnstile) {
          clearInterval(iv);
          render();
        }
      }, 200);
      return () => clearInterval(iv);
    }
    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} style={{ marginTop: 12 }} />;
}

export function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithEmail, signInWithGoogle, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSent(false);
      setError(null);
      setSending(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!email.trim()) return setError('Enter your email address.');
    if (TURNSTILE_SITE_KEY && !token) return setError('Please complete the bot check.');
    setSending(true);
    const { error: err } = await signInWithEmail(email.trim(), token || undefined);
    setSending(false);
    if (err) setError(err);
    else setSent(true);
  };

  const google = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Save your list</h3>
        <p className="modal-sub">
          Sign in to save this list and pick it up on any device. No password — we email you a
          secure link.
        </p>

        {!configured ? (
          <p style={{ color: '#b23b1f', fontSize: 13 }}>
            Sign-in isn't configured yet (missing Supabase keys). The catalogue and your local list
            still work.
          </p>
        ) : sent ? (
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            ✉️ Check your inbox — we've sent a sign-in link to <b>{email}</b>. Open it on this device
            to keep your list.
          </p>
        ) : (
          <>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <Turnstile onToken={setToken} />
            {error && <p style={{ color: '#b23b1f', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <div className="mbtns">
              <button className="cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="save" onClick={submit} disabled={sending}>
                {sending ? 'Sending…' : 'Email me a link'}
              </button>
            </div>
            <button
              className="btn"
              style={{ width: '100%', marginTop: 10 }}
              onClick={google}
            >
              Continue with Google
            </button>
          </>
        )}

        <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.45 }}>
          By signing in you agree to our <Link to="/terms">Terms</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
