import type { Locale } from "./config";
import { en, type Dictionary } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";

export type { Dictionary };
export * from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, ru };

/**
 * Dictionaries are plain objects imported at build time. Every page is
 * statically exported, so all of this resolves during `next build`; client
 * components only receive the slice of strings they render.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
