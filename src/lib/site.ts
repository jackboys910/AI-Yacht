/**
 * Single place to change when the production domain is decided.
 * Everything that renders a URL (metadata, footer, canonical tags) reads it.
 */
export const siteConfig = {
  name: "AI Yacht",
  domain: "nazarov.net",
  url: "https://nazarov.net",
  title: "AI Yacht — AI bootcamp on a catamaran in the Caribbean",
  description:
    "10 days in the Caribbean, 7 of them aboard a catamaran. A closed group of 6 entrepreneurs builds a working AI tool. November 12–22, 2026.",
  dates: "12–22 NOV 2026",
  price: "$3,500",
  seats: 6,
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
