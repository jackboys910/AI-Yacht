"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { emailConfig } from "@/lib/email/config";
import { visitSource } from "@/lib/visit-source";
import { Field } from "../form-fields";
import { TurnstileCheck, type CheckState } from "../suggest/turnstile-check";
import { joinCopy } from "./join-copy";

type Status = "idle" | "sending" | "sent" | "failed" | "spam" | "off" | "rejected";

/**
 * "Join this trip" (ТЗ v4 §2.2, §12; plan item 2.8).
 *
 * The form that stands in for a member account. Three answers are required —
 * name, email and why this trip — and the three large boxes under them are
 * not: the owner reads them to decide, but a wall of mandatory essays is how
 * a form collects nothing at all.
 *
 * It posts to `/api/application` rather than to Firestore for the same reason
 * the other two forms do. `applications` holds strangers' addresses and what
 * they wrote about themselves, so no browser may read or write it; the
 * Turnstile token is worth nothing until something with the secret has asked
 * Cloudflare about it; and the letters go out with the EmailJS private key.
 */
export function JoinForm({
  tripId,
  locale,
  kidFriendly,
}: {
  tripId: string;
  locale: Locale;
  /** The children question exists only where children are welcome. */
  kidFriendly: boolean;
}) {
  const c = joinCopy;
  const [status, setStatus] = useState<Status>("idle");
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
      const response = await fetch("/api/application", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tripId,
          name: read("name"),
          email: read("email"),
          city: read("city"),
          contact: read("contact"),
          links: [read("instagram"), read("facebook"), read("linkedin")].filter(Boolean),
          why: read("why"),
          about: read("about"),
          bring: read("bring"),
          kids: kidFriendly ? read("kids") : "",
          locale,
          source: visitSource(),
          turnstileToken: token,
        }),
      });

      if (response.ok) {
        setStatus("sent");
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

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-[color:var(--gold)]/40 bg-white/[0.05] p-8 sm:p-10">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--gold)] text-xl text-[color:var(--gold-foreground)]"
        >
          ✓
        </span>
        <h3 className="mt-6 font-display text-3xl text-white">{c.sent.title[locale]}</h3>
        <p className="mt-3 max-w-xl text-white/80">{c.sent.text[locale]}</p>
        <p className="mt-2 max-w-xl text-sm text-white/55">{c.sent.note[locale]}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-white"
        >
          {c.sent.again[locale]}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="space-y-5" disabled={sending}>
        <div className="grid gap-5 sm:grid-cols-2">
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
            label={c.city[locale]}
            name="city"
            placeholder={c.cityPlaceholder[locale]}
            autoComplete="address-level2"
          />
          <Field
            label={c.contact[locale]}
            name="contact"
            type="tel"
            placeholder="+351 …"
            autoComplete="tel"
          />
        </div>
        <Hint>{c.cityHint[locale]}</Hint>
      </fieldset>

      <fieldset className="space-y-5" disabled={sending}>
        <Legend>{c.socialHeading[locale]}</Legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Instagram" name="instagram" placeholder="https://instagram.com/…" />
          <Field label="Facebook" name="facebook" placeholder="https://facebook.com/…" />
          <Field label="LinkedIn" name="linkedin" placeholder="https://linkedin.com/in/…" />
        </div>
        <Hint>{c.socialHint[locale]}</Hint>
      </fieldset>

      <fieldset className="space-y-5" disabled={sending}>
        <Legend>{c.aboutHeading[locale]}</Legend>
        <Field
          label={`${c.why[locale]} *`}
          name="why"
          placeholder={c.whyPlaceholder[locale]}
          textarea
          required
        />
        <Field
          label={c.about[locale]}
          name="about"
          placeholder={c.aboutPlaceholder[locale]}
          textarea
        />
        <Field
          label={c.bring[locale]}
          name="bring"
          placeholder={c.bringPlaceholder[locale]}
          textarea
        />

        {kidFriendly && (
          <>
            <Field
              label={c.kids[locale]}
              name="kids"
              placeholder={locale === "ru" ? "Сын, 9 лет" : "A son, 9"}
            />
            <Hint>{c.kidsHint[locale]}</Hint>
          </>
        )}
      </fieldset>

      <div className="space-y-4">
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
          className="w-full rounded-full bg-[color:var(--gold)] px-6 py-4 font-display text-base text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {sending ? c.sending[locale] : c.submit[locale]}
        </button>

        <p className="text-xs text-white/45">{c.consent[locale]}</p>
      </div>
    </form>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-1 font-display text-xl text-white sm:text-2xl">
      {children}
    </legend>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="-mt-2 text-xs leading-relaxed text-white/45">{children}</p>;
}
