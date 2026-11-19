// Relative, not "@/…": these letters are built inside the Cloudflare Worker,
// which wrangler bundles without Next's path aliases.
import { projectTypeLabel } from "../content/solutions";
import {
  esc,
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The two letters a Solutions enquiry sends (§6.6, §7.6, А-17).
 *
 * One to support@ctmass.com, where the work is quoted from, and one back to
 * whoever asked, because §6.6 promises an answer within one business day and
 * a form that answers with nothing until a human gets to it has already
 * broken that promise once.
 *
 * The studio's letter is in English whatever language the form was in: the
 * team reads both, and one language in the inbox is one shape to scan. The
 * reply to the sender follows the language they wrote in.
 *
 * Neither letter is a mailing, so neither carries an unsubscribe footer —
 * §8.2 and Н-09 are about the announcement, not about a receipt for a form
 * somebody has just filled in themselves.
 */

export interface SolutionsEmailData {
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  message: string;
  locale: "en" | "ru";
  source?: string;
}

const LANGUAGE_NAMES = { en: "English", ru: "Russian" } as const;

/** The enquiry, as a letter to the studio. */
export function buildSolutionsOwnerEmail(data: SolutionsEmailData): OutgoingEmail {
  const who = data.name.trim() || "Someone";
  const kind = projectTypeLabel(data.projectType, "en");

  const content: EmailContent = {
    preheader: `${who} needs ${kind.toLowerCase()}`,
    brand: "NAZAROV.NET",
    kicker: "Solutions",
    title: "A new project enquiry",
    subtitle: `${who} filled in the form on /solutions/. It is waiting in the panel too.`,
    rowsLabel: "Who is asking",
    rows: [
      { label: "Name", value: data.name },
      { label: "Email", value: data.email, href: `mailto:${data.email}` },
      { label: "Phone", value: data.phone ?? "" },
      { label: "Needs", value: kind },
      { label: "Site language", value: LANGUAGE_NAMES[data.locale] },
      { label: "Sent from", value: data.source ?? "" },
    ],
    block: {
      label: "In their words",
      text: data.message,
      emptyText: "— nothing written —",
    },
    calloutHtml:
      `Open <strong>Applications → Solutions</strong> in the panel to mark it dealt with. ` +
      `Replying to this letter goes straight to <strong>${esc(data.email)}</strong>.`,
  };

  return {
    subject: `nazarov.net · ${kind} enquiry from ${who}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
    replyTo: data.email,
  };
}

/**
 * The receipt, to whoever asked.
 *
 * It repeats the one promise §6.6 makes — an answer within one business day —
 * and the enquiry itself, so that the sender has their own copy of what they
 * asked for when the quote arrives.
 */
export function buildSolutionsReceiptEmail(data: SolutionsEmailData): OutgoingEmail {
  const ru = data.locale === "ru";
  const who = data.name.trim();
  const kind = projectTypeLabel(data.projectType, data.locale);

  const content: EmailContent = {
    preheader: ru
      ? "Заявка получена. Ответим в течение одного рабочего дня."
      : "Your enquiry arrived. We answer within one business day.",
    brand: "NAZAROV.NET",
    kicker: "Solutions",
    title: ru ? "Заявка получена" : "Thanks — we have your enquiry",
    subtitle: ru
      ? who
        ? `${who}, спасибо. Прочитаем сами и ответим в течение одного рабочего дня.`
        : "Спасибо. Прочитаем сами и ответим в течение одного рабочего дня."
      : who
        ? `Thank you, ${who}. We read these ourselves and will get back to you within 1 business day.`
        : "Thank you. We read these ourselves and will get back to you within 1 business day.",
    rowsLabel: ru ? "Что вы прислали" : "What you sent",
    rows: [
      { label: ru ? "Что нужно" : "What you need", value: kind },
      { label: ru ? "Почта" : "Email", value: data.email },
      { label: ru ? "Телефон" : "Phone", value: data.phone ?? "" },
    ],
    block: {
      label: ru ? "Ваш проект" : "Your project",
      text: data.message,
      emptyText: ru ? "— не заполнено —" : "— nothing written —",
    },
    calloutHtml: ru
      ? "Если удобнее поговорить, запишитесь на двадцатиминутный звонок — календарь есть на той же странице."
      : "If a call is easier, book twenty minutes — the calendar is on the same page.",
  };

  return {
    subject: ru
      ? `nazarov.net · Заявка получена — ${kind}`
      : `nazarov.net · Enquiry received — ${kind}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
  };
}
