"use client";

import { useEffect, useRef, useState } from "react";
import { readAnnounce, sendAnnounceBatch, type AnnounceState } from "@/lib/announce";
import type { PublicationStatus } from "@/lib/content/types";
import { PrimaryButton, SecondaryButton } from "../fields";
import { useAdmin } from "../i18n";

/**
 * "Send to subscribers" (Н-07, Н-08, §8.2).
 *
 * The owner sees three things before anything leaves: how many people this
 * reaches, in which languages, and the letter itself. The preview is the
 * real letter — built by the Worker from this trip and shown in a frame —
 * because an approximation of a mailing is exactly the thing that gets sent
 * with a mistake in it.
 *
 * Sending happens in batches, and this panel is what drives them: one call
 * per handful of letters, repeated while anything is left. That is not a
 * detail of taste — a Worker request may only make so many outgoing requests
 * — but it does mean the tab has to stay open, and the panel says so.
 * Nothing breaks if it does not: who has been written to is recorded in the
 * database as it happens, so reopening the trip offers to carry on rather
 * than start again.
 *
 * Н-08 lives at the end: once everybody has had it, the button asks a second
 * question before it will send the same letter twice.
 */
export function AnnouncePanel({
  tripId,
  status,
  dirty,
}: {
  /** Null until the trip has been saved once. */
  tripId: string | null;
  status: PublicationStatus;
  /** Unsaved edits: the letter would describe the saved trip, not this one. */
  dirty: boolean;
}) {
  const { t } = useAdmin();
  const c = t.tripForm.announce;

  const [state, setState] = useState<AnnounceState | null>(null);
  const [absent, setAbsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [shown, setShown] = useState<"en" | "ru">("en");
  const alive = useRef(true);

  const published = status === "published" && Boolean(tripId);

  // Every setState here happens after the request, never in the body of the
  // effect: a synchronous one would redraw the form twice before the first
  // paint, and this is the longest form in the panel.
  useEffect(() => {
    alive.current = true;
    if (!published || !tripId) {
      return () => {
        alive.current = false;
      };
    }

    readAnnounce(tripId).then(
      (answer) => {
        if (!alive.current) return;
        if (!answer) setAbsent(true);
        else setState(answer);
      },
      () => {
        if (alive.current) setAbsent(true);
      },
    );

    return () => {
      alive.current = false;
    };
  }, [published, tripId]);

  async function run(confirm = false) {
    if (!tripId) return;
    setBusy(true);
    setAsking(false);
    setFailure(null);

    try {
      let answer = await sendAnnounceBatch(tripId, confirm);
      // While there is anything left and the last call actually moved: a
      // call that sent nothing and still reports work left would otherwise
      // spin here forever.
      while (
        answer &&
        !answer.error &&
        !answer.needsConfirmation &&
        answer.remaining > 0 &&
        (answer.delivered ?? 0) > 0
      ) {
        if (!alive.current) return;
        setState(answer);
        answer = await sendAnnounceBatch(tripId);
      }

      if (!alive.current) return;
      if (!answer) {
        setAbsent(true);
        return;
      }
      setState(answer);
      if (answer.needsConfirmation) setAsking(true);
      else if (answer.error) setFailure(answer.error);
    } catch {
      if (alive.current) setFailure("failed");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <section
      id="block-announce"
      className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h3 className="font-display text-lg">{c.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{c.explain}</p>

      {!tripId ? (
        <Note>{c.saveFirst}</Note>
      ) : status !== "published" ? (
        <Note>{c.draft}</Note>
      ) : absent ? (
        <Note>{c.absent}</Note>
      ) : state ? (
        <>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-2xl">{c.recipients(state.recipients)}</span>
            {state.recipients > 0 && (
              <span className="text-sm text-muted-foreground">
                {c.byLocale(state.byLocale.en, state.byLocale.ru)}
              </span>
            )}
          </div>

          {state.recipients === 0 ? (
            <Note>{c.nobody}</Note>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {c.limit(state.recipients, state.limit)}
            </p>
          )}

          {state.recipients > state.limit / 2 && (
            <Warn>{c.overLimit}</Warn>
          )}

          {state.finishedAt && (
            <p className="mt-4 text-sm text-[color:var(--teal)]">
              {c.sentAt(state.finishedAt.slice(0, 10))}
            </p>
          )}
          {!state.finishedAt && state.sentCount > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {c.progress(state.sentCount, state.recipients)}
            </p>
          )}

          {state.failed.length > 0 && (
            <Warn>
              {c.failedSome(state.failed.length)}
              <span className="mt-1 block break-all text-xs opacity-80">
                {state.failed.join(", ")}
              </span>
            </Warn>
          )}

          {!state.postalAddress && <Warn>{c.noPostal}</Warn>}
          {failure === "no-emailjs" && <Warn>{c.unconfigured}</Warn>}
          {failure === "failed" || failure === "server" ? <Warn>{c.failed}</Warn> : null}

          {state.preview && state.recipients > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {c.preview}
                </span>
                <div className="flex gap-2">
                  {(["en", "ru"] as const).map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setShown(locale)}
                      aria-pressed={shown === locale}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                        shown === locale
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {locale === "en" ? c.previewEn : c.previewRu}
                    </button>
                  ))}
                </div>
              </div>
              {/* The letter, in a frame of its own. `sandbox` with nothing
                  granted: a preview may not run anything, and the letter has
                  nothing to run. */}
              <iframe
                key={shown}
                title={state.preview.subject}
                srcDoc={shown === "en" ? state.preview.en : state.preview.ru}
                sandbox=""
                className="mt-3 h-[28rem] w-full rounded-xl border border-border bg-white"
              />
            </div>
          )}

          {state.recipients > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {asking ? (
                <>
                  <span className="text-sm text-muted-foreground">{c.againConfirm}</span>
                  <PrimaryButton onClick={() => void run(true)} disabled={busy}>
                    {c.againYes}
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setAsking(false)} disabled={busy}>
                    {c.againNo}
                  </SecondaryButton>
                </>
              ) : (
                <PrimaryButton
                  onClick={() => void run()}
                  disabled={busy || dirty || !state.postalAddress}
                >
                  {busy
                    ? c.sending(state.sentCount, state.recipients)
                    : state.finishedAt
                      ? c.again
                      : state.sentCount > 0
                        ? c.resume(state.remaining)
                        : c.send}
                </PrimaryButton>
              )}

              {busy && <span className="text-xs text-muted-foreground">{c.closingTab}</span>}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-muted-foreground">{children}</p>;
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900"
    >
      {children}
    </div>
  );
}
