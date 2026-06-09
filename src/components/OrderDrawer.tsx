import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder, type ItemRef } from '../lib/order';
import { useOrderDrawer, useSignIn } from '../lib/ui';
import { groupActive } from '../lib/activeList';
import { useActiveListActions } from '../lib/useActiveListActions';
import { ListItemRow } from './ListItemRow';
import { ExportButtons } from './ExportButtons';

export function OrderDrawer() {
  const { lines, notes, count, title, setTitle, orderId, isDbMode, saveStatus, setQty, setUnit, setNote, removeLine } =
    useOrder();
  const { drawerOpen: open, closeDrawer } = useOrderDrawer();
  const { openSignIn } = useSignIn();
  const { promptSent, doClear } = useActiveListActions();
  const navigate = useNavigate();

  const grouped = useMemo(() => groupActive(lines, notes), [lines, notes]);

  const dmeta = count
    ? `${count} item${count > 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'Nothing added yet';

  const refFor = (it: { id: string; name: string; cat: string; cuisine?: string; is_custom?: boolean }): ItemRef => ({
    id: it.id,
    name: it.name,
    cat: it.cat,
    cuisine: it.cuisine,
    is_custom: it.is_custom,
  });

  return (
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={closeDrawer} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              className="drawer-title-input"
              key={title}
              defaultValue={title}
              aria-label="List name"
              onBlur={(e) => {
                if (e.target.value.trim() !== title) setTitle(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />
            <div className="dmeta">
              {dmeta}
              {isDbMode && saveStatus === 'saving' && ' · saving…'}
              {isDbMode && saveStatus === 'saved' && ' · saved ✓'}
            </div>
            {orderId && (
              <button
                className="full-list-link"
                onClick={() => {
                  closeDrawer();
                  navigate(`/lists/${orderId}`);
                }}
              >
                Open full list →
              </button>
            )}
          </div>
          <button className="x" onClick={closeDrawer} aria-label="close">
            ×
          </button>
        </div>

        <div className="drawer-body">
          {grouped.length === 0 ? (
            <div className="empty-order">
              <span className="big">No items yet</span>
              Tap items in the catalogue to build your list.
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.cat} className="o-cat">
                <h3>{g.cat}</h3>
                {g.items.map((it) => (
                  <ListItemRow
                    key={it.id}
                    name={it.name}
                    unit={it.unit}
                    qty={it.qty}
                    note={it.note}
                    onQty={(q) => setQty(refFor(it), q, it.unit)}
                    onUnit={(u) => setUnit(it.id, u)}
                    onNote={(n) => setNote(it.id, n)}
                    onRemove={() => removeLine(it.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <div className="drawer-foot">
          {!isDbMode && (
            <button
              className="save-cta"
              onClick={() => {
                closeDrawer();
                openSignIn();
              }}
            >
              Sign in to save this list
            </button>
          )}
          <ExportButtons title={title} groups={grouped} count={count} onExported={promptSent} />
          <button className="clear-link" onClick={doClear}>
            Clear list
          </button>
        </div>
      </aside>
    </>
  );
}
