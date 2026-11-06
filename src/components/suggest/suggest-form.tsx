"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { emailConfig } from "@/lib/email/config";
import { Field, SelectField } from "../form-fields";
import { suggestCopy } from "./suggest-copy";
import { TurnstileCheck, type CheckState } from "./turnstile-check";

/** A category in the dropdown — a direction with "offer in the idea form" on. */
export interface SuggestCategory {
  id: string;
  label: string;
  /** Picking it asks the author to name their own category instead. */
  other: boolean;
}

type Status = "idle" | "sending" | "sent" | "failed" | "spam" | "off" | "rejected";

const LEVELS = ["", "beginner", "intermediate", "advanced", "allLevels"] as const;

/**
 * The Suggest an Adventure form (ТЗ v4, §3.2).
 *
 * One column, five required fields out of fourteen. Everything goes to
 * `/api/suggestion` rather than to Firestore directly: the collection stays
 * shut to browsers because it fills with email addresses and what people
 * write about themselves, and a Turnstile token means nothing until something
 * holding a secret has asked Cloudflare about it.
 *
 * Photographs are links, never uploads. A bucket open to strangers is other
 * people's files on the owner's bill, and at the idea stage there is nothing
 * worth that risk — the real photography arrives when the owner builds the
 * trip.
 */
export function SuggestForm({
  locale,
  categories,
  homeHref,
}: {
  locale: Locale;
  categories: SuggestCategory[];
  homeHref: string;
}) {
  const c = suggestCopy;
  const f = c.form;

  const [status, setStatus] = useState<Status>("idle");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [token, setToken] = useState("");
  const [check, setCheck] = useState<CheckState>("loading");
  // Which answer the Worker would not take. The browser stops the five
  // required fields on its own, so reaching this means something subtler —
  // an address it accepted and the Worker did not, most likely.
  const [rejected, setRejected] = useState("");

  const sending = status === "sending";
  const chosen = categories.find((one) => one.id === category);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();
    const lines = (key: string) =>
      read(key)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    setStatus("sending");
    try {
      const response = await fetch("/api/suggestion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          interestId: category,
          categoryOther: chosen?.other ? read("categoryOther") : "",
          categoryLabel: chosen?.other
            ? `${chosen.label}: ${read("categoryOther")}`
            : (chosen?.label ?? ""),
          title: read("title"),
          description: read("description"),
          place: read("place"),
          when: read("when"),
          budget: read("budget"),
          groupSize: read("groupSize"),
          experienceLevel: level,
          name: read("name"),
          email: read("email"),
          links: [read("facebook"), read("instagram"), read("linkedin")].filter(Boolean),
          experience: read("experience"),
          audience: read("audience"),
          photoLinks: lines("photos"),
          locale,
          source: window.location.pathname,
          turnstileToken: token,
        }),
      });

      if (response.ok) {
        setStatus("sent");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        field?: string;
      };
      // Four failures with four different answers: the form is not switched on
      // yet, the robot check said no, an answer was refused, or something of
      // ours broke. Telling them apart is the difference between "try again",
      // "fix this field" and "do not bother".
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

  if (status === "sent") {
    return <Sent locale={locale} homeHref={homeHref} onAgain={() => setStatus("idle")} />;
  }

  const mail = (
    <a
      href={`mailto:${emailConfig.recipient}`}
      className="text-white underline decoration-[color:var(--gold)] underline-offset-4"
    >
      {emailConfig.recipient}
    </a>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <fieldset className="space-y-5" disabled={sending}>
        <Legend>{f.ideaHeading[locale]}</Legend>

        <Field
          label={`${f.title[locale]} *`}
          name="title"
          placeholder={f.titlePlaceholder[locale]}
          required
        />

        <SelectField
          label={`${f.category[locale]} *`}
          name="category"
          required
          value={category}
          onChange={setCategory}
          options={[
            { value: "", label: f.categoryChoose[locale] },
            ...categories.map((one) => ({ value: one.id, label: one.label })),
          ]}
        />

        {chosen?.other && (
          <Field
            label={f.categoryOther[locale]}
            name="categoryOther"
            placeholder={f.categoryOtherPlaceholder[locale]}
          />
        )}

        <Field
          label={`${f.description[locale]} *`}
          name="description"
          placeholder={f.descriptionPlaceholder[locale]}
          textarea
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.place[locale]} name="place" placeholder={f.placePlaceholder[locale]} />
          <Field label={f.when[locale]} name="when" placeholder={f.whenPlaceholder[locale]} />
          <Field label={f.budget[locale]} name="budget" placeholder={f.budgetPlaceholder[locale]} />
          <Field
            label={f.groupSize[locale]}
            name="groupSize"
            placeholder={f.groupSizePlaceholder[locale]}
          />
        </div>

        <SelectField
          label={f.level[locale]}
          name="experienceLevel"
          value={level}
          onChange={setLevel}
          options={LEVELS.map((value) => ({ value, label: f.levels[value][locale] }))}
        />
      </fieldset>

      <fieldset className="space-y-5" disabled={sending}>
        <Legend>{f.aboutHeading[locale]}</Legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={`${f.name[locale]} *`}
            name="name"
            placeholder={f.namePlaceholder[locale]}
            autoComplete="name"
            required
          />
          <Field
            label={`${f.email[locale]} *`}
            name="email"
            type="email"
            placeholder={f.emailPlaceholder[locale]}
            autoComplete="email"
            required
          />
        </div>
        <Hint>{f.emailHint[locale]}</Hint>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={f.facebook[locale]} name="facebook" placeholder="https://facebook.com/…" />
          <Field label={f.instagram[locale]} name="instagram" placeholder="https://instagram.com/…" />
          <Field label={f.linkedin[locale]} name="linkedin" placeholder="https://linkedin.com/in/…" />
        </div>
        <Hint>{f.socialHint[locale]}</Hint>

        <Field
          label={f.experience[locale]}
          name="experience"
          placeholder={f.experiencePlaceholder[locale]}
          textarea
        />
        <Field
          label={f.audience[locale]}
          name="audience"
          placeholder={f.audiencePlaceholder[locale]}
          textarea
        />
        <Field
          label={f.photos[locale]}
          name="photos"
          placeholder={f.photosPlaceholder[locale]}
          textarea
        />
        <Hint>{f.photosHint[locale]}</Hint>
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
          {sending ? f.sending[locale] : f.submit[locale]}
        </button>

        <p className="text-xs text-white/45">{f.consent[locale]}</p>
      </div>
    </form>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-1 font-display text-2xl text-white sm:text-3xl">
      {children}
    </legend>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="-mt-2 text-xs leading-relaxed text-white/45">{children}</p>;
}

/** §3.3: a screen of its own, not a line under the form. */
function Sent({
  locale,
  homeHref,
  onAgain,
}: {
  locale: Locale;
  homeHref: string;
  onAgain: () => void;
}) {
  const s = suggestCopy.sent;

  return (
    <div className="rounded-3xl border border-[color:var(--gold)]/40 bg-white/[0.05] p-8 sm:p-12">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--gold)] text-xl text-[color:var(--gold-foreground)]"
      >
        ✓
      </span>
      <h2 className="mt-6 font-display text-3xl text-white sm:text-4xl">
        {s.title[locale]}
      </h2>
      <p className="mt-4 max-w-xl text-white/75">{s.text[locale]}</p>

      <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/45">
        {s.next[locale]}
      </p>
      <ol className="mt-4 space-y-3">
        {s.steps.map((step, index) => (
          <li key={step.en} className="flex gap-3 text-sm text-white/75">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/50 text-xs text-[color:var(--gold)]">
              {index + 1}
            </span>
            {step[locale]}
          </li>
        ))}
      </ol>

      <div className="mt-9 flex flex-wrap gap-3">
        <a
          href={homeHref}
          className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
        >
          {s.home[locale]}
        </a>
        <button
          type="button"
          onClick={onAgain}
          className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-white"
        >
          {s.another[locale]}
        </button>
      </div>
    </div>
  );
}
