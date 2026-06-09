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

export interface Galley {
  vessel?: string | null;
  name?: string | null;
  role?: string | null;
}

/**
 * Standard galley header line for exports: 'MY Test · 9 Jun 2026 — Lauren
 * Moody · head chef'. Length/type/home port/region are internal and never
 * included. Returns '' when there's no galley identity (omit gracefully).
 */
export function galleyHeader(g: Galley): string {
  const vessel = (g.vessel ?? '').trim();
  const name = (g.name ?? '').trim();
  const role = (g.role ?? '').trim();
  if (!vessel && !name && !role) return '';
  const left = [vessel, shortDate()].filter(Boolean).join(' · ');
  const right = [name, role].filter(Boolean).join(' · ');
  return [left, right].filter(Boolean).join(' — ');
}

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

/** Plain-text grouped list (for Copy / Email body). Galley header on top. */
export function listText(title: string, groups: ExportGroup[], count: number, header = ''): string {
  let t = '';
  if (header) t += `${header}\n`;
  // keep a date on the title line only when there's no galley header carrying it
  t += `${title.toUpperCase()}${header ? '' : ` — ${shortDate()}`}\n`;
  for (const g of groups) {
    t += `\n${g.cat.toUpperCase()}\n`;
    for (const it of g.items) {
      t += `• ${it.qty} × ${it.name}${it.unit ? ` (${it.unit})` : ''}${it.note ? ` — ${it.note}` : ''}\n`;
    }
  }
  t += `\n${count} line items total.`;
  return t;
}

/** Email subject line. */
export function listSubject(title: string): string {
  return `Provisions order — ${title} — ${shortDate()}`;
}

export function mailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** CSV — raw data. Optional galley header as a single comment cell (no commas,
 *  so it can't shift the data columns). */
export function listCsv(groups: ExportGroup[], header = ''): string {
  let csv = '';
  if (header) csv += `# ${header}\n`; // header uses ' · '/' — ' (no commas) → one cell
  csv += 'Category,Item,Quantity,Unit,Note\n';
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
  galley: Galley,
  groups: ExportGroup[],
  count: number,
): string {
  const vessel = (galley.vessel ?? '').trim();
  const nameRole = [(galley.name ?? '').trim(), (galley.role ?? '').trim()].filter(Boolean).join(' · ');
  const heading = vessel || title;
  const metaParts: string[] = [];
  if (vessel && title && title !== vessel) metaParts.push(esc(title));
  metaParts.push(longDate());
  if (nameRole) metaParts.push(esc(nameRole));
  metaParts.push(`${count} line items`);
  let h =
    `<div class="pa-brand"><img class="pa-logo" src="/Centered_Logo.svg" alt="Cargo" /><span class="pa-sub">Provisions</span></div>` +
    `<h2>${esc(heading)}</h2>` +
    `<div class="pmeta">${metaParts.join(' · ')}</div>`;
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
