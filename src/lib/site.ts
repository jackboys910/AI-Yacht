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
