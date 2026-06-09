import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';

const SUPPORT_EMAIL = 'support@cargotechnology.co.uk';

export function Terms() {
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to catalogue
      </Link>
      <article className="prose">
        <h1>Terms of Use — Cargo Provisions</h1>
        <p className="updated">Last updated: 9 June 2026</p>

        <h2>About this tool</h2>
        <p>
          Cargo Provisions is a free reference and ordering tool for catering and hospitality
          professionals, operated by the team behind Cargo ("we", "us"). By using it you accept
          these terms and our <Link to="/privacy">Privacy Policy</Link>. If you don't agree, please
          don't use the tool.
        </p>

        <h2>The catalogue is a reference</h2>
        <p>
          The catalogue is a reference list to help you build and send an order.{' '}
          <b>Availability, pricing, seasonality and exact specifications must always be confirmed
          with your supplier.</b>{' '}
          We make no warranty that any item listed is available, accurately described, or suitable
          for your needs. You're responsible for what you order and for any agreements or contracts
          you make with your suppliers — we're not a party to them.
        </p>

        <h2>Your account</h2>
        <p>
          You can browse and build an order without an account. If you create one, keep your email
          access secure, as that's how you sign in. You're responsible for activity under your
          account. You can delete your account and data at any time from your{' '}
          <Link to="/account">account page</Link>.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Please use the tool only for its intended purpose. Don't misuse it, attempt to disrupt or
          gain unauthorised access to it, scrape or copy the catalogue wholesale, or use it to break
          the law. We may suspend or withdraw access if it's misused.
        </p>

        <h2>Communications</h2>
        <p>
          We'll send you essential service emails (such as your sign-in link). We'll only send you
          marketing about Cargo's wider products if you've opted in, and you can withdraw that at any
          time.
        </p>

        <h2>Availability and changes</h2>
        <p>
          The tool is provided "as is" and free of charge. We don't guarantee it will always be
          available, uninterrupted or error-free, and we may change, suspend or withdraw it, or
          update these terms, at any time. We'll update the "last updated" date when terms change;
          continuing to use the tool means you accept the changes.
        </p>

        <h2>Liability</h2>
        <p>
          To the fullest extent permitted by law, we're not liable for any loss arising from your use
          of the tool — including losses connected to orders placed with suppliers, unavailable or
          incorrectly specified items, or any interruption to the service. Nothing in these terms
          limits liability that can't be limited by law.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales, and disputes are subject to the
          courts of England and Wales.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </article>
      <Footer />
    </>
  );
}
