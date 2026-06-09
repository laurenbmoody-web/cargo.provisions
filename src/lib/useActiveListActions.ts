import { useOrder, LISTS_UPDATED_EVENT } from './order';
import { useToast } from '../components/Toast';
import { supabase } from './supabase';

/**
 * Shared 'mark as sent' prompt + clear for the ACTIVE list, used by the drawer
 * and the full-page view. Export rendering lives in <ExportButtons/>.
 */
export function useActiveListActions() {
  const { count, clearOrder, orderId, isDbMode, reload } = useOrder();
  const toast = useToast();

  const promptSent = async () => {
    if (!isDbMode || !orderId) return;
    if (window.confirm('Mark this list as sent?')) {
      await supabase.from('chef_orders').update({ status: 'sent' }).eq('id', orderId);
      reload(); // active list sent → catalogue re-adopts another open list
      window.dispatchEvent(new Event(LISTS_UPDATED_EVENT));
      toast('Marked as sent');
    }
  };

  const doClear = () => {
    if (!count) return toast('Already empty');
    if (window.confirm(`Clear all ${count} item${count === 1 ? '' : 's'}?`)) {
      clearOrder();
      toast('List cleared');
    }
  };

  return { promptSent, doClear };
}
