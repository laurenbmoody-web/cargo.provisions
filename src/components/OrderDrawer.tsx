import { useMemo } from 'react';
import { DATA } from '../data/catalogue';
import { useOrder } from '../lib/order';
import { useOrderDrawer, useSignIn } from '../lib/ui';
import { useToast } from './Toast';

interface OrderRow {
  id: string;
  name: string;
  unit: string;
  qty: number;
  note: string;
}
interface OrderGroup {
  cat: string;
  items: OrderRow[];
}

export function OrderDrawer() {
  const { lines, notes, count, removeLine, clearOrder, isDbMode, saveStatus } = useOrder();
  const { drawerOpen: open, closeDrawer } = useOrderDrawer();
  const { openSignIn } = useSignIn();
  const toast = useToast();

  const onClose = closeDrawer;
  const onSignIn = () => {
    closeDrawer();
    openSignIn();
  };

  // Group active lines by category in catalogue order.
  const grouped: OrderGroup[] = useMemo(() => {
    const catOrder: string[] = [];
    for (const [, cats] of DATA) for (const [cat] of cats) catOrder.push(cat);
    // Include any custom categories not in DATA at the end (defensive).
    const seen = new Set(catOrder);
    for (const l of Object.values(lines)) if (l.cat && !seen.has(l.cat)) {
      catOrder.push(l.cat);
      seen.add(l.cat);
    }
    const out: OrderGroup[] = [];
    for (const cat of catOrder) {
      const items = Object.entries(lines)
        .filter(([, l]) => l.cat === cat && l.qty > 0)
        .map(([id, l]) => ({ id, name: l.name, unit: l.unit, qty: l.qty, note: (notes[id] ?? '').trim() }));
      if (items.length) out.push({ cat, items });
    }
    return out;
  }, [lines, notes]);

  const orderText = () => {
    const date = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    let t = `PROVISIONS LIST — ${date}\n`;
    for (const g of grouped) {
      t += `\n${g.cat.toUpperCase()}\n`;
      for (const it of g.items) {
        t += `• ${it.qty} × ${it.name}${it.unit ? ` (${it.unit})` : ''}${it.note ? ` — ${it.note}` : ''}\n`;
      }
    }
    t += `\n${count} line items total.`;
    return t;
  };

  const doCopy = async () => {
    if (!count) return toast('List is empty');
    const t = orderText();
    try {
      await navigator.clipboard.writeText(t);
      toast('Copied — paste into WhatsApp or email');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast('Copied to clipboard');
      } catch {
        toast('Copy failed — long-press to select');
      }
      ta.remove();
    }
  };

  const doCsv = () => {
    if (!count) return toast('List is empty');
    let csv = 'Category,Item,Quantity,Unit,Note\n';
    for (const g of grouped) {
      for (const it of g.items) {
        csv += `"${g.cat}","${it.name}",${it.qty},"${it.unit || ''}","${(it.note || '').replace(/"/g, '""')}"\n`;
      }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `provisions-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV downloaded');
  };

  const doPrint = () => {
    if (!count) return toast('List is empty');
    const pa = document.getElementById('printArea');
    if (!pa) return;
    const date = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    let h = `<h2>Provisions List</h2><div class="pmeta">${date} · ${count} line items</div>`;
    for (const g of grouped) {
      h += `<h3>${g.cat}</h3>`;
      for (const it of g.items) {
        h += `<div class="pr"><span>${it.qty} × ${it.name}${it.note ? ` <em style="color:#666">— ${it.note}</em>` : ''}</span><span>${it.unit || ''}</span></div>`;
      }
    }
    pa.innerHTML = h;
    window.print();
  };

  const doClear = () => {
    if (!count) return toast('Already empty');
    if (!window.confirm('Clear the whole list?')) return;
    clearOrder();
    toast('List cleared');
  };

  const dmeta = count
    ? `${count} item${count > 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'Nothing added yet';

  return (
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <h2>Your list</h2>
            <div className="dmeta">
              {dmeta}
              {isDbMode && saveStatus === 'saving' && ' · saving…'}
              {isDbMode && saveStatus === 'saved' && ' · saved ✓'}
            </div>
          </div>
          <button className="x" onClick={onClose} aria-label="close">
            ×
          </button>
        </div>

        <div className="drawer-body">
          {grouped.length === 0 ? (
            <div className="empty-order">
              <span className="big">Empty so far</span>
              Add items and they'll gather here, ready to send.
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.cat} className="o-cat">
                <h3>{g.cat}</h3>
                {g.items.map((it) => (
                  <div key={it.id} className="o-row">
                    <span className="oq">{it.qty}×</span>
                    <span className="on">
                      {it.name}
                      {it.note && <span className="onote">{it.note}</span>}
                    </span>
                    <span className="ou">{it.unit || ''}</span>
                    <button className="orm" aria-label="remove" onClick={() => removeLine(it.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="drawer-foot">
          <div className="actions">
            {!isDbMode && (
              <button className="save-cta" onClick={onSignIn}>
                Sign in to save this list
              </button>
            )}
            <button className="primary" onClick={doCopy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              Copy list (for WhatsApp / email)
            </button>
            <button onClick={doCsv}>Export CSV</button>
            <button onClick={doPrint}>Print</button>
            <button className="danger" style={{ gridColumn: '1 / -1' }} onClick={doClear}>
              Clear list
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
