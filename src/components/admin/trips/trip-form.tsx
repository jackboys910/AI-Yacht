"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { slugify } from "@/lib/content/slug";
import type { Interest, Person, Trip } from "@/lib/content/types";
import { validateTrip, type ValidationIssue } from "@/lib/content/validation";
import { rebuildAfterTrip, rebuildSoon } from "@/lib/rebuild";
import {
  deleteTrip,
  saveTrip,
  type TripDraft,
} from "@/lib/firebase/trips";
import {
  Checkbox,
  FormLocaleProvider,
  LocaleTabs,
  LocalizedInput,
  LocalizedTextarea,
  NumberInput,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextInput,
} from "../fields";
import { failureText, useAdmin, type AdminCopy } from "../i18n";
import { Section } from "./section";
import { TripBlocks, TripClosingBlocks } from "./trip-blocks";
import { TripCrew, TripGallery, TripRoute } from "./trip-media";
import { TripPreview } from "./trip-preview";

/**
 * The trip form — every block of §6.3, filled in for both languages.
 *
 * Three things shape it. The sections follow the order of the finished page, so
 * filling the form reads like reading the trip. Optional blocks are added
 * rather than left blank, because §6.3 renders nothing for a block that was not
 * filled in. And the work is protected: a long form on a phone is exactly where
 * an accidental back-swipe costs an hour, so unsaved changes are kept in the
 * browser and offered back on the next visit.
 */

/**
 * The blocks of the form, in page order, each paired with the copy key that
 * names it. Written as pairs rather than as two lists so a block cannot be
 * renamed in one place and keep its old anchor in the other.
 */
type TripBlockCopy = AdminCopy["tripForm"];

/** The copy keys that name a block — the ones carrying a title and a subtitle. */
type BlockKey = {
  [K in keyof TripBlockCopy]: TripBlockCopy[K] extends { title: string } ? K : never;
}[keyof TripBlockCopy];

const CONTENTS: { id: string; key: BlockKey }[] = [
  { id: "block-basics", key: "basics" },
  { id: "block-seats", key: "seats" },
  { id: "block-gallery", key: "gallery" },
  { id: "block-price", key: "price" },
  { id: "block-place", key: "placeBlock" },
  { id: "block-audience", key: "audience" },
  { id: "block-what-you-get", key: "whatYouGet" },
  { id: "block-prepare", key: "howToPrepare" },
  { id: "block-program", key: "program" },
  { id: "block-route", key: "route" },
  { id: "block-map", key: "map" },
  { id: "block-media", key: "media" },
  { id: "block-crew", key: "crew" },
  { id: "block-rules", key: "rules" },
  { id: "block-faq", key: "faq" },
  { id: "block-flags", key: "flags" },
  { id: "block-social", key: "social" },
];

const BOOKING_STATUSES = ["open", "fewSpots", "soldOut", "completed"] as const;

const backupKey = (id: string | null) => `nazarov.admin.trip.${id ?? "new"}`;

export function TripForm({
  id,
  initial,
  interests,
  people,
  allTrips,
  onDone,
  onCancel,
}: {
  id: string | null;
  initial: TripDraft;
  interests: Interest[];
  people: Person[];
  allTrips: Trip[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { locale: panelLocale, t } = useAdmin();
  const [draft, setDraft] = useState(initial);
  // The content language. Separate from the panel's on purpose: А-03 blocks
  // publication until both languages of the trip are filled in, so both have
  // to be reachable from whichever interface the owner is working in.
  const [locale, setLocale] = useState<Locale>("en");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Read once, on mount, so nothing is set from inside an effect.
  const [backup] = useState(() => readBackup(backupKey(id)));
  const [backupHandled, setBackupHandled] = useState(false);

  const set = <K extends keyof TripDraft>(key: K, value: TripDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  );

  // Unsaved work lives in the browser until it is saved, and the page asks
  // before closing. Firestore is deliberately not written on every keystroke:
  // a half-typed trip is not a draft anyone wants stored.
  useEffect(() => {
    try {
      if (dirty) localStorage.setItem(backupKey(id), JSON.stringify(draft));
      else localStorage.removeItem(backupKey(id));
    } catch {
      // Private browsing, blocked storage — the form still works.
    }
  }, [dirty, draft, id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const issues = useMemo(
    () => validateTrip({ ...draft, id: id ?? "new", createdAt: "", updatedAt: "" }),
    [draft, id],
  );
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  const incomplete = (["en", "ru"] as const).filter((l) =>
    issues.some((issue) => issue.locale === l),
  );

  async function save(status: TripDraft["status"]) {
    setBusy(true);
    setSaveError(null);
    try {
      await saveTrip(id, { ...draft, status }, allTrips);
      // А-08: publishing is what the owner presses, and the page appearing is
      // what they expect to follow. Saving a draft changes nothing a visitor
      // can see, so it starts no build.
      if (rebuildAfterTrip(id ? initial.status : null, status)) rebuildSoon();
      try {
        localStorage.removeItem(backupKey(id));
      } catch {
        // Nothing to clean up if storage is unavailable.
      }
      onDone();
    } catch (error) {
      setSaveError(failureText(error, panelLocale, t, t.tripForm.saveFailed));
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteTrip(id!);
      try {
        localStorage.removeItem(backupKey(id));
      } catch {
        // Nothing to clean up if storage is unavailable.
      }
      onDone();
    } catch (error) {
      setSaveError(failureText(error, panelLocale, t, t.tripForm.saveFailed));
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  if (previewing) {
    return (
      <TripPreview
        draft={draft}
        id={id}
        people={people}
        interestSlug={interestSlug(interests, draft.interestId)}
        onClose={() => setPreviewing(false)}
      />
    );
  }

  return (
    <FormLocaleProvider locale={locale}>
      <div className="lg:flex lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl">
              {id ? t.tripForm.edit : t.tripForm.create}
              {draft.status === "published" && (
                <span className="ml-3 rounded-full bg-[color:var(--teal)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--teal)]">
                  {t.tripForm.live}
                </span>
              )}
            </h2>
            <LocaleTabs value={locale} onChange={setLocale} incomplete={incomplete} />
          </div>

          {backup && !backupHandled && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p>{t.tripForm.backup}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SecondaryButton
                  onClick={() => {
                    setDraft(backup);
                    setBackupHandled(true);
                  }}
                >
                  {t.tripForm.backupRestore}
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => {
                    try {
                      localStorage.removeItem(backupKey(id));
                    } catch {
                      // Nothing to clean up.
                    }
                    setBackupHandled(true);
                  }}
                >
                  {t.tripForm.backupDiscard}
                </SecondaryButton>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Section
              id="block-basics"
              title={t.tripForm.basics.title}
              subtitle={t.tripForm.basics.subtitle}
            >
              <Select
                id="trip-interest"
                label={t.tripForm.interest}
                required
                value={draft.interestId}
                options={[
                  { value: "", label: t.tripForm.interestPlaceholder },
                  ...interests.map((interest) => ({
                    value: interest.id,
                    label: interest.name.en || interest.slug,
                  })),
                ]}
                onChange={(interestId) => set("interestId", interestId)}
              />

              <LocalizedInput
                id="trip-title"
                label={t.tripForm.name}
                required
                value={draft.title}
                onChange={(title) => {
                  set("title", title);
                  // The address follows the English title until it is edited by
                  // hand, so a new trip needs one field typed, not two.
                  if (!id && (!draft.slug || draft.slug === slugify(draft.title.en))) {
                    set("slug", slugify(title.en));
                  }
                }}
                placeholder="Grenadines, Nov 12–22 2026"
              />

              <LocalizedInput
                id="trip-subtitle"
                label={t.tripForm.subtitle}
                required
                value={draft.subtitle}
                onChange={(subtitle) => set("subtitle", subtitle)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="trip-start"
                  label={t.tripForm.startDate}
                  required
                  value={draft.startDate}
                  onChange={(startDate) => set("startDate", startDate)}
                  hint={t.tripForm.startDateHint}
                />
                <TextInput
                  id="trip-end"
                  label={t.tripForm.endDate}
                  required
                  value={draft.endDate}
                  onChange={(endDate) => set("endDate", endDate)}
                  hint={t.tripForm.endDateHint}
                />
              </div>

              <LocalizedInput
                id="trip-place"
                label={t.tripForm.place}
                required
                value={draft.place}
                onChange={(place) => set("place", place)}
                placeholder="Caribbean"
              />
            </Section>

            <Section
              id="block-seats"
              title={t.tripForm.seats.title}
              subtitle={t.tripForm.seats.subtitle}
            >
              <Select
                id="trip-status"
                label={t.tripForm.bookingStatus}
                required
                value={draft.bookingStatus}
                options={BOOKING_STATUSES.map((value) => ({
                  value,
                  label: t.tripForm.bookingLabels[value],
                }))}
                onChange={(bookingStatus) => set("bookingStatus", bookingStatus)}
                hint={t.tripForm.bookingStatusHint}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  id="trip-total-seats"
                  label={t.tripForm.totalSeats}
                  required
                  value={draft.totalSeats}
                  onChange={(value) => set("totalSeats", value ?? 0)}
                />
                <NumberInput
                  id="trip-seats-left"
                  label={t.tripForm.seatsLeft}
                  required
                  value={draft.seatsLeft}
                  onChange={(value) => set("seatsLeft", value ?? 0)}
                />
              </div>
              <NumberInput
                id="trip-going"
                label={t.tripForm.going}
                value={draft.goingOverride}
                onChange={(value) => set("goingOverride", value)}
                hint={t.tripForm.goingHint}
              />
            </Section>

            <TripGallery draft={draft} set={set} />
            <TripBlocks draft={draft} set={set} />
            <TripRoute draft={draft} set={set} />
            <TripCrew draft={draft} set={set} people={people} />
            <TripClosingBlocks draft={draft} set={set} />

            <Section
              id="block-flags"
              title={t.tripForm.flags.title}
              subtitle={t.tripForm.flags.subtitle}
            >
              <TextInput
                id="trip-slug"
                label={t.tripForm.slug}
                required
                value={draft.slug}
                onChange={(slug) => set("slug", slugify(slug))}
                hint={`nazarov.net/${interestSlug(interests, draft.interestId)}/${draft.slug || "…"}/`}
              />

              <Checkbox
                id="trip-kid-friendly"
                label={t.tripForm.kidFriendly}
                checked={draft.kidFriendly}
                onChange={(kidFriendly) => set("kidFriendly", kidFriendly)}
                hint={t.tripForm.kidFriendlyHint}
              />

              {draft.kidFriendly && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    id="trip-kid-from"
                    label={t.tripForm.kidAgeFrom}
                    value={draft.kidAgeFrom}
                    onChange={(value) => set("kidAgeFrom", value)}
                  />
                  <NumberInput
                    id="trip-kid-to"
                    label={t.tripForm.kidAgeTo}
                    value={draft.kidAgeTo}
                    onChange={(value) => set("kidAgeTo", value)}
                  />
                </div>
              )}

              <Checkbox
                id="trip-show-in-past"
                label={t.tripForm.showInPast}
                checked={draft.showInPast}
                onChange={(showInPast) => set("showInPast", showInPast)}
                hint={t.tripForm.showInPastHint}
              />
            </Section>

            <Section
              id="block-social"
              title={t.tripForm.social.title}
              subtitle={t.tripForm.social.subtitle}
            >
              <LocalizedInput
                id="trip-social-title"
                label={t.tripForm.socialTitle}
                value={draft.social.title}
                onChange={(title) => set("social", { ...draft.social, title })}
                hint={t.tripForm.socialTitleHint}
              />
              <LocalizedTextarea
                id="trip-social-description"
                label={t.tripForm.socialDescription}
                rows={2}
                value={draft.social.description}
                onChange={(description) => set("social", { ...draft.social, description })}
                hint={t.tripForm.socialDescriptionHint}
              />
            </Section>
          </div>

          <div className="mt-6 space-y-4">
            {saveError && (
              <div
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
              >
                {saveError}
              </div>
            )}

            <IssueList
              title={t.tripForm.missing}
              tone="error"
              issues={errors}
              locale={panelLocale}
              empty={t.tripForm.missingNone}
            />
            <IssueList
              title={t.tripForm.worthFinishing}
              tone="warning"
              issues={warnings}
              locale={panelLocale}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pb-10">
            <PrimaryButton onClick={() => save(draft.status)} disabled={busy}>
              {busy
                ? t.field.saving
                : draft.status === "published"
                  ? t.tripForm.saveChanges
                  : t.tripForm.saveDraft}
            </PrimaryButton>

            {draft.status !== "published" ? (
              <SecondaryButton onClick={() => save("published")} disabled={busy || errors.length > 0}>
                {t.tripForm.publish}
              </SecondaryButton>
            ) : (
              // Back to a draft, which takes the trip off the site without
              // archiving it. Archiving and restoring live in the trip list.
              <SecondaryButton onClick={() => save("draft")} disabled={busy}>
                {t.tripForm.unpublish}
              </SecondaryButton>
            )}

            <SecondaryButton onClick={() => setPreviewing(true)} disabled={busy}>
              {t.tripForm.preview}
            </SecondaryButton>

            <SecondaryButton onClick={onCancel} disabled={busy}>
              {dirty ? t.tripForm.discard : t.tripForm.back}
            </SecondaryButton>

            {id && (
              <div className="ml-auto">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t.tripForm.deleteConfirm}
                    </span>
                    <SecondaryButton onClick={remove} disabled={busy} tone="danger">
                      {t.field.deleteYes}
                    </SecondaryButton>
                    <SecondaryButton onClick={() => setConfirmDelete(false)} disabled={busy}>
                      {t.field.deleteNo}
                    </SecondaryButton>
                  </div>
                ) : (
                  <SecondaryButton
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                    tone="danger"
                  >
                    {t.field.delete}
                  </SecondaryButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* The form is long; the contents keep the owner from scrolling to find
            a block. Hidden on narrow screens, where it would push the form
            itself off the first screenful. */}
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.tripForm.contents}
            </p>
            <ul className="mt-3 space-y-1">
              {CONTENTS.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="block rounded px-2 py-1 text-sm text-muted-foreground transition hover:bg-[color:var(--muted)] hover:text-foreground"
                  >
                    {t.tripForm[entry.key].title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </FormLocaleProvider>
  );
}

function IssueList({
  title,
  issues,
  tone,
  locale,
  empty,
}: {
  title: string;
  issues: ValidationIssue[];
  tone: "error" | "warning";
  /** The panel's language — each issue carries its text in both. */
  locale: Locale;
  empty?: string;
}) {
  if (issues.length === 0) {
    return empty ? (
      <p className="text-sm text-[color:var(--teal)]">{empty}</p>
    ) : null;
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 text-sm ${
        tone === "error"
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-medium">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {issues.map((issue) => (
          <li key={`${issue.field}-${issue.locale ?? ""}`}>{issue.message[locale]}</li>
        ))}
      </ul>
    </div>
  );
}

function interestSlug(interests: Interest[], interestId: string): string {
  return interests.find((interest) => interest.id === interestId)?.slug ?? "…";
}

function readBackup(key: string): TripDraft | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as TripDraft) : null;
  } catch {
    return null;
  }
}

