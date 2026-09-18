"use client";

import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/i18n";
import { emailConfig } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import {
  buildItInquiryEmail,
  type BudgetKey,
} from "@/lib/email/it-inquiry";
import { Eyebrow } from "../eyebrow";
import { DotList, Field, SelectField, SentCard } from "../form-fields";
import { SELECT_SERVICE_EVENT } from "./quote-link";

type Status = "idle" | "sending" | "sent" | "error";

export function ItInquiryForm({
  locale,
  t,
  services,
}: {
  locale: Locale;
  t: Dictionary["it"]["form"];
  services: Dictionary["it"]["services"]["items"];
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState<BudgetKey | "">("");
  const sending = status === "sending";

  // A "Get a quote" link on a service card preselects that service here.
  useEffect(() => {
    const onSelect = (event: Event) =>
      setService(String((event as CustomEvent<string>).detail ?? ""));
    window.addEventListener(SELECT_SERVICE_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, onSelect);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();

    setStatus("sending");
    try {
      await sendEmail(
        buildItInquiryEmail(
          {
            name: read("name"),
            email: read("email"),
            contact: read("contact"),
            company: read("company"),
            service,
            budget,
            details: read("details"),
          },
          locale,
        ),
      );
      setStatus("sent");
    } catch (error) {
      console.error("[AI Yacht] IT inquiry send failed", error);
      setStatus("error");
    }
  }

  const f = t.fields;
  const serviceOptions = [
    { value: "", label: f.service.unsure },
    ...services.map((s) => ({ value: s.key, label: s.title })),
  ];
  const budgetOptions = [
    { value: "", label: "—" },
    ...(Object.keys(f.budget.options) as BudgetKey[]).map((key) => ({
      value: key,
      label: f.budget.options[key],
    })),
  ];

  const mail = (
    <a
      href={`mailto:${emailConfig.recipient}`}
      className="text-white underline decoration-[color:var(--gold)] underline-offset-4"
    >
      {emailConfig.recipient}
    </a>
  );
  const bullets = t.bullets.map((line) => {
    const [before, after] = line.split("{email}");
    return after === undefined ? line : <>{before}{mail}{after}</>;
  });

  return (
    <section
      id="it-apply"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 400px at 80% 20%, #0F7A6B33, transparent)",
        }}
      />

      <div className="container-narrow relative grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <Eyebrow tone="light">{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-6 max-w-md text-white/80">{t.text}</p>
          <DotList items={bullets} />
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md sm:p-10">
          {status === "sent" ? (
            <SentCard title={t.successTitle} text={t.successText} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field {...f.name} name="name" required disabled={sending} autoComplete="name" />
                <Field {...f.email} name="email" type="email" required disabled={sending} autoComplete="email" />
                <Field {...f.contact} name="contact" type="tel" disabled={sending} autoComplete="tel" />
                <Field {...f.company} name="company" disabled={sending} autoComplete="organization" />
                <SelectField
                  label={f.service.label}
                  name="service"
                  value={service}
                  onChange={setService}
                  options={serviceOptions}
                  disabled={sending}
                />
                <SelectField
                  label={f.budget.label}
                  name="budget"
                  value={budget}
                  onChange={(value) => setBudget(value as BudgetKey | "")}
                  options={budgetOptions}
                  disabled={sending}
                />
              </div>
              <Field {...f.details} name="details" textarea required disabled={sending} />

              <button
                type="submit"
                disabled={sending}
                className="mt-2 w-full rounded-full bg-[color:var(--gold)] px-6 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? t.sending : t.submit}
              </button>

              {status === "error" && (
                <p role="alert" className="text-center text-xs text-[color:var(--gold)]">
                  {t.error.replace("{email}", emailConfig.recipient)}
                </p>
              )}

              <p className="text-center text-xs text-white/50">{t.consent}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
