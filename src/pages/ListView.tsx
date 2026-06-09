import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useOrder, type ItemRef } from '../lib/order';
import { useToast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { Spinner } from '../components/Spinner';
import { ListItemRow } from '../components/ListItemRow';
import { ExportButtons } from '../components/ExportButtons';
import { groupActive } from '../lib/activeList';
import { useActiveListActions } from '../lib/useActiveListActions';
import { LISTS_UPDATED_EVENT } from '../lib/order';
import { groupRows, countRows, type ExportRow } from '../lib/listExport';

export function ListView() {
  const { id } = useParams();
  const { user, configured } = useAuth();
  const order = useOrder();
  const actions = useActiveListActions();
  const toast = useToast();
  const navigate = useNavigate();

  const isActive = !!id && id === order.orderId;

  // ---- non-active (read-only) list state ----
  const [meta, setMeta] = useState<{ title: string; status: string } | null>(null);
  const [rows, setRows] = useState<ExportRow[] | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (configured && !user) {
      navigate('/', { replace: true });
    }
  }, [configured, user, navigate]);

  const loadStatic = useCallback(async () => {
    if (!id || !user) return;
    const { data: m } = await supabase
      .from('chef_orders')
      .select('title,status')
      .eq('id', id)
      .maybeSingle();
    const { data: its } = await supabase
      .from('chef_order_items')
      .select('item_name,category,unit,qty,note')
      .eq('order_id', id)
      .gt('qty', 0);
    setMeta(m ? { title: (m.title as string) || 'Provisions list', status: m.status as string } : null);
    setNameDraft(((m?.title as string) || 'Provisions list') as string);
    setRows((its ?? []) as ExportRow[]);
  }, [id, user]);

  useEffect(() => {
    if (isActive) return;
    void loadStatic();
  }, [isActive, loadStatic]);

  const refFor = (it: { id: string; name: string; cat: string; cuisine?: string; is_custom?: boolean }): ItemRef => ({
    id: it.id,
    name: it.name,
    cat: it.cat,
    cuisine: it.cuisine,
    is_custom: it.is_custom,
  });

  // ---------- ACTIVE (editable) ----------
  if (isActive) {
    const grouped = groupActive(order.lines, order.notes);
    return (
      <>
        <div className="account list-view">
          <p className="lv-back">
            <Link to="/lists">← My lists</Link>
          </p>
          <div className="lv-head">
            <input
              className="lv-title-input"
              key={order.title}
              defaultValue={order.title}
              aria-label="List name"
              onBlur={(e) => {
                if (e.target.value.trim() !== order.title) order.setTitle(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            <span className="badge open">Open</span>
            <span className="current-tag">Current</span>
          </div>

          {grouped.length === 0 ? (
            <div className="empty-order" style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--line)' }}>
              <span className="big">No items yet</span>
              Tap items in the catalogue to build your list.
            </div>
          ) : (
            grouped.map((g) => (
              <section key={g.cat} className="lv-cat">
                <h3>{g.cat}</h3>
                {g.items.map((it) => (
                  <ListItemRow
                    key={it.id}
                    name={it.name}
                    unit={it.unit}
                    qty={it.qty}
                    note={it.note}
                    onQty={(q) => order.setQty(refFor(it), q, it.unit)}
                    onUnit={(u) => order.setUnit(it.id, u)}
                    onNote={(n) => order.setNote(it.id, n)}
                    onRemove={() => order.removeLine(it.id)}
                  />
                ))}
              </section>
            ))
          )}

          <div style={{ marginTop: 18 }}>
            <button className="clear-link" onClick={actions.doClear}>
              Clear list
            </button>
          </div>
        </div>

        <div className="lv-bar">
          <div className="wrap lv-bar-inner">
            <ExportButtons title={order.title} groups={grouped} count={order.count} onExported={actions.promptSent} />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ---------- NON-ACTIVE (read-only review + export) ----------
  if (!configured) {
    return (
      <div className="account">
        <p className="lv-back">
          <Link to="/lists">← My lists</Link>
        </p>
        <p style={{ color: 'var(--ink-soft)' }}>Sign-in isn't configured in this environment.</p>
      </div>
    );
  }
  if (meta === null || rows === null) {
    return (
      <div className="loading-center">
        <Spinner size={48} />
        <p>Loading list…</p>
      </div>
    );
  }

  const groups = groupRows(rows);
  const count = countRows(rows);
  const sent = meta.status === 'sent';

  const renameStatic = async () => {
    const v = nameDraft.trim() || 'Provisions list';
    if (v !== meta.title) {
      await supabase.from('chef_orders').update({ title: v }).eq('id', id!);
      setMeta({ ...meta, title: v });
    }
  };

  const promptSent = async () => {
    if (sent) return;
    if (window.confirm('Mark this list as sent?')) {
      await supabase.from('chef_orders').update({ status: 'sent' }).eq('id', id!);
      setMeta({ ...meta, status: 'sent' });
      window.dispatchEvent(new Event(LISTS_UPDATED_EVENT));
      toast('Marked as sent');
    }
  };

  const openOnCatalogue = async () => {
    if (!user || !id) return;
    if (meta.status === 'sent') {
      await supabase.from('chef_orders').update({ status: 'open' }).eq('id', id);
    }
    await order.setActiveOrder(id);
    toast('List opened — find it on the catalogue');
    navigate('/');
  };

  return (
    <>
      <div className="account list-view">
        <p className="lv-back">
          <Link to="/lists">← My lists</Link>
        </p>
        <div className="lv-head">
          <input
            className="lv-title-input"
            value={nameDraft}
            aria-label="List name"
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={renameStatic}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          {sent ? <span className="badge sent">Sent</span> : <span className="badge open">Open</span>}
        </div>

        {count === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>This list is empty.</p>
        ) : (
          groups.map((g) => (
            <section key={g.cat} className="lv-cat">
              <h3>{g.cat}</h3>
              {g.items.map((it, i) => (
                <ListItemRow key={g.cat + i} editable={false} name={it.name} unit={it.unit} qty={it.qty} note={it.note} />
              ))}
            </section>
          ))
        )}

        <div style={{ marginTop: 18 }}>
          <button className="btn" onClick={openOnCatalogue}>
            Open on the catalogue to edit
          </button>
        </div>
      </div>

      <div className="lv-bar">
        <div className="wrap lv-bar-inner">
          <ExportButtons title={meta.title} groups={groups} count={count} onExported={promptSent} />
        </div>
      </div>
      <Footer />
    </>
  );
}
