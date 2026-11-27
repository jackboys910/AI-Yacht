import { localizedKind } from "./content/fill-locales";
import { idToken } from "./firebase/auth";

/**
 * The Russian half of a record, filled in by machine just before it is saved.
 *
 * The panel is filled in English only (plan item 6.9): there is no Russian
 * tab, and typing in a field empties its Russian half (fields.tsx), so an
 * edited text is never left beside a translation of what it used to say.
 * This walks the record about to be written, finds every bilingual text with
 * English and no Russian, has `/api/translate` translate them in one request,
 * and returns the record with the Russian filled in.
 *
 * Bilingual fields are found by shape, exactly as `fillLocales` finds them,
 * so a field added to a form later is translated without anyone remembering
 * to list it here. A list ("What's included") is translated line by line and
 * keeps its lines.
 *
 * It never stands in the way of a save. With no Worker (`next dev`), no
 * binding, or a model that did not answer, the record goes out as it is; the
 * site prints the English on the Russian page (fill-locales.ts), and the next
 * save tries again.
 */

const ENDPOINT = "/api/translate";

type Slot =
  | { kind: "text"; target: Record<string, unknown>; at: number }
  | { kind: "list"; target: Record<string, unknown>; at: number; count: number };

const has = (value: unknown) => typeof value === "string" && value.trim() !== "";

/** A deep copy, with every text still to translate noted on the way. */
function collect(value: unknown, texts: string[], slots: Slot[]): unknown {
  if (Array.isArray(value)) return value.map((item) => collect(item, texts, slots));
  if (value === null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const kind = localizedKind(source);
  if (kind === "text") {
    const target = { ...source };
    if (has(source.en) && !has(source.ru)) {
      slots.push({ kind: "text", target, at: texts.length });
      texts.push((source.en as string).trim());
    }
    return target;
  }
  if (kind === "list") {
    const en = (source.en as string[]).filter(has);
    const target = { ...source, en: [...(source.en as string[])], ru: [...(source.ru as string[])] };
    if (en.length > 0 && (source.ru as string[]).filter(has).length === 0) {
      slots.push({ kind: "list", target, at: texts.length, count: en.length });
      texts.push(...en.map((line) => line.trim()));
    }
    return target;
  }

  return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, collect(item, texts, slots)]));
}

export interface Translated<T> {
  value: T;
  /** How many texts were sent, and whether they came back. */
  asked: number;
  ok: boolean;
}

export async function translateMissing<T>(record: T, options: { tripId?: string } = {}): Promise<Translated<T>> {
  const texts: string[] = [];
  const slots: Slot[] = [];
  const copy = collect(record, texts, slots) as T;
  if (texts.length === 0) return { value: record, asked: 0, ok: true };

  let translations: unknown;
  try {
    const token = await idToken();
    if (!token) return { value: record, asked: texts.length, ok: false };
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ texts, tripId: options.tripId }),
    });
    // `next dev` answers an unknown path with a page, not JSON.
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      return { value: record, asked: texts.length, ok: false };
    }
    translations = ((await response.json()) as { translations?: unknown }).translations;
  } catch {
    return { value: record, asked: texts.length, ok: false };
  }

  if (!Array.isArray(translations) || translations.length !== texts.length) {
    return { value: record, asked: texts.length, ok: false };
  }
  const result = translations.map((item) => (typeof item === "string" ? item.trim() : ""));

  for (const slot of slots) {
    if (slot.kind === "text") {
      if (result[slot.at]) slot.target.ru = result[slot.at];
    } else {
      const lines = result.slice(slot.at, slot.at + slot.count);
      // All the lines or none: a list half in English reads worse than one
      // wholly in English, which the site prints when Russian is empty.
      if (lines.every(Boolean)) slot.target.ru = lines;
    }
  }
  return { value: copy, asked: texts.length, ok: result.every(Boolean) };
}
