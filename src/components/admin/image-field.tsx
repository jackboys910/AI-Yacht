"use client";

import { useState } from "react";
import type { StoredImage } from "@/lib/content/types";
import { TextInput } from "./fields";

/**
 * A picture, entered as an address.
 *
 * Uploading from a computer or a phone arrives with plan item 1.5, once Cloud
 * Storage is available. Until then an address already covers the case that
 * matters: item 1.11 moves the AI Yacht trip across, and its photography
 * already sits under /assets/.
 *
 * The dimensions are measured in the browser rather than guessed, so the page
 * can reserve the right space and the layout does not jump as pictures arrive.
 * `storagePath` stays empty, which marks the file as one we did not upload and
 * therefore must never delete.
 */
export function ImageUrlField({
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
        id={id}
        label={label}
        type="url"
        value={value?.url ?? ""}
        onChange={apply}
        placeholder={placeholder}
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
          className={`mt-3 rounded-lg border border-border ${previewClass}`}
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
