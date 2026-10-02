/**
 * The site itself: its name and where it lives. Everything that renders a URL
 * — metadata, canonical tags, the footer, the links inside emails — reads it.
 *
 * The AI Yacht dates, price and seat count used to live here too. They are a
 * trip's details, and since plan item 1.11 the trip keeps them in the database
 * where the owner can change them without a developer.
 */
export const siteConfig = {
  name: "Nazarov",
  domain: "nazarov.net",
  url: "https://nazarov.net",
} as const;

/**
 * EmailJS credentials, shared with the CTMASS project (same paid account).
 * The public key is designed to be exposed in the browser — EmailJS restricts
 * abuse by domain allow-list in the dashboard, not by keeping this secret.
 * Values can be overridden per-environment via .env.local.
 */
export const emailConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "default_service",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_epduqer",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "as4ih3rGW3abw98dk",
  recipient: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@ctmass.com",
} as const;
