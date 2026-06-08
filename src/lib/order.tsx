import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { logCustomItem } from './analytics';

/* ============================================================
   Types
   ============================================================ */
export interface OrderLine {
  qty: number;
  unit: string;
  name: string;
  cat: string; // category name
  cuisine?: string; // comma-separated cuisine codes
  is_custom?: boolean;
}
export interface CustomItem {
  id: string; // item_key
  cat: string;
  name: string;
  unit: string;
}
/** Minimal descriptor the UI passes when changing quantity. */
export interface ItemRef {
  id: string;
  name: string;
  cat: string;
  cuisine?: string;
  is_custom?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface OrderContextValue {
  ready: boolean;
  lines: Record<string, OrderLine>;
  notes: Record<string, string>;
  customItems: CustomItem[];
  count: number;
  saveStatus: SaveStatus;
  isDbMode: boolean;
  setQty: (item: ItemRef, qty: number, unit: string) => void;
  setUnit: (id: string, unit: string) => void;
  setNote: (id: string, note: string) => void;
  addCustom: (cat: string, name: string, unit: string) => string;
  removeLine: (id: string) => void;
  clearOrder: () => void;
  reload: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

/* ============================================================
   localStorage persistence (anonymous) — reuses existing keys
   ============================================================ */
const KEY_ORDER = 'provisions:order';
const KEY_CUSTOM = 'provisions:custom';
const KEY_NOTES = 'provisions:notes';

function lsAvailable(): boolean {
  try {
    const k = '__pls_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
const HAS_LS = lsAvailable();

interface LocalState {
  lines: Record<string, OrderLine>;
  customItems: CustomItem[];
  notes: Record<string, string>;
}

function loadLocal(): LocalState {
  const empty: LocalState = { lines: {}, customItems: [], notes: {} };
  if (!HAS_LS) return empty;
  try {
    const o = window.localStorage.getItem(KEY_ORDER);
    const c = window.localStorage.getItem(KEY_CUSTOM);
    const n = window.localStorage.getItem(KEY_NOTES);
    return {
      lines: o ? JSON.parse(o) : {},
      customItems: c ? JSON.parse(c) : [],
      notes: n ? JSON.parse(n) : {},
    };
  } catch {
    return empty;
  }
}
function saveLocal(s: LocalState) {
  if (!HAS_LS) return;
  try {
    window.localStorage.setItem(KEY_ORDER, JSON.stringify(s.lines));
    window.localStorage.setItem(KEY_CUSTOM, JSON.stringify(s.customItems));
    window.localStorage.setItem(KEY_NOTES, JSON.stringify(s.notes));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}
function clearLocal() {
  if (!HAS_LS) return;
  try {
    window.localStorage.removeItem(KEY_ORDER);
    window.localStorage.removeItem(KEY_CUSTOM);
    window.localStorage.removeItem(KEY_NOTES);
  } catch {
    /* ignore */
  }
}
function isLocalEmpty(s: LocalState): boolean {
  return (
    Object.keys(s.lines).length === 0 &&
    s.customItems.length === 0 &&
    Object.keys(s.notes).length === 0
  );
}

/* ============================================================
   Supabase persistence helpers
   ============================================================ */
async function dbGetOpenOrderId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('chef_orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function dbCreateOpenOrder(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('chef_orders')
    .insert({ user_id: userId, status: 'open' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

interface DbItemRow {
  item_key: string;
  item_name: string;
  category: string | null;
  cuisine: string | null;
  unit: string | null;
  qty: number;
  note: string | null;
  is_custom: boolean;
}

async function dbLoadItems(orderId: string): Promise<LocalState> {
  const { data } = await supabase
    .from('chef_order_items')
    .select('item_key,item_name,category,cuisine,unit,qty,note,is_custom')
    .eq('order_id', orderId);
  const rows = (data ?? []) as DbItemRow[];
  const out: LocalState = { lines: {}, customItems: [], notes: {} };
  for (const r of rows) {
    if (r.qty > 0) {
      out.lines[r.item_key] = {
        qty: r.qty,
        unit: r.unit ?? '',
        name: r.item_name,
        cat: r.category ?? '',
        cuisine: r.cuisine ?? undefined,
        is_custom: r.is_custom,
      };
    }
    if (r.note) out.notes[r.item_key] = r.note;
    if (r.is_custom) {
      out.customItems.push({
        id: r.item_key,
        cat: r.category ?? '',
        name: r.item_name,
        unit: r.unit ?? '',
      });
    }
  }
  return out;
}

function rowFor(orderId: string, key: string, line: OrderLine, note: string) {
  return {
    order_id: orderId,
    item_key: key,
    item_name: line.name,
    category: line.cat || null,
    cuisine: line.cuisine ?? null,
    unit: line.unit || null,
    qty: line.qty,
    note: note ? note : null,
    is_custom: !!line.is_custom,
  };
}

/* ============================================================
   Provider
   ============================================================ */
export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<Record<string, OrderLine>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const orderIdRef = useRef<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const reload = useCallback(() => setReloadCounter((n) => n + 1), []);
  const isDbMode = !!user;

  // Live refs so debounced flushers read current state.
  const linesRef = useRef(lines);
  const notesRef = useRef(notes);
  const customRef = useRef(customItems);
  linesRef.current = lines;
  notesRef.current = notes;
  customRef.current = customItems;

  /* ---------- localStorage autosave (anon only) ---------- */
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistLocal = useCallback(() => {
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      saveLocal({
        lines: linesRef.current,
        customItems: customRef.current,
        notes: notesRef.current,
      });
    }, 300);
  }, []);

  /* ---------- Supabase autosave (signed-in) ---------- */
  // Pending per-item ops, coalesced by item_key.
  const pending = useRef<Map<string, { type: 'upsert' | 'delete' }>>(new Map());
  const dbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushDb = useCallback(async () => {
    if (!user) return;
    const ops = pending.current;
    if (ops.size === 0) return;
    pending.current = new Map();
    setSaveStatus('saving');
    try {
      if (!orderIdRef.current) {
        orderIdRef.current = await dbCreateOpenOrder(user.id);
      }
      const orderId = orderIdRef.current;
      const upserts: ReturnType<typeof rowFor>[] = [];
      const deletes: string[] = [];
      for (const [key, op] of ops) {
        if (op.type === 'delete') {
          deletes.push(key);
        } else {
          const line = linesRef.current[key];
          if (line) upserts.push(rowFor(orderId, key, line, notesRef.current[key] ?? ''));
          else deletes.push(key);
        }
      }
      if (upserts.length) {
        await supabase
          .from('chef_order_items')
          .upsert(upserts, { onConflict: 'order_id,item_key' });
      }
      if (deletes.length) {
        await supabase
          .from('chef_order_items')
          .delete()
          .eq('order_id', orderId)
          .in('item_key', deletes);
      }
      // Touch the order so updated_at reflects activity.
      await supabase.from('chef_orders').update({ status: 'open' }).eq('id', orderId);
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e) {
      console.warn('[order] db flush failed', e);
      setSaveStatus('idle');
    }
  }, [user]);

  const queueDb = useCallback(
    (key: string, type: 'upsert' | 'delete') => {
      pending.current.set(key, { type });
      if (dbTimer.current) clearTimeout(dbTimer.current);
      dbTimer.current = setTimeout(flushDb, 600);
    },
    [flushDb],
  );

  // Persist a change in whichever mode is active.
  const persistKey = useCallback(
    (key: string, type: 'upsert' | 'delete') => {
      if (isDbMode) queueDb(key, type);
      else persistLocal();
    },
    [isDbMode, queueDb, persistLocal],
  );

  /* ---------- Load / migrate when auth state settles ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      if (!user) {
        // Anonymous: load from localStorage.
        orderIdRef.current = null;
        const s = loadLocal();
        if (cancelled) return;
        setLines(s.lines);
        setNotes(s.notes);
        setCustomItems(s.customItems);
        setReady(true);
        return;
      }
      // Signed-in: load DB open order, migrating any local order first.
      try {
        let orderId = await dbGetOpenOrderId(user.id);
        const local = loadLocal();
        if (!isLocalEmpty(local)) {
          if (!orderId) orderId = await dbCreateOpenOrder(user.id);
          // Local wins on conflict.
          const rows: ReturnType<typeof rowFor>[] = [];
          for (const [key, line] of Object.entries(local.lines)) {
            rows.push(rowFor(orderId, key, line, local.notes[key] ?? ''));
          }
          // Custom items that aren't in the order (qty 0) still get a row so
          // they reappear in their category; qty defaults to 0.
          for (const ci of local.customItems) {
            if (!local.lines[ci.id]) {
              rows.push(
                rowFor(
                  orderId,
                  ci.id,
                  { qty: 0, unit: ci.unit, name: ci.name, cat: ci.cat, is_custom: true },
                  local.notes[ci.id] ?? '',
                ),
              );
            }
          }
          if (rows.length) {
            await supabase
              .from('chef_order_items')
              .upsert(rows, { onConflict: 'order_id,item_key' });
          }
          clearLocal();
        }
        const state = orderId ? await dbLoadItems(orderId) : { lines: {}, customItems: [], notes: {} };
        if (cancelled) return;
        orderIdRef.current = orderId;
        setLines(state.lines);
        setNotes(state.notes);
        setCustomItems(state.customItems);
        setReady(true);
      } catch (e) {
        console.warn('[order] db load failed', e);
        if (cancelled) return;
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reloadCounter]);

  /* ---------- Mutations ---------- */
  const setQty = useCallback(
    (item: ItemRef, qty: number, unit: string) => {
      const q = Math.max(0, Math.floor(qty) || 0);
      setLines((prev) => {
        const next = { ...prev };
        if (q > 0) {
          next[item.id] = {
            qty: q,
            unit,
            name: item.name,
            cat: item.cat,
            cuisine: item.cuisine,
            is_custom: item.is_custom,
          };
        } else {
          delete next[item.id];
        }
        return next;
      });
      persistKey(item.id, q > 0 ? 'upsert' : 'delete');
    },
    [persistKey],
  );

  const setUnit = useCallback(
    (id: string, unit: string) => {
      let inOrder = false;
      setLines((prev) => {
        if (!prev[id]) return prev;
        inOrder = true;
        return { ...prev, [id]: { ...prev[id], unit } };
      });
      // Unit is also stored on the line; only persist if it's in the order.
      if (inOrder) persistKey(id, 'upsert');
      else if (!isDbMode) persistLocal();
    },
    [persistKey, isDbMode, persistLocal],
  );

  const setNote = useCallback(
    (id: string, note: string) => {
      setNotes((prev) => {
        const next = { ...prev };
        if (note.trim()) next[id] = note;
        else delete next[id];
        return next;
      });
      // A note only persists to the DB when the item is in the order.
      if (isDbMode) {
        if (linesRef.current[id]) queueDb(id, 'upsert');
      } else {
        persistLocal();
      }
    },
    [isDbMode, queueDb, persistLocal],
  );

  const addCustom = useCallback(
    (cat: string, name: string, unit: string): string => {
      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = `${slugify(cat)}:custom-${slugify(name)}-${Date.now().toString(36)}`;
      setCustomItems((prev) => [...prev, { id, cat, name, unit }]);
      setLines((prev) => ({
        ...prev,
        [id]: { qty: 1, unit, name, cat, is_custom: true },
      }));
      persistKey(id, 'upsert');
      if (isDbMode && user) void logCustomItem(user.id, name, unit, cat);
      return id;
    },
    [persistKey, isDbMode, user],
  );

  const removeLine = useCallback(
    (id: string) => {
      setLines((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      persistKey(id, 'delete');
    },
    [persistKey],
  );

  const clearOrder = useCallback(() => {
    const keys = Object.keys(linesRef.current);
    setLines({});
    if (isDbMode) {
      keys.forEach((k) => queueDb(k, 'delete'));
    } else {
      persistLocal();
    }
  }, [isDbMode, queueDb, persistLocal]);

  const count = useMemo(
    () => Object.values(lines).filter((l) => l.qty > 0).length,
    [lines],
  );

  const value: OrderContextValue = {
    ready,
    lines,
    notes,
    customItems,
    count,
    saveStatus,
    isDbMode,
    setQty,
    setUnit,
    setNote,
    addCustom,
    removeLine,
    clearOrder,
    reload,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}
