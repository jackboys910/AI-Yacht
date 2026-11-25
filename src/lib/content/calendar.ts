import { localized, type Locale } from "@/i18n/config";
import { interestLabel } from "./nav";
import { effectiveBookingStatus, isPast } from "./schedule";
import { pick } from "./trip-view";
import type { BookingStatus, IsoDate, SiteContent } from "./types";
import { publishedTrips } from "./visibility";

/**
 * Everything on the site that happens on a date (asked for by the client,
 * 24.11.2026: "a calendar of all the events on the site").
 *
 * A trip is the only thing here that has dates, so the calendar is the trips
 * — all of them, across every direction, past ones included. That is the
 * difference between this page and the home page: the home page shows what is
 * coming next and nothing else, and somebody who wants to know what February
 * looks like, or what happened last spring, has had nowhere to look.
 *
 * Which trips: the published ones, the same set that has pages. A trip under
 * a direction the owner has hidden keeps its own page (§7.3 hides the tab,
 * not the trips), so it keeps its place here too — a calendar that left out
 * a trip anybody can open would be lying about the month.
 *
 * Dates are handled in UTC from end to end. A trip's dates are calendar days
 * rather than instants, and reading "2027-05-08" in a browser west of
 * Greenwich turns it into the seventh if the zone is allowed to have an
 * opinion.
 */

export interface CalendarEvent {
  id: string;
  title: string;
  href: string;
  start: IsoDate;
  end: IsoDate;
  /** The direction's label, as the tabs spell it (§16.1: English in both). */
  direction: string;
  directionSlug: string;
  place: string;
  kidFriendly: boolean;
  booking: BookingStatus;
  past: boolean;
}

/** Every published trip as an entry in the calendar, soonest first. */
export function calendarEvents(
  content: SiteContent,
  locale: Locale,
  today: IsoDate,
): CalendarEvent[] {
  const byId = new Map(content.interests.map((interest) => [interest.id, interest]));

  return publishedTrips(content.trips)
    .flatMap<CalendarEvent>((trip) => {
      const interest = byId.get(trip.interestId);
      if (!interest) return [];

      return [
        {
          id: trip.id,
          title: pick(trip.title, locale) || trip.slug,
          href: localized(`/${interest.slug}/${trip.slug}/`, locale),
          start: trip.startDate,
          end: trip.endDate || trip.startDate,
          direction: interestLabel(interest),
          directionSlug: interest.slug,
          place: pick(trip.place, locale),
          kidFriendly: trip.kidFriendly,
          booking: effectiveBookingStatus(trip, today),
          past: isPast(trip, today),
        },
      ];
    })
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

/* -------------------------------------------------------------------------
   Months, as the grid needs them
   ------------------------------------------------------------------------- */

/** "2027-05" — the key a month is addressed by. */
export type MonthKey = string;

export const monthOf = (iso: IsoDate): MonthKey => iso.slice(0, 7);

/** The month `count` months after this one, over a year boundary and back. */
export function shiftMonth(key: MonthKey, count: number): MonthKey {
  const [year, month] = key.split("-").map(Number);
  const moved = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * The grid of one month: always whole weeks, so the shape of the month is
 * the shape of the block.
 *
 * `weekStart` is 0 for Sunday and 1 for Monday — the week does not begin on
 * the same day in the two languages the site speaks, and a calendar that got
 * that wrong would be read wrong rather than merely look foreign.
 */
export function monthGrid(
  key: MonthKey,
  weekStart: 0 | 1,
): { iso: IsoDate; day: number; inMonth: boolean }[] {
  const [year, month] = key.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));

  // How many days of the previous month the first row has to show.
  const lead = (first.getUTCDay() - weekStart + 7) % 7;
  const start = new Date(Date.UTC(year, month - 1, 1 - lead));

  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((lead + last) / 7) * 7;

  return Array.from({ length: cells }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000);
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year,
    };
  });
}

/** Whether a date falls inside an event, start and end days included. */
export const covers = (event: CalendarEvent, iso: IsoDate): boolean =>
  event.start <= iso && iso <= event.end;

/** The events that touch a month at all, including those that straddle it. */
export function eventsInMonth(events: CalendarEvent[], key: MonthKey): CalendarEvent[] {
  const [year, month] = key.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const first = `${key}-01`;
  return events.filter((event) => event.start <= last && event.end >= first);
}

/** The months with something in them, so the arrows can stop at the edges. */
export function monthRange(events: CalendarEvent[]): { first?: MonthKey; last?: MonthKey } {
  if (events.length === 0) return {};
  return {
    first: monthOf(events[0].start),
    last: events.reduce((latest, event) => (event.end > latest ? event.end : latest), events[0].end).slice(0, 7),
  };
}
