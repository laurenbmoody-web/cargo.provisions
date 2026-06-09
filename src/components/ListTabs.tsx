import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useOrder, LISTS_UPDATED_EVENT } from '../lib/order';

interface Tab {
  id: string;
  title: string;
  count: number;
}

const MAX_NAME = 60;

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

/**
 * Browser-style list tabs riding the bottom edge of the navy hero. Tabs are
 * inline-renamable (double-click / long-press / pencil) and write to the same
 * chef_orders.title used by the /lists ⋯ Rename action, so names stay in sync.
 */
export function ListTabs() {
  const { user, configured } = useAuth();
  const { orderId, count, title, setTitle, setActiveOrder, createNewActiveList, reload } = useOrder();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [closing, setClosing] = useState<Tab | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chef_orders')
      .select('id,title')
      .eq('user_id', user.id)
      .eq('status', 'open')
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

  // keep the active tab title in sync if it changes elsewhere (drawer rename)
  useEffect(() => {
    if (!orderId) return;
    setTabs((prev) => prev.map((t) => (t.id === orderId ? { ...t, title } : t)));
  }, [title, orderId]);

  useEffect(() => {
    if (editingId) return;
    activeRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [orderId, tabs.length, editingId]);

  const startEdit = (t: Tab) => {
    cancelledRef.current = false;
    setDraft(t.title);
    setEditingId(t.id);
  };

  const commit = (t: Tab) => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setEditingId(null);
      return;
    }
    setEditingId(null);
    const v = draft.trim().slice(0, MAX_NAME);
    if (!v || v === t.title) return; // blank or unchanged → revert
    setTabs((prev) => prev.map((x) => (x.id === t.id ? { ...x, title: v } : x))); // optimistic
    if (t.id === orderId) {
      setTitle(v); // active list → updates context + DB + notifies /lists
    } else {
      void supabase
        .from('chef_orders')
        .update({ title: v })
        .eq('id', t.id)
        .then(() => window.dispatchEvent(new Event(LISTS_UPDATED_EVENT)));
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    setEditingId(null);
  };

  // Close a tab: park it (kept in history) or delete it outright.
  const closeKeep = async (t: Tab) => {
    setClosing(null);
    setTabs((prev) => prev.filter((x) => x.id !== t.id)); // optimistic
    await supabase.from('chef_orders').update({ status: 'saved' }).eq('id', t.id);
    if (t.id === orderId) reload(); // active parked → adopt another open list
    window.dispatchEvent(new Event(LISTS_UPDATED_EVENT));
  };
  const deleteList = async (t: Tab) => {
    setClosing(null);
    setTabs((prev) => prev.filter((x) => x.id !== t.id)); // optimistic
    await supabase.from('chef_orders').delete().eq('id', t.id);
    if (t.id === orderId) reload();
    window.dispatchEvent(new Event(LISTS_UPDATED_EVENT));
  };

  // touch long-press → edit (and suppress the click that would switch tabs)
  const onTouchStart = (t: Tab) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      suppressClick.current = true;
      startEdit(t);
    }, 500);
  };
  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

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
            const n = active ? count : t.count;
            const editing = editingId === t.id;
            return (
              <div
                key={t.id}
                ref={active ? activeRef : undefined}
                className={`htab${active ? ' active' : ''}${editing ? ' editing' : ''}`}
                role="button"
                tabIndex={0}
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  if (!editing && !active) void setActiveOrder(t.id);
                }}
                onDoubleClick={() => startEdit(t)}
                onKeyDown={(e) => {
                  if (!editing && (e.key === 'Enter' || e.key === ' ') && !active) {
                    e.preventDefault();
                    void setActiveOrder(t.id);
                  }
                }}
                onTouchStart={() => onTouchStart(t)}
                onTouchEnd={clearPress}
                onTouchMove={clearPress}
              >
                {editing ? (
                  <input
                    className="htab-edit"
                    value={draft}
                    autoFocus
                    maxLength={MAX_NAME}
                    aria-label="List name"
                    onChange={(e) => setDraft(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      } else if (e.key === 'Escape') {
                        cancel();
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => commit(t)}
                  />
                ) : (
                  <>
                    <span className="htab-name">{t.title}</span>
                    <span className={`htab-badge${active ? ' active' : ''}`}>{n}</span>
                    {active && (
                      <button
                        className="htab-edit-btn"
                        aria-label="Rename list"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(t);
                        }}
                      >
                        <PencilIcon />
                      </button>
                    )}
                    <button
                      className="htab-close"
                      aria-label="Close list"
                      title="Close list"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClosing(t);
                      }}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
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

      {closing && (
        <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && setClosing(null)}>
          <div className="modal">
            <h3>Close “{closing.title}”?</h3>
            <p className="modal-sub">
              Keep it in your list history to reopen later, or delete it permanently.
            </p>
            <div className="mbtns">
              <button className="cancel" onClick={() => setClosing(null)}>
                Cancel
              </button>
              <button className="save" onClick={() => void closeKeep(closing)}>
                Save &amp; keep
              </button>
            </div>
            <button className="link-btn danger-link" onClick={() => void deleteList(closing)}>
              Delete permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
