import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { LEGAL } from '../lib/constants';

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Do I need an account?',
    a: 'No — browse and build an order straight away. You only sign in if you want to save it and come back to it later (on any device).',
  },
  {
    q: 'How do I sign in?',
    a: "Enter your email and we'll send you a one-time secure link — no password to remember. (You can also use Google if you prefer.)",
  },
  {
    q: 'Can I keep an order open over several days?',
    a: "Yes. Once you're signed in, your current order saves automatically as you go. Pick it up any time from any device under My orders.",
  },
  {
    q: 'How do I send my order to a supplier?',
    a: 'Open the order panel and tap Copy for a clean, grouped list to paste into WhatsApp or email, Export CSV for a spreadsheet, or Print for a paper pick-list.',
  },
  {
    q: 'Can I change the unit or pack size?',
    a: 'Yes — every item has a unit dropdown (kg, each, case, punnet, bottle, etc.) with an Other… option to type your own. Quantities are editable too.',
  },
  {
    q: "Can I add something that isn't listed?",
    a: 'Yes — use "Add your own item" in any category. (We log what people add so we can keep expanding the catalogue.)',
  },
  {
    q: "What's a note for?",
    a: 'Tap the note icon on any item to specify a cut, ripeness, brand or anything else for your supplier — it travels with the order in every export.',
  },
  {
    q: 'Is my data private?',
    a: (
      <>
        Your orders are yours and only visible to you. See our <Link to="/privacy">Privacy Policy</Link>.
        You can export or delete everything from your account at any time.
      </>
    ),
  },
  {
    q: 'What is Cargo?',
    a: "Cargo is the wider yacht-operations platform this tool is part of. If you'd like to hear about it, tick the box in your account — otherwise we'll leave you to your provisioning. ⚓",
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
        {FAQ.map((item) => (
          <div key={item.q}>
            <h2>{item.q}</h2>
            <p>{item.a}</p>
          </div>
        ))}
        <h2>Something missing or broken?</h2>
        <p>Email {LEGAL.supportEmail}.</p>
      </article>
      <Footer />
    </>
  );
}
