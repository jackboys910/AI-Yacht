import { localeHrefs, localized, type Locale } from "@/i18n/config";
import type { Interest } from "./types";
import { visibleInterests } from "./visibility";

/**
 * The site's navigation, built from the database rather than written into the
 * markup.
 *
 * А-14 is the reason: an interest the owner adds in the panel has to appear in
 * the header, on the home page and in the subscription form without a
 * developer. The header therefore has no list of tabs in it — it renders
 * whatever the build read out of Firestore.
 */

export interface NavLink {
  /** Identifies the active item; an interest's slug, or "solutions". */
  id: string;
  label: string;
  href: string;
}

/**
 * The interests, in the order the owner arranged them, hidden ones left out.
 *
 * Labels are English in both language versions: §16.1 fixes the tab names that
 * way, and Appendix В lists them as strings to carry across verbatim.
 */
export function interestLinks(interests: Interest[], locale: Locale): NavLink[] {
  return visibleInterests(interests).map((interest) => ({
    id: interest.slug,
    label: interest.name.en || interest.name.ru || interest.slug,
    href: localized(`/${interest.slug}/`, locale),
  }));
}

/** Where the EN / RU switch points from a database-built address. */
export { localeHrefs };
