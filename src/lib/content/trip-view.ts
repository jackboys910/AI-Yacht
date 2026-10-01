import type { Locale } from "@/i18n/config";
import type {
  BookingStatus,
  Localized,
  StoredImage,
  Trip,
} from "./types";

/**
 * Turning stored trip data into the values a page renders.
 *
 * The rule that runs through all of it comes from §6.3: a block the owner did
 * not fill in is not rendered — no empty heading, no placeholder. So every
 * helper here answers "is there anything to show?" rather than "give me the
 * text", and the components lean on that instead of each inventing their own
 * emptiness test.
 */

/** The text for this language, trimmed; empty when there is none. */
export function pick(value: Localized<string> | undefined, locale: Locale): string {
  return value?.[locale]?.trim() ?? "";
}

/** The non-empty lines for this language. */
export function pickList(
  value: Localized<string[]> | undefined,
  locale: Locale,
): string[] {
  return (value?.[locale] ?? []).map((line) => line.trim()).filter(Boolean);
}

/**
 * A localized value with the other language as a fallback.
 *
 * Used only where leaving a hole would be worse than showing the wrong
 * language — a trip's title, say, or the alt text of a photo. Body copy never
 * falls back: half-translated prose reads as a mistake, and А-03 blocks
 * publishing a trip whose mandatory text is missing anyway.
 */
export function pickOrOther(
  value: Localized<string> | undefined,
  locale: Locale,
): string {
  const own = pick(value, locale);
  if (own) return own;
  return locale === "en" ? (value?.ru?.trim() ?? "") : (value?.en?.trim() ?? "");
}

export function coverOf(trip: Trip): StoredImage | undefined {
  return trip.gallery[trip.coverIndex] ?? trip.gallery[0];
}

/** Cards and small screens get the smaller file where one exists. */
export function thumbOf(image: StoredImage | undefined): string | undefined {
  return image?.thumbUrl ?? image?.url;
}

const MONTHS: Record<Locale, string[]> = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  ru: [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ],
};

/**
 * "November 12–22, 2027" / "12–22 ноября 2027".
 *
 * Written out rather than handed to Intl because the two languages put the
 * pieces in different orders and a range has to collapse the repeated parts —
 * "12–22 ноября", not "12 ноября – 22 ноября". Dates are parsed as plain
 * `YYYY-MM-DD` numbers, never through `new Date(string)`, so the result does
 * not shift by a day depending on where the build runs.
 */
export function formatDateRange(start: string, end: string, locale: Locale): string {
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return "";

  const month = (m: number) => MONTHS[locale][m - 1] ?? "";

  if (locale === "ru") {
    if (from.year === to.year && from.month === to.month) {
      return `${from.day}–${to.day} ${month(from.month)} ${from.year}`;
    }
    if (from.year === to.year) {
      return `${from.day} ${month(from.month)} – ${to.day} ${month(to.month)} ${from.year}`;
    }
    return `${from.day} ${month(from.month)} ${from.year} – ${to.day} ${month(to.month)} ${to.year}`;
  }

  if (from.year === to.year && from.month === to.month) {
    return `${month(from.month)} ${from.day}–${to.day}, ${from.year}`;
  }
  if (from.year === to.year) {
    return `${month(from.month)} ${from.day} – ${month(to.month)} ${to.day}, ${from.year}`;
  }
  return `${month(from.month)} ${from.day}, ${from.year} – ${month(to.month)} ${to.day}, ${to.year}`;
}

function parse(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** The wording §6.3 and Appendix В fix for each state, in both languages. */
const BOOKING_LABELS: Record<BookingStatus, Localized<string>> = {
  open: { en: "Open for booking", ru: "Набор открыт" },
  fewSpots: { en: "Few spots left", ru: "Мест мало" },
  soldOut: { en: "Sold out", ru: "Мест нет" },
  completed: { en: "Completed", ru: "Поездка прошла" },
};

export function bookingLabel(status: BookingStatus, locale: Locale): string {
  return BOOKING_LABELS[status][locale];
}

/**
 * The badges a kid-friendly trip carries (§6.3).
 *
 * The spec asks for two different things and they are not alternatives: the
 * mark itself puts "Kids welcome" on the trip, and an age range the owner
 * filled in adds a badge of the form "Kids 2–6". So a range extends the first
 * badge rather than replacing it — otherwise filling the ages in would quietly
 * take away the words Appendix В fixes for the mark.
 */
export function kidsBadges(trip: Trip, locale: Locale): string[] {
  if (!trip.kidFriendly) return [];

  const welcome = locale === "en" ? "Kids welcome" : "Можно с детьми";
  const kids = locale === "en" ? "Kids" : "Дети";
  const { kidAgeFrom: from, kidAgeTo: to } = trip;

  if (from !== undefined && to !== undefined) return [welcome, `${kids} ${from}–${to}`];
  if (from !== undefined)
    return [welcome, locale === "en" ? `${kids} ${from}+` : `${kids} от ${from}`];
  if (to !== undefined)
    return [welcome, locale === "en" ? `${kids} up to ${to}` : `${kids} до ${to}`];
  return [welcome];
}
