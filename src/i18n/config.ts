export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Every page of the site, independent of language. */
export type PageId = "home" | "itSolutions";

const slugs: Record<PageId, string> = {
  home: "/",
  // §2 of the spec renames the page to "Solutions"; its content is rewritten in
  // plan item 3.3, and /it-solutions redirects here (public/_redirects).
  itSolutions: "/solutions/",
};

/**
 * English lives at the root (`/`, `/it-solutions/`) because it is the
 * default; every other locale is prefixed (`/ru/`, `/ru/it-solutions/`).
 * Paths keep the trailing slash to match `trailingSlash: true`.
 */
export function pagePath(page: PageId, locale: Locale): string {
  const slug = slugs[page];
  return locale === defaultLocale ? slug : `/${locale}${slug}`;
}

/**
 * The same address in a given language. English lives at the root, every other
 * locale is prefixed — `/sailing/grenadines/` becomes `/ru/sailing/grenadines/`.
 *
 * Used for addresses built at runtime from the database (interests, trips),
 * where `pagePath` and its fixed list of pages cannot help.
 */
export function localized(path: string, locale: Locale): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

/** Both language versions of one address, for the EN / RU switch. */
export function localeHrefs(path: string): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, localized(path, locale)]),
  ) as Record<Locale, string>;
}

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

/** Open Graph locale codes. */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
};
