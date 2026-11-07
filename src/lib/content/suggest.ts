import type { SuggestCategory } from "@/components/suggest/suggest-form";
import type { Locale } from "@/i18n/config";
import type { Interest } from "./types";
import { pickOrOther } from "./trip-view";

/**
 * The categories offered by the Suggest an Adventure form (ТЗ v4, §3.5).
 *
 * They are the site's directions, filtered by a flag of their own rather than
 * by whether their tab is visible. The Functional Specification lists seven
 * categories while the site has four tabs, and the four missing ones —
 * Family Travel, Hiking & Camping, Road Trips, Other Adventures — have to be
 * suggestable before any of them has a trip to show. A tab with nothing under
 * it is worse than no tab; a category nobody can pick is worse than both.
 *
 * The "Other" direction sorts last whatever its menu position: it is the
 * escape hatch at the bottom of a list, not a peer of the real categories.
 */
export function suggestCategories(
  interests: Interest[],
  locale: Locale,
): SuggestCategory[] {
  return interests
    .filter((interest) => interest.suggestable)
    .sort((a, b) => {
      if (a.suggestOther !== b.suggestOther) return a.suggestOther ? 1 : -1;
      return a.order - b.order || a.slug.localeCompare(b.slug);
    })
    .map((interest) => ({
      id: interest.id,
      label: pickOrOther(interest.name, locale) || interest.slug,
      other: interest.suggestOther,
    }));
}
