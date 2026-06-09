import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from './Toast';
import {
  listText,
  listCsv,
  listSubject,
  mailtoHref,
  downloadCsv,
  csvFilename,
  copyText,
  galleyHeader,
  type ExportGroup,
  type Galley,
} from '../lib/listExport';
import { downloadListPdf } from '../lib/listPdf';

/**
 * Uniform export actions for every list surface (drawer, full page, past
 * lists): Copy (primary) · Email (mailto) · Download ▾ (PDF / CSV). All output
 * is serialised from the list data, never the DOM. PDF downloads a real file.
 */
export function ExportButtons({
  title,
  groups,
  count,
}: {
  title: string;
  groups: ExportGroup[];
  count: number;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [galley, setGalley] = useState<Galley>({});
  const [dlOpen, setDlOpen] = useState(false);
  const dlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setGalley({});
      return;
    }
    supabase
      .from('chef_profiles')
      .select('vessel_name,full_name,role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) =>
        setGalley({
          vessel: (data?.vessel_name as string) ?? '',
          name: (data?.full_name as string) ?? '',
          role: (data?.role as string) ?? '',
        }),
      );
  }, [user]);

  const vessel = (galley.vessel ?? '').trim();
  const header = galleyHeader(galley);

  useEffect(() => {
    if (!dlOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node)) setDlOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dlOpen]);

  const empty = () => {
    toast('This list is empty');
    return true;
  };

  const doCopy = async () => {
    if (!count) return empty();
    const ok = await copyText(listText(title, groups, count, header));
    toast(ok ? 'Copied — paste into WhatsApp or email' : 'Copy failed — long-press to select');
  };

  const doEmail = () => {
    if (!count) return empty();
    window.location.href = mailtoHref(listSubject(title), listText(title, groups, count, header));
  };

  const doPdf = async () => {
    setDlOpen(false);
    if (!count) return empty();
    toast('Preparing PDF…');
    await downloadListPdf(title, galley, groups, count);
  };

  const doCsv = () => {
    setDlOpen(false);
    if (!count) return empty();
    downloadCsv(csvFilename(vessel || title), listCsv(groups, header));
    toast('CSV downloaded');
  };

  return (
    <div className="export-actions">
      <button className="ea-btn primary" onClick={doCopy}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        Copy
      </button>
      <div className="ea-row">
        <button className="ea-btn" onClick={doEmail}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          Email
        </button>
        <div className="ea-dl" ref={dlRef}>
          <button className="ea-btn" aria-haspopup="menu" aria-expanded={dlOpen} onClick={() => setDlOpen((o) => !o)}>
            Download <span className="caret-sm" aria-hidden="true">▾</span>
          </button>
          {dlOpen && (
            <div className="ea-menu" role="menu">
              <button className="ea-menu-item" role="menuitem" onClick={doPdf}>
                <b>PDF</b>
                <span>download to send or print</span>
              </button>
              <button className="ea-menu-item" role="menuitem" onClick={doCsv}>
                <b>CSV</b>
                <span>for spreadsheets</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
