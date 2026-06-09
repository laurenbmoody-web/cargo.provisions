import { memo, useState } from 'react';
import { unitOptions } from '../data/catalogue';

const OTHER = '__other__';

const NoteGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4v16h16v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

export interface ListItemRowProps {
  name: string;
  unit: string;
  qty: number;
  note: string;
  editable?: boolean;
  onQty?: (qty: number) => void;
  onUnit?: (unit: string) => void;
  onNote?: (note: string) => void;
  onRemove?: () => void;
}

/**
 * The single source-of-truth row used by BOTH the order drawer and the
 * full-page list view, so they can't drift apart. Column order is identical
 * in both editable and read-only modes: name → note-icon → unit → qty → ✕.
 * These on-screen controls are presentation only — exports are serialised
 * from the list data elsewhere, never from this DOM.
 */
function ListItemRowInner({
  name,
  unit,
  qty,
  note,
  editable = true,
  onQty,
  onUnit,
  onNote,
  onRemove,
}: ListItemRowProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);

  const noteLine =
    editable && noteOpen ? (
      <input
        className="note-input li-note-input"
        type="text"
        autoFocus
        placeholder="Note — e.g. skin on, pin-boned, ripe for Fri, brand…"
        value={note}
        onChange={(e) => onNote?.(e.target.value)}
        onBlur={() => setNoteOpen(false)}
      />
    ) : note ? (
      <div className="li-note-line">
        <span className="li-note-tag">note</span>
        {note}
      </div>
    ) : null;

  if (!editable) {
    return (
      <div className="li-row li-readonly">
        <div className="li-line">
          <div className="li-name-wrap">
            <span className="li-name">{name}</span>
            {note && (
              <span className="li-note-icon has static" aria-hidden="true">
                <NoteGlyph />
              </span>
            )}
          </div>
          <span className="li-unit-ro">{unit}</span>
          <span className="li-qty-ro">{qty}×</span>
        </div>
        {noteLine}
      </div>
    );
  }

  const opts = unitOptions(unit);
  if (!opts.includes(unit)) opts.unshift(unit);

  return (
    <div className="li-row">
      <div className="li-line">
        <div className="li-name-wrap">
          <span className="li-name">{name}</span>
          <button
            className={`li-note-icon${note ? ' has' : ''}`}
            aria-label={note ? 'Edit note' : 'Add note'}
            onClick={() => setNoteOpen((o) => !o)}
          >
            <NoteGlyph />
          </button>
        </div>

        <div className="unit li-unit">
          {customUnit ? (
            <input
              className="unit-custom"
              type="text"
              placeholder="type unit…"
              aria-label="custom unit"
              autoFocus
              defaultValue=""
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) onUnit?.(v);
                setCustomUnit(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') setCustomUnit(false);
              }}
            />
          ) : (
            <select
              className="unit-sel"
              aria-label="unit"
              value={unit}
              onChange={(e) => {
                if (e.target.value === OTHER) setCustomUnit(true);
                else onUnit?.(e.target.value);
              }}
            >
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value={OTHER}>Other…</option>
            </select>
          )}
        </div>

        <div className="li-qty">
          <button aria-label="decrease" onClick={() => onQty?.(qty - 1)}>
            −
          </button>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="quantity"
            value={qty}
            onChange={(e) => onQty?.(parseInt(e.target.value, 10) || 0)}
          />
          <button aria-label="increase" onClick={() => onQty?.(qty + 1)}>
            +
          </button>
        </div>

        <button className="li-remove" aria-label="remove" onClick={() => onRemove?.()}>
          ×
        </button>
      </div>

      {noteLine}
    </div>
  );
}

export const ListItemRow = memo(ListItemRowInner);
