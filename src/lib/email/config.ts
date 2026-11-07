/**
 * EmailJS credentials, shared with the CTMASS project (the same paid account).
 *
 * Kept apart from `lib/site.ts` because these are the values that read the
 * environment, and `site.ts` is imported by the email templates, which the
 * Cloudflare Worker shares. There is no `process` there.
 *
 * The public key is meant to be visible in the browser — EmailJS limits abuse
 * through a domain allow-list in its dashboard, not by keeping this secret.
 * The **private** key is a different matter entirely: it never enters the
 * bundle, it lives in the Worker's secrets, and only server-side sends use it.
 *
 * Every value can be pointed elsewhere through `.env.local`. The reads are
 * written out in full rather than through a helper, because `next build`
 * substitutes the literal text `process.env.NEXT_PUBLIC_…` and an alias would
 * quietly leave every override behind.
 */
export const emailConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "default_service",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_epduqer",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "as4ih3rGW3abw98dk",
  recipient: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@ctmass.com",
} as const;
