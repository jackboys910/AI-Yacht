"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Settings } from "@/lib/content/types";
import { reportEvent } from "@/lib/analytics/events";
import { emailConfig } from "@/lib/email/config";
import { publishInterested, useInterested } from "@/lib/firebase/counters";
import { visitSource } from "@/lib/visit-source";
import { TurnstileCheck, type CheckState } from "../suggest/turnstile-check";
import { interestedCopy } from "./interested-copy";

/**
 * "I'm interested" and the two numbers beside it (§6.3, plan item 3.1).
 *
 * The button asks for one thing, an email, and does two: it counts the
 * person among those interested in this trip and puts them on the mailing
 * list of its direction. Both happen in the Worker — the collections it
 * writes are shut to browsers, and a counter a browser could write is a
 * counter anybody could write any number into.
 *
 * The numbers appear only above the thresholds in the settings, because §6.3
 * says so and the reason is worth repeating: "1 going" puts people off more
 * than no number at all.
 *
 * Everything here is one client island rather than three, so that a press
 * moves the figure, the faces and the thank-you together. What keeps them in
 * step across the page — a card and the page it links to, two cards of the
 * same trip — is the shared store in `lib/firebase/counters`.
 */

export interface Face {
  name: string;
  url?: string;
}

type Status = "idle" | "sending" | "done" | "failed" | "spam" | "off" | "rejected";

/** One of the two big numbers in "Who's going". */
export function InterestedFigure({
  tripId,
  printed,
  threshold,
  locale,
}: {
  tripId: string;
  /** What the count was when the page was built. */
  printed: number;
  threshold: number;
  locale: Locale;
}) {
  const count = useInterested(tripId, printed);
  if (count < threshold) return null;

  return (
    <span className="flex items-baseline gap-2">
      <span className="font-display text-3xl sm:text-4xl">{count}</span>
      <span className="text-sm text-muted-foreground">
        {interestedCopy.figures.interested[locale]}
      </span>
    </span>
  );
}

/**
 * The faces under the numbers and the button that joins them.
 *
 * The faces are the trip's crew, from the people directory — §6.3 asks for
 * "photos from the directory or initials", and the directory is the only
 * place this site has a photograph of anybody. Nobody who merely wrote in is
 * shown: their names were given to the owner, not to the page.
 */
export function InterestedRow({
  tripId,
  tripTitle,
  direction,
  locale,
  going,
  printed,
  thresholds,
  faces,
}: {
  tripId: string;
  tripTitle: string;
  /** The direction's name, for the line about what else arrives. */
  direction: string;
  locale: Locale;
  going: number;
  printed: number;
  thresholds: Settings["counterThresholds"];
  faces: Face[];
}) {
  const count = useInterested(tripId, printed);
  const crowded = going >= thresholds.going || count >= thresholds.interested;
  const shown = faces.slice(0, 5);
  const more = going - shown.length;

  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
      {crowded && shown.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {shown.map((face) => (
              <Avatar key={`${face.name}-${face.url ?? ""}`} face={face} />
            ))}
          </div>
          {more > 0 && (
            <span className="ml-3 text-sm text-muted-foreground">
              {interestedCopy.more[locale](more)}
            </span>
          )}
        </div>
      )}

      <InterestedButton
        tripId={tripId}
        tripTitle={tripTitle}
        direction={direction}
        locale={locale}
      />
    </div>
  );
}

function Avatar({ face }: { face: Face }) {
  const initials =
    face.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "·";

  return face.url ? (
    <img
      src={face.url}
      alt={face.name}
      width={40}
      height={40}
      loading="lazy"
      className="h-10 w-10 rounded-full border-2 border-background object-cover"
    />
  ) : (
    <span
      aria-label={face.name}
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-background bg-[color:var(--muted)] text-xs font-medium text-muted-foreground"
    >
      {initials}
    </span>
  );
}

/** The two numbers on a card, where there is room for one line and no faces. */
export function CardCounters({
  tripId,
  going,
  printed,
  thresholds,
  locale,
}: {
  tripId: string;
  going: number;
  printed: number;
  thresholds: Settings["counterThresholds"];
  locale: Locale;
}) {
  const count = useInterested(tripId, printed);
  const parts: string[] = [];
  if (going >= thresholds.going) parts.push(interestedCopy.card.going[locale](going));
  if (count >= thresholds.interested) {
    parts.push(interestedCopy.card.interested[locale](count));
  }
  if (parts.length === 0) return null;

  return <p className="mt-2 text-sm text-muted-foreground">{parts.join(" · ")}</p>;
}

export function InterestedButton({
  tripId,
  tripTitle,
  direction,
  locale,
}: {
  tripId: string;
  tripTitle: string;
  direction: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
      >
        {interestedCopy.button[locale]}
      </button>

      <InterestedDialog
        tripId={tripId}
        tripTitle={tripTitle}
        direction={direction}
        locale={locale}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function InterestedDialog({
  tripId,
  tripTitle,
  direction,
  locale,
  open,
  onClose,
}: {
  tripId: string;
  tripTitle: string;
  direction: string;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // `showModal` is what makes it modal; an `open` attribute renders the
    // same markup with no backdrop, no focus trap and no Escape.
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        // The content sits in a child, so a click that matches the dialog
        // itself is a click on the backdrop.
        if (event.target === dialog.current) onClose();
      }}
      // `m-auto` is what centres it: a dialog centres itself through
      // `margin: auto`, and Tailwind's reset zeroes every margin.
      className="m-auto max-h-[85dvh] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl bg-card p-0 text-foreground shadow-2xl backdrop:bg-[color:var(--primary)]/70 backdrop:backdrop-blur-sm"
    >
      {/* Mounted only while open, so the robot check is asked for when
          somebody means to press the button, and a fresh token every time. */}
      {open && (
        <DialogBody
          tripId={tripId}
          tripTitle={tripTitle}
          direction={direction}
          locale={locale}
          fieldId={field}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

function DialogBody({
  tripId,
  tripTitle,
  direction,
  locale,
  fieldId,
  onClose,
}: {
  tripId: string;
  tripTitle: string;
  direction: string;
  locale: Locale;
  fieldId: string;
  onClose: () => void;
}) {
  const c = interestedCopy;
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState("");
  const [check, setCheck] = useState<CheckState>("loading");
  const [already, setAlready] = useState(false);

  const sending = status === "sending";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const data = new FormData(event.currentTarget);
    const address = String(data.get("email") ?? "").trim();
    setStatus("sending");
    try {
      const response = await fetch("/api/interested", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tripId,
          email: address,
          locale,
          source: visitSource(),
          turnstileToken: token,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        interested?: number;
        counted?: boolean;
        error?: string;
      };

      if (response.ok && body.ok) {
        // The Worker has just counted the records; the page takes its word
        // for it rather than asking Firestore the same question again.
        if (typeof body.interested === "number") {
          publishInterested(tripId, body.interested);
        }
        setAlready(body.counted === false);
        setStatus("done");
        // Ш-06. Counted means new to this trip; a repeat press is the same
        // person saying the same thing, not a second piece of interest.
        if (body.counted !== false) {
          reportEvent("interested", { email: address, contentName: tripTitle });
        }
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
      <div className="p-7 sm:p-8">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--gold)] text-lg text-[color:var(--gold-foreground)]"
        >
          ✓
        </span>
        <h2 className="mt-5 font-display text-2xl">{c.done.title[locale]}</h2>
        <p className="mt-3 text-sm leading-relaxed">{c.done.text[locale](tripTitle)}</p>
        {already && (
          <p className="mt-2 text-sm text-muted-foreground">{c.done.already[locale]}</p>
        )}

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
    <form onSubmit={submit} className="p-7 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
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

        <p className="text-xs leading-relaxed text-muted-foreground">
          {c.dialog.note[locale](direction)}
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
        disabled={sending || check === "failed"}
        className="mt-6 w-full rounded-full bg-[color:var(--gold)] px-6 py-3.5 font-display text-base text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-50"
      >
        {sending ? c.dialog.sending[locale] : c.dialog.submit[locale]}
      </button>
    </form>
  );
}
