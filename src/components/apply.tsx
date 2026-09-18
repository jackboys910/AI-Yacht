"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/i18n";
import { emailConfig } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import { buildYachtApplicationEmail } from "@/lib/email/yacht-application";
import { Eyebrow } from "./eyebrow";
import { DotList, Field, SentCard } from "./form-fields";

type Status = "idle" | "sending" | "sent" | "error";

export function Apply({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["home"]["apply"];
}) {
  const [status, setStatus] = useState<Status>("idle");
  const sending = status === "sending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();

    setStatus("sending");
    try {
      await sendEmail(
        buildYachtApplicationEmail(
          {
            name: read("name"),
            contact: read("contact"),
            niche: read("niche"),
            goal: read("goal"),
          },
          locale,
        ),
      );
      setStatus("sent");
    } catch (error) {
      console.error("[AI Yacht] application send failed", error);
      setStatus("error");
    }
  }

  return (
    <section
      id="apply"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 400px at 80% 20%, #0F7A6B33, transparent)",
        }}
      />

      <div className="container-narrow relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Eyebrow tone="light">{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-6 max-w-md text-white/80">{t.text}</p>
          <DotList items={t.bullets} />
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md sm:p-10">
          {status === "sent" ? (
            <SentCard title={t.successTitle} text={t.successText} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field {...t.fields.name} name="name" required disabled={sending} autoComplete="name" />
              <Field {...t.fields.contact} name="contact" required disabled={sending} />
              <Field {...t.fields.niche} name="niche" required disabled={sending} />
              <Field {...t.fields.goal} name="goal" textarea disabled={sending} />

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
