import { useEffect, useState } from 'react';
import { Catalogue } from '../components/Catalogue';
import { Onboarding } from '../components/Onboarding';
import { Footer } from '../components/Footer';
import { StorageNotice } from '../components/StorageNotice';
import { useAuth } from '../lib/auth';
import { useOrder } from '../lib/order';
import { useSignIn, useOrderDrawer } from '../lib/ui';
import { supabase } from '../lib/supabase';

export function Home() {
  const { user, configured } = useAuth();
  const { count } = useOrder();
  const { openSignIn } = useSignIn();
  const { openDrawer } = useOrderDrawer();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // First-time onboarding: show if no profile row yet.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setNeedsOnboarding(false);
      return;
    }
    supabase
      .from('chef_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setNeedsOnboarding(!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <>
      <header className="top">
        <div className="wrap">
          <h1>
            What are we <em>ordering</em>?
          </h1>
          <div className="sub">
            The simple provisioning list for superyacht chefs — build your list and send it off.
          </div>
        </div>
      </header>

      <Catalogue />

      {/* Low-pressure save prompt once the list has items and you're signed out */}
      {configured && !user && count > 0 && (
        <div className="wrap">
          <div className="signin-prompt">
            <span className="grow">
              Building a list? Sign in to save it and pick it up on any device.
            </span>
            <button onClick={openSignIn}>Save list</button>
          </div>
        </div>
      )}

      <Footer />

      {/* floating mobile bar */}
      <div className="fab">
        <div className="wrap">
          <div className="lbl">
            <b>{count}</b> {count === 1 ? 'item' : 'items'} in your list
          </div>
          <button onClick={openDrawer}>View list</button>
        </div>
      </div>

      {needsOnboarding && <Onboarding onDone={() => setNeedsOnboarding(false)} />}

      <StorageNotice />
      <div id="printArea" />
    </>
  );
}
