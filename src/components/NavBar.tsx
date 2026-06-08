import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSignIn } from '../lib/ui';

/** Cargo brand mark — interlocking swirl, approximated from the Cargo logo.
 *  Swap for the official asset when available. */
function CargoMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <path
        d="M20 7 C12 7 7 12 7 19.5 C7 25.5 11 29.5 16 29.5 C20.5 29.5 23.5 26.5 23.5 22.2 C23.5 18.5 21.2 16 18 16"
        fill="none"
        stroke="var(--navy)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M20 33 C28 33 33 28 33 20.5 C33 14.5 29 10.5 24 10.5 C19.5 10.5 16.5 13.5 16.5 17.8 C16.5 21.5 18.8 24 22 24"
        fill="none"
        stroke="var(--rust)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NavBar() {
  const { user, configured, signOut } = useAuth();
  const { openSignIn } = useSignIn();
  const navigate = useNavigate();
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
          <CargoMark />
          <span className="brand-word">
            cargo
            <span className="brand-sub">Provisions</span>
          </span>
        </Link>

        <div className="nav-actions">
          {/* Order history */}
          <button
            className="icon-btn"
            aria-label="Order history"
            title="Order history"
            onClick={() => (configured && user ? go('/account') : openSignIn())}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5" />
              <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>

          {/* Account */}
          <div className="acct" ref={menuRef}>
            <button
              className={`acct-btn${user ? ' signed-in' : ''}`}
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {user ? (
                <span className="avatar">{initial}</span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div className="acct-menu" role="menu">
                {!configured ? (
                  <div className="acct-note">Sign-in isn't configured yet.</div>
                ) : user ? (
                  <>
                    <div className="acct-head">
                      <div className="acct-head-label">Signed in as</div>
                      <div className="acct-head-email">{user.email}</div>
                    </div>
                    <button className="acct-item" role="menuitem" onClick={() => go('/account')}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                      </svg>
                      My profile
                    </button>
                    <button className="acct-item" role="menuitem" onClick={() => go('/account')}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v5h5" />
                        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      Order history
                    </button>
                    <button className="acct-item" role="menuitem" onClick={() => go('/help')}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
                        <path d="M12 17h.01" />
                      </svg>
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
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="m16 17 5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="acct-item primary"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        openSignIn();
                      }}
                    >
                      Log in or sign up
                    </button>
                    <div className="acct-note">
                      Browse freely — sign in only to save your order across devices.
                    </div>
                    <div className="acct-divider" />
                    <Link className="acct-item" role="menuitem" to="/help" onClick={() => setMenuOpen(false)}>
                      Help &amp; FAQ
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
