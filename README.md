# Cargo Provisions

A free, mobile-first provisioning tool for yacht chefs. Browse an extensive
catalogue (~2,500 ingredients across 60+ categories), build an order with
editable units, quantities and per-item notes, and export it straight to a
supplier. Sign in (passwordless) to save your order and pick it back up on any
device.

The catalogue is open to everyone with no account. The **only** thing behind
sign-in is **saving and resuming** an order.

> A standalone product that shares design language with — but is fully isolated
> from — the wider [Cargo](https://cargotechnology.netlify.app) yacht-operations
> platform. See [Isolation](#isolation--cargo).

---

## Features

- **Open catalogue** — ~2,500 items: fresh / chilled / frozen / bakery /
  dry & pantry / world pantry / pastry & modernist / drinks / galley.
- **Search + cuisine filter** — single-tap filter to the ingredients that
  define a cuisine (French, Italian, Japanese, Thai, Mexican, …).
- **Per-item controls** — unit dropdown with sensible per-item options and an
  "Other…" free-text fallback; quantity steppers; an expandable note for cut,
  ripeness, brand, etc.
- **Persistent open order** — autosaves to your account; resume on any device
  over several days.
- **Export** — copy a clean grouped list (WhatsApp / email), CSV, or print.
- **Custom items** — add anything not listed.
- **Passwordless auth** — magic-link sign-in (optional Google), via Resend.
- **GDPR built-in** — consent split, data export, account deletion, withdraw
  consent.

---

## Tech stack

| Layer      | Choice                                   |
|------------|------------------------------------------|
| Front end  | React + Vite + TypeScript + Tailwind     |
| Backend    | Supabase (Postgres, Auth, Edge Functions)|
| Email      | Resend (custom SMTP for auth emails)     |
| Bot guard  | Cloudflare Turnstile                     |
| Hosting    | Netlify                                  |

The catalogue is bundled **client-side** (a static TS module) — browsing is
instant and hits no database. Only orders and profiles are stored server-side.

---

## Getting started

### Prerequisites
- Node 18+ and npm
- A Supabase project (see [Supabase setup](#supabase-setup))
- Supabase CLI (optional, for migrations/functions)

### Install & run
```bash
git clone https://github.com/<owner>/cargo-provisions.git
cd cargo-provisions
npm install
cp .env.example .env   # fill in the values below
npm run dev
```

### Environment variables
Client (`.env`, exposed to the browser — anon key only, never the service role):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_TURNSTILE_SITE_KEY=<turnstile-site-key>
```
Edge function secrets (set in Supabase, **not** in client env):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(usually auto-present in the project's functions runtime).

---

## Supabase setup

1. **Create a project** (separate from Cargo — see [Isolation](#isolation--cargo)).
2. **Run the migration** — `supabase/migrations/0001_chef.sql` creates the
   `chef_*` tables with default-deny row-level security.
3. **Auth → Email:** enable magic-link (OTP). Configure **custom SMTP** with Resend:
   - host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key
   - sender = a verified domain address (e.g. `provisions@send.<your-domain>`)
   - brand the magic-link email template.
4. **Auth → URL config:** add the site URL and `…/auth/callback` to the allow-list.
5. **Auth → Bot protection:** enable Turnstile; put the site key in client env.
6. **(Optional) Providers:** enable Google OAuth.
7. **Deploy the Edge Function** `delete-account` (handles GDPR erasure with the
   service role):
   ```bash
   supabase functions deploy delete-account
   ```

---

## Data model

| Table                 | Purpose                                                        |
|-----------------------|----------------------------------------------------------------|
| `chef_profiles`       | One row per user; profile + vessel details + consent record    |
| `chef_orders`         | A user's orders (`open` / `saved` / `sent`)                    |
| `chef_order_items`    | Items on an order (name, category, unit, qty, note)            |
| `chef_custom_items`   | Analytics: items chefs add that aren't catalogued              |
| `chef_search_misses`  | Analytics: searches returning no results (catalogue gaps)      |

Every table is RLS-protected: a user can only ever read/write their own rows;
anonymous visitors have no database access (they browse the client-side catalogue).

---

## Deployment (Netlify)

- Build command: `npm run build` · Publish directory: `dist`
- SPA fallback — `public/_redirects`:
  ```
  /*  /index.html  200
  ```
- Set the three `VITE_*` env vars in Netlify.
- Custom domain (optional): e.g. `provisions.<your-domain>` via CNAME.

---

## Project structure

```
src/
  data/catalogue.ts          # DATA, TAGS, CATEGORY_CUISINE, UNIT_SETS/MAP, CUISINES, unitOptions, slug
  lib/supabase.ts            # anon client
  lib/order.ts               # order state + localStorage <-> Supabase sync (debounced autosave)
  lib/auth.tsx               # session context, magic-link, Google, sign-out
  components/Catalogue.tsx    ItemRow.tsx  OrderDrawer.tsx
  components/SignInModal.tsx  Onboarding.tsx
  pages/Account.tsx Privacy.tsx Terms.tsx Help.tsx
  App.tsx  main.tsx
public/_redirects
supabase/migrations/0001_chef.sql
supabase/functions/delete-account/index.ts
```

The catalogue data (`src/data/catalogue.ts`) is ported from the reference build
`provisions-list.html`. Keep that one source of truth so the list doesn't
diverge between this app and any future Cargo integration.

---

## Privacy & GDPR

- Catalogue browsing requires no account or personal data.
- Service/account data is processed to provide the tool; **marketing is
  consent-only** (separate, unticked opt-in) and can be withdrawn anytime.
- Users can **export** their data and **delete** their account (cascade) from
  the account page.
- Processors: Supabase, Netlify, Resend, Cloudflare (and Google if OAuth is on).
- See `/privacy`, `/terms`, `/help` in the app.

> The in-app legal copy is a starting template and should be reviewed by a
> professional before launch. Not legal advice.

---

## Roadmap

- Email an order to a supplier (Resend).
- Named/duplicate orders and richer order history.
- Anonymous analytics capture (via Edge Function).
- Fold into Cargo: shared catalogue module, `chef_profiles` as the lead/vessel
  dataset, multi-vessel team accounts, supplier-side surfacing.

---

## Disclaimer

The catalogue is a **reference list**. Availability, pricing, seasonality and
specifications must always be confirmed with your supplier.

## License

[Choose a license] © [YEAR] [Cargo Technology / legal entity]
