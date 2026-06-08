import { memo, useState } from 'react';
import { unitOptions } from '../data/catalogue';
import { useOrder, type ItemRef } from '../lib/order';

export interface CatItem {
  id: string;
  name: string;
  unit: string; // default unit
  cu?: string[];
  custom?: boolean;
}

const OTHER = '__other__';

function ItemRowInner({ item, cat }: { item: CatItem; cat: string }) {
  const { lines, notes, setQty, setUnit, setNote } = useOrder();
  const line = lines[item.id];
  const qty = line?.qty ?? 0;
  const active = qty > 0;
  const currentUnit = line?.unit ?? item.unit;
  const note = notes[item.id] ?? '';

  const [noteOpen, setNoteOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState(false);

  const ref: ItemRef = {
    id: item.id,
    name: item.name,
    cat,
    cuisine: item.cu && item.cu.length ? item.cu.join(',') : undefined,
    is_custom: item.custom,
  };

  const opts = unitOptions(item.unit);
  if (!opts.includes(currentUnit)) opts.unshift(currentUnit);

  const changeQty = (v: number) => setQty(ref, v, currentUnit);

  const onUnitSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === OTHER) {
      setCustomUnit(true);
      return;
    }
    setUnit(item.id, e.target.value);
  };

  const commitCustomUnit = (v: string) => {
    const t = v.trim();
    if (t) setUnit(item.id, t);
    setCustomUnit(false);
  };

  return (
    <div className={`row${active ? ' active' : ''}${item.custom ? ' custom' : ''}`} data-id={item.id}>
      <div className="row-main">
        <div className="iname">
          <span className="iname-text">
            {item.name}
            {item.custom && <span className="custom-tag">· custom</span>}
          </span>
          <button
            className={`note-btn${note ? ' has' : ''}`}
            aria-label="add note"
            title="Add a note"
            onClick={() => setNoteOpen((o) => !o)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4v16h16v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </button>
          {note && !noteOpen && <div className="note-preview">{'“' + note + '”'}</div>}
        </div>

        <div className="unit">
          {customUnit ? (
            <input
              className="unit-custom"
              type="text"
              placeholder="type unit…"
              aria-label="custom unit"
              autoFocus
              defaultValue=""
              onBlur={(e) => commitCustomUnit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  setCustomUnit(false);
                }
              }}
            />
          ) : (
            <select className="unit-sel" aria-label="unit" value={currentUnit} onChange={onUnitSelect}>
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value={OTHER}>Other…</option>
            </select>
          )}
        </div>

        <div className={`qty${active ? ' on' : ''}`}>
          <button className="minus" aria-label="decrease" onClick={() => changeQty(qty - 1)}>
            −
          </button>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="quantity"
            value={qty}
            onChange={(e) => changeQty(parseInt(e.target.value, 10) || 0)}
          />
          <button className="plus" aria-label="increase" onClick={() => changeQty(qty + 1)}>
            +
          </button>
        </div>
      </div>

      {noteOpen && (
        <div className="row-note open">
          <input
            className="note-input"
            type="text"
            autoFocus
            placeholder="Note — e.g. skin on, pin-boned, ripe for Fri, brand, supplier…"
            value={note}
            onChange={(e) => setNote(item.id, e.target.value)}
            onBlur={() => setNoteOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export const ItemRow = memo(ItemRowInner);
