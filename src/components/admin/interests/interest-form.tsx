"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Localized } from "@/lib/content/types";
import { rebuildSoon } from "@/lib/rebuild";
import { slugify } from "@/lib/content/slug";
import type { Interest } from "@/lib/content/types";
import {
  deleteInterest,
  saveInterest,
  validateInterest,
  type InterestDraft,
} from "@/lib/firebase/interests";
import {
  Checkbox,
  FormLocaleProvider,
  LocaleTabs,
  LocalizedInput,
  LocalizedTextarea,
  PrimaryButton,
  Problems,
  SecondaryButton,
  TextInput,
} from "../fields";
import { failureText, useAdmin } from "../i18n";
import { ImageField } from "../image-field";

export function InterestForm({
  id,
  initial,
  others,
  onDone,
  onCancel,
}: {
  id: string | null;
  initial: InterestDraft;
  /** Every other interest, for the address-already-taken check. */
  others: Interest[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { locale: panelLocale, t } = useAdmin();
  const [draft, setDraft] = useState(initial);
  // The content language, which is nothing to do with the panel's: a Russian
  // interface still has to reach the English name of the tab (§6, А-03).
  const [locale, setLocale] = useState<Locale>("en");
  const [problems, setProblems] = useState<Localized<string>[]>([]);
  // Kept apart from the problems above: those come from `validateInterest` in
  // both languages and re-read when the panel's language changes, while this
  // one is a request that failed and exists in whichever language it was made.
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof InterestDraft>(key: K, value: InterestDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // Which language still has holes, so the tab can carry a warning dot.
  const incomplete = (["en", "ru"] as const).filter(
    (l) => !draft.name[l].trim() || !draft.description[l].trim(),
  );

  async function save() {
    setFailure(null);
    const found = validateInterest(draft, others);
    setProblems(found);
    if (found.length > 0) return;

    setBusy(true);
    try {
      await saveInterest(id, draft);
      rebuildSoon();
      onDone();
    } catch (error) {
      setFailure(failureText(error, panelLocale, t, t.interests.saveFailed));
      setBusy(false);
    }
  }

  async function remove() {
    setFailure(null);
    setBusy(true);
    try {
      await deleteInterest(id!);
      rebuildSoon();
      onDone();
    } catch (error) {
      setFailure(failureText(error, panelLocale, t, t.interests.deleteFailed));
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <FormLocaleProvider locale={locale}>
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">
            {id ? t.interests.editTitle : t.interests.createTitle}
          </h2>
          <LocaleTabs value={locale} onChange={setLocale} incomplete={incomplete} />
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <LocalizedInput
            id="interest-name"
            label={t.interests.name}
            required
            value={draft.name}
            onChange={(value) => {
              set("name", value);
              // The address follows the English name until the owner edits it
              // by hand; a new interest should not need two fields typed.
              if (!id && (!draft.slug || draft.slug === slugify(draft.name.en))) {
                set("slug", slugify(value.en));
              }
            }}
            hint={t.interests.nameHint}
          />

          <TextInput
            id="interest-slug"
            label={t.interests.slug}
            required
            value={draft.slug}
            onChange={(value) => set("slug", slugify(value))}
            placeholder="sailing"
            hint={t.interests.slugHint(draft.slug || "…")}
          />

          <LocalizedInput
            id="interest-caption"
            label={t.interests.caption}
            value={draft.tileCaption}
            onChange={(value) => set("tileCaption", value)}
            placeholder="On the water"
          />

          <LocalizedTextarea
            id="interest-description"
            label={t.interests.description}
            required
            rows={4}
            value={draft.description}
            onChange={(value) => set("description", value)}
          />

          <ImageField
            id="interest-cover"
            label={t.interests.cover}
            placeholder="/assets/hero-catamaran.jpg"
            value={draft.cover}
            onChange={(cover) => set("cover", cover)}
          />

          <TextInput
            id="interest-order"
            label={t.interests.order}
            type="number"
            value={String(draft.order)}
            onChange={(value) => set("order", Number(value) || 0)}
            hint={t.interests.orderHint}
          />

          <TextInput
            id="interest-playlist"
            label={t.interests.playlist}
            value={draft.youtubePlaylistId ?? ""}
            onChange={(value) => set("youtubePlaylistId", value.trim() || undefined)}
            placeholder="PLxxxxxxxxxxxxxxxx"
            hint={t.interests.playlistHint}
          />
        </div>

        <div className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <Checkbox
            id="interest-past"
            label={t.interests.showPast}
            checked={draft.showPastTrips}
            onChange={(value) => set("showPastTrips", value)}
            hint={t.interests.showPastHint}
          />
          <Checkbox
            id="interest-hidden"
            label={t.interests.hide}
            checked={draft.hidden}
            onChange={(value) => set("hidden", value)}
            hint={t.interests.hideHint}
          />
          <Checkbox
            id="interest-collector"
            label={t.interests.collects}
            checked={draft.collectsKidFriendly}
            onChange={(value) => set("collectsKidFriendly", value)}
            hint={t.interests.collectsHint}
          />
        </div>

        <div className="mt-5">
          <Problems
            items={[
              ...problems.map((problem) => problem[panelLocale]),
              ...(failure ? [failure] : []),
            ]}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={save} disabled={busy}>
            {busy ? t.field.saving : t.field.save}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel} disabled={busy}>
            {t.field.cancel}
          </SecondaryButton>

          {id && (
            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t.field.deleteConfirm}</span>
                  <SecondaryButton onClick={remove} disabled={busy} tone="danger">
                    {t.field.deleteYes}
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setConfirmDelete(false)} disabled={busy}>
                    {t.field.deleteNo}
                  </SecondaryButton>
                </div>
              ) : (
                <SecondaryButton onClick={() => setConfirmDelete(true)} disabled={busy} tone="danger">
                  {t.field.delete}
                </SecondaryButton>
              )}
            </div>
          )}
        </div>
      </div>
    </FormLocaleProvider>
  );
}

