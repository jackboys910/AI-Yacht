import { defaultLocale, locales } from "@/i18n/config";

/**
 * Filling one language's gaps from the other.
 *
 * ТЗ §15.1 (П-08) asks that both language versions of a page carry a
 * translation rather than duplicating the other language — and that is still
 * what the site aims at. But the client changed who fills a trip in
 * (27.11.2026): organizers are English-speaking and many of them cannot write
 * Russian at all, so the panel is to be filled in English alone and the trip
 * is to appear in both versions of the site regardless.
 *
 * So a missing translation stops being a reason to hide a trip and becomes a
 * reason to print the text there is. A Russian visitor then reads an English
 * title rather than an empty frame, which is the lesser of the two — and the
 * better one once the automatic translation lands, because this stays as the
 * floor under it: when the translation cannot be made, nothing on the site is
 * ever blank for the want of it.
 *
 * The rule runs over the whole site content at the moment it is read, so
 * every page, card, letter and feed gets a filled object and none of them has
 * to know about any of this. The letters already worked this way
 * (`localized()` in src/worker/announce.ts) — this is that promise, made
 * everywhere.
 *
 * What it does **not** touch is the panel: there the owner must see which
 * fields are genuinely empty, so the form reads the record as it is stored.
 * The one exception is the preview, which is the visitor's view by
 * definition.
 */

const isText = (value: unknown): value is string => typeof value === "string";

const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

type Kind = "text" | "list";

/**
 * Whether this object is a `Localized<string>` or `Localized<string[]>`.
 *
 * Recognised by shape — exactly the locale keys, and prose behind each of
 * them — because the alternative is a list of field paths to keep in step
 * with the types, and a field left off that list is a blank on the site that
 * nobody notices. Every localized field in `content/types.ts` is prose, so
 * the shape is unambiguous.
 */
function localizedKind(value: Record<string, unknown>): Kind | null {
  const keys = Object.keys(value);
  if (keys.length !== locales.length) return null;
  if (!locales.every((locale) => keys.includes(locale))) return null;
  if (locales.every((locale) => isText(value[locale]))) return "text";
  if (locales.every((locale) => isTextList(value[locale]))) return "list";
  return null;
}

const written = (value: unknown, kind: Kind): boolean =>
  kind === "text" ? isText(value) && value.trim() !== "" : isTextList(value) && value.length > 0;

/** Returns a copy, so two languages never share one array. */
const copy = (value: unknown, kind: Kind): unknown =>
  kind === "list" ? [...(value as string[])] : value;

export function fillLocales<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => fillLocales(item)) as unknown as T;
  if (value === null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const kind = localizedKind(source);

  if (kind) {
    const have = locales.filter((locale) => written(source[locale], kind));
    // Nothing anywhere — a block the owner never filled in, and §6.3 says such
    // a block is simply not rendered. Nothing missing — nothing to do.
    if (have.length === 0 || have.length === locales.length) return value;

    // English first where there is a choice: it is the language the panel is
    // filled in, so it is the one most likely to be the original.
    const from = have.includes(defaultLocale) ? defaultLocale : have[0];
    return Object.fromEntries(
      locales.map((locale) => [
        locale,
        written(source[locale], kind) ? source[locale] : copy(source[from], kind),
      ]),
    ) as T;
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => [key, fillLocales(item)]),
  ) as T;
}
