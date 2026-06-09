import { DATA } from '../data/catalogue';
import type { OrderLine } from './order';

export interface ActiveItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  note: string;
  cat: string;
  cuisine?: string;
  is_custom?: boolean;
}
export interface ActiveGroup {
  cat: string;
  items: ActiveItem[];
}

/** Group the active list's lines (qty > 0) by category in catalogue order.
 *  Shared by the drawer and the full-page view so they never diverge. */
export function groupActive(
  lines: Record<string, OrderLine>,
  notes: Record<string, string>,
): ActiveGroup[] {
  const order: string[] = [];
  for (const [, cats] of DATA) for (const [cat] of cats) order.push(cat);
  const seen = new Set(order);
  for (const l of Object.values(lines)) if (l.cat && !seen.has(l.cat)) {
    order.push(l.cat);
    seen.add(l.cat);
  }
  const out: ActiveGroup[] = [];
  for (const cat of order) {
    const items = Object.entries(lines)
      .filter(([, l]) => l.cat === cat && l.qty > 0)
      .map(([id, l]) => ({
        id,
        name: l.name,
        unit: l.unit,
        qty: l.qty,
        note: (notes[id] ?? '').trim(),
        cat: l.cat,
        cuisine: l.cuisine,
        is_custom: l.is_custom,
      }));
    if (items.length) out.push({ cat, items });
  }
  return out;
}
