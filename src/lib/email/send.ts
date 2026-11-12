import emailjs from "@emailjs/browser";
import { siteConfig } from "../site";
import { emailConfig } from "./config";
import { OWNER_WATCHERS, ownerAddresses, parseAddresses } from "./recipients";
import type { OutgoingEmail } from "./shell";

export type { OutgoingEmail } from "./shell";

/**
 * Sends through the shared EmailJS template, whose fields are
 * subject / html / text / mail_to / from_name / from (+ reply_to).
 *
 * The template carries one recipient, so a copy is a second send rather than
 * a cc. One letter per address, the owner first: if the second one fails, the
 * person who has to act on it has already got theirs, and the page is told
 * nothing went wrong — which is true of the part that matters.
 */
export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const watchers =
    emailConfig.copyTo === undefined ? OWNER_WATCHERS : parseAddresses(emailConfig.copyTo);

  let first = true;
  for (const to of ownerAddresses(emailConfig.recipient, watchers)) {
    try {
      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        {
          subject: email.subject,
          html: email.html,
          text: email.text,
          mail_to: to,
          send_to: to,
          from_name: email.fromName ?? siteConfig.name,
          from: emailConfig.recipient,
          reply_to: email.replyTo ?? "",
        },
        { publicKey: emailConfig.publicKey },
      );
    } catch (cause) {
      // The owner is the one send the form depends on. A copy that failed is
      // worth a line in the console and nothing more.
      if (first) throw cause;
      console.warn("[nazarov.net] a copy of the letter did not go out", cause);
    } finally {
      first = false;
    }
  }
}
