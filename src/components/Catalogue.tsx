import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DATA,
  TAGS,
  CATEGORY_CUISINE,
  CUISINES,
  CUISINE_LABEL,
  slug,
} from '../data/catalogue';
import { useOrder } from '../lib/order';
import { useAuth } from '../lib/auth';
import { logSearchMiss } from '../lib/analytics';
import { useToast } from './Toast';
import { ItemRow, type CatItem } from './ItemRow';

interface CatModel {
  name: string;
  group: string;
  items: CatItem[];
}
interface GroupModel {
  group: string;
  cats: CatModel[];
}

function buildModel(custom: { id: string; cat: string; name: string; unit: string }[]): GroupModel[] {
  const byCat: Record<string, CatItem[]> = {};
  const groups: GroupModel[] = DATA.map(([group, cats]) => ({
    group,
    cats: cats.map(([cat, items]) => {
      const catCu = CATEGORY_CUISINE[cat] ?? [];
      const built: CatItem[] = items.map(([name, unit]) => {
        const t = TAGS[name];
        const cu = Array.from(new Set([...(t ? t.split(',') : []), ...catCu]));
        return { id: `${slug(cat)}:${slug(name)}`, name, unit, cu, custom: false };
      });
      byCat[cat] = built;
      return { name: cat, group, items: built };
    }),
  }));
  // Merge custom items into their categories.
  for (const ci of custom) {
    if (byCat[ci.cat]) {
      byCat[ci.cat].push({ id: ci.id, name: ci.name, unit: ci.unit, custom: true });
    }
  }
  return groups;
}

export function Catalogue({ onOpenOrder }: { onOpenOrder: () => void }) {
  const { customItems, lines, count, isDbMode } = useOrder();
  const { user } = useAuth();
  const toast = useToast();

  const model = useMemo(() => buildModel(customItems), [customItems]);
  const allCats = useMemo(
    () => model.flatMap((g) => g.cats.map((c) => c.name)),
    [model],
  );

  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtering = query.trim() !== '' || cuisine !== 'all';
  const q = query.trim().toLowerCase();

  const matches = (it: CatItem) => {
    const okText = !q || it.name.toLowerCase().includes(q);
    const okCu = cuisine === 'all' || (it.cu ?? []).includes(cuisine);
    return okText && okCu;
  };

  // Per-category filtered items (only computed when filtering).
  const filteredByCat = useMemo(() => {
    if (!filtering) return {};
    const out: Record<string, CatItem[]> = {};
    for (const g of model) for (const c of g.cats) out[c.name] = c.items.filter(matches);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, filtering, q, cuisine]);

  const anyResults = filtering
    ? Object.values(filteredByCat).some((arr) => arr.length > 0)
    : true;

  // Log settled empty searches (signed-in only), debounced.
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isDbMode || !user) return;
    if (!q || anyResults) return;
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => void logSearchMiss(user.id, q), 900);
    return () => {
      if (missTimer.current) clearTimeout(missTimer.current);
    };
  }, [q, anyResults, isDbMode, user]);

  const toggleCat = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const inCount = (items: CatItem[]) =>
    items.filter((i) => lines[i.id] && lines[i.id].qty > 0).length;

  /* ---------- custom item modal ---------- */
  const { addCustom } = useOrder();
  const [modalCat, setModalCat] = useState<string | null>(null);
  const [cName, setCName] = useState('');
  const [cUnit, setCUnit] = useState('each');

  const openModal = (cat: string, prefillName = '') => {
    setModalCat(cat);
    setCName(prefillName);
    setCUnit('each');
  };
  const saveCustom = () => {
    const name = cName.trim();
    if (!name || !modalCat) {
      toast('Give it a name');
      return;
    }
    addCustom(modalCat, name, cUnit.trim() || 'each');
    setExpanded((prev) => new Set(prev).add(modalCat));
    toast('Added ' + name);
    setModalCat(null);
  };

  const scrollToGroup = (group: string) => {
    document.getElementById('g-' + slug(group))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="toolbar">
        <div className="wrap">
          <div className="toolrow">
            <div className="search">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder="Search every item…"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="orderBtn" onClick={onOpenOrder} aria-label="open order">
              Order <span className={`count${count === 0 ? ' zero' : ''}`}>{count}</span>
            </button>
          </div>
          <div className="chips">
            {model.map((g) => (
              <button key={g.group} className="chip" onClick={() => scrollToGroup(g.group)}>
                {g.group}
              </button>
            ))}
          </div>
          <div className="chips cuisinebar">
            <span className="chip cuisine-label">Cuisine</span>
            <button
              className={`chip${cuisine === 'all' ? ' cu-active' : ''}`}
              onClick={() => setCuisine('all')}
            >
              All
            </button>
            {CUISINES.map(([code, label]) => (
              <button
                key={code}
                className={`chip${cuisine === code ? ' cu-active' : ''}`}
                onClick={() => setCuisine(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="catalogue wrap">
        {model.map((g) => {
          const visibleCats = filtering
            ? g.cats.filter((c) => (filteredByCat[c.name] ?? []).length > 0)
            : g.cats;
          if (filtering && visibleCats.length === 0) return null;
          return (
            <div key={g.group}>
              {!filtering && (
                <div className="group-label" id={'g-' + slug(g.group)}>
                  {g.group}
                </div>
              )}
              {visibleCats.map((c) => {
                const open = filtering || expanded.has(c.name);
                const shownItems = filtering ? filteredByCat[c.name] : c.items;
                const badge = inCount(c.items);
                return (
                  <section key={c.name} className={`cat${open ? '' : ' collapsed'}`} id={'c-' + slug(c.name)}>
                    <div
                      className="cat-head"
                      onClick={() => {
                        if (!filtering) toggleCat(c.name);
                      }}
                    >
                      <span className="cname">{c.name}</span>
                      <span className="cmeta">{c.items.length}</span>
                      {badge > 0 && <span className="inorder">{badge} in order</span>}
                      <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                    {open && (
                      <div className="items">
                        {shownItems.map((it) => (
                          <ItemRow key={it.id} item={it} cat={c.name} />
                        ))}
                        {!filtering && (
                          <button className="add-custom" onClick={() => openModal(c.name)}>
                            + Add your own item to {c.name}
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          );
        })}

        {filtering && !anyResults && (
          <div className="nores">
            {q ? (
              <>
                No match for “{q}”.{' '}
                <button
                  className="add-custom"
                  style={{ border: 'none', display: 'inline', width: 'auto', padding: '0 4px' }}
                  onClick={() => {
                    setQuery('');
                    setCuisine('all');
                    openModal(allCats[0], q);
                  }}
                >
                  Add it as a custom item
                </button>
              </>
            ) : (
              <>Nothing tagged “{CUISINE_LABEL[cuisine] ?? cuisine}” yet — try another cuisine or “All”.</>
            )}
          </div>
        )}
      </main>

      {modalCat !== null && (
        <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && setModalCat(null)}>
          <div className="modal">
            <h3>Add your own item</h3>
            <label>Category</label>
            <select value={modalCat} onChange={(e) => setModalCat(e.target.value)}>
              {allCats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label>Item name</label>
            <input
              type="text"
              placeholder="e.g. Yuzu juice"
              autoComplete="off"
              autoFocus
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCustom()}
            />
            <label>Pack / unit</label>
            <input
              type="text"
              placeholder="e.g. bottle, kg, each"
              autoComplete="off"
              value={cUnit}
              onChange={(e) => setCUnit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCustom()}
            />
            <div className="mbtns">
              <button className="cancel" onClick={() => setModalCat(null)}>
                Cancel
              </button>
              <button className="save" onClick={saveCustom}>
                Add item
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
