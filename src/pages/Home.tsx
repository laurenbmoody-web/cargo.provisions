import { useEffect, useState } from 'react';
import { Catalogue } from '../components/Catalogue';
import { OrderDrawer } from '../components/OrderDrawer';
import { Onboarding } from '../components/Onboarding';
import { Footer } from '../components/Footer';
import { StorageNotice } from '../components/StorageNotice';
import { useAuth } from '../lib/auth';
import { useOrder } from '../lib/order';
import { useSignIn } from '../lib/ui';
import { supabase } from '../lib/supabase';

export function Home() {
  const { user, configured } = useAuth();
  const { count } = useOrder();
  const { openSignIn } = useSignIn();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
          <div className="eyebrow">Cargo Provisions · Galley Order</div>
          <h1>
            What are we <em>ordering</em>?
          </h1>
          <div className="sub">
            Tap through, set the pack size and quantity, and send the order off. Everything saves as
            you go — build it up over a few days if you need to.
          </div>
        </div>
      </header>

      <Catalogue onOpenOrder={() => setDrawerOpen(true)} />

      {/* Low-pressure save prompt once the order has items and you're signed out */}
      {configured && !user && count > 0 && (
        <div className="wrap">
          <div className="signin-prompt">
            <span className="grow">
              Building an order? Sign in to save it and pick it up on any device.
            </span>
            <button onClick={openSignIn}>Save order</button>
          </div>
        </div>
      )}

      <Footer />

      {/* floating mobile bar */}
      <div className="fab" style={{ display: count > 0 ? undefined : undefined }}>
        <div className="wrap">
          <div className="lbl">
            <b>{count}</b> {count === 1 ? 'item' : 'items'} in order
          </div>
          <button onClick={() => setDrawerOpen(true)}>View order</button>
        </div>
      </div>

      <OrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSignIn={() => {
          setDrawerOpen(false);
          openSignIn();
        }}
      />

      {needsOnboarding && <Onboarding onDone={() => setNeedsOnboarding(false)} />}

      <StorageNotice />
      <div id="printArea" />
    </>
  );
}
