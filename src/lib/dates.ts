import type { Locale } from "@/i18n/config";

/**
 * Writing a calendar day out in both languages.
 *
 * Asking `Intl` for a day, a month and a year together gets "8 мая 2027 г."
 * in Russian — correct, and three characters of officialese that belong in a
 * document rather than on a card or in a letter. So the day and the month are
 * asked for together, which `Intl` is needed for (the month has to be in the
 * genitive — "8 мая", not "8 май"), and the year is simply put after them.
 *
 * Dates are read as UTC throughout. A trip's date is a calendar day rather
 * than an instant, and a browser west of Greenwich turns "2027-05-08" into
 * the seventh if it is allowed an opinion about the zone.
 */

const tagFor = (locale: Locale) => (locale === "ru" ? "ru-RU" : "en-GB");

const atUtc = (iso: string): Date | null => {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "8 May" / "8 мая", or "8 Jan" / "8 янв." when short. */
export function writeDayMonth(
  iso: string,
  locale: Locale,
  month: "long" | "short" = "long",
): string {
  const date = atUtc(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(tagFor(locale), {
    day: "numeric",
    month,
    timeZone: "UTC",
  }).format(date);
}

/** "8 May 2027" / "8 мая 2027". */
export function writeDay(
  iso: string,
  locale: Locale,
  month: "long" | "short" = "long",
): string {
  const date = atUtc(iso);
  if (!date) return iso;
  return `${writeDayMonth(iso, locale, month)} ${date.getUTCFullYear()}`;
}

/** "January 2027" / "Январь 2027", capitalised: a heading is a heading. */
export function writeMonth(key: string, locale: Locale): string {
  const [year, month] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat(tagFor(locale), {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `${name} ${year}`;
}

/**
 * A run of days: "14 — 24 Jan 2027", saying the month and the year once
 * wherever both halves share them.
 */
export function writeSpan(start: string, end: string, locale: Locale): string {
  const from = atUtc(start);
  const to = atUtc(end);
  if (!from || !to) return start;
  if (start === end) return writeDay(start, locale, "short");

  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();

  if (sameMonth) return `${from.getUTCDate()} — ${writeDay(end, locale, "short")}`;
  return sameYear
    ? `${writeDayMonth(start, locale, "short")} — ${writeDay(end, locale, "short")}`
    : `${writeDay(start, locale, "short")} — ${writeDay(end, locale, "short")}`;
}
