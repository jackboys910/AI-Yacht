import type { BookingStatus, IsoDate, Trip } from "./types";

/**
 * Where a trip sits on the calendar.
 *
 * §6.2 defines Upcoming as a published trip whose end date has not passed, and
 * Past as everything after it, shown with the status "Completed".
 *
 * Every comparison here is a string comparison of `YYYY-MM-DD` values in UTC.
 * That is deliberate: the build runs on a CI machine in UTC and the visitor's
 * browser may be a day off either side, and `new Date("2026-11-22")` parsed as
 * local time would put those two on different sides of the boundary.
 */

/** Today as `YYYY-MM-DD` in UTC. */
export function todayUtc(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10);
}

/** A trip is still upcoming on the day it ends. */
export function isUpcoming(trip: Trip, today: IsoDate): boolean {
  return trip.endDate >= today;
}

export function isPast(trip: Trip, today: IsoDate): boolean {
  return trip.endDate < today;
}

/**
 * The status visitors see. A finished trip reads "Completed" whatever the
 * owner last set, so nobody has to remember to change it (§6.3).
 */
export function effectiveBookingStatus(trip: Trip, today: IsoDate): BookingStatus {
  return isPast(trip, today) ? "completed" : trip.bookingStatus;
}

/** How many people are going: the owner's number, or seats taken. */
export function goingCount(trip: Trip): number {
  if (trip.goingOverride !== undefined) return trip.goingOverride;
  return Math.max(0, trip.totalSeats - trip.seatsLeft);
}

/** Soonest first — the order Upcoming lists use. */
export function byStartDateAsc(a: Trip, b: Trip): number {
  return a.startDate.localeCompare(b.startDate) || a.slug.localeCompare(b.slug);
}

/** Most recent first — the order Past lists use. */
export function byEndDateDesc(a: Trip, b: Trip): number {
  return b.endDate.localeCompare(a.endDate) || a.slug.localeCompare(b.slug);
}

/**
 * Splits trips into the two blocks a tab renders, each already sorted. The
 * caller is expected to have filtered out drafts and archived trips first.
 */
export function splitBySchedule(
  trips: Trip[],
  today: IsoDate,
): { upcoming: Trip[]; past: Trip[] } {
  const upcoming: Trip[] = [];
  const past: Trip[] = [];

  for (const trip of trips) {
    (isUpcoming(trip, today) ? upcoming : past).push(trip);
  }

  upcoming.sort(byStartDateAsc);
  past.sort(byEndDateDesc);
  return { upcoming, past };
}
