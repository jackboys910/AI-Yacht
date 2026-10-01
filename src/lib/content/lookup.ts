import type { Interest, Person, SiteContent, Trip } from "./types";
import { isPublic, tabTrips } from "./visibility";

/** A trip together with the tab it belongs to, which its address is built from. */
export interface ListedTrip {
  trip: Trip;
  interestSlug: string;
  interestLabel: string;
}

/**
 * A stand-in path for a site that has no published trips yet.
 *
 * `output: "export"` refuses to build a dynamic route whose
 * `generateStaticParams` comes back empty — it is a hard error, with no flag to
 * turn it off. Left alone, that would mean nazarov.net cannot be built at all
 * before the first trip is published, and becomes unbuildable again the day the
 * owner unpublishes the last one. Neither is acceptable for a site that
 * rebuilds on every publish.
 *
 * So the route is always given one path, and the page answers it the way it
 * answers any address that does not match a trip: with the 404 page. Nothing
 * links to it and it stays out of the sitemap.
 */
export const PLACEHOLDER_SEGMENT = "_";

export function withPlaceholder(
  paths: { interest: string; trip: string }[],
): { interest: string; trip: string }[] {
  return paths.length > 0
    ? paths
    : [{ interest: PLACEHOLDER_SEGMENT, trip: PLACEHOLDER_SEGMENT }];
}

/** The same guard for the interest pages, which have one segment, not two. */
export function withInterestPlaceholder(
  paths: { interest: string }[],
): { interest: string }[] {
  return paths.length > 0 ? paths : [{ interest: PLACEHOLDER_SEGMENT }];
}

/** The interest a tab page is about, or null when the address matches none. */
export function resolveInterest(
  content: SiteContent,
  interestSlug: string,
): Interest | null {
  const interest = content.interests.find((item) => item.slug === interestSlug);
  return interest && !interest.hidden ? interest : null;
}

/**
 * Everything a tab page shows: the interest, its upcoming trips and the past
 * ones it is allowed to show.
 *
 * Each trip carries the tab that owns it rather than the tab being viewed,
 * because a kid-friendly trip listed under Son keeps the single address of its
 * own interest (§6.4) — the same trip, not a copy, so a link shared from either
 * tab leads to the same page.
 */
export function resolveInterestPage(
  content: SiteContent,
  interestSlug: string,
  today: string,
): { interest: Interest; upcoming: ListedTrip[]; past: ListedTrip[] } | null {
  const interest = resolveInterest(content, interestSlug);
  if (!interest) return null;

  const byId = new Map(content.interests.map((item) => [item.id, item]));
  const list = (trips: Trip[]): ListedTrip[] =>
    trips.flatMap((trip) => {
      const owner = byId.get(trip.interestId);
      if (!owner) return [];
      return [
        {
          trip,
          interestSlug: owner.slug,
          interestLabel: owner.name.en || owner.name.ru || owner.slug,
        },
      ];
    });

  const { upcoming, past } = tabTrips(content.trips, interest, today);
  return { interest, upcoming: list(upcoming), past: list(past) };
}

/**
 * Finding the one trip a page is about, from the content read at build time.
 *
 * Only published trips resolve. A draft or archived trip has no page, which is
 * П-09 — and because `generateStaticParams` enumerates the same set, such a
 * trip is never even asked for.
 */
export function resolveTrip(
  content: SiteContent,
  interestSlug: string,
  tripSlug: string,
): { trip: Trip; interest: Interest; crew: Person[] } | null {
  const interest = content.interests.find((item) => item.slug === interestSlug);
  if (!interest) return null;

  const trip = content.trips.find(
    (item) => item.interestId === interest.id && item.slug === tripSlug && isPublic(item),
  );
  if (!trip) return null;

  // Only the people this trip actually lists, so a page never carries the whole
  // directory into its HTML.
  const crew = trip.crewPersonIds
    .map((id) => content.people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person));

  return { trip, interest, crew };
}
