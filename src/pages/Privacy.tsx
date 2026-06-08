import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LEGAL } from '../lib/constants';

export function Privacy() {
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to catalogue
      </Link>
      <article className="prose">
        <h1>Privacy Policy — Cargo Provisions</h1>
        <p className="updated">Last updated: {LEGAL.effectiveDate}</p>

        <h2>Who we are</h2>
        <p>
          Cargo Provisions is a free provisioning tool provided by {LEGAL.entity} ("we", "us"),{' '}
          {LEGAL.address}. Contact: {LEGAL.privacyEmail}.
        </p>

        <h2>What this tool does</h2>
        <p>
          You can browse our provisions catalogue without an account. If you create an account, we
          save your orders so you can return to them on any device.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <em>Account:</em> your email address (to sign you in via a secure link).
          </li>
          <li>
            <em>Profile you give us:</em> your name and role, and optional details about your vessel
            (name, length, type, guest/crew numbers, home port, cruising region, charter/private
            use) and phone number. These are optional and used to tailor the tool.
          </li>
          <li>
            <em>Your orders:</em> the items, quantities, units and notes you save.
          </li>
          <li>
            <em>Product analytics:</em> items you add that aren't in our catalogue, and searches that
            return no results — so we can improve the catalogue.
          </li>
          <li>
            <em>Technical:</em> essential cookies/local storage to keep you signed in and to hold
            your in-progress order.
          </li>
        </ul>

        <h2>Why, and our legal basis</h2>
        <p>
          We process your account, profile and order data to provide the service you've asked for
          (and our legitimate interest in improving it). We only send you marketing about Cargo's
          wider products <b>if you have given consent</b>, which you can withdraw at any time in your
          account.
        </p>

        <h2>Who we share it with</h2>
        <p>
          We don't sell your data. We use trusted processors to run the service: Supabase (database &
          sign-in, hosted in {LEGAL.hostingRegion}), Netlify (app hosting), Resend (sending
          sign-in/transactional emails) and Cloudflare (bot protection). And Google, if you choose to
          sign in with Google.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep your account, profile and orders while your account is active. If you delete your
          account, we delete this data. We may remove long-inactive accounts after{' '}
          {LEGAL.inactivePeriod}.
        </p>

        <h2>Your rights</h2>
        <p>
          You can access, correct, export or delete your data, object to or restrict processing, and
          withdraw marketing consent. Use the <b>Export my data</b> and <b>Delete my account</b>{' '}
          tools in your <Link to="/account">account</Link>, or email {LEGAL.privacyEmail}. You can
          complain to your data protection authority (UK: the ICO, ico.org.uk; Spain: the AEPD,
          aepd.es).
        </p>

        <h2>Changes</h2>
        <p>We'll update this page and the "last updated" date if anything changes.</p>
      </article>
      <Footer />
    </>
  );
}
