# AI Yacht

Landing page for the AI Yacht bootcamp — 10 days in the Caribbean, 7 of them
aboard a catamaran, November 12–22 2026.

Built as a single statically exported page, deployed to Cloudflare Workers.

## Stack

| Piece      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router), `output: "export"`         |
| Language   | TypeScript                                         |
| Styling    | Tailwind CSS v4, OKLCH design tokens in `globals.css` |
| Fonts      | Manrope + Playfair Display, self-hosted via `next/font` |
| Form       | EmailJS (browser SDK) → `support@ctmass.com`        |
| Hosting    | Cloudflare Workers static assets                    |

There is no server, no database and no API route: `next build` produces plain
HTML/CSS/JS in `out/`, which Cloudflare serves from its edge.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # static export into out/
npm run lint
npm run preview    # serve the built out/ through a local Worker
npm run deploy     # build + wrangler deploy (needs Cloudflare auth)
```

## Configuration

Everything environment-specific lives in [`src/lib/site.ts`](src/lib/site.ts).
**Change the production domain in one place** — `siteConfig.domain` and
`siteConfig.url` — and the metadata, Open Graph tags and footer follow.

Each EmailJS value has a working default baked in, so the project builds and
sends mail with no `.env` file at all. To point the form elsewhere, create
`.env.local`:

```ini
NEXT_PUBLIC_EMAILJS_SERVICE_ID=default_service
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_epduqer
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=as4ih3rGW3abw98dk
NEXT_PUBLIC_CONTACT_EMAIL=support@ctmass.com
```

The EmailJS public key is designed to be visible in the browser — EmailJS
prevents abuse with a domain allow-list in its dashboard, not by keeping the
key secret. Add the production domain to that allow-list before going live.

### The application email

`src/lib/application-email.ts` builds the message. It sends three fields to the
shared `template_epduqer` EmailJS template:

- `subject` — `AI Yacht — new application from <name>`
- `html` — the branded email body
- `text` — a plain-text fallback

> **If the email arrives as raw HTML source instead of a rendered message,**
> the EmailJS template is escaping it. Open the template in the EmailJS
> dashboard and make sure the content field uses **triple** braces —
> `{{{html}}}`, not `{{html}}` — and that the template's content type is set to
> HTML rather than plain text. Handlebars escapes `{{html}}` by design, which
> is exactly what turns a formatted email into a wall of tags.

## Structure

```
src/
  app/
    layout.tsx        metadata, fonts
    page.tsx          composes the sections in order
    globals.css       design tokens + custom utilities
  components/         one file per page section
  lib/
    site.ts           domain + EmailJS configuration
    application-email.ts   subject / HTML / text builders
public/assets/        photography and nautical charts
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full walkthrough. Short version: push to
GitHub, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository
secrets, then run the **Deploy to Cloudflare** workflow manually from the
Actions tab and pick your branch.
