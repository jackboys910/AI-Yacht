"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { emailConfig } from "@/lib/email/config";
import { visitSource } from "@/lib/visit-source";
import { TurnstileCheck, type CheckState } from "../suggest/turnstile-check";
import { nameList, subscribeCopy } from "./subscribe-copy";

/** A direction somebody can be written to about. */
export interface SubscribeOption {
  /** The interest's database id — what the mailing list is keyed on. */
  id: string;
  label: string;
}

type Status = "idle" | "sending" | "done" | "failed" | "spam" | "off" | "rejected";

/**
 * "+ Subscribe" and the window behind it (ТЗ §15.3: Н-01…Н-06, Н-12; С-05).
 *
 * One component for both shapes the subscription takes — the "+" beside a
 * direction and the strip at the foot of a page — because they are the same
 * conversation and splitting them would mean two copies of the state that
 * decides what happens after the address is typed.
 *
 * Only an email is asked for. No phone (Н-02), no account (С-05), and no
 * confirmation step: the subscription is live the moment it is sent (Н-04).
 * The directions of the page you came from are ticked already (Н-03) and the
 * rest are there to tick.
 *
 * The window is a real `<dialog>`, opened with `showModal`. That is what gets
 * Escape, the backdrop, focus held inside it and the rest of the page hidden
 * from a screen reader — all of which a `<div>` with a high z-index has to
 * reimplement, usually badly.
 */
export function Subscribe({
  locale,
  options,
  preselect,
  variant = "button",
  name,
  tone = "light",
}: {
  locale: Locale;
  options: SubscribeOption[];
  /** Ticked when the window opens — the direction whose page this is. */
  preselect?: string[];
  variant?: "button" | "strip";
  /** Names the direction in the button: "+ Subscribe to Sailing". */
  name?: string;
  /** "dark" for the button that sits on a photograph. */
  tone?: "light" | "dark";
}) {
  const c = subscribeCopy;
  const [open, setOpen] = useState(false);

  if (options.length === 0) return null;

  const label = name ? c.open.one[locale](name) : c.open.any[locale];

  return (
    <>
      {variant === "strip" ? (
        <section className="bg-primary py-14 text-white sm:py-20">
          <div className="container-narrow flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)]">
                {c.strip.kicker[locale]}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                {c.strip.heading[locale]}
              </h2>
              <p className="mt-4 text-white/75">{c.strip.text[locale]}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-full bg-[color:var(--gold)] px-7 py-3.5 font-display text-base text-[color:var(--gold-foreground)] transition hover:brightness-95"
            >
              {label}
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            tone === "dark"
              ? "inline-flex items-center rounded-full border border-[color:var(--gold)]/70 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-[color:var(--gold)] hover:text-[color:var(--gold-foreground)]"
              : "inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
          }
        >
          {label}
        </button>
      )}

      <SubscribeDialog
        locale={locale}
        options={options}
        preselect={preselect}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function SubscribeDialog({
  locale,
  options,
  preselect,
  open,
  onClose,
}: {
  locale: Locale;
  options: SubscribeOption[];
  preselect?: string[];
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // `showModal` is what makes it modal; setting an `open` attribute renders
    // the same markup without the backdrop, the focus trap or Escape.
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      // Escape and the backdrop close it without going through the button.
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop:
        // the content is inside a child, so it never matches.
        if (event.target === dialog.current) onClose();
      }}
      // `m-auto` is what centres it: a dialog centres itself through
      // `margin: auto`, and Tailwind's reset sets every margin to zero, so
      // without this the window opens in the top-left corner.
      className="m-auto max-h-[85dvh] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl bg-card p-0 text-foreground shadow-2xl backdrop:bg-[color:var(--primary)]/70 backdrop:backdrop-blur-sm"
    >
      {/* Mounted only while open, so the robot check is requested when
          somebody actually means to subscribe, and a fresh token is asked for
          every time the window is opened. */}
      {open && (
        <DialogBody
          locale={locale}
          options={options}
          preselect={preselect}
          fieldId={field}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

function DialogBody({
  locale,
  options,
  preselect,
  fieldId,
  onClose,
}: {
  locale: Locale;
  options: SubscribeOption[];
  preselect?: string[];
  fieldId: string;
  onClose: () => void;
}) {
  const c = subscribeCopy;
  const [chosen, setChosen] = useState<string[]>(() => {
    const wanted = (preselect ?? []).filter((id) => options.some((o) => o.id === id));
    // Opened from a direction, that direction is ticked; opened from the home
    // page, everything is, because "join the crew" there means the community
    // rather than one of its corners. Both are a starting point, not a
    // decision — every box is there to be unticked.
    return wanted.length > 0 ? wanted : options.map((option) => option.id);
  });
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState("");
  const [check, setCheck] = useState<CheckState>("loading");
  const [already, setAlready] = useState(false);

  const sending = status === "sending";
  const picked = options.filter((option) => chosen.includes(option.id));

  function toggle(id: string) {
    setChosen((current) =>
      current.includes(id) ? current.filter((one) => one !== id) : [...current, id],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || chosen.length === 0) return;

    const data = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? "").trim(),
          interestIds: chosen,
          locale,
          source: visitSource(),
          turnstileToken: token,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        created?: boolean;
        error?: string;
      };

      if (response.ok && body.ok) {
        setAlready(body.created === false);
        setStatus("done");
        return;
      }

      setStatus(
        body.error === "not-configured"
          ? "off"
          : body.error === "turnstile"
            ? "spam"
            : body.error === "bad-request"
              ? "rejected"
              : "failed",
      );
    } catch {
      setStatus("failed");
    }
  }

  const mail = (
    <a
      href={`mailto:${emailConfig.recipient}`}
      className="underline decoration-[color:var(--gold)] underline-offset-4"
    >
      {emailConfig.recipient}
    </a>
  );

  if (status === "done") {
    return (
      <div className="p-7 sm:p-9">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--gold)] text-lg text-[color:var(--gold-foreground)]"
        >
          ✓
        </span>
        <h2 className="mt-5 font-display text-2xl">{c.done.title[locale]}</h2>
        <p className="mt-3 text-sm leading-relaxed">
          {c.done.text[locale](nameList(picked.map((one) => one.label), locale))}
        </p>
        {already && (
          <p className="mt-2 text-sm text-muted-foreground">{c.done.already[locale]}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{c.done.letter[locale]}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
        >
          {c.dialog.close[locale]}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="p-7 sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">{c.dialog.title[locale]}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {c.dialog.lead[locale]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={c.dialog.close[locale]}
          className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-[color:var(--muted)] hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <fieldset disabled={sending} className="mt-6 space-y-5">
        <div>
          <label htmlFor={`${fieldId}-email`} className="block text-sm font-medium">
            {c.dialog.email[locale]}
          </label>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={c.dialog.emailPlaceholder[locale]}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25 disabled:opacity-60"
          />
        </div>

        <div>
          <span className="block text-sm font-medium">{c.dialog.directions[locale]}</span>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.dialog.directionsHint[locale]}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => {
              const on = chosen.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(option.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    on
                      ? "border-[color:var(--teal)] bg-[color:var(--teal)] text-white"
                      : "border-border bg-background hover:border-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {chosen.length === 0 && (
            <p role="alert" className="mt-2 text-sm text-amber-700">
              {c.dialog.needsOne[locale]}
            </p>
          )}
        </div>

        {/* Consent is a sentence, not a checkbox: pressing "Subscribe" under
            it is the agreement, and a box to tick before a button that means
            the same thing is a second click for nothing. The Privacy Policy
            link joins it when that page exists (plan item 4.2). */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {c.dialog.consent[locale]} {c.dialog.consentNote[locale]}
        </p>

        <TurnstileCheck locale={locale} onToken={setToken} onState={setCheck} />
      </fieldset>

      {check === "failed" ? (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {c.check.failed[locale]} {mail}
        </p>
      ) : (
        check === "loading" && (
          <p className="mt-3 text-xs text-muted-foreground">{c.check.loading[locale]}</p>
        )
      )}

      {status === "off" && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {c.failure.notConfigured[locale]} {mail}
        </p>
      )}
      {status === "spam" && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {c.failure.spam[locale]}
        </p>
      )}
      {status === "rejected" && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {c.failure.rejected[locale]}
        </p>
      )}
      {status === "failed" && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {c.failure.text[locale]} {mail}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || chosen.length === 0 || check === "failed"}
        className="mt-6 w-full rounded-full bg-[color:var(--gold)] px-6 py-3.5 font-display text-base text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50"
      >
        {sending ? c.dialog.sending[locale] : c.dialog.submit[locale]}
      </button>
    </form>
  );
}
