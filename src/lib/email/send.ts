import emailjs from "@emailjs/browser";
import { emailConfig, siteConfig } from "../site";

export type OutgoingEmail = {
  subject: string;
  html: string;
  text: string;
  fromName?: string;
  /** Lets "Reply" in the inbox go straight to the sender, when the EmailJS
   *  template maps its Reply-To field to {{reply_to}}. */
  replyTo?: string;
};

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
