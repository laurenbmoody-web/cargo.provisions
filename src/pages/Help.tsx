import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';

const SUPPORT_EMAIL = 'support@cargotechnology.co.uk';

interface QA {
  q: string;
  a: React.ReactNode;
}
interface Section {
  title: string;
  items: QA[];
}

const SECTIONS: Section[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'Is it free?',
        a: 'Yes — completely free to browse, build an order, and send it off.',
      },
      {
        q: 'Do I need an account?',
        a: "No. Browse the full catalogue and build an order straight away. You only sign in if you want to save it and come back to it later, on any device. Without an account your order is saved only on the device you're using — so sign in (or export it) if you don't want to risk losing it.",
      },
      {
        q: 'How do I sign in?',
        a: "Enter your email and we'll send you a one-time secure link — no password to remember. You can also continue with Google if you prefer.",
      },
    ],
  },
  {
    title: 'Building an order',
    items: [
      {
        q: 'Can I change the unit or pack size?',
        a: 'Yes — every item has a unit dropdown (kg, each, case, punnet, bottle, and so on) with an Other… option to type your own. Quantities are fully editable too.',
      },
      {
        q: "Can I add something that isn't listed?",
        a: 'Yes — use "Add your own item" in any category. We keep track of what\'s being added so we can keep growing the catalogue.',
      },
      {
        q: "What's a note for?",
        a: 'Tap the note icon on any item to specify a cut, ripeness, brand or anything else for your supplier — it travels with the order in every export.',
      },
      {
        q: 'Can I have more than one order?',
        a: 'Yes. Keep your current order on the go, and find past ones any time under My orders.',
      },
      {
        q: 'How do I send my order to a supplier?',
        a: 'Open the order panel and tap Copy for a clean, grouped list to paste into WhatsApp or email, Export CSV for a spreadsheet, or Print for a paper pick-list.',
      },
      {
        q: 'Will my supplier be able to fulfil it?',
        a: 'This is a reference list to help you build and send your order. Availability, pricing, seasonality and exact specifications are always between you and your supplier — worth confirming with them directly.',
      },
    ],
  },
  {
    title: 'Your account & data',
    items: [
      {
        q: 'Can I keep an order open over several days?',
        a: "Yes. Once you're signed in, your current order saves automatically as you go. Pick it up any time, on any device, under My orders.",
      },
      {
        q: 'Why do you ask about my vessel?',
        a: "It's optional, and it lets us tailor things like pack sizes and suggest suppliers relevant to where you are. You can fill in as much or as little as you like.",
      },
      {
        q: 'Is my data private?',
        a: (
          <>
            Your orders are private to you. At sign-up we ask a few optional details about your
            galley to tailor the tool, and you choose whether you'd like to hear from Cargo — we
            never sell your data. You can export or delete everything any time from your account.
            See our <Link to="/privacy">Privacy Policy</Link>.
          </>
        ),
      },
    ],
  },
  {
    title: 'About Cargo',
    items: [
      {
        q: 'What is Cargo?',
        a: "Cargo is the wider yacht-operations platform this tool is part of. If you'd like to hear about it, tick the box when you sign up (or any time in your account) — otherwise we'll leave you to your provisioning. ⚓",
      },
      {
        q: 'Something missing or broken?',
        a: (
          <>
            Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> — we'd love to hear
            what you'd add.
          </>
        ),
      },
    ],
  },
];

export function Help() {
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to catalogue
      </Link>
      <article className="prose">
        <h1>Help &amp; FAQ</h1>
        {SECTIONS.map((section) => (
          <section key={section.title} className="faq-section">
            <h2>{section.title}</h2>
            {section.items.map((item) => (
              <div key={item.q} className="faq-item">
                <h3 className="faq-q">{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </section>
        ))}
      </article>
      <Footer />
    </>
  );
}
