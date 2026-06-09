# Branded sign-in email (Resend + Supabase)

Send the magic-link email from **provisions@cargotechnology.co.uk** via Resend,
using the branded template in `magic-link.html`.

## 1. Verify the domain in Resend
1. Resend → **Domains → Add Domain** → `cargotechnology.co.uk`.
2. Add the DNS records Resend gives you (SPF/DKIM, and DMARC if offered) at your
   DNS host. Wait for **Verified**.
3. Resend → **API Keys** → create a key (Sending access). Copy it.

## 2. Point Supabase Auth at Resend (custom SMTP)
Supabase → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP:

| Field          | Value                              |
| -------------- | ---------------------------------- |
| Host           | `smtp.resend.com`                  |
| Port           | `465` (SSL) or `587` (STARTTLS)    |
| Username       | `resend`                           |
| Password       | *your Resend API key*              |
| Sender email   | `provisions@cargotechnology.co.uk` |
| Sender name    | `Cargo Provisions`                 |

Save. (Custom SMTP also lifts Supabase's tiny built-in email rate limit.)

## 3. Use the branded template
Supabase → **Authentication → Email Templates → Magic Link**:
- **Subject:** `Your Cargo Provisions sign-in link`
- **Message body:** paste the contents of `magic-link.html`.

It keeps Supabase's `{{ .ConfirmationURL }}` variable, and the header logo loads
from `https://cargoprovisions.netlify.app/email-logo.png` (regenerate with
`node scripts/build-email-logo.mjs`).

## 4. Test
Sign in with email from the app → confirm the message arrives **from
provisions@cargotechnology.co.uk** with the branded header, and the button signs
you in. Check it doesn't land in spam (proper DKIM/SPF from step 1 prevents that).

> Note: the app's redirect already uses `…/auth/callback`; make sure that URL is
> in **Authentication → URL Configuration → Redirect URLs**.
