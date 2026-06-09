import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';

const SUPPORT_EMAIL = 'support@cargotechnology.co.uk';

export function Privacy() {
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to catalogue
      </Link>
      <article className="prose">
        <h1>Privacy Policy — Cargo Provisions</h1>
        <p className="updated">Last updated: 9 June 2026</p>

        <h2>Who we are</h2>
        <p>
          Cargo Provisions is a free provisioning tool operated by the team behind Cargo ("we",
          "us"). You can reach us about anything in this policy at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, and our full operator details are
          available on request. (We are in the process of incorporating in the United Kingdom; this
          page will be updated with our registered company details once that's complete.)
        </p>

        <h2>What this tool does</h2>
        <p>
          You can browse our provisions catalogue and build an order without an account. If you
          create an account, we save your orders so you can return to them on any device.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <em>Account:</em> your email address — to sign you in via a one-time secure link, or, if
            you choose, through Google sign-in.
          </li>
          <li>
            <em>Profile you give us (optional):</em> your name and role, and optional details about
            your vessel (name, length, type, guest/crew numbers, home port, cruising region, charter
            or private use) and phone number. These are optional and used to tailor the tool.
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
            your in-progress order. We don't use advertising or third-party tracking cookies.
          </li>
        </ul>

        <h2>Why, and our legal basis</h2>
        <p>
          We process your account, profile and order data to provide the service you've asked for,
          and we rely on our legitimate interest to keep the catalogue and tool improving. We only
          send you marketing about Cargo's wider products if you've given consent — a separate,
          optional opt-in you can withdraw at any time in your account.
        </p>

        <h2>Who we share it with</h2>
        <p>We don't sell your data. We use trusted processors to run the service:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database and sign-in (hosted in the EU (Stockholm))
          </li>
          <li>
            <strong>Netlify</strong> — app hosting
          </li>
          <li>
            <strong>Resend</strong> — sending sign-in and other transactional emails
          </li>
          <li>
            <strong>Cloudflare</strong> — bot protection
          </li>
          <li>
            <strong>Google</strong> — only if you choose to sign in with Google
          </li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          We keep your account, profile and orders while your account is active. If you delete your
          account, we delete this data. We may remove accounts that have been inactive for 24 months.
        </p>

        <h2>Your rights</h2>
        <p>
          You can access, correct, export or delete your data, object to or restrict processing, and
          withdraw marketing consent at any time. Use the <b>Export my data</b> and{' '}
          <b>Delete my account</b> tools in your <Link to="/account">account</Link>, or email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. You can also complain to a data
          protection authority — in the UK, the ICO (ico.org.uk); in Spain, the AEPD (aepd.es).
        </p>

        <h2>Changes</h2>
        <p>We'll update this page and the "last updated" date if anything changes.</p>
      </article>
      <Footer />
    </>
  );
}
