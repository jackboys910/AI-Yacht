import emailjs from "@emailjs/browser";
import { siteConfig } from "../site";
import { emailConfig } from "./config";
import type { OutgoingEmail } from "./shell";

export type { OutgoingEmail } from "./shell";

/**
 * Sends through the shared EmailJS template, whose fields are
 * subject / html / text / mail_to / from_name / from (+ reply_to).
 */
export function sendEmail(email: OutgoingEmail) {
  return emailjs.send(
    emailConfig.serviceId,
    emailConfig.templateId,
    {
      subject: email.subject,
      html: email.html,
      text: email.text,
      mail_to: emailConfig.recipient,
      send_to: emailConfig.recipient,
      from_name: email.fromName ?? siteConfig.name,
      from: emailConfig.recipient,
      reply_to: email.replyTo ?? "",
    },
    { publicKey: emailConfig.publicKey },
  );
}
