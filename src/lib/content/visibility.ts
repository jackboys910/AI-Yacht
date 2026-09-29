import { isPast, splitBySchedule } from "./schedule";
import type { Interest, IsoDate, Trip } from "./types";

/**
 * Which trips a visitor is allowed to see, and where.
 *
 * §6.2 puts three separate switches on past trips and they stack, so the rules
 * live here once rather than in each page:
 *
 *  1. the interest's "Показывать прошедшие поездки" hides the whole Past block;
 *  2. a trip's own "Показывать в прошедших" hides just that trip;
 *  3. "В архив" takes the trip off the site altogether, and it can come back.
 *
 * Drafts and archived trips never reach a visitor (П-09), so every function
 * here starts from the published set.
 */

/** Only published trips exist as far as the public site is concerned. */
export function isPublic(trip: Trip): boolean {
  return trip.status === "published";
}

export function publishedTrips(trips: Trip[]): Trip[] {
  return trips.filter(isPublic);
}

/**
 * The trips that belong on one interest's tab.
 *
 * A normal tab shows only its own trips — §3 is explicit that Sailing has no
 * snowboarding in it. Son is the exception: it carries its own trips plus every
 * kid-friendly trip from the other tabs (§6.4). Those are the same trips, not
 * copies, so editing one changes it everywhere.
 */
export function tripsForInterest(trips: Trip[], interest: Interest): Trip[] {
  return publishedTrips(trips).filter((trip) => {
    if (trip.interestId === interest.id) return true;
    return interest.collectsKidFriendly && trip.kidFriendly;
  });
}

/**
 * The two blocks of an interest tab, with the past switches already applied.
 * `pastHidden` is the count the owner has chosen not to show; it exists so a
 * caller can tell "no past trips yet" apart from "past trips are switched off".
 */
export function tabTrips(
  trips: Trip[],
  interest: Interest,
  today: IsoDate,
): { upcoming: Trip[]; past: Trip[]; pastHidden: number } {
  const mine = tripsForInterest(trips, interest);
  const { upcoming, past } = splitBySchedule(mine, today);

  if (!interest.showPastTrips) {
    return { upcoming, past: [], pastHidden: past.length };
  }

  const visible = past.filter((trip) => trip.showInPast);
  return { upcoming, past: visible, pastHidden: past.length - visible.length };
}

/**
 * The home page shows the soonest published trips across every interest, and
 * never a past one (§6.1). Trips from hidden interests drop out with them.
 */
export function homeTrips(
  trips: Trip[],
  interests: Interest[],
  today: IsoDate,
  limit?: number,
): Trip[] {
  const visibleInterests = new Set(
    interests.filter((interest) => !interest.hidden).map((interest) => interest.id),
  );

  const upcoming = publishedTrips(trips).filter(
    (trip) => visibleInterests.has(trip.interestId) && !isPast(trip, today),
  );

  const { upcoming: sorted } = splitBySchedule(upcoming, today);
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

/**
 * The tabs the header and the subscription form offer. Hidden interests keep
 * their trips in the database but disappear from the site (§7.3).
 */
export function visibleInterests(interests: Interest[]): Interest[] {
  return interests
    .filter((interest) => !interest.hidden)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/**
 * Every address the build has to emit: one page per published trip, under the
 * interest that owns it. A kid-friendly trip is listed inside Son as well, but
 * it keeps the single address of its own interest, so the link shared from
 * either tab leads to the same page.
 */
export function publishedTripPaths(
  trips: Trip[],
  interests: Interest[],
): { interest: string; trip: string }[] {
  const slugById = new Map(interests.map((interest) => [interest.id, interest.slug]));

  return publishedTrips(trips).flatMap((trip) => {
    const interestSlug = slugById.get(trip.interestId);
    return interestSlug ? [{ interest: interestSlug, trip: trip.slug }] : [];
  });
}
