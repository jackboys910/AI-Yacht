import type { Locale } from "@/i18n/config";
import { siteConfig } from "../site";
import { renderEmailHtml, renderEmailText, type EmailContent } from "./shell";
import type { OutgoingEmail } from "./send";

export type YachtApplication = {
  name: string;
  contact: string;
  niche: string;
  goal: string;
};

const languageNames: Record<Locale, string> = {
  en: "English",
  ru: "Russian",
};

/** The AI Yacht "book a call" form → an English email for the organisers. */
export function buildYachtApplicationEmail(
  data: YachtApplication,
  locale: Locale,
): OutgoingEmail {
  const who = data.name.trim() || "Unnamed applicant";
  const content: EmailContent = {
    preheader: `New AI Yacht application from ${who} — ${data.contact || "no contact"}`,
    brand: "AI YACHT",
    kicker: `${siteConfig.dates} · Caribbean`,
    title: "New application",
    subtitle: "Someone just requested a 15-minute call.",
    rowsLabel: "Applicant",
    rows: [
      { label: "Name", value: data.name },
      { label: "Telegram / WhatsApp", value: data.contact },
      { label: "Line of business", value: data.niche },
      { label: "Site language", value: languageNames[locale] },
    ],
    block: {
      label: "What they want from the week",
      text: data.goal,
      emptyText: "— not filled in —",
    },
    calloutHtml: `<strong>Reply within 24 hours.</strong> Only ${siteConfig.seats} seats are available and priority goes by application date.`,
  };

  return {
    subject: `AI Yacht — new application from ${who}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "AI Yacht",
  };
}
