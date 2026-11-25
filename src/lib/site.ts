/**
 * The site itself: its name and where it lives. Everything that renders a URL
 * — metadata, canonical tags, the footer, the links inside emails — reads it.
 *
 * The AI Yacht dates, price and seat count used to live here too. They are a
 * trip's details, and since plan item 1.11 the trip keeps them in the database
 * where the owner can change them without a developer.
 *
 * Nothing in this file reads an environment variable, and that is now
 * load-bearing. The email templates import it, and they are shared with the
 * Cloudflare Worker, where there is no `process` at all: one `process.env`
 * touched while the module loads would kill the endpoint before it ran a
 * line. The EmailJS credentials, which do read the environment, moved to
 * `lib/email/config.ts` for exactly that reason.
 */
export const siteConfig = {
  name: "Nazarov",
  domain: "nazarov.net",
  url: "https://nazarov.net",
} as const;

/**
 * The picture a page falls back to when it has none of its own (Ш-05).
 *
 * А-14 lets the owner add a direction from the panel, and a direction starts
 * without a photograph: the tab exists on the site the moment it is saved,
 * while the cover is uploaded afterwards. Shared in between, it would have
 * gone out as a bare grey link in a messenger — which is what Summits did
 * the day it appeared. One picture of the site is a worse preview than the
 * right one and a far better one than none.
 */
export const defaultPreviewImage = "/assets/hero-catamaran.jpg";
