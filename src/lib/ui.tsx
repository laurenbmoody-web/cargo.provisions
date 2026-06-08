import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { SignInModal } from '../components/SignInModal';

interface UIContextValue {
  openSignIn: () => void;
  query: string;
  setQuery: (q: string) => void;
}

const UIContext = createContext<UIContextValue>({
  openSignIn: () => {},
  query: '',
  setQuery: () => {},
});

/** Holds shared UI state: the single sign-in modal + the catalogue search query
 *  (lifted so the nav bar search box can drive the catalogue). */
export function SignInProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const openSignIn = useCallback(() => setOpen(true), []);
  return (
    <UIContext.Provider value={{ openSignIn, query, setQuery }}>
      {children}
      <SignInModal open={open} onClose={() => setOpen(false)} />
    </UIContext.Provider>
  );
}

export function useSignIn() {
  return useContext(UIContext);
}

export function useSearch() {
  const { query, setQuery } = useContext(UIContext);
  return { query, setQuery };
}
