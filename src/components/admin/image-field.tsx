"use client";

import { useRef, useState } from "react";
import type { StoredImage } from "@/lib/content/types";
import { UnsupportedImageError } from "@/lib/images/compress";
import { uploadImage, type UploadStage } from "@/lib/firebase/storage";
import { TextInput } from "./fields";

/**
 * A picture: uploaded from a computer or a phone, or pointed at by address.
 *
 * The file input carries `accept="image/*"` and no `capture`, which is what
 * makes a phone offer both the camera and the gallery (§7.2) rather than
 * forcing one of them.
 *
 * The address field stays because item 1.11 brings the AI Yacht trip across and
 * its photography already sits under /assets/ — those files are served by
 * Cloudflare and must not be re-uploaded. An image entered that way keeps an
 * empty `storagePath`, which marks it as one we did not upload and must never
 * delete.
 */
export function ImageField({
  id,
  label,
  value,
  onChange,
  placeholder,
  previewClass = "h-32 w-full object-cover",
}: {
  id: string;
  label: string;
  value?: StoredImage;
  onChange: (image: StoredImage | undefined) => void;
  placeholder?: string;
  previewClass?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [byAddress, setByAddress] = useState(false);
  const [probing, setProbing] = useState(false);

  async function upload(file: File) {
    setError(null);
    try {
      const image = await uploadImage(file, value?.alt, setStage);
      onChange(image);
    } catch (cause) {
      setError(
        cause instanceof UnsupportedImageError
          ? cause.message
          : `Не удалось загрузить: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    } finally {
      setStage(null);
      // Without this, picking the same file twice in a row fires no event.
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  /** The address path: measure the real size instead of guessing at it. */
  async function applyAddress(url: string) {
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

  const busy = stage !== null;

  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>

      {value?.url && (
        <img
          src={value.thumbUrl ?? value.url}
          alt=""
          className={`mt-2 rounded-lg border border-border ${previewClass}`}
        />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <label
          htmlFor={`${id}-file`}
          aria-disabled={busy}
          className={`inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-foreground ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {stage === "compressing"
            ? "Сжимаем…"
            : stage === "uploading"
              ? "Загружаем…"
              : value?.url
                ? "Заменить фото"
                : "Загрузить фото"}
        </label>

        {value?.url && !busy && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-full border border-border px-4 py-2 text-sm text-red-600 transition hover:border-red-400"
          >
            Убрать
          </button>
        )}

        <button
          type="button"
          onClick={() => setByAddress((open) => !open)}
          className="text-sm text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
        >
          {byAddress ? "скрыть адрес" : "указать адресом"}
        </button>
      </div>

      {byAddress && (
        <div className="mt-3">
          <TextInput
            id={`${id}-url`}
            label="Адрес картинки"
            type="url"
            value={value?.url ?? ""}
            onChange={applyAddress}
            placeholder={placeholder ?? "/assets/hero-catamaran.jpg"}
            hint="Для картинок, которые уже лежат на сайте. Загруженные через кнопку выше сюда подставляются сами."
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {probing
          ? "Определяем размер картинки…"
          : value?.width
            ? describe(value)
            : "С телефона можно снять камерой или выбрать из галереи. Фото уменьшается и сжимается перед загрузкой."}
      </p>
    </div>
  );
}

function describe(image: StoredImage): string {
  const size = `${image.width}×${image.height}`;
  return image.storagePath
    ? `Загружено, ${size}. Хранится уменьшенная копия для карточек и телефонов.`
    : `Картинка с сайта, ${size}. Не загружалась в хранилище и не будет удалена.`;
}

function measure(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

