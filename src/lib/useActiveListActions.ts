import { useOrder } from './order';
import { useToast } from '../components/Toast';
import { supabase } from './supabase';
import { groupActive } from './activeList';
import { listText, listCsv, listPrintHtml, downloadCsv, copyText } from './listExport';

/**
 * Export + clear actions for the ACTIVE list, shared by the drawer and the
 * full-page view. Every export is serialised from the list data (never the
 * DOM), so output is clean: "2 × Linguine (500g)" with no UI controls.
 */
export function useActiveListActions() {
  const { lines, notes, title, count, clearOrder, orderId, isDbMode, reload } = useOrder();
  const toast = useToast();

  const groups = () => groupActive(lines, notes);

  // After a real send (export), offer to record the list as sent.
  const promptSent = async () => {
    if (!isDbMode || !orderId) return;
    if (window.confirm('Mark this list as sent?')) {
      await supabase.from('chef_orders').update({ status: 'sent' }).eq('id', orderId);
      reload();
      toast('Marked as sent');
    }
  };

  const doCopy = async () => {
    if (!count) return toast('List is empty');
    const ok = await copyText(listText(title, groups(), count));
    toast(ok ? 'Copied — paste into WhatsApp or email' : 'Copy failed — long-press to select');
    await promptSent();
  };

  const doCsv = async () => {
    if (!count) return toast('List is empty');
    const name = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'list'}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    downloadCsv(name, listCsv(groups()));
    toast('CSV downloaded');
    await promptSent();
  };

  const doPrint = async () => {
    if (!count) return toast('List is empty');
    const pa = document.getElementById('printArea');
    if (pa) {
      pa.innerHTML = listPrintHtml(title, groups(), count);
      window.print();
    }
    await promptSent();
  };

  const doClear = () => {
    if (!count) return toast('Already empty');
    if (window.confirm(`Clear all ${count} item${count === 1 ? '' : 's'}?`)) {
      clearOrder();
      toast('List cleared');
    }
  };

  return { doCopy, doCsv, doPrint, doClear, count };
}
