import { DATA, slug } from '../data/catalogue';

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

export const SIGNATURE = '— Sent via Cargo Provisions';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const longDate = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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

/** Plain-text grouped list (for Copy / Email body). */
export function listText(
  title: string,
  groups: ExportGroup[],
  count: number,
  opts: { signature?: boolean } = {},
): string {
  let t = `${title.toUpperCase()} — ${shortDate()}\n`;
  for (const g of groups) {
    t += `\n${g.cat.toUpperCase()}\n`;
    for (const it of g.items) {
      t += `• ${it.qty} × ${it.name}${it.unit ? ` (${it.unit})` : ''}${it.note ? ` — ${it.note}` : ''}\n`;
    }
  }
  t += `\n${count} line items total.`;
  if (opts.signature) t += `\n\n${SIGNATURE}`;
  return t;
}

/** Email subject line. */
export function listSubject(title: string): string {
  return `Provisions order — ${title} — ${shortDate()}`;
}

export function mailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** CSV — raw data, no in-file branding. */
export function listCsv(groups: ExportGroup[]): string {
  let csv = 'Category,Item,Quantity,Unit,Note\n';
  for (const g of groups) {
    for (const it of g.items) {
      csv += `"${g.cat}","${it.name}",${it.qty},"${it.unit || ''}","${(it.note || '').replace(/"/g, '""')}"\n`;
    }
  }
  return csv;
}

/** Branded filename: cargo-provisions-[vessel]-[date].csv */
export function csvFilename(vesselOrTitle: string): string {
  const v = slug(vesselOrTitle) || 'list';
  return `cargo-provisions-${v}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * Branded, supplier-facing print/PDF document built from the list data.
 * Cargo Provisions wordmark + vessel + date header, sections, quiet footer.
 */
export function brandedPrintHtml(
  title: string,
  vesselName: string,
  groups: ExportGroup[],
  count: number,
): string {
  const heading = vesselName.trim() || title;
  const subtitle = vesselName.trim() && vesselName.trim() !== title ? `${esc(title)} · ` : '';
  let h =
    `<div class="pa-brand"><img class="pa-logo" src="/Centered_Logo.svg" alt="Cargo" /><span class="pa-sub">Provisions</span></div>` +
    `<h2>${esc(heading)}</h2>` +
    `<div class="pmeta">${subtitle}${longDate()} · ${count} line items</div>`;
  for (const g of groups) {
    h += `<h3>${esc(g.cat)}</h3>`;
    for (const it of g.items) {
      h += `<div class="pr"><span>${it.qty} × ${esc(it.name)}${
        it.note ? ` <em style="color:#666">— ${esc(it.note)}</em>` : ''
      }</span><span>${esc(it.unit || '')}</span></div>`;
    }
  }
  h += `<div class="pa-foot">Built with Cargo Provisions · cargoprovisions.netlify.app</div>`;
  return h;
}

export function printHtml(html: string) {
  const pa = document.getElementById('printArea');
  if (!pa) return;
  pa.innerHTML = html;
  window.print();
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
