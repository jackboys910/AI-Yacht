import type { Locale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { esc, renderEmailHtml, renderEmailText, type EmailContent } from "./shell";
import type { OutgoingEmail } from "./send";

export type BudgetKey = keyof typeof en.it.form.fields.budget.options;

export type ItInquiry = {
  name: string;
  email: string;
  contact: string;
  company: string;
  /** A service key from the dictionary, or "" for "not sure yet". */
  service: string;
  budget: BudgetKey | "";
  details: string;
};

const languageNames: Record<Locale, string> = {
  en: "English",
  ru: "Russian",
};

/** The email always goes out in English, whatever language the visitor used. */
function serviceLabel(key: string): string {
  const match = en.it.services.items.find((item) => item.key === key);
  return match ? match.title : en.it.form.fields.service.unsure;
}

function budgetLabel(key: BudgetKey | ""): string {
  return key ? en.it.form.fields.budget.options[key] : "";
}

/** The IT Solutions inquiry form → an English email for the CTMASS team. */
export function buildItInquiryEmail(
  data: ItInquiry,
  locale: Locale,
): OutgoingEmail {
  const who = data.name.trim() || "Unnamed client";
  const service = serviceLabel(data.service);
  const content: EmailContent = {
    preheader: `${service} inquiry from ${who} (${data.email})`,
    brand: "CTMASS IT SOLUTIONS",
    kicker: "Via the AI Yacht website",
    title: "New project inquiry",
    subtitle: "A potential client is asking for a free consultation.",
    rowsLabel: "Client",
    rows: [
      { label: "Name", value: data.name },
      { label: "Email", value: data.email, href: `mailto:${data.email}` },
      { label: "Phone / Messenger", value: data.contact },
      { label: "Company / website", value: data.company },
      { label: "Service", value: service },
      { label: "Budget", value: budgetLabel(data.budget) },
      { label: "Site language", value: languageNames[locale] },
    ],
    block: {
      label: "Project details",
      text: data.details,
      emptyText: "— not filled in —",
    },
    calloutHtml: `<strong>Reply within 24 hours</strong> — that is what the page promises. Write back to <strong>${esc(data.email)}</strong> to set up the consultation.`,
  };

  return {
    subject: `AI Yacht · IT Solutions — ${service} inquiry from ${who}`,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    fromName: "AI Yacht · IT Solutions",
    replyTo: data.email,
  };
}
