import type { Interest, Person, SiteContent, Trip } from "./types";
import { isPublic } from "./visibility";

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
export const PLACEHOLDER_TRIP_PATH = { interest: "_", trip: "_" } as const;

export function withPlaceholder(
  paths: { interest: string; trip: string }[],
): { interest: string; trip: string }[] {
  return paths.length > 0 ? paths : [PLACEHOLDER_TRIP_PATH];
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
