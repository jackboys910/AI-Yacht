"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { slugify } from "@/lib/content/slug";
import type { Interest, Person, Trip } from "@/lib/content/types";
import { validateTrip, type ValidationIssue } from "@/lib/content/validation";
import { rebuildAfterTrip, rebuildSoon } from "@/lib/rebuild";
import {
  TripValidationError,
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

const CONTENTS = [
  { id: "block-basics", label: "Основное" },
  { id: "block-seats", label: "Статус и места" },
  { id: "block-gallery", label: "Фото первого экрана" },
  { id: "block-price", label: "Цена" },
  { id: "block-place", label: "Место" },
  { id: "block-audience", label: "Кому подходит" },
  { id: "block-what-you-get", label: "Что получишь" },
  { id: "block-prepare", label: "Подготовка" },
  { id: "block-program", label: "Программа" },
  { id: "block-route", label: "Маршрут по дням" },
  { id: "block-map", label: "Карта" },
  { id: "block-media", label: "Фото и видео" },
  { id: "block-crew", label: "Команда" },
  { id: "block-rules", label: "Правила" },
  { id: "block-faq", label: "Вопросы и ответы" },
  { id: "block-flags", label: "Отметки и адрес" },
  { id: "block-social", label: "Для соцсетей" },
];

const STATUSES = [
  { value: "open" as const, label: "Open for booking — набор открыт" },
  { value: "fewSpots" as const, label: "Few spots left — мест мало" },
  { value: "soldOut" as const, label: "Sold out — мест нет" },
  { value: "completed" as const, label: "Completed — поездка прошла" },
];

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
  const [draft, setDraft] = useState(initial);
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
      setSaveError(
        error instanceof TripValidationError ? error.message : describe(error),
      );
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
      setSaveError(describe(error));
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
              {id ? "Изменить поездку" : "Новая поездка"}
              {draft.status === "published" && (
                <span className="ml-3 rounded-full bg-[color:var(--teal)]/15 px-2.5 py-1 text-xs font-medium text-[color:var(--teal)]">
                  опубликована
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
              <p>В прошлый раз эта поездка осталась несохранённой.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SecondaryButton
                  onClick={() => {
                    setDraft(backup);
                    setBackupHandled(true);
                  }}
                >
                  Восстановить
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
                  Не нужно
                </SecondaryButton>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <Section id="block-basics" title="Основное" subtitle="Первый экран страницы поездки.">
              <Select
                id="trip-interest"
                label="Направление"
                required
                value={draft.interestId}
                options={[
                  { value: "", label: "Выберите направление…" },
                  ...interests.map((interest) => ({
                    value: interest.id,
                    label: interest.name.en || interest.slug,
                  })),
                ]}
                onChange={(interestId) => set("interestId", interestId)}
              />

              <LocalizedInput
                id="trip-title"
                label="Название поездки"
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
                label="Подзаголовок"
                required
                value={draft.subtitle}
                onChange={(subtitle) => set("subtitle", subtitle)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="trip-start"
                  label="Дата начала"
                  required
                  value={draft.startDate}
                  onChange={(startDate) => set("startDate", startDate)}
                  hint="В виде 2026-11-12."
                />
                <TextInput
                  id="trip-end"
                  label="Дата окончания"
                  required
                  value={draft.endDate}
                  onChange={(endDate) => set("endDate", endDate)}
                  hint="После неё поездка сама уйдёт в «Past»."
                />
              </div>

              <LocalizedInput
                id="trip-place"
                label="Место"
                required
                value={draft.place}
                onChange={(place) => set("place", place)}
                placeholder="Caribbean"
              />
            </Section>

            <Section
              id="block-seats"
              title="Статус и места"
              subtitle="Показывается на карточке и на странице поездки."
            >
              <Select
                id="trip-status"
                label="Статус набора"
                required
                value={draft.bookingStatus}
                options={STATUSES}
                onChange={(bookingStatus) => set("bookingStatus", bookingStatus)}
                hint="После даты окончания статус сам станет «Completed», менять его вручную не нужно."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  id="trip-total-seats"
                  label="Всего мест"
                  required
                  value={draft.totalSeats}
                  onChange={(value) => set("totalSeats", value ?? 0)}
                />
                <NumberInput
                  id="trip-seats-left"
                  label="Свободно мест"
                  required
                  value={draft.seatsLeft}
                  onChange={(value) => set("seatsLeft", value ?? 0)}
                />
              </div>
              <NumberInput
                id="trip-going"
                label="Сколько человек едет"
                value={draft.goingOverride}
                onChange={(value) => set("goingOverride", value)}
                hint="Если оставить пустым, считается как «всего мест» минус «свободно». Заполните, чтобы поставить своё число."
              />
            </Section>

            <TripGallery draft={draft} set={set} />
            <TripBlocks draft={draft} set={set} />
            <TripRoute draft={draft} set={set} />
            <TripCrew draft={draft} set={set} people={people} />
            <TripClosingBlocks draft={draft} set={set} />

            <Section
              id="block-flags"
              title="Отметки и адрес"
              subtitle="Служебное — на странице поездки этого блока нет."
            >
              <TextInput
                id="trip-slug"
                label="Адрес страницы"
                required
                value={draft.slug}
                onChange={(slug) => set("slug", slugify(slug))}
                hint={`nazarov.net/${interestSlug(interests, draft.interestId)}/${draft.slug || "…"}/`}
              />

              <Checkbox
                id="trip-kid-friendly"
                label="С детьми можно (kid-friendly)"
                checked={draft.kidFriendly}
                onChange={(kidFriendly) => set("kidFriendly", kidFriendly)}
                hint="Поездка получит значок «Kids welcome», в заявке появится поле про детей, и она покажется во вкладке Son."
              />

              {draft.kidFriendly && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberInput
                    id="trip-kid-from"
                    label="Возраст детей, от"
                    value={draft.kidAgeFrom}
                    onChange={(value) => set("kidAgeFrom", value)}
                  />
                  <NumberInput
                    id="trip-kid-to"
                    label="Возраст детей, до"
                    value={draft.kidAgeTo}
                    onChange={(value) => set("kidAgeTo", value)}
                  />
                </div>
              )}

              <Checkbox
                id="trip-show-in-past"
                label="Показывать в прошедших"
                checked={draft.showInPast}
                onChange={(showInPast) => set("showInPast", showInPast)}
                hint="Выключено — после окончания поездка не появится в блоке «Past trips» этой вкладки."
              />
            </Section>

            <Section
              id="block-social"
              title="Для соцсетей"
              subtitle="Заголовок и описание, которые видно при отправке ссылки в Facebook, Telegram и WhatsApp."
            >
              <LocalizedInput
                id="trip-social-title"
                label="Заголовок превью"
                value={draft.social.title}
                onChange={(title) => set("social", { ...draft.social, title })}
                hint="Если оставить пустым, возьмём название поездки."
              />
              <LocalizedTextarea
                id="trip-social-description"
                label="Описание превью"
                rows={2}
                value={draft.social.description}
                onChange={(description) => set("social", { ...draft.social, description })}
                hint="Если оставить пустым, возьмём подзаголовок."
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
              title="Не хватает для публикации"
              tone="error"
              issues={errors}
              empty="Всё обязательное заполнено — поездку можно публиковать."
            />
            <IssueList
              title="Стоит доделать"
              tone="warning"
              issues={warnings}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pb-10">
            <PrimaryButton onClick={() => save(draft.status)} disabled={busy}>
              {busy
                ? "Сохраняем…"
                : draft.status === "published"
                  ? "Сохранить изменения"
                  : "Сохранить черновик"}
            </PrimaryButton>

            {draft.status !== "published" ? (
              <SecondaryButton onClick={() => save("published")} disabled={busy || errors.length > 0}>
                Опубликовать
              </SecondaryButton>
            ) : (
              // Back to a draft, which takes the trip off the site without
              // archiving it. Archiving and restoring live in the trip list.
              <SecondaryButton onClick={() => save("draft")} disabled={busy}>
                Снять с публикации
              </SecondaryButton>
            )}

            <SecondaryButton onClick={() => setPreviewing(true)} disabled={busy}>
              Предпросмотр
            </SecondaryButton>

            <SecondaryButton onClick={onCancel} disabled={busy}>
              {dirty ? "Отменить изменения" : "Назад"}
            </SecondaryButton>

            {id && (
              <div className="ml-auto">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Удалить поездку?</span>
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

        {/* The form is long; the contents keep the owner from scrolling to find
            a block. Hidden on narrow screens, where it would push the form
            itself off the first screenful. */}
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Блоки
            </p>
            <ul className="mt-3 space-y-1">
              {CONTENTS.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="block rounded px-2 py-1 text-sm text-muted-foreground transition hover:bg-[color:var(--muted)] hover:text-foreground"
                  >
                    {entry.label}
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
  empty,
}: {
  title: string;
  issues: ValidationIssue[];
  tone: "error" | "warning";
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
          <li key={`${issue.field}-${issue.locale ?? ""}`}>{issue.message}</li>
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

function describe(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return /permission|insufficient/i.test(text)
    ? "База отказала в доступе. Проверьте, что правила Firestore опубликованы."
    : `Не удалось сохранить: ${text}`;
}
