"use client";

import { rebuildSoon } from "@/lib/rebuild";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Localized } from "@/lib/content/types";
import {
  deletePerson,
  savePerson,
  validatePerson,
  type PersonDraft,
} from "@/lib/firebase/people";
import {
  FormLocaleProvider,
  LocaleTabs,
  LocalizedInput,
  LocalizedTextarea,
  PrimaryButton,
  Problems,
  SecondaryButton,
} from "../fields";
import { failureText, useAdmin } from "../i18n";
import { ImageField } from "../image-field";

export function PersonForm({
  id,
  initial,
  onDone,
  onCancel,
}: {
  id: string | null;
  initial: PersonDraft;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { locale: panelLocale, t } = useAdmin();
  const [draft, setDraft] = useState(initial);
  // The content language, not the panel's: both names have to be reachable
  // from either interface (§6, А-03).
  const [locale, setLocale] = useState<Locale>("en");
  const [problems, setProblems] = useState<Localized<string>[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const incomplete = (["en", "ru"] as const).filter((l) => !draft.name[l].trim());

  async function save() {
    setFailure(null);
    const found = validatePerson(draft);
    setProblems(found);
    if (found.length > 0) return;

    setBusy(true);
    try {
      await savePerson(id, draft);
      rebuildSoon();
      onDone();
    } catch (error) {
      setFailure(failureText(error, panelLocale, t, t.people.saveFailed));
      setBusy(false);
    }
  }

  async function remove() {
    setFailure(null);
    setBusy(true);
    try {
      await deletePerson(id!);
      rebuildSoon();
      onDone();
    } catch (error) {
      setFailure(failureText(error, panelLocale, t, t.people.deleteFailed));
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <FormLocaleProvider locale={locale}>
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">
            {id ? t.people.editTitle : t.people.createTitle}
          </h2>
          <LocaleTabs value={locale} onChange={setLocale} incomplete={incomplete} />
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <LocalizedInput
            id="person-name"
            label={t.people.name}
            required
            value={draft.name}
            onChange={(value) => set("name", value)}
            placeholder="Ivan Nazarov"
          />

          <LocalizedInput
            id="person-role"
            label={t.people.role}
            value={draft.role}
            onChange={(value) => set("role", value)}
            placeholder="Skipper"
            hint={t.people.roleHint}
          />

          <LocalizedTextarea
            id="person-bio"
            label={t.people.bio}
            rows={4}
            value={draft.bio}
            onChange={(value) => set("bio", value)}
          />

          <ImageField
            id="person-photo"
            label={t.people.photo}
            placeholder="/assets/ivan.jpg"
            value={draft.photo}
            onChange={(photo) => set("photo", photo)}
            previewClass="h-32 w-32 object-cover"
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
    </FormLocaleProvider>
  );
}

