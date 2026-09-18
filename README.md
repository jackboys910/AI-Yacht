# AI Yacht

Landing page for the AI Yacht bootcamp — 10 days in the Caribbean, 7 of them
aboard a catamaran, November 12–22 2026 — plus an IT Solutions page selling
the CTMASS team's development services. English and Russian.

Statically exported, deployed to Cloudflare Workers.

## Pages

| URL | Page |
| --- | ---- |
| `/` | AI Yacht (English, default) |
| `/it-solutions/` | IT Solutions by CTMASS (English) |
| `/ru/` | AI Yacht (Russian) |
| `/ru/it-solutions/` | IT Solutions by CTMASS (Russian) |

The EN/RU switch in the header links to the same page in the other language
and keeps the current `#section`.

## Stack

| Piece      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router), `output: "export"`         |
| Language   | TypeScript                                         |
| i18n       | Typed dictionaries, one root layout per language    |
| Styling    | Tailwind CSS v4, OKLCH design tokens in `globals.css` |
| Fonts      | Manrope + Playfair Display (Latin + Cyrillic), self-hosted via `next/font` |
| Forms      | EmailJS (browser SDK) → `support@ctmass.com`        |
| Hosting    | Cloudflare Workers static assets                    |

There is no server, no database and no API route: `next build` produces plain
HTML/CSS/JS in `out/`, which Cloudflare serves from its edge.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000  (Russian: /ru/)
```

Other scripts:

```bash
npm run build      # static export into out/
npm run lint
npm run preview    # serve the built out/ through a local Worker
npm run deploy     # build + wrangler deploy (needs Cloudflare auth)
```

## Editing text

All copy lives in two files:

- [`src/i18n/dictionaries/en.ts`](src/i18n/dictionaries/en.ts)
- [`src/i18n/dictionaries/ru.ts`](src/i18n/dictionaries/ru.ts)

`ru.ts` is typed against `en.ts`, so a key added to one and forgotten in the
other fails the build instead of rendering blank.

Team photos are part of the dictionaries too: Ivan's photo has a speech bubble
baked into the image, so English uses `ivanEN.jpg` and Russian the original
`ivan.jpg`.

## How the languages are wired

Each language has its own root layout, using route groups:

```
src/app/
  (en)/layout.tsx            <html lang="en">
  (en)/page.tsx              /
  (en)/it-solutions/page.tsx /it-solutions/
  (ru)/layout.tsx            <html lang="ru">
  (ru)/ru/page.tsx           /ru/
  (ru)/ru/it-solutions/…     /ru/it-solutions/
  global-not-found.tsx       bilingual 404 (needs experimental.globalNotFound)
```

That way the exported HTML carries the correct `lang`, title, canonical URL
and hreflang alternates for every page — nothing is swapped in on the client.
The page files are one-liners; the real composition is in `src/views/`.

To add a page: add its id and slug to `src/i18n/config.ts`, its `meta` entry
to both dictionaries, and a page file under each language group.

## Configuration

Environment-specific values live in [`src/lib/site.ts`](src/lib/site.ts). The
production domain is set in one place — `siteConfig.domain` and
`siteConfig.url` — and canonical URLs, hreflang, Open Graph and the footer
follow.

Each EmailJS value has a working default, so the project builds and sends mail
with no `.env` file. Override any of them in `.env.local`, or as GitHub
repository variables for the deploy workflow:

```ini
NEXT_PUBLIC_EMAILJS_SERVICE_ID=default_service
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_epduqer
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=as4ih3rGW3abw98dk
NEXT_PUBLIC_CONTACT_EMAIL=support@ctmass.com
```

The EmailJS public key is designed to be visible in the browser.

### Emails

`src/lib/email/` builds both messages. They always go out in **English** and
say which site language the visitor used:

- `yacht-application.ts` — `AI Yacht — new application from <name>`
- `it-inquiry.ts` — `AI Yacht · IT Solutions — <service> inquiry from <name>`,
  with `reply_to` set to the client's email
- `shell.ts` — the shared branded HTML layout and plain-text fallback

> **If an email arrives as raw HTML source,** the EmailJS template is escaping
> it: its content must be `{{{html}}}` (triple braces), not `{{html}}`. See
> DEPLOY.md §9 for setting up a dedicated template.

## Structure

```
src/
  app/                route groups per language (see above) + globals.css
  views/              home-page.tsx, it-solutions-page.tsx
  components/         one file per home section; it/ for the IT page
  i18n/               locales, dictionaries, metadata builder
  lib/
    site.ts           domain + EmailJS configuration
    fonts.ts          next/font setup
    email/            email builders and the EmailJS sender
public/assets/        photography and nautical charts
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full walkthrough. Short version: push to
GitHub, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository
secrets, then run the **Deploy to Cloudflare** workflow manually from the
Actions tab and pick your branch.
