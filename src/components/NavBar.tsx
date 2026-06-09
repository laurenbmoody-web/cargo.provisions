import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useOrder } from '../lib/order';
import { useSignIn, useSearch, useOrderDrawer } from '../lib/ui';

/* Modern, consistent line icons (1.75 stroke, rounded). */
const HistoryIcon = ({ size = 21 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4v4h4" />
    <path d="M3.5 9a8.5 8.5 0 1 1-1 4" />
    <path d="M12 8v4.2l3 1.8" />
  </svg>
);
const UserIcon = ({ size = 21 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
  </svg>
);
const HelpIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.2a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .9-1 1.6" />
    <path d="M12 16.5h.01" />
  </svg>
);
const SignOutIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
const LogInIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);
// lucide clipboard-list — an order list, not a checkout cart
const ClipboardListIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

export function NavBar() {
  const { user, configured, signOut } = useAuth();
  const { openSignIn } = useSignIn();
  const { query, setQuery } = useSearch();
  const { openDrawer } = useOrderDrawer();
  const { count } = useOrder();
  const navigate = useNavigate();
  const location = useLocation();
  const onCatalogue = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner wrap">
        <Link to="/" className="brand" aria-label="Cargo Provisions — home">
          <img className="brand-logo" src="/Centered_Logo.svg" alt="Cargo" />
          <span className="brand-sub">Provisions</span>
        </Link>

        {onCatalogue && (
          <div className="nav-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search every item…"
              autoComplete="off"
              aria-label="Search the catalogue"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <div className="nav-actions">
          {/* Order list (opens the order drawer) */}
          <button
            className="order-pill"
            aria-label={`View list (${count} item${count === 1 ? '' : 's'})`}
            onClick={openDrawer}
          >
            <ClipboardListIcon size={18} />
            <span className="order-pill-label">List</span>
            {count > 0 && <span className="order-count">{count}</span>}
          </button>

          {/* Order history */}
          <button
            className="icon-btn"
            aria-label="My lists"
            title="My lists"
            onClick={() => (configured && user ? go('/account') : openSignIn())}
          >
            <HistoryIcon />
          </button>

          {/* Account — dropdown when signed in, direct 'Sign in' button when not */}
          {user ? (
            <div className="acct" ref={menuRef}>
              <button
                className="acct-btn signed-in"
                aria-label="Account"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="avatar">{initial}</span>
              </button>

              {menuOpen && (
                <div className="acct-menu" role="menu">
                  <div className="acct-head">
                    <div className="acct-head-label">Signed in as</div>
                    <div className="acct-head-email">{user.email}</div>
                  </div>
                  <button className="acct-item" role="menuitem" onClick={() => go('/account')}>
                    <UserIcon size={18} />
                    My profile
                  </button>
                  <button className="acct-item" role="menuitem" onClick={() => go('/account')}>
                    <HistoryIcon size={18} />
                    My lists
                  </button>
                  <button className="acct-item" role="menuitem" onClick={() => go('/help')}>
                    <HelpIcon size={18} />
                    Help
                  </button>
                  <div className="acct-divider" />
                  <button
                    className="acct-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                  >
                    <SignOutIcon size={18} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="signin-pill" onClick={openSignIn}>
              <LogInIcon size={18} />
              <span className="signin-pill-label">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
