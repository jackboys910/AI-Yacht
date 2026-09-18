export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Every page of the site, independent of language. */
export type PageId = "home" | "itSolutions";

const slugs: Record<PageId, string> = {
  home: "/",
  itSolutions: "/it-solutions/",
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

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

/** Open Graph locale codes. */
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
};
