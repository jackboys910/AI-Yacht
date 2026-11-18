import { ABOUT } from "@/components/about/about-copy";
import { HOME_OPENING } from "@/components/home/home-copy";
import type { Localized, Settings } from "./types";

/**
 * The text of the pages whose words the owner may change (§7.7, А-15).
 *
 * Two sources, one answer. The site ships with the copy it was written with,
 * in code, next to the markup that uses it; the settings document holds what
 * the owner has rewritten since. This merges them, field by field and
 * language by language.
 *
 * Field by field is the whole point. The pitfall of moving copy into a
 * database is the first save: a form that writes every field at once, with
 * the untouched ones empty, replaces a finished page with blanks. So an empty
 * value here never means "empty" — it means "say what you said before", and
 * the only way to blank a line is to have never had one.
 *
 * Per language for the same reason. The owner edits the panel in one
 * language at a time, and a Russian correction must not take the English
 * sentence down with it.
 */

const pick = (
  override: Localized<string> | undefined,
  fallback: Localized<string>,
): Localized<string> => ({
  en: override?.en?.trim() ? override.en : fallback.en,
  ru: override?.ru?.trim() ? override.ru : fallback.ru,
});

const pickLines = (
  override: Localized<string[]> | undefined,
  fallback: Localized<string[]>,
): Localized<string[]> => ({
  en: override?.en?.some((line) => line.trim()) ? override.en : fallback.en,
  ru: override?.ru?.some((line) => line.trim()) ? override.ru : fallback.ru,
});

export type HomeOpeningCopy = typeof HOME_OPENING;

/** The six strings of the home page's first screen. */
export function homeOpening(settings: Settings | null): HomeOpeningCopy {
  const home = settings?.home;
  return {
    ...HOME_OPENING,
    communityA: pick(home?.communityA, HOME_OPENING.communityA),
    communityB: pick(home?.communityB, HOME_OPENING.communityB),
    free: pick(home?.free, HOME_OPENING.free),
    noFees: pick(home?.noFees, HOME_OPENING.noFees),
    titleA: pick(home?.titleA, HOME_OPENING.titleA),
    titleB: pick(home?.titleB, HOME_OPENING.titleB),
  };
}

/** How the About page opens. */
export function aboutHero(settings: Settings | null): typeof ABOUT.hero {
  const about = settings?.about;
  return {
    ...ABOUT.hero,
    eyebrow: pick(about?.heroEyebrow, ABOUT.hero.eyebrow),
    title: pick(about?.heroTitle, ABOUT.hero.title),
    paragraphs: pickLines(about?.heroParagraphs, ABOUT.hero.paragraphs),
  };
}

/** How it signs off. */
export function aboutClosing(settings: Settings | null): typeof ABOUT.closing {
  const about = settings?.about;
  return {
    ...ABOUT.closing,
    title: pick(about?.closingTitle, ABOUT.closing.title),
    paragraphs: pickLines(about?.closingParagraphs, ABOUT.closing.paragraphs),
    sign: pick(about?.closingSign, ABOUT.closing.sign),
  };
}
