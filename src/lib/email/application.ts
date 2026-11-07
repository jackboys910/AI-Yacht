import {
  esc,
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The two letters an application sends (ТЗ v4 §12, plan item 2.8): one to
 * whoever decides, and one to the person who applied.
 *
 * The deciding letter carries everything, because deciding is what it is
 * for — С-06 asks for the name, the address, the social link and what they
 * wrote about themselves to be *in the panel*, and an email that makes the
 * owner open the panel to find out who applied would waste the trip.
 *
 * It is written in English whatever language the form was in. The owner and
 * the organizer read both, and one shape to scan beats two.
 */

export interface ApplicationEmailData {
  tripTitle: string;
  tripDates?: string;
  name: string;
  email: string;
  city?: string;
  contact?: string;
  links: string[];
  why?: string;
  about?: string;
  bring?: string;
  kids?: string;
  locale: "en" | "ru";
  source?: string;
}

const LANGUAGE_NAMES = { en: "English", ru: "Russian" } as const;

/** Everything somebody wrote, to the person who decides. */
export function buildApplicationOwnerEmail(
  data: ApplicationEmailData,
  /** Set when this copy goes to the organizer rather than to the owner. */
  forOrganizer = false,
): OutgoingEmail {
  const who = data.name.trim() || "Someone";

  const story = [
    data.why?.trim() && `Why this trip:\n${data.why.trim()}`,
    data.about?.trim() && `What they are like to travel with:\n${data.about.trim()}`,
    data.bring?.trim() && `What they bring:\n${data.bring.trim()}`,
  ].filter((line): line is string => Boolean(line));

  const content: EmailContent = {
    preheader: `${who} wants to come on ${data.tripTitle}`,
    brand: "NAZAROV.NET",
    kicker: forOrganizer ? "Your trip" : "Trip application",
    title: "Somebody wants to come",
    subtitle: forOrganizer
      ? `An application to the trip you are running. It is in the panel as well.`
      : "The application is waiting in the panel.",
    rowsLabel: "Who applied",
    rows: [
      { label: "Trip", value: data.tripTitle },
      { label: "Dates", value: data.tripDates ?? "" },
      { label: "Name", value: data.name },
      { label: "Email", value: data.email, href: `mailto:${data.email}` },
      { label: "Lives in", value: data.city ?? "" },
      { label: "Phone / messenger", value: data.contact ?? "" },
      { label: "Links", value: data.links.join(", ") },
      { label: "Children", value: data.kids ?? "" },
      { label: "Site language", value: LANGUAGE_NAMES[data.locale] },
      { label: "Sent from", value: data.source ?? "" },
    ],
    block: {
      label: "In their words",
      text: story.join("\n\n"),
      emptyText: "— nothing written —",
    },
    calloutHtml:
      `Open <strong>Applications</strong> in the panel to accept or decline it. ` +
      `Replying goes straight to <strong>${esc(data.email)}</strong>.`,
  };

  return {
    subject: `nazarov.net · ${who} wants to come — ${data.tripTitle}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
    replyTo: data.email,
  };
}

/**
 * The receipt, to the person who applied.
 *
 * It repeats the promise the form made — an answer within 24 hours — because
 * that promise is the only thing standing between sending a stranger a page
 * about yourself and silence. Nothing else is promised: whether they are
 * coming is somebody's decision, not an automatic reply's.
 */
export function buildApplicationReceiptEmail(
  data: ApplicationEmailData,
): OutgoingEmail {
  const ru = data.locale === "ru";
  const who = data.name.trim();

  const content: EmailContent = {
    preheader: ru
      ? `Заявка на «${data.tripTitle}» получена.`
      : `Your application for ${data.tripTitle} has arrived.`,
    brand: "NAZAROV.NET",
    kicker: ru ? "Заявка" : "Application",
    title: ru ? "Заявка получена" : "Got it",
    subtitle: ru
      ? who
        ? `${who}, я прочитаю её сам и отвечу в течение 24 часов.`
        : "Я прочитаю её сам и отвечу в течение 24 часов."
      : who
        ? `${who}, I read these myself and will answer within 24 hours.`
        : "I read these myself and will answer within 24 hours.",
    rowsLabel: ru ? "О чём заявка" : "What you applied for",
    rows: [
      { label: ru ? "Поездка" : "Trip", value: data.tripTitle },
      { label: ru ? "Даты" : "Dates", value: data.tripDates ?? "" },
      { label: ru ? "Ваша почта" : "Your email", value: data.email },
    ],
    block: {
      label: ru ? "Что вы написали" : "What you wrote",
      text: data.why?.trim() ?? "",
      emptyText: ru ? "— не заполнено —" : "— nothing written —",
    },
    calloutHtml: ru
      ? "Группу собирают вручную, поэтому ответ будет живым письмом, а не " +
        "автоматическим. Если что-то забыли рассказать — просто ответьте на это письмо."
      : "The group is put together by hand, so the answer will be a real letter " +
        "rather than an automatic one. Forgot to mention something? Just reply here.",
  };

  return {
    subject: ru
      ? `nazarov.net · Заявка получена — ${data.tripTitle}`
      : `nazarov.net · Application received — ${data.tripTitle}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
  };
}
