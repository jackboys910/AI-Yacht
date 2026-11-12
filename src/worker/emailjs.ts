// Relative, not "@/…": the Worker is bundled by wrangler, not by Next, and
// nothing here should depend on its view of the path aliases.
import { OWNER_WATCHERS, ownerAddresses, parseAddresses } from "../lib/email/recipients";
import type { OutgoingEmail } from "../lib/email/shell";

/**
 * Sending through EmailJS from the Worker.
 *
 * The same account and the same template the site's own forms use, reached
 * over its REST API instead of the browser SDK, because there is no browser
 * here. The difference that matters is `accessToken`: a server-side send must
 * carry the account's **private** key, which is why this cannot be done from
 * a page and why that key is a Worker secret.
 *
 * `/api/suggestion` does not fail when a send fails. The idea is already in
 * the database by then, and telling someone their idea did not go through —
 * when it did — would get it sent again.
 */

const SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey: string;
  /** Where the owner's own copy goes. */
  owner: string;
  /** Who else reads the owner's mail — see lib/email/recipients.ts. */
  watchers: string[];
}

export function readEmailJs(env: {
  EMAILJS_SERVICE_ID?: string;
  EMAILJS_TEMPLATE_ID?: string;
  EMAILJS_PUBLIC_KEY?: string;
  EMAILJS_PRIVATE_KEY?: string;
  CONTACT_EMAIL?: string;
  EMAILJS_COPY_TO?: string;
}): EmailJsConfig | null {
  if (!env.EMAILJS_PRIVATE_KEY || !env.EMAILJS_PUBLIC_KEY) return null;
  return {
    serviceId: env.EMAILJS_SERVICE_ID || "default_service",
    templateId: env.EMAILJS_TEMPLATE_ID || "template_epduqer",
    publicKey: env.EMAILJS_PUBLIC_KEY,
    privateKey: env.EMAILJS_PRIVATE_KEY,
    owner: env.CONTACT_EMAIL || "support@ctmass.com",
    // An absent variable leaves the default; an empty one is somebody saying
    // "no copies", and that must be possible without editing code.
    watchers:
      env.EMAILJS_COPY_TO === undefined
        ? [...OWNER_WATCHERS]
        : parseAddresses(env.EMAILJS_COPY_TO),
  };
}

/**
 * Everyone who gets a letter addressed to the owner, the owner first.
 *
 * Used by every endpoint that writes to the owner, so that a new endpoint
 * cannot quietly leave the copy out.
 */
export function ownerCopies(config: EmailJsConfig): string[] {
  return ownerAddresses(config.owner, config.watchers);
}

export async function sendEmail(
  config: EmailJsConfig,
  to: string,
  email: OutgoingEmail,
): Promise<void> {
  const response = await fetch(SEND_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: {
        subject: email.subject,
        html: email.html,
        text: email.text,
        mail_to: to,
        send_to: to,
        from_name: email.fromName ?? "Nazarov",
        from: config.owner,
        reply_to: email.replyTo ?? "",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`EmailJS ${response.status}: ${await response.text()}`);
  }
}
