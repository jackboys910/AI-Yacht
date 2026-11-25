"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { UnsupportedImageError } from "@/lib/images/compress";
import { MAX_PHOTOS, uploadSuggestionPhoto } from "@/lib/firebase/suggestion-photos";
import { suggestCopy } from "./suggest-copy";

/**
 * Photographs attached to an idea (changed by the client on 24.11.2026:
 * links became uploads).
 *
 * Each picture goes up the moment it is chosen rather than when the form is
 * sent, and the reason is what happens on a phone: four photographs over a
 * mobile connection take long enough that a submit button doing it silently
 * looks broken, and a form that fails after a minute of nothing loses
 * everything typed above it. Uploading as you go makes the progress visible
 * and the submit instant — by then there is nothing left to send but five
 * short addresses.
 *
 * A picture that fails stays on screen with its reason and the file still in
 * hand, so "try once more" is one press and not "choose it again".
 */

type Item =
  | { kind: "busy"; id: string; preview: string; name: string }
  | { kind: "done"; id: string; preview: string; name: string; url: string }
  | { kind: "failed"; id: string; preview: string; name: string; file: File; why: string };

export function PhotoUpload({
  locale,
  urls,
  onChange,
  disabled,
}: {
  locale: Locale;
  /** The addresses gathered so far; the form sends exactly these. */
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const f = suggestCopy.form;
  const [items, setItems] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const left = MAX_PHOTOS - items.filter((item) => item.kind !== "failed").length;

  /** Replaces one entry and republishes the addresses that are ready. */
  function settle(id: string, next: Item) {
    setItems((current) => {
      const updated = current.map((item) => (item.id === id ? next : item));
      onChange(
        updated.flatMap((item) => (item.kind === "done" ? [item.url] : [])),
      );
      return updated;
    });
  }

  async function send(file: File, id: string, preview: string) {
    try {
      const url = await uploadSuggestionPhoto(file);
      settle(id, { kind: "done", id, preview, name: file.name, url });
    } catch (error) {
      const why =
        error instanceof UnsupportedImageError
          ? f.photosBadFile[locale]
          : // Storage refuses by rule, and a rule cannot report which of its
            // conditions failed: a file over the cap and a bucket whose rules
            // have not been published yet both arrive as "unauthorized". So
            // the sentence claims neither.
            /unauthorized|403|quota|size/i.test(String(error))
            ? f.photosRefused[locale]
            : f.photosFailed[locale];
      settle(id, { kind: "failed", id, preview, name: file.name, file, why });
    }
  }

  function take(files: FileList | null) {
    if (!files) return;
    const chosen = [...files].slice(0, Math.max(0, left));
    if (chosen.length === 0) return;

    const started: Item[] = chosen.map((file) => ({
      kind: "busy",
      id: crypto.randomUUID(),
      // An object URL shows the picture while it is still being sent. Revoking
      // it is deliberately skipped: a handful of previews on a page somebody
      // leaves within minutes is not a leak worth the bookkeeping, and
      // revoking early is how a thumbnail turns into a broken image.
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setItems((current) => [...current, ...started]);
    started.forEach((item, index) => void send(chosen[index], item.id, item.preview));
  }

  function remove(id: string) {
    setItems((current) => {
      const updated = current.filter((item) => item.id !== id);
      onChange(updated.flatMap((item) => (item.kind === "done" ? [item.url] : [])));
      return updated;
    });
  }

  function retry(item: Extract<Item, { kind: "failed" }>) {
    settle(item.id, { kind: "busy", id: item.id, preview: item.preview, name: item.name });
    void send(item.file, item.id, item.preview);
  }

  return (
    <div>
      <span className="mb-2 block text-xs uppercase tracking-widest text-white/60">
        {f.photos[locale]}
      </span>

      {items.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04]"
            >
              {/* The file the visitor chose, drawn from their own disk — not
                  something fetched, so no layout rules of the site apply. */}
              <img
                src={item.preview}
                alt=""
                className={`h-28 w-full object-cover transition ${
                  item.kind === "done" ? "" : "opacity-40"
                }`}
              />

              {item.kind === "busy" && (
                <span className="absolute inset-0 grid place-items-center text-xs text-white">
                  {f.photosUploading[locale]}
                </span>
              )}

              {item.kind === "failed" && (
                <button
                  type="button"
                  onClick={() => retry(item)}
                  className="absolute inset-0 grid place-items-center px-2 text-center text-[11px] leading-snug text-amber-200 underline decoration-amber-200/50 underline-offset-2"
                >
                  {item.why}
                </button>
              )}

              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`${f.photosRemove[locale]}: ${item.name}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-[color:var(--primary)]/80 text-sm text-white transition hover:bg-[color:var(--primary)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled || left <= 0}
        onChange={(event) => {
          take(event.target.files);
          // Cleared so choosing the same file twice in a row still fires.
          event.target.value = "";
        }}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || left <= 0}
          onClick={() => input.current?.click()}
          className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition hover:border-[color:var(--gold)] disabled:opacity-40"
        >
          {items.length === 0 ? f.photosChoose[locale] : f.photosAdd[locale]}
        </button>
        {items.length > 0 && (
          // Only once something is on screen: before that the hint under the
          // control already says how many the form takes, and a counter
          // reading "5 more can be added" beside an empty row is a riddle.
          <span className="text-xs text-white/45">
            {left > 0 ? f.photosLeft(left)[locale] : f.photosFull[locale]}
          </span>
        )}
      </div>

      {/* The addresses themselves, so a browser that restores a form — or a
          test — can see what the fields actually hold. */}
      {urls.map((url) => (
        <input key={url} type="hidden" name="photos" value={url} readOnly />
      ))}
    </div>
  );
}
