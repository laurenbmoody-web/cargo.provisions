import { DATA } from '../data/catalogue';

export interface ExportRow {
  item_name: string;
  category: string | null;
  unit: string | null;
  qty: number;
  note: string | null;
}
export interface ExportGroup {
  cat: string;
  items: { name: string; unit: string; qty: number; note: string }[];
}

/** Group rows (qty > 0) by category in catalogue order. */
export function groupRows(rows: ExportRow[]): ExportGroup[] {
  const order: string[] = [];
  for (const [, cats] of DATA) for (const [cat] of cats) order.push(cat);
  const seen = new Set(order);
  for (const r of rows) if (r.category && !seen.has(r.category)) {
    order.push(r.category);
    seen.add(r.category);
  }
  const out: ExportGroup[] = [];
  for (const cat of order) {
    const items = rows
      .filter((r) => (r.category ?? '') === cat && r.qty > 0)
      .map((r) => ({ name: r.item_name, unit: r.unit ?? '', qty: r.qty, note: (r.note ?? '').trim() }));
    if (items.length) out.push({ cat, items });
  }
  return out;
}

export function countRows(rows: ExportRow[]): number {
  return rows.filter((r) => r.qty > 0).length;
}

export function listText(title: string, groups: ExportGroup[], count: number): string {
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  let t = `${title.toUpperCase()} — ${date}\n`;
  for (const g of groups) {
    t += `\n${g.cat.toUpperCase()}\n`;
    for (const it of g.items) {
      t += `• ${it.qty} × ${it.name}${it.unit ? ` (${it.unit})` : ''}${it.note ? ` — ${it.note}` : ''}\n`;
    }
  }
  t += `\n${count} line items total.`;
  return t;
}

export function listCsv(groups: ExportGroup[]): string {
  let csv = 'Category,Item,Quantity,Unit,Note\n';
  for (const g of groups) {
    for (const it of g.items) {
      csv += `"${g.cat}","${it.name}",${it.qty},"${it.unit || ''}","${(it.note || '').replace(/"/g, '""')}"\n`;
    }
  }
  return csv;
}

export function listPrintHtml(title: string, groups: ExportGroup[], count: number): string {
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  let h = `<h2>${title}</h2><div class="pmeta">${date} · ${count} line items</div>`;
  for (const g of groups) {
    h += `<h3>${g.cat}</h3>`;
    for (const it of g.items) {
      h += `<div class="pr"><span>${it.qty} × ${it.name}${
        it.note ? ` <em style="color:#666">— ${it.note}</em>` : ''
      }</span><span>${it.unit || ''}</span></div>`;
    }
  }
  return h;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
