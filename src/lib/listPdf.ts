import { jsPDF } from 'jspdf';
import type { ExportGroup, Galley } from './listExport';

const NAVY: [number, number, number] = [38, 42, 83];
const RUST: [number, number, number] = [198, 90, 26];
const INK: [number, number, number] = [35, 38, 47];
const INK_SOFT: [number, number, number] = [90, 95, 109];
const GREY: [number, number, number] = [155, 152, 173];
const LINE: [number, number, number] = [230, 225, 216];

const longDate = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/email-logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Build and download a branded, supplier-facing PDF from the list data. */
export async function downloadListPdf(
  title: string,
  galley: Galley,
  groups: ExportGroup[],
  count: number,
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  const bandH = 92;

  const vessel = (galley.vessel ?? '').trim();
  const nameRole = [(galley.name ?? '').trim(), (galley.role ?? '').trim()].filter(Boolean).join(' · ');
  const heading = vessel || title;

  const logo = await loadLogo();

  const drawHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageW, bandH, 'F');
    if (logo) {
      const w = 210;
      const h = w * (210 / 720); // email-logo is 720×210
      doc.addImage(logo, 'PNG', (pageW - w) / 2, (bandH - h) / 2, w, h);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(240, 237, 232);
      doc.text('CARGO PROVISIONS', pageW / 2, bandH / 2 + 6, { align: 'center' });
    }
  };

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(
      'Built with Cargo Provisions · provisions.cargotechnology.co.uk',
      pageW / 2,
      pageH - 24,
      { align: 'center' },
    );
  };

  drawHeader();
  drawFooter();

  let y = bandH + 36;

  // title block
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(heading, margin, y);
  y += 18;
  const meta = [vessel && title !== vessel ? title : '', longDate(), nameRole, `${count} line items`]
    .filter(Boolean)
    .join('  ·  ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK_SOFT);
  doc.text(meta, margin, y);
  y += 22;

  const bottomLimit = pageH - 48;
  const pageBreakIfNeeded = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      drawHeader();
      drawFooter();
      y = bandH + 36;
    }
  };

  for (const g of groups) {
    pageBreakIfNeeded(40);
    // category heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...RUST);
    doc.text(g.cat.toUpperCase(), margin, y);
    y += 7;
    doc.setDrawColor(...LINE);
    doc.line(margin, y, pageW - margin, y);
    y += 14;

    for (const it of g.items) {
      const line = `${it.qty} × ${it.name}${it.unit ? ` (${it.unit})` : ''}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...INK);
      const wrapped = doc.splitTextToSize(line, contentW) as string[];
      const noteWrapped = it.note
        ? (doc.splitTextToSize(`— ${it.note}`, contentW - 14) as string[])
        : [];
      pageBreakIfNeeded(wrapped.length * 14 + noteWrapped.length * 12 + 4);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 14;
      if (noteWrapped.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(...RUST);
        doc.text(noteWrapped, margin + 14, y);
        y += noteWrapped.length * 12;
      }
      y += 4;
    }
    y += 12;
  }

  const safe = (vessel || title).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'list';
  doc.save(`cargo-provisions-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
