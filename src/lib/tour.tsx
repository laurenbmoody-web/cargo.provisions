import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { useOrder } from './order';
import { useOrderDrawer } from './ui';

interface TourStep {
  selector: string;
  title: string;
  body: string;
  prep?: () => void;
}

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const seenKey = (uid?: string) => (uid ? `provisions:tour-seen:${uid}` : 'provisions:tour-seen');

// Give a brand-new user time to look around before the tour auto-starts.
const TOUR_DELAY_MS = 60000;

const TourContext = createContext<{ startTour: () => void }>({ startTour: () => {} });
export const useTour = () => useContext(TourContext);

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { ready, count } = useOrder();
  const { openDrawer, closeDrawer } = useOrderDrawer();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number; placement: 'below' | 'above' }>({
    top: 0,
    left: 0,
    placement: 'below',
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);
  const tourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // live refs so the delayed auto-start can re-check conditions when it fires
  const countRef = useRef(count);
  const pathRef = useRef(location.pathname);
  const activeRef = useRef(active);
  countRef.current = count;
  pathRef.current = location.pathname;
  activeRef.current = active;

  const expandFirstCategory = useCallback(() => {
    const cat = document.querySelector('main.catalogue .cat');
    if (cat && cat.classList.contains('collapsed')) {
      (cat.querySelector('.cat-head') as HTMLElement | null)?.click();
    }
  }, []);

  const STEPS: TourStep[] = [
    {
      selector: 'main.catalogue .cat',
      title: 'Build your list',
      body: 'Tap any category, then + to add an item to your list.',
    },
    {
      selector: '.note-btn',
      title: 'Add a note',
      body: 'Add a note for a cut, ripeness or brand — it travels with your order.',
      prep: expandFirstCategory,
    },
    {
      selector: '.order-pill',
      title: 'Your list',
      body: 'Your list lives here. Working on more than one? Add a tab for guest vs crew.',
    },
    {
      selector: '.export-actions',
      title: 'Send it off',
      body: "When you're ready, copy or download to send to your supplier.",
      prep: () => openDrawer(),
    },
  ];

  const total = STEPS.length;

  // --- measure the current target & track it on scroll/resize ---
  const measure = useCallback(() => {
    const s = STEPS[stepRef.current];
    if (!s) return;
    const el = document.querySelector(s.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepRef = useRef(step);
  stepRef.current = step;

  // when active + step changes: run prep, scroll target into view, then measure
  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    if (!s) return;
    s.prep?.();
    let raf = 0;
    let tries = 0;
    let scrolled = false;
    const settle = () => {
      const el = document.querySelector(s.selector) as HTMLElement | null;
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
      measure(); // re-measure as the smooth scroll settles
      tries += 1;
      if (tries < 20) raf = window.setTimeout(() => requestAnimationFrame(settle), 40);
    };
    // small delay lets prep (drawer open / category expand) render first
    const t = window.setTimeout(() => requestAnimationFrame(settle), s.prep ? 360 : 0);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // keep the spotlight glued to the element while open
  useEffect(() => {
    if (!active) return;
    const onMove = () => measure();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [active, measure]);

  // position the tooltip card within the viewport, not covering the target
  useLayoutEffect(() => {
    if (!active) return;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const card = cardRef.current;
    const cw = card?.offsetWidth ?? Math.min(320, vw - 24);
    const ch = card?.offsetHeight ?? 180;
    const gap = 14;
    if (!rect) {
      setCardPos({ top: Math.round((vh - ch) / 2), left: Math.round((vw - cw) / 2), placement: 'below' });
      return;
    }
    const below = rect.top + rect.height + gap;
    const above = rect.top - gap - ch;
    let placement: 'below' | 'above' = 'below';
    let top = below;
    if (below + ch > vh - 12 && above >= 12) {
      placement = 'above';
      top = above;
    }
    top = Math.max(12, Math.min(top, vh - ch - 12));
    let left = rect.left + rect.width / 2 - cw / 2;
    left = Math.max(12, Math.min(left, vw - cw - 12));
    setCardPos({ top: Math.round(top), left: Math.round(left), placement });
  }, [active, rect, step]);

  const finish = useCallback(() => {
    setActive(false);
    setRect(null);
    closeDrawer();
    try {
      window.localStorage.setItem(seenKey(user?.id), '1');
      window.localStorage.setItem('provisions:tour-seen', '1');
    } catch {
      /* ignore */
    }
    if (user) {
      void supabase
        .from('chef_profiles')
        .update({ tour_seen_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {}, () => {});
    }
  }, [closeDrawer, user]);

  const begin = useCallback(() => {
    if (tourTimer.current) {
      clearTimeout(tourTimer.current);
      tourTimer.current = null;
    }
    autoStarted.current = true;
    setStep(0);
    setRect(null);
    setActive(true);
  }, []);

  const startTour = useCallback(() => {
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(begin, 350);
    } else {
      begin();
    }
  }, [location.pathname, navigate, begin]);

  // auto-start: new user, first session (empty list), not seen yet, on catalogue.
  // Waits TOUR_DELAY_MS so they can look around first; cancels if they start a
  // list or navigate away.
  useEffect(() => {
    if (autoStarted.current || !ready || active) return;
    if (location.pathname !== '/' || count !== 0) return;
    autoStarted.current = true;
    let cancelled = false;
    (async () => {
      let seen = false;
      try {
        seen =
          window.localStorage.getItem(seenKey(user?.id)) === '1' ||
          window.localStorage.getItem('provisions:tour-seen') === '1';
      } catch {
        /* ignore */
      }
      if (!seen && user) {
        const { data } = await supabase
          .from('chef_profiles')
          .select('tour_seen_at')
          .eq('id', user.id)
          .maybeSingle();
        if (data && (data as { tour_seen_at?: string }).tour_seen_at) seen = true;
      }
      if (cancelled || seen) return;
      tourTimer.current = setTimeout(() => {
        // re-check at fire time — only nudge an idle, still-empty visitor
        if (countRef.current === 0 && pathRef.current === '/' && !activeRef.current) begin();
      }, TOUR_DELAY_MS);
    })();
    return () => {
      cancelled = true;
      if (tourTimer.current) {
        clearTimeout(tourTimer.current);
        tourTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, count, user, location.pathname]);

  const next = () => {
    if (step + 1 >= total) finish();
    else setStep((s) => s + 1);
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {active && (
        <div className={`tour-root${reduceMotion() ? ' no-motion' : ''}`} role="dialog" aria-modal="true">
          <div className="tour-block" onClick={(e) => e.stopPropagation()} />
          {rect ? (
            <div
              className="tour-hole"
              style={{
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
              }}
            />
          ) : (
            <div className="tour-dim" />
          )}
          <div className="tour-card" ref={cardRef} style={{ top: cardPos.top, left: cardPos.left }}>
            <div className="tour-card-body">
              <h3>{STEPS[step].title}</h3>
              <p>{STEPS[step].body}</p>
            </div>
            <div className="tour-card-foot">
              <div className="tour-dots" aria-label={`Step ${step + 1} of ${total}`}>
                {STEPS.map((_, i) => (
                  <span key={i} className={`tour-dot${i === step ? ' on' : ''}`} />
                ))}
              </div>
              <div className="tour-card-btns">
                <button className="tour-skip" onClick={finish}>
                  Skip
                </button>
                <button className="tour-next" onClick={next}>
                  {step + 1 >= total ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TourContext.Provider>
  );
}
