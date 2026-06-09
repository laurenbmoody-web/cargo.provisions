import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'provisions:storage-notice-ack';

export function StorageNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="storage-notice">
      <span>
        We use essential storage to keep your list and keep you signed in. No ad tracking. If you
        choose Google sign-in, Google is used too. See our <Link to="/privacy">Privacy Policy</Link>.
      </span>
      <button onClick={dismiss}>Got it</button>
    </div>
  );
}
