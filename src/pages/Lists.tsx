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
  favorite: boolean;
}

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.3l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z" />
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
  // Favourites: synced via chef_orders.is_favorite when the column exists,
  // otherwise fall back to per-user localStorage (so it works pre-migration).
  const [favSynced, setFavSynced] = useState(true);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const favKey = user ? `provisions:favs:${user.id}` : '';

  useEffect(() => {
    if (configured && !user) navigate('/', { replace: true });
  }, [configured, user, navigate]);

  // local favourites (only used in fallback mode)
  useEffect(() => {
    if (!user) return;
    try {
      const raw = window.localStorage.getItem(`provisions:favs:${user.id}`);
      setFavs(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      /* ignore */
    }
  }, [user]);

  const isFav = (o: ListSummary) => (favSynced ? o.favorite : favs.has(o.id));

  const toggleFav = async (o: ListSummary) => {
    if (favSynced) {
      const next = !o.favorite;
      setLists((prev) => prev.map((l) => (l.id === o.id ? { ...l, favorite: next } : l)));
      await supabase.from('chef_orders').update({ is_favorite: next }).eq('id', o.id);
    } else {
      setFavs((prev) => {
        const next = new Set(prev);
        if (next.has(o.id)) next.delete(o.id);
        else next.add(o.id);
        try {
          if (favKey) window.localStorage.setItem(favKey, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  };

  // close overflow menu on outside click / Escape
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
    let synced = true;
    const primary = await supabase
      .from('chef_orders')
      .select('id,title,status,updated_at,is_favorite')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    let data = primary.data as Array<Record<string, unknown>> | null;
    if (primary.error) {
      // is_favorite column not present yet → fall back to local favourites
      synced = false;
      const fb = await supabase
        .from('chef_orders')
        .select('id,title,status,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      data = fb.data as Array<Record<string, unknown>> | null;
    }
    setFavSynced(synced);
    const rows = data ?? [];
    const withCounts = await Promise.all(
      rows.map(async (o) => {
        const { count } = await supabase
          .from('chef_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', o.id as string)
          .gt('qty', 0);
        return {
          id: o.id as string,
          title: o.title as string,
          status: o.status as string,
          updated_at: o.updated_at as string,
          favorite: !!o.is_favorite,
          itemCount: count ?? 0,
        } as ListSummary;
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

  const markSent = async (o: ListSummary) => {
    setMenuId(null);
    await supabase.from('chef_orders').update({ status: 'sent' }).eq('id', o.id);
    await load();
    if (o.status === 'open') reload(); // active list was sent → catalogue starts fresh
    toast('Marked as sent');
  };

  const makeActive = async (o: ListSummary) => {
    setMenuId(null);
    if (!user) return;
    await supabase.from('chef_orders').update({ status: 'saved' }).eq('user_id', user.id).eq('status', 'open');
    await supabase.from('chef_orders').update({ status: 'open' }).eq('id', o.id);
    await load();
    reload();
    toast('List opened — find it on the catalogue');
    navigate('/');
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
    await supabase.from('chef_orders').update({ status: 'saved' }).eq('user_id', user.id).eq('status', 'open');
    await supabase.from('chef_orders').insert({ user_id: user.id, status: 'open' });
    await load();
    reload();
    toast('Started a new list');
    navigate('/');
  };

  if (!configured) {
    return (
      <div className="account">
        <h1 className="page-title">
          My <em>lists</em>
        </h1>
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

  // favourites sort to the top (each subset already newest-first)
  const sorted = [...lists].sort((a, b) => Number(isFav(b)) - Number(isFav(a)));

  return (
    <>
      <div className="account lists-page">
        <div className="lists-head">
          <h1 className="page-title">
            My <em>lists</em>
          </h1>
          <button className="btn primary" onClick={newList}>
            Start a new list
          </button>
        </div>

        {sorted.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No saved lists yet.</p>
        ) : (
          sorted.map((o) => {
            const fav = isFav(o);
            const sent = o.status === 'sent';
            return (
              <div key={o.id} className="list-card">
                <button className="lc-open" onClick={() => navigate(`/lists/${o.id}`)}>
                  <div className="lc-title">{o.title}</div>
                  <div className="lc-meta">
                    {o.itemCount} item{o.itemCount === 1 ? '' : 's'} · updated{' '}
                    {new Date(o.updated_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </button>

                <button
                  className={`star-btn${fav ? ' on' : ''}`}
                  aria-label={fav ? 'Unfavourite' : 'Favourite'}
                  aria-pressed={fav}
                  onClick={() => toggleFav(o)}
                >
                  <StarIcon filled={fav} />
                </button>

                {o.status === 'open' && <span className="badge open">Open</span>}
                {sent && <span className="badge sent">Sent</span>}

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
                      {sent ? (
                        <button className="overflow-item" role="menuitem" onClick={() => makeActive(o)}>
                          Mark as open
                        </button>
                      ) : (
                        <button className="overflow-item" role="menuitem" onClick={() => markSent(o)}>
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
            );
          })
        )}
      </div>
      <Footer />
    </>
  );
}
