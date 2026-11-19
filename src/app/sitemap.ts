import type { MetadataRoute } from "next";
import {
  defaultLocale,
  localized,
  locales,
  pagePath,
  type Locale,
  type PageId,
} from "@/i18n/config";
import { publishedTripPaths } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { siteConfig } from "@/lib/site";

/**
 * `sitemap.xml` (Т-03, Т-05).
 *
 * Built from the same database read the pages are built from, so it cannot
 * drift away from them: a trip that is a draft or in the archive is not in
 * `getSiteContent`, which means it cannot reach this file either — Т-03 asks
 * for exactly that, and the guarantee is structural rather than a filter
 * somebody has to remember.
 *
 * Two pages are deliberately absent. `/unsubscribe/` is about one person's
 * subscription and carries `noindex` for that reason, and `/admin/` is the
 * panel. Both are also in `robots.txt`; a sitemap that lists what robots.txt
 * forbids is a sitemap that argues with itself.
 *
 * Every entry carries its other language as `alternates.languages`, which is
 * the hreflang pair in sitemap form (Т-05). The pages say the same thing in
 * their own `<head>`; search engines are happy to be told twice and this is
 * the half that covers the trip pages without crawling them first.
 */

/** A metadata route is a route handler, and a static export insists on this. */
export const dynamic = "force-static";

const FIXED: PageId[] = ["home", "about", "story", "suggest", "itSolutions", "privacy"];

/** How often each kind of page is worth re-reading, and how much it matters. */
const WEIGHT = {
  home: { changeFrequency: "weekly", priority: 1 },
  interest: { changeFrequency: "weekly", priority: 0.9 },
  trip: { changeFrequency: "weekly", priority: 0.8 },
  page: { changeFrequency: "monthly", priority: 0.6 },
  legal: { changeFrequency: "yearly", priority: 0.2 },
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { interests, trips } = await getSiteContent();
  const now = new Date();

  const absolute = (path: string) => `${siteConfig.url}${path}`;

  /** One row per language, each naming the others. */
  const rows = (
    paths: Record<Locale, string>,
    weight: { changeFrequency: string; priority: number },
  ): MetadataRoute.Sitemap =>
    locales.map((locale) => ({
      url: absolute(paths[locale]),
      lastModified: now,
      changeFrequency: weight.changeFrequency as "weekly",
      priority: weight.priority,
      alternates: {
        languages: Object.fromEntries(
          locales
            .map((other) => [other, absolute(paths[other])])
            .concat([["x-default", absolute(paths[defaultLocale])]]),
        ),
      },
    }));

  /** The same page in every language, which is what one row needs. */
  const everyLanguage = (path: (locale: Locale) => string): Record<Locale, string> =>
    Object.fromEntries(locales.map((l) => [l, path(l)])) as Record<Locale, string>;

  const pages = FIXED.flatMap((page) =>
    rows(
      everyLanguage((locale) => pagePath(page, locale)),
      page === "home" ? WEIGHT.home : page === "privacy" ? WEIGHT.legal : WEIGHT.page,
    ),
  );

  const tabs = interests.flatMap((interest) =>
    rows(
      everyLanguage((locale) => localized(`/${interest.slug}/`, locale)),
      WEIGHT.interest,
    ),
  );

  const tripPages = publishedTripPaths(trips, interests).flatMap((path) =>
    rows(
      everyLanguage((locale) => localized(`/${path.interest}/${path.trip}/`, locale)),
      WEIGHT.trip,
    ),
  );

  return [...pages, ...tabs, ...tripPages];
}
