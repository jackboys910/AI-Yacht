import { siteConfig } from "../site";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The announcement of a new trip (Н-07, §8.2).
 *
 * The one letter here that is sent to a list rather than to a person who has
 * just filled something in, and everything about it follows from that.
 *
 * It is short: a photograph, the name, the dates, the place, and one button.
 * §8.2 lists exactly that, and the reason is that a subscriber is deciding
 * whether to open the page, not reading the page in an inbox.
 *
 * It carries the two things American law requires of a mailing — the sender's
 * postal address and a way off the list — and the Worker refuses to send it
 * while the address is unset rather than sending something unlawful.
 *
 * It is built in the subscriber's own language. They chose it when they
 * subscribed, and a Russian reader has no reason to meet an English letter
 * because an English visitor pressed Publish.
 */
export interface AnnouncementEmailData {
  /** Already in the reader's language. */
  tripTitle: string;
  dates: string;
  place: string;
  subtitle: string;
  /** The trip page, in the reader's language. */
  tripUrl: string;
  coverUrl?: string;
  /** The direction they subscribed to, for the line explaining the letter. */
  direction: string;
  locale: "en" | "ru";
  /** The sender's postal address — CAN-SPAM, §8.2. */
  postalAddress: string;
  /** Off the list entirely, and the page for picking directions (item 3.3). */
  unsubscribeUrl: string;
  manageUrl: string;
  /** Where a reply goes — the owner, not the shared sending mailbox. */
  ownerEmail?: string;
}

export function buildAnnouncementEmail(data: AnnouncementEmailData): OutgoingEmail {
  const ru = data.locale === "ru";

  const content: EmailContent = {
    preheader: ru
      ? `Новая поездка: ${data.tripTitle}, ${data.dates}`
      : `New trip: ${data.tripTitle}, ${data.dates}`,
    brand: "NAZAROV.NET",
    kicker: ru ? "Новая поездка" : "New trip",
    title: data.tripTitle,
    subtitle: data.subtitle || (ru ? `${data.dates} · ${data.place}` : `${data.dates} · ${data.place}`),
    rowsLabel: ru ? "Коротко" : "In short",
    rows: [
      { label: ru ? "Направление" : "Direction", value: data.direction },
      { label: ru ? "Даты" : "Dates", value: data.dates },
      { label: ru ? "Место" : "Place", value: data.place },
    ].filter((row) => row.value.trim().length > 0),
    hero: data.coverUrl ? { url: data.coverUrl, alt: data.tripTitle } : undefined,
    button: {
      label: ru ? "Смотреть поездку" : "View trip",
      href: data.tripUrl,
    },
    footer: {
      note: ru
        ? `Вы получили это письмо, потому что подписались на ${siteConfig.domain}. ${data.postalAddress}`
        : `You're receiving this because you subscribed at ${siteConfig.domain}. ${data.postalAddress}`,
      links: [
        { label: ru ? "Отписаться" : "Unsubscribe", href: data.unsubscribeUrl },
        { label: ru ? "Выбрать направления" : "Manage topics", href: data.manageUrl },
      ],
    },
  };

  return {
    subject: ru
      ? `Новая поездка: ${data.tripTitle}, ${data.dates}`
      : `New trip: ${data.tripTitle}, ${data.dates}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "Nazarov",
    replyTo: data.ownerEmail,
  };
}
