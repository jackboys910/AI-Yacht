"use client";

import { useRef, useState } from "react";
import type { StoredImage } from "@/lib/content/types";
import { UnsupportedImageError } from "@/lib/images/compress";
import { uploadImage, type UploadStage } from "@/lib/firebase/storage";
import { TextInput } from "./fields";
import { useAdmin, type AdminCopy } from "./i18n";

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
  const { locale, t } = useAdmin();
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
          ? cause.text[locale]
          : t.image.uploadFailed(
              cause instanceof Error ? cause.message : String(cause),
            ),
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
            ? t.image.compressing
            : stage === "uploading"
              ? t.image.uploading
              : value?.url
                ? t.image.replace
                : t.image.upload}
        </label>

        {value?.url && !busy && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-full border border-border px-4 py-2 text-sm text-red-600 transition hover:border-red-400"
          >
            {t.image.clear}
          </button>
        )}

        <button
          type="button"
          onClick={() => setByAddress((open) => !open)}
          className="text-sm text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
        >
          {byAddress ? t.image.hideAddress : t.image.showAddress}
        </button>
      </div>

      {byAddress && (
        <div className="mt-3">
          <TextInput
            id={`${id}-url`}
            label={t.image.address}
            type="url"
            value={value?.url ?? ""}
            onChange={applyAddress}
            placeholder={placeholder ?? "/assets/hero-catamaran.jpg"}
            hint={t.image.addressHint}
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
          ? t.image.measuring
          : value?.width
            ? describe(value, t)
            : t.image.advice}
      </p>
    </div>
  );
}

/**
 * What is known about the picture, under the field.
 *
 * Whether we uploaded it matters enough to say out loud: a picture entered by
 * address is served from /assets/ and deleting the trip must not touch it.
 */
function describe(image: StoredImage, t: AdminCopy): string {
  const size = `${image.width}×${image.height}`;
  return image.storagePath ? t.image.stored(size) : t.image.linked(size);
}

function measure(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

