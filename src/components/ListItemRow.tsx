import { memo, useState } from 'react';
import { unitOptions } from '../data/catalogue';

const OTHER = '__other__';

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
 * full-page list view. Editable mode shows steppers / unit dropdown / note
 * editor; read-only mode shows clean values. These on-screen controls are
 * presentation only — exports are serialised from the list data elsewhere,
 * never from this DOM.
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

  if (!editable) {
    return (
      <div className="li-row li-readonly">
        <span className="li-qty-ro">{qty}×</span>
        <span className="li-name">
          {name}
          {note && (
            <span className="li-note-preview">
              <span className="li-note-tag">note</span>
              {note}
            </span>
          )}
        </span>
        <span className="li-unit-ro">{unit}</span>
      </div>
    );
  }

  const opts = unitOptions(unit);
  if (!opts.includes(unit)) opts.unshift(unit);

  return (
    <div className="li-row">
      <div className="li-line">
        <span className="li-name">{name}</span>
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
      </div>

      <div className="li-controls">
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

        <button
          className={`li-note-btn${note ? ' has' : ''}`}
          aria-label={note ? 'Edit note' : 'Add note'}
          onClick={() => setNoteOpen((o) => !o)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4v16h16v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
          note
        </button>

        <button className="li-remove" aria-label="remove" onClick={() => onRemove?.()}>
          ×
        </button>
      </div>

      {noteOpen ? (
        <input
          className="note-input li-note-input"
          type="text"
          autoFocus
          placeholder="Note — e.g. skin on, pin-boned, ripe for Fri, brand…"
          value={note}
          onChange={(e) => onNote?.(e.target.value)}
          onBlur={() => setNoteOpen(false)}
        />
      ) : (
        note && (
          <button className="li-note-preview tappable" onClick={() => setNoteOpen(true)}>
            <span className="li-note-tag">note</span>
            {note}
          </button>
        )
      )}
    </div>
  );
}

export const ListItemRow = memo(ListItemRowInner);
