import { Link } from 'react-router-dom';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/help">Help</Link>
        <a
          className="ig"
          href="https://www.instagram.com/cargo_technologyltd"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cargo on Instagram"
          title="Instagram"
        >
          <InstagramIcon />
        </a>
        <span className="cargo">A free tool by Cargo Technology ⚓</span>
      </div>
    </footer>
  );
}
