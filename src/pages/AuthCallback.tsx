import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Signing you in…');

  useEffect(() => {
    let done = false;
    // detectSessionInUrl handles the token exchange; wait for it to settle.
    const finish = () => {
      if (done) return;
      done = true;
      navigate('/', { replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish();
    });

    const timeout = setTimeout(() => {
      if (!done) {
        setMsg('Could not complete sign-in. The link may have expired — please try again.');
        setTimeout(() => navigate('/', { replace: true }), 2500);
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', textAlign: 'center', padding: 20 }}>
      <div>
        <div className="font-display" style={{ fontSize: 28, color: 'var(--navy)', marginBottom: 10 }}>
          Cargo Provisions
        </div>
        <p style={{ color: 'var(--ink-soft)' }}>{msg}</p>
      </div>
    </div>
  );
}
