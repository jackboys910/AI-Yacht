"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { slugify } from "@/lib/content/slug";
import type { Interest, StoredImage } from "@/lib/content/types";
import {
  InterestInUseError,
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
  const [draft, setDraft] = useState(initial);
  const [locale, setLocale] = useState<Locale>("en");
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof InterestDraft>(key: K, value: InterestDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // Which language still has holes, so the tab can carry a warning dot.
  const incomplete = (["en", "ru"] as const).filter(
    (l) => !draft.name[l].trim() || !draft.description[l].trim(),
  );

  async function save() {
    const found = validateInterest(draft, others);
    setProblems(found);
    if (found.length > 0) return;

    setBusy(true);
    try {
      await saveInterest(id, draft);
      onDone();
    } catch (error) {
      setProblems([`Не удалось сохранить: ${message(error)}`]);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteInterest(id!);
      onDone();
    } catch (error) {
      setProblems([
        error instanceof InterestInUseError
          ? error.message
          : `Не удалось удалить: ${message(error)}`,
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
            {id ? "Изменить направление" : "Новое направление"}
          </h2>
          <LocaleTabs value={locale} onChange={setLocale} incomplete={incomplete} />
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <LocalizedInput
            id="interest-name"
            label="Название вкладки"
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
            hint="По §16 ТЗ вкладки названы по-английски в обеих языковых версиях — но русское поле есть, если захотите иначе."
          />

          <TextInput
            id="interest-slug"
            label="Адрес вкладки"
            required
            value={draft.slug}
            onChange={(value) => set("slug", slugify(value))}
            placeholder="sailing"
            hint={`Страница будет доступна по адресу nazarov.net/${draft.slug || "…"}/ и nazarov.net/ru/${draft.slug || "…"}/`}
          />

          <LocalizedInput
            id="interest-caption"
            label="Подпись под плиткой на главной"
            value={draft.tileCaption}
            onChange={(value) => set("tileCaption", value)}
            placeholder="On the water"
          />

          <LocalizedTextarea
            id="interest-description"
            label="Описание вкладки"
            required
            rows={4}
            value={draft.description}
            onChange={(value) => set("description", value)}
          />

          <CoverField
            value={draft.cover}
            onChange={(cover) => set("cover", cover)}
          />

          <TextInput
            id="interest-order"
            label="Порядок в меню"
            type="number"
            value={String(draft.order)}
            onChange={(value) => set("order", Number(value) || 0)}
            hint="Меньше — левее в блоке «MY INTERESTS» и выше на главной."
          />

          <TextInput
            id="interest-playlist"
            label="Плейлист YouTube"
            value={draft.youtubePlaylistId ?? ""}
            onChange={(value) => set("youtubePlaylistId", value.trim() || undefined)}
            placeholder="PLxxxxxxxxxxxxxxxx"
            hint="Необязательно. Видео из этого плейлиста появятся на странице вкладки."
          />
        </div>

        <div className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <Checkbox
            id="interest-past"
            label="Показывать прошедшие поездки"
            checked={draft.showPastTrips}
            onChange={(value) => set("showPastTrips", value)}
            hint="Выключено — блока «Past trips» на этой вкладке не будет совсем, даже если прошедшие поездки есть."
          />
          <Checkbox
            id="interest-hidden"
            label="Скрыть вкладку с сайта"
            checked={draft.hidden}
            onChange={(value) => set("hidden", value)}
            hint="Вкладка пропадёт из меню и с главной, но поездки сохранятся и вернутся вместе с ней."
          />
          <Checkbox
            id="interest-collector"
            label="Собирать поездки с детьми из других вкладок"
            checked={draft.collectsKidFriendly}
            onChange={(value) => set("collectsKidFriendly", value)}
            hint="Так устроена вкладка Son: в ней показываются все поездки с отметкой «kid-friendly». Это те же поездки, а не копии."
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
                <SecondaryButton onClick={() => setConfirmDelete(true)} disabled={busy} tone="danger">
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

/**
 * The cover, entered as an address for now.
 *
 * Uploading from a computer or a phone arrives with plan item 1.5, once Cloud
 * Storage is available. Until then an address still covers the case that
 * matters: item 1.11 moves the AI Yacht trip across, and its photography
 * already sits under /assets/. The real dimensions are measured in the browser
 * rather than guessed, so the page can reserve the right space and avoid the
 * layout jumping as images arrive. `storagePath` stays empty, which marks the
 * file as one we did not upload and must not delete.
 */
function CoverField({
  value,
  onChange,
}: {
  value?: StoredImage;
  onChange: (cover: StoredImage | undefined) => void;
}) {
  const [probing, setProbing] = useState(false);

  async function apply(url: string) {
    const trimmed = url.trim();
    if (!trimmed) {
      onChange(undefined);
      return;
    }

    setProbing(true);
    const size = await measure(trimmed);
    setProbing(false);

    onChange({
      url: trimmed,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
      storagePath: "",
      alt: value?.alt ?? { en: "", ru: "" },
    });
  }

  return (
    <div>
      <TextInput
        id="interest-cover"
        label="Обложка вкладки"
        type="url"
        value={value?.url ?? ""}
        onChange={apply}
        placeholder="/assets/hero-catamaran.jpg"
        hint={
          probing
            ? "Определяем размер картинки…"
            : value?.width
              ? `Картинка ${value.width}×${value.height}. Загрузка с компьютера и телефона появится на пункте 1.5.`
              : "Пока — адрес картинки. Загрузка с компьютера и телефона появится на пункте 1.5."
        }
      />
      {value?.url && (
        <img
          src={value.url}
          alt=""
          className="mt-3 h-32 w-full rounded-lg border border-border object-cover"
        />
      )}
    </div>
  );
}

function measure(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function message(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return /permission|insufficient/i.test(text)
    ? "база отказала в доступе. Проверьте, что правила Firestore опубликованы."
    : text;
}
