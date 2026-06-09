import { useOrder } from './order';
import { useToast } from '../components/Toast';

/**
 * Shared 'clear list' action for the ACTIVE list, used by the drawer and the
 * full-page view. Export rendering lives in <ExportButtons/>.
 */
export function useActiveListActions() {
  const { count, clearOrder } = useOrder();
  const toast = useToast();

  const doClear = () => {
    if (!count) return toast('Already empty');
    if (window.confirm(`Clear all ${count} item${count === 1 ? '' : 's'}?`)) {
      clearOrder();
      toast('List cleared');
    }
  };

  return { doClear };
}
