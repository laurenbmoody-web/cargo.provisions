import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useOrder, LISTS_UPDATED_EVENT } from '../lib/order';

interface Tab {
  id: string;
  title: string;
  count: number;
}

/**
 * Browser-style list tabs riding the bottom edge of the navy hero. Each tab is
 * one of the chef's non-sent lists; the active tab merges into the page below.
 * Tapping a tab switches the active list (what the catalogue edits). The
 * drawer and full-page views are unaffected — these only pick the active list.
 */
export function ListTabs() {
  const { user, configured } = useAuth();
  const { orderId, count, setActiveOrder, createNewActiveList } = useOrder();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chef_orders')
      .select('id,title')
      .eq('user_id', user.id)
      .neq('status', 'sent')
      .order('created_at', { ascending: true });
    const rows = (data ?? []) as { id: string; title: string }[];
    const withCounts = await Promise.all(
      rows.map(async (o) => {
        const { count: c } = await supabase
          .from('chef_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', o.id)
          .gt('qty', 0);
        return { id: o.id, title: o.title || 'Your list', count: c ?? 0 };
      }),
    );
    setTabs(withCounts);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, orderId]);

  useEffect(() => {
    const onUpdated = () => void load();
    window.addEventListener(LISTS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(LISTS_UPDATED_EVENT, onUpdated);
  }, [load]);

  // keep the active tab in view on mobile
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [orderId, tabs.length]);

  // tabs are an account feature; nothing to show until there's a list
  if (!configured || !user || tabs.length === 0) return null;

  // Solo: don't make one list look like a tab workspace — just offer '+ New list'.
  const solo = tabs.length === 1;

  return (
    <div className="hero-tabs-wrap">
      <div className="hero-tabs" ref={scrollRef}>
        {!solo &&
          tabs.map((t) => {
            const active = t.id === orderId;
            const n = active ? count : t.count; // live count for the active list
            return (
              <button
                key={t.id}
                ref={active ? activeRef : undefined}
                className={`htab${active ? ' active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  if (!active) void setActiveOrder(t.id);
                }}
              >
                <span className="htab-name">{t.title}</span>
                <span className={`htab-badge${active ? ' active' : ''}`}>{n}</span>
              </button>
            );
          })}
        <button
          className={`htab htab-add${solo ? ' solo' : ''}`}
          aria-label="Start a new list"
          title="New list"
          onClick={() => void createNewActiveList()}
        >
          {solo ? '+ New list' : '+'}
        </button>
      </div>
    </div>
  );
}
