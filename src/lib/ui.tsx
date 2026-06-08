import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { SignInModal } from '../components/SignInModal';

interface UIContextValue {
  openSignIn: () => void;
}

const UIContext = createContext<UIContextValue>({ openSignIn: () => {} });

/** Renders the single sign-in modal and lets any component open it. */
export function SignInProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSignIn = useCallback(() => setOpen(true), []);
  return (
    <UIContext.Provider value={{ openSignIn }}>
      {children}
      <SignInModal open={open} onClose={() => setOpen(false)} />
    </UIContext.Provider>
  );
}

export function useSignIn() {
  return useContext(UIContext);
}
