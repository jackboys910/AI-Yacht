"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdventureSuggestion,
  Interest,
  SuggestionStatus,
  Trip,
} from "@/lib/content/types";
import { patchSuggestion, tripFromSuggestion } from "@/lib/firebase/suggestions";
import { deleteSuggestion } from "@/lib/firebase/suggestions";
import { saveTrip } from "@/lib/firebase/trips";
import { PrimaryButton, SecondaryButton } from "../fields";
import { failureText, useAdmin } from "../i18n";
import { Badge, Banner, StatusBadge } from "./suggestions-view";

const STATUSES: SuggestionStatus[] = [
  "new",
  "underReview",
  "needsInfo",
  "approved",
  "published",
  "declined",
];

/**
 * One idea, in full, with everything the owner can do to it (ТЗ v4, §3.4).
 *
 * Nothing the author wrote is editable here. An idea is a letter, and a letter
 * the recipient can rewrite is no longer evidence of what was asked for. What
 * the owner adds — a status, a note, a trip — lives beside it.
 */
export function SuggestionDetail({
  suggestion,
  interests,
  trips,
  onChanged,
  onBack,
}: {
  suggestion: AdventureSuggestion;
  interests: Interest[];
  trips: Trip[];
  onChanged: () => void;
  onBack: () => void;
}) {
  const { locale, t } = useAdmin();
  const router = useRouter();

  const [note, setNote] = useState(suggestion.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const interest = interests.find((one) => one.id === suggestion.interestId);
  const madeTrip = suggestion.tripId
    ? trips.find((trip) => trip.id === suggestion.tripId)
    : undefined;

  async function run(what: () => Promise<string>, wrap: (detail: string) => string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setNotice(await what());
      onChanged();
    } catch (cause) {
      setError(failureText(cause, locale, t, wrap));
    } finally {
      setBusy(false);
    }
  }

  /**
   * А draft from the idea.
   *
   * Pressing it twice must not make two trips, so the first thing the new trip
   * does is write its id back onto the idea; from then on the button is a link
   * to that trip instead. The status moves to "approved" at the same time —
   * making a trip from an idea *is* approving it, and asking the owner to also
   * remember to change a dropdown is how a queue stops being trustworthy.
   */
  async function createTrip() {
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const draft = tripFromSuggestion(suggestion, trips);
      const tripId = await saveTrip(null, draft, trips);
      await patchSuggestion(suggestion.id, { tripId, status: "approved" });
      setNotice(t.suggestions.created);
      onChanged();
    } catch (cause) {
      setError(failureText(cause, locale, t, t.suggestions.createFailed));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {error && <Banner tone="warn">{error}</Banner>}
      {notice && <Banner tone="info">{notice}</Banner>}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl">
            {suggestion.title.trim() || t.suggestions.untitled}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={suggestion.status} t={t} />
            {suggestion.createdAt && (
              <span>{t.suggestions.received(suggestion.createdAt.slice(0, 10))}</span>
            )}
            <span>·</span>
            <span>{t.suggestions.sentIn(t.suggestions.languages[suggestion.locale])}</span>
          </p>
        </div>
        <SecondaryButton onClick={onBack}>{t.suggestions.back}</SecondaryButton>
      </div>

      <Card title={t.suggestions.idea}>
        <Row label={t.suggestions.category}>
          {suggestion.categoryOther?.trim() ? (
            <>
              {interest?.name.en ?? t.suggestions.noDirection}
              <span className="ml-2">
                <Badge>{t.suggestions.otherCategory}: {suggestion.categoryOther}</Badge>
              </span>
            </>
          ) : (
            (interest?.name.en ?? t.suggestions.noDirection)
          )}
        </Row>
        <Block label={t.suggestions.description} text={suggestion.description} />
        <Row label={t.suggestions.place}>{suggestion.place}</Row>
        <Row label={t.suggestions.when}>{suggestion.when}</Row>
        <Row label={t.suggestions.budget}>{suggestion.budget}</Row>
        <Row label={t.suggestions.groupSize}>{suggestion.groupSize}</Row>
        <Row label={t.suggestions.experienceLevel}>
          {suggestion.experienceLevel && t.suggestions.levels[suggestion.experienceLevel]}
        </Row>
      </Card>

      <Card title={t.suggestions.author}>
        <Row label={t.suggestions.name}>{suggestion.name}</Row>
        <Row label={t.suggestions.email}>
          {suggestion.email && (
            <a
              href={`mailto:${suggestion.email}`}
              className="text-[color:var(--teal)] underline underline-offset-2"
            >
              {suggestion.email}
            </a>
          )}
        </Row>
        <Links label={t.suggestions.links} urls={suggestion.links} />
        <Block label={t.suggestions.experience} text={suggestion.experience} />
        <Block label={t.suggestions.audience} text={suggestion.audience} />
        <Links label={t.suggestions.photoLinks} urls={suggestion.photoLinks} />
        <Row label={t.suggestions.source}>{suggestion.source}</Row>
      </Card>

      <Card title={t.suggestions.decision}>
        <div>
          <label
            htmlFor="suggestion-status"
            className="block text-sm font-medium"
          >
            {t.suggestions.status}
          </label>
          <select
            id="suggestion-status"
            value={suggestion.status}
            disabled={busy}
            onChange={(event) =>
              void run(async () => {
                await patchSuggestion(suggestion.id, {
                  status: event.target.value as SuggestionStatus,
                });
                return t.suggestions.statusChanged;
              }, t.suggestions.saveFailed)
            }
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-[color:var(--ring)] disabled:opacity-60 sm:w-auto"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t.suggestions.statuses[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="suggestion-note" className="block text-sm font-medium">
            {t.suggestions.note}
          </label>
          <textarea
            id="suggestion-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t.suggestions.noteHint}</p>
          <div className="mt-3">
            <SecondaryButton
              disabled={busy || note === (suggestion.adminNote ?? "")}
              onClick={() =>
                void run(async () => {
                  await patchSuggestion(suggestion.id, { adminNote: note });
                  return t.suggestions.noteSaved;
                }, t.suggestions.saveFailed)
              }
            >
              {t.suggestions.saveNote}
            </SecondaryButton>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          {suggestion.tripId ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t.suggestions.alreadyCreated}
              </p>
              <div className="mt-3">
                <PrimaryButton
                  onClick={() =>
                    router.push(`/admin/?view=trips&edit=${suggestion.tripId}`)
                  }
                >
                  {madeTrip?.title.en?.trim()
                    ? `${t.suggestions.openTrip}: ${madeTrip.title.en}`
                    : t.suggestions.openTrip}
                </PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <PrimaryButton onClick={() => void createTrip()} disabled={creating || busy}>
                {creating ? t.suggestions.creating : t.suggestions.createTrip}
              </PrimaryButton>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.suggestions.createTripHint}
              </p>
            </>
          )}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3 pb-10">
        {confirmDelete ? (
          <>
            <span className="text-sm text-muted-foreground">
              {t.suggestions.deleteConfirm}
            </span>
            <SecondaryButton
              tone="danger"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await deleteSuggestion(suggestion.id);
                  onBack();
                  return "";
                }, t.suggestions.saveFailed)
              }
            >
              {t.field.deleteYes}
            </SecondaryButton>
            <SecondaryButton disabled={busy} onClick={() => setConfirmDelete(false)}>
              {t.field.deleteNo}
            </SecondaryButton>
          </>
        ) : (
          <SecondaryButton tone="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
            {t.suggestions.deleteIdea}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** One short answer. Absent answers still get a line: a gap is information. */
function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  const { t } = useAdmin();
  const empty =
    children === undefined ||
    children === null ||
    children === "" ||
    children === false;

  return (
    <div className="grid gap-0.5 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${empty ? "text-muted-foreground/60" : ""}`}>
        {empty ? t.suggestions.empty : children}
      </span>
    </div>
  );
}

/** A long answer, kept on its own lines the way the author typed it. */
function Block({ label, text }: { label: string; text?: string }) {
  const { t } = useAdmin();
  const filled = Boolean(text?.trim());

  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p
        className={`mt-1 whitespace-pre-wrap text-sm ${
          filled ? "" : "text-muted-foreground/60"
        }`}
      >
        {filled ? text : t.suggestions.empty}
      </p>
    </div>
  );
}

/**
 * Links the author gave.
 *
 * `rel="noopener noreferrer nofollow"` and no `target` guesswork: these are
 * addresses typed by a stranger, so they open in a new tab without handing the
 * destination a handle on this page, and without passing any ranking on.
 */
function Links({ label, urls }: { label: string; urls: string[] }) {
  const { t } = useAdmin();

  return (
    <div className="grid gap-0.5 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {urls.length === 0 ? (
        <span className="text-sm text-muted-foreground/60">{t.suggestions.empty}</span>
      ) : (
        <ul className="space-y-1 text-sm">
          {urls.map((url) => (
            <li key={url} className="break-all">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-[color:var(--teal)] underline underline-offset-2"
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
