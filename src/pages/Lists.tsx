import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useOrder } from '../lib/order';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { Spinner } from '../components/Spinner';

interface ListSummary {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  itemCount: number;
}

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

export function Lists() {
  const { user, configured } = useAuth();
  const { reload } = useOrder();
  const navigate = useNavigate();
  const toast = useToast();

  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (configured && !user) navigate('/', { replace: true });
  }, [configured, user, navigate]);

  // Close the overflow menu on outside click / Escape.
  useEffect(() => {
    if (!menuId) return;
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.lc-overflow')) setMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuId(null);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuId]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: os } = await supabase
      .from('chef_orders')
      .select('id,title,status,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    const rows = (os ?? []) as Omit<ListSummary, 'itemCount'>[];
    const withCounts = await Promise.all(
      rows.map(async (o) => {
        const { count } = await supabase
          .from('chef_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', o.id)
          .gt('qty', 0);
        return { ...o, itemCount: count ?? 0 };
      }),
    );
    setLists(withCounts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const renameList = async (o: ListSummary) => {
    const title = window.prompt('Rename list', o.title);
    if (title == null) return;
    await supabase
      .from('chef_orders')
      .update({ title: title.trim() || 'Provisions list' })
      .eq('id', o.id);
    void load();
  };

  const setStatus = async (o: ListSummary, status: 'open' | 'saved' | 'sent') => {
    setMenuId(null);
    if (status === 'open') {
      // One open list at a time: archive any current open list first.
      await supabase
        .from('chef_orders')
        .update({ status: 'saved' })
        .eq('user_id', user!.id)
        .eq('status', 'open');
    }
    await supabase.from('chef_orders').update({ status }).eq('id', o.id);
    await load();
    reload();
    if (status === 'open') {
      toast('List opened — find it on the catalogue');
      navigate('/');
    }
  };

  const duplicateList = async (o: ListSummary) => {
    setMenuId(null);
    if (!user) return;
    const { data: created, error } = await supabase
      .from('chef_orders')
      .insert({ user_id: user.id, title: `${o.title} (copy)`, status: 'saved' })
      .select('id')
      .single();
    if (error || !created) {
      toast('Could not duplicate');
      return;
    }
    const { data: items } = await supabase
      .from('chef_order_items')
      .select('item_key,item_name,category,cuisine,unit,qty,note,is_custom')
      .eq('order_id', o.id);
    if (items && items.length) {
      await supabase.from('chef_order_items').insert(items.map((it) => ({ ...it, order_id: created.id })));
    }
    void load();
    toast('List duplicated');
  };

  const deleteList = async (o: ListSummary) => {
    setMenuId(null);
    if (!window.confirm(`Delete “${o.title}”? This can't be undone.`)) return;
    await supabase.from('chef_orders').delete().eq('id', o.id);
    await load();
    if (o.status === 'open') reload();
    toast('List deleted');
  };

  const newList = async () => {
    if (!user) return;
    await supabase
      .from('chef_orders')
      .update({ status: 'saved' })
      .eq('user_id', user.id)
      .eq('status', 'open');
    await supabase.from('chef_orders').insert({ user_id: user.id, status: 'open' });
    await load();
    reload();
    toast('Started a new list');
    navigate('/');
  };

  if (!configured) {
    return (
      <div className="account">
        <h1>My lists</h1>
        <p style={{ color: 'var(--ink-soft)' }}>Sign-in isn't configured in this environment.</p>
        <Link className="btn" to="/">
          Back to catalogue
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-center">
        <Spinner size={48} />
        <p>Loading your lists…</p>
      </div>
    );
  }

  return (
    <>
      <div className="account">
        <h1>My lists</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          Your provisioning lists · <Link to="/account">Account &amp; profile</Link> ·{' '}
          <Link to="/">Back to catalogue</Link>
        </p>

        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Lists</h2>
            <button className="btn primary" onClick={newList}>
              Start a new list
            </button>
          </div>

          {lists.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>No saved lists yet.</p>
          ) : (
            lists.map((o) => (
              <div key={o.id} className="list-card">
                <div className="lc-main">
                  <div className="lc-title">{o.title}</div>
                  <div className="lc-meta">
                    {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · updated{' '}
                    {new Date(o.updated_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <span className={`badge ${o.status}`}>{o.status}</span>

                {o.status !== 'open' && (
                  <button className="btn" onClick={() => setStatus(o, 'open')}>
                    Open
                  </button>
                )}
                <button className="btn" onClick={() => renameList(o)}>
                  Rename
                </button>

                <div className="lc-overflow">
                  <button
                    className="icon-btn-sm"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={menuId === o.id}
                    onClick={() => setMenuId(menuId === o.id ? null : o.id)}
                  >
                    <MoreIcon />
                  </button>
                  {menuId === o.id && (
                    <div className="overflow-menu" role="menu">
                      <button className="overflow-item" role="menuitem" onClick={() => duplicateList(o)}>
                        Duplicate
                      </button>
                      {o.status !== 'saved' && (
                        <button className="overflow-item" role="menuitem" onClick={() => setStatus(o, 'saved')}>
                          Mark as saved
                        </button>
                      )}
                      {o.status !== 'sent' && (
                        <button className="overflow-item" role="menuitem" onClick={() => setStatus(o, 'sent')}>
                          Mark as sent
                        </button>
                      )}
                      <div className="overflow-divider" />
                      <button className="overflow-item danger" role="menuitem" onClick={() => deleteList(o)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
