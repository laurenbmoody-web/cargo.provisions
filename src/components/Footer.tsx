import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/help">Help</Link>
        <span className="cargo">A free tool by Cargo Technology ⚓</span>
      </div>
    </footer>
  );
}
