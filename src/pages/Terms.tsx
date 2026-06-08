import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LEGAL } from '../lib/constants';

export function Terms() {
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to catalogue
      </Link>
      <article className="prose">
        <h1>Terms of Use — Cargo Provisions</h1>
        <p className="updated">Last updated: {LEGAL.effectiveDate}</p>
        <p>
          Cargo Provisions is a free reference and ordering tool for catering and hospitality
          professionals. The catalogue is a reference list —{' '}
          <b>availability, pricing, seasonality and specifications must always be confirmed with your
          supplier.</b>{' '}
          We make no warranty that any item is available or suitable. You're responsible for what you
          order and for any contracts you make with suppliers. The tool is provided "as is"; to the
          extent permitted by law we're not liable for losses arising from its use. We may change or
          withdraw the tool. By using it you accept these terms and our{' '}
          <Link to="/privacy">Privacy Policy</Link>. Governing law: {LEGAL.jurisdiction}. Contact:{' '}
          {LEGAL.contactEmail}.
        </p>
      </article>
      <Footer />
    </>
  );
}
