"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { reportEvent } from "@/lib/analytics/events";
import { emailConfig } from "@/lib/email/config";
import { visitSource } from "@/lib/visit-source";
import { Eyebrow } from "../eyebrow";
import { DotList, Field, SelectField, SentCard } from "../form-fields";
import { TurnstileCheck, type CheckState } from "../suggest/turnstile-check";
import { PROJECT_TYPES, solutionsCopy } from "./solutions-copy";

type Status = "idle" | "sending" | "sent" | "failed" | "spam" | "off" | "rejected";

/**
 * "Tell us about your project" (§6.6, П-17, А-17).
 *
 * It posts to `/api/solutions` instead of sending the letter from the page,
 * and that is the whole difference from the form this replaces. §6.6 asks for
 * the enquiry to be **saved in the panel** as well as emailed, and the
 * collection it is saved to is shut to browsers: a name, an address and a
 * phone number for every business that ever asked for a quote. The Turnstile
 * token is also worth nothing until something holding the secret has asked
 * Cloudflare about it.
 *
 * Five fields, four of them required. §6.6 marks the phone optional, and it
 * stays optional — the answer goes to the email address either way.
 */
export function SolutionsForm({ locale }: { locale: Locale }) {
  const c = solutionsCopy.form;
  const [status, setStatus] = useState<Status>("idle");
  const [projectType, setProjectType] = useState("");
  const [token, setToken] = useState("");
  const [check, setCheck] = useState<CheckState>("loading");
  const [rejected, setRejected] = useState("");

  const sending = status === "sending";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();

    setStatus("sending");
    try {
      const response = await fetch("/api/solutions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: read("name"),
          email: read("email"),
          phone: read("phone"),
          projectType,
          message: read("message"),
          locale,
          source: visitSource(),
          turnstileToken: token,
        }),
      });

      if (response.ok) {
        setStatus("sent");
        reportEvent("solutions", {
          email: read("email"),
          contentCategory: projectType,
        });
        return;
      }

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        field?: string;
      };
      setStatus(
        body.error === "not-configured"
          ? "off"
          : body.error === "turnstile"
            ? "spam"
            : body.error === "bad-request"
              ? "rejected"
              : "failed",
      );
      if (body.error === "bad-request") setRejected(body.field ?? "");
    } catch {
      setStatus("failed");
    }
  }

  const mail = (
    <a
      href={`mailto:${emailConfig.recipient}`}
      className="text-white underline decoration-[color:var(--gold)] underline-offset-4"
    >
      {emailConfig.recipient}
    </a>
  );

  const bullets = c.bullets.map((line) => {
    const [before, after] = line[locale].split("{email}");
    return after === undefined ? line[locale] : <>{before}{mail}{after}</>;
  });

  const typeOptions = [
    { value: "", label: c.choose[locale] },
    ...PROJECT_TYPES.map((value) => ({
      value,
      label: c.projectTypes[value][locale],
    })),
  ];

  return (
    <section
      id="start"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
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
          <Eyebrow tone="light">{c.eyebrow[locale]}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {c.title[locale]}
          </h2>
          <p className="mt-6 max-w-md text-white/80">{c.text[locale]}</p>
          <DotList items={bullets} />
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-md sm:p-10">
          {status === "sent" ? (
            <div>
              <SentCard title={c.sentTitle[locale]} text={c.sentText[locale]} />
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mx-auto mt-6 block rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-white"
              >
                {c.again[locale]}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset className="grid gap-5 sm:grid-cols-2" disabled={sending}>
                <Field
                  label={`${c.name[locale]} *`}
                  name="name"
                  placeholder={c.namePlaceholder[locale]}
                  autoComplete="name"
                  required
                />
                <Field
                  label={`${c.email[locale]} *`}
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <Field
                  label={c.phone[locale]}
                  name="phone"
                  type="tel"
                  placeholder="+1 …"
                  autoComplete="tel"
                />
                <SelectField
                  label={`${c.projectType[locale]} *`}
                  name="projectType"
                  value={projectType}
                  onChange={setProjectType}
                  options={typeOptions}
                  disabled={sending}
                  required
                />
              </fieldset>

              <Field
                label={`${c.details[locale]} *`}
                name="message"
                placeholder={c.detailsPlaceholder[locale]}
                textarea
                required
                disabled={sending}
              />

              <TurnstileCheck locale={locale} onToken={setToken} onState={setCheck} />

              {check === "failed" ? (
                <p role="alert" className="text-sm text-amber-300">
                  {c.check.failed[locale]} {mail}
                </p>
              ) : (
                check === "loading" && (
                  <p className="text-xs text-white/45">{c.check.loading[locale]}</p>
                )
              )}

              {status === "off" && (
                <p role="alert" className="text-sm text-amber-300">
                  {c.failure.notConfigured[locale]} {mail}
                </p>
              )}
              {status === "spam" && (
                <p role="alert" className="text-sm text-amber-300">
                  {c.failure.spam[locale]}
                </p>
              )}
              {status === "rejected" && (
                <p role="alert" className="text-sm text-amber-300">
                  {c.failure.rejected[locale]}
                  {rejected && <span className="ml-1 font-semibold">{rejected}</span>}
                </p>
              )}
              {status === "failed" && (
                <p role="alert" className="text-sm text-amber-300">
                  {c.failure.text[locale]} {mail}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || check === "failed"}
                className="mt-2 w-full rounded-full bg-[color:var(--gold)] px-6 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? c.sending[locale] : c.submit[locale]}
              </button>

              <p className="text-center text-xs text-white/50">{c.consent[locale]}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
