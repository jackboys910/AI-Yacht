"use client";

import { rebuildSoon } from "@/lib/rebuild";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import {
  PersonInUseError,
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
  const [draft, setDraft] = useState(initial);
  const [locale, setLocale] = useState<Locale>("en");
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const incomplete = (["en", "ru"] as const).filter((l) => !draft.name[l].trim());

  async function save() {
    const found = validatePerson(draft);
    setProblems(found);
    if (found.length > 0) return;

    setBusy(true);
    try {
      await savePerson(id, draft);
      rebuildSoon();
      onDone();
    } catch (error) {
      setProblems([`Не удалось сохранить: ${describe(error)}`]);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deletePerson(id!);
      rebuildSoon();
      onDone();
    } catch (error) {
      setProblems([
        error instanceof PersonInUseError
          ? error.message
          : `Не удалось удалить: ${describe(error)}`,
      ]);
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <FormLocaleProvider locale={locale}>
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">
            {id ? "Изменить человека" : "Новый человек"}
          </h2>
          <LocaleTabs value={locale} onChange={setLocale} incomplete={incomplete} />
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <LocalizedInput
            id="person-name"
            label="Имя"
            required
            value={draft.name}
            onChange={(value) => set("name", value)}
            placeholder="Ivan Nazarov"
          />

          <LocalizedInput
            id="person-role"
            label="Роль"
            value={draft.role}
            onChange={(value) => set("role", value)}
            placeholder="Skipper"
            hint="Как подписан человек в блоке «Your crew» на странице поездки."
          />

          <LocalizedTextarea
            id="person-bio"
            label="Описание"
            rows={4}
            value={draft.bio}
            onChange={(value) => set("bio", value)}
          />

          <ImageField
            id="person-photo"
            label="Фото"
            placeholder="/assets/ivan.jpg"
            value={draft.photo}
            onChange={(photo) => set("photo", photo)}
            previewClass="h-32 w-32 object-cover"
          />
        </div>

        <div className="mt-5">
          <Problems items={problems} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={save} disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </PrimaryButton>
          <SecondaryButton onClick={onCancel} disabled={busy}>
            Отмена
          </SecondaryButton>

          {id && (
            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Удалить?</span>
                  <SecondaryButton onClick={remove} disabled={busy} tone="danger">
                    Да, удалить
                  </SecondaryButton>
                  <SecondaryButton onClick={() => setConfirmDelete(false)} disabled={busy}>
                    Нет
                  </SecondaryButton>
                </div>
              ) : (
                <SecondaryButton
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  tone="danger"
                >
                  Удалить
                </SecondaryButton>
              )}
            </div>
          )}
        </div>
      </div>
    </FormLocaleProvider>
  );
}

function describe(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return /permission|insufficient/i.test(text)
    ? "база отказала в доступе. Проверьте, что правила Firestore опубликованы."
    : text;
}
