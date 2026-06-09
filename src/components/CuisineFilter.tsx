import { useEffect, useState } from 'react';
import { CUISINES, CUISINE_LABEL } from '../data/catalogue';

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="m20 6-11 11-5-5" />
  </svg>
);

/** Multi-select cuisine filter (OR logic). Selections live in the parent and
 *  persist when the menu closes. Renders as a popover on desktop and a
 *  bottom sheet on mobile (driven by CSS). */
export function CuisineFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const count = selected.length;
  const label =
    count === 0
      ? 'Cuisine'
      : count === 1
        ? CUISINE_LABEL[selected[0]] ?? selected[0]
        : `${count} cuisines`;

  const toggle = (code: string) =>
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);

  return (
    <div className="cuisine-filter">
      <button
        className={`filter-btn${count ? ' active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <span className="caret-sm" aria-hidden="true">▾</span>
      </button>

      {open && (
        <>
          <div className="sheet-scrim" onClick={() => setOpen(false)} />
          <div className="cuisine-menu" role="dialog" aria-label="Filter by cuisine">
            <div className="cuisine-menu-head">
              <span>Filter by cuisine</span>
              <button className="link-btn" onClick={() => onChange([])} disabled={count === 0}>
                Clear
              </button>
            </div>
            <div className="cuisine-list">
              {CUISINES.map(([code, lbl]) => {
                const on = selected.includes(code);
                return (
                  <button
                    key={code}
                    className={`check-row${on ? ' on' : ''}`}
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => toggle(code)}
                  >
                    <span className="check-box">{on && <CheckIcon />}</span>
                    <span>{lbl}</span>
                  </button>
                );
              })}
            </div>
            <div className="cuisine-menu-foot">
              <button className="btn-done" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
