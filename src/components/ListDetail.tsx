import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrder } from '../lib/order';
import { useToast } from './Toast';
import { Spinner } from './Spinner';
import {
  groupRows,
  countRows,
  listText,
  listCsv,
  listPrintHtml,
  downloadCsv,
  copyText,
  type ExportRow,
  type ExportGroup,
} from '../lib/listExport';

export interface DetailList {
  id: string;
  title: string;
  status: string;
}

export function ListDetail({
  list,
  onClose,
  onChanged,
}: {
  list: DetailList;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { reload } = useOrder();
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<ExportRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('chef_order_items')
        .select('item_name,category,unit,qty,note')
        .eq('order_id', list.id)
        .gt('qty', 0);
      if (!cancelled) setRows((data ?? []) as ExportRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [list.id]);

  const groups: ExportGroup[] = rows ? groupRows(rows) : [];
  const count = rows ? countRows(rows) : 0;

  // After a chef exports, offer to record that the list was sent.
  const promptSent = async () => {
    if (list.status === 'sent') return;
    if (window.confirm('Mark this list as sent?')) {
      await supabase.from('chef_orders').update({ status: 'sent' }).eq('id', list.id);
      onChanged();
      reload(); // if this was the active list, refresh the catalogue
      toast('Marked as sent');
    }
  };

  const doCopy = async () => {
    if (!count) return toast('This list is empty');
    const ok = await copyText(listText(list.title, groups, count));
    toast(ok ? 'Copied — paste into WhatsApp or email' : 'Copy failed — long-press to select');
    await promptSent();
  };
  const doCsv = async () => {
    if (!count) return toast('This list is empty');
    downloadCsv(`${list.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, listCsv(groups));
    toast('CSV downloaded');
    await promptSent();
  };
  const doPrint = async () => {
    if (!count) return toast('This list is empty');
    const pa = document.getElementById('printArea');
    if (pa) {
      pa.innerHTML = listPrintHtml(list.title, groups, count);
      window.print();
    }
    await promptSent();
  };

  const openOnCatalogue = async () => {
    // Make this the active (open) list, archiving any current open list.
    await supabase.from('chef_orders').update({ status: 'saved' }).eq('status', 'open');
    await supabase.from('chef_orders').update({ status: 'open' }).eq('id', list.id);
    onChanged();
    reload();
    toast('List opened — find it on the catalogue');
    navigate('/');
  };

  return (
    <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal list-detail">
        <div className="ld-head">
          <h3>{list.title}</h3>
          <button className="x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        {rows === null ? (
          <div style={{ padding: '24px 0' }}>
            <Spinner size={36} />
          </div>
        ) : count === 0 ? (
          <p style={{ color: 'var(--ink-soft)', padding: '8px 0 4px' }}>This list is empty.</p>
        ) : (
          <div className="ld-body">
            {groups.map((g) => (
              <div key={g.cat} className="o-cat">
                <h3>{g.cat}</h3>
                {g.items.map((it, i) => (
                  <div key={g.cat + i} className="o-row">
                    <span className="oq">{it.qty}×</span>
                    <span className="on">
                      {it.name}
                      {it.note && <span className="onote">{it.note}</span>}
                    </span>
                    <span className="ou">{it.unit}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="ld-foot">
          <div className="actions">
            <button className="primary" onClick={doCopy}>
              Copy list (for WhatsApp / email)
            </button>
            <button onClick={doCsv}>Export CSV</button>
            <button onClick={doPrint}>Print</button>
            <button className="save-cta" style={{ gridColumn: '1 / -1' }} onClick={openOnCatalogue}>
              Open on the catalogue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
