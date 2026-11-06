import {
  esc,
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
  type OutgoingEmail,
} from "./shell";

/**
 * The two letters an idea sends (ТЗ v4, §3.3): one to the owner, who has to
 * decide, and one to the author, who has to know it arrived.
 *
 * Both are written here rather than in the Worker so the wording lives with
 * the rest of the site's email copy and can be read without a deploy.
 *
 * The owner's letter is in English whatever language the form was in — he
 * reads both, and one language in his inbox is one shape to scan. The
 * author's letter answers in the language they wrote in, because to them it
 * is the site talking back.
 */

export interface SuggestionEmailData {
  title: string;
  category: string;
  description: string;
  place?: string;
  when?: string;
  budget?: string;
  groupSize?: string;
  experienceLevel?: string;
  name: string;
  email: string;
  links: string[];
  experience?: string;
  audience?: string;
  photoLinks: string[];
  locale: "en" | "ru";
  source?: string;
}

const LANGUAGE_NAMES = { en: "English", ru: "Russian" } as const;

/** The idea, as a letter to the owner. */
export function buildSuggestionOwnerEmail(data: SuggestionEmailData): OutgoingEmail {
  const who = data.name.trim() || "Someone";
  const extras = [
    data.experience?.trim() && `Experience organizing: ${data.experience.trim()}`,
    data.audience?.trim() && `Wants to bring together: ${data.audience.trim()}`,
    data.photoLinks.length > 0 && `References: ${data.photoLinks.join(", ")}`,
  ].filter((line): line is string => Boolean(line));

  const content: EmailContent = {
    preheader: `${who} suggests: ${data.title}`,
    brand: "NAZAROV.NET",
    kicker: "Suggest an Adventure",
    title: "A new trip idea",
    subtitle: "Somebody wants to put a trip together. It is waiting in the panel.",
    rowsLabel: "The idea",
    rows: [
      { label: "Title", value: data.title },
      { label: "Category", value: data.category },
      { label: "Destination", value: data.place ?? "" },
      { label: "When", value: data.when ?? "" },
      { label: "Budget", value: data.budget ?? "" },
      { label: "Group size", value: data.groupSize ?? "" },
      { label: "Experience", value: data.experienceLevel ?? "" },
      { label: "Name", value: data.name },
      { label: "Email", value: data.email, href: `mailto:${data.email}` },
      { label: "Links", value: data.links.join(", ") },
      { label: "Site language", value: LANGUAGE_NAMES[data.locale] },
      { label: "Sent from", value: data.source ?? "" },
    ],
    block: {
      label: "In their words",
      text: [data.description, ...extras].filter(Boolean).join("\n\n"),
      emptyText: "— nothing written —",
    },
    calloutHtml:
      `Open <strong>Trip ideas</strong> in the panel to read it in full, change its status ` +
      `or turn it into a draft trip. Replying goes straight to <strong>${esc(data.email)}</strong>.`,
  };

  return {
    subject: `nazarov.net · New trip idea from ${who} — ${data.title}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
    replyTo: data.email,
  };
}

/**
 * The receipt, to the author.
 *
 * Deliberately short, and it promises only what the owner can keep: that it
 * arrived and that an answer comes by email. No timeframe — this is one
 * person reading ideas, not a support desk, and a promise of "within 24
 * hours" would be the site writing a cheque someone else has to cash.
 */
export function buildSuggestionAuthorEmail(data: SuggestionEmailData): OutgoingEmail {
  const ru = data.locale === "ru";
  const who = data.name.trim();

  const content: EmailContent = {
    preheader: ru
      ? "Идея получена. Отвечу на эту почту."
      : "Your idea arrived. The answer comes to this address.",
    brand: "NAZAROV.NET",
    kicker: ru ? "Предложить приключение" : "Suggest an Adventure",
    title: ru ? "Идея получена" : "Your idea has arrived",
    subtitle: ru
      ? who
        ? `${who}, спасибо. Я прочитаю её сам и отвечу на эту почту.`
        : "Спасибо. Я прочитаю её сам и отвечу на эту почту."
      : who
        ? `Thank you, ${who}. I read these myself and will answer to this address.`
        : "Thank you. I read these myself and will answer to this address.",
    rowsLabel: ru ? "Что вы прислали" : "What you sent",
    rows: [
      { label: ru ? "Название" : "Title", value: data.title },
      { label: ru ? "Категория" : "Category", value: data.category },
      { label: ru ? "Куда" : "Destination", value: data.place ?? "" },
      { label: ru ? "Когда" : "When", value: data.when ?? "" },
    ],
    block: {
      label: ru ? "В чём идея" : "The idea",
      text: data.description,
      emptyText: ru ? "— не заполнено —" : "— nothing written —",
    },
    calloutHtml: ru
      ? "Если идея подойдёт, мы обсудим детали и вы сможете вести эту поездку сами — " +
        "в сообществе это роль <strong>организатора</strong>."
      : "If it fits, we will work out the details and you can run the trip yourself — " +
        "in this community that role is called <strong>organizer</strong>.",
  };

  return {
    subject: ru
      ? `nazarov.net · Идея получена — ${data.title}`
      : `nazarov.net · Idea received — ${data.title}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "nazarov.net",
  };
}
