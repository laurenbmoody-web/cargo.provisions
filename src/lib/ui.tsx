import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { SignInModal } from '../components/SignInModal';

interface UIContextValue {
  openSignIn: () => void;
  query: string;
  setQuery: (q: string) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const UIContext = createContext<UIContextValue>({
  openSignIn: () => {},
  query: '',
  setQuery: () => {},
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

/** Holds shared UI state: the sign-in modal, the catalogue search query
 *  (so the nav bar search box can drive the catalogue) and the order drawer
 *  (so the nav bar Order control can open it). */
export function SignInProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openSignIn = useCallback(() => setOpen(true), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  return (
    <UIContext.Provider
      value={{ openSignIn, query, setQuery, drawerOpen, openDrawer, closeDrawer }}
    >
      {children}
      <SignInModal open={open} onClose={() => setOpen(false)} />
    </UIContext.Provider>
  );
}

export function useSignIn() {
  const { openSignIn } = useContext(UIContext);
  return { openSignIn };
}

export function useSearch() {
  const { query, setQuery } = useContext(UIContext);
  return { query, setQuery };
}

export function useOrderDrawer() {
  const { drawerOpen, openDrawer, closeDrawer } = useContext(UIContext);
  return { drawerOpen, openDrawer, closeDrawer };
}
