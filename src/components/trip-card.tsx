import type { Locale } from "@/i18n/config";
import { localized } from "@/i18n/config";
import { effectiveBookingStatus } from "@/lib/content/schedule";
import type { Trip } from "@/lib/content/types";
import {
  bookingLabel,
  coverOf,
  formatDateRange,
  kidsBadges,
  pick,
  pickOrOther,
  thumbOf,
} from "@/lib/content/trip-view";

const COPY = {
  view: { en: "View trip", ru: "Подробнее" },
  photos: { en: "See photos", ru: "Посмотреть фото" },
} as const;

/**
 * One trip in a list (§6.2): photo, status, name, dates, place, price.
 *
 * A past trip is shown quieter and offers photographs instead of a way to
 * sign up — §6.2 asks for exactly that, and a booking button on a trip that
 * already happened would be a small lie.
 */
export function TripCard({
  trip,
  interestSlug,
  locale,
  today,
}: {
  trip: Trip;
  interestSlug: string;
  locale: Locale;
  today: string;
}) {
  const cover = coverOf(trip);
  const status = effectiveBookingStatus(trip, today);
  const past = status === "completed";
  const kids = past ? [] : kidsBadges(trip, locale);
  const href = localized(`/${interestSlug}/${trip.slug}/`, locale);
  const price = pick(trip.price?.amount, locale);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition ${
        past ? "opacity-70 hover:opacity-100" : "hover:shadow-card"
      }`}
    >
      <a href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-primary">
          {cover && (
            <img
              src={thumbOf(cover)}
              alt={pickOrOther(cover.alt, locale)}
              width={cover.width || 640}
              height={cover.height || 480}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] ${
                past ? "saturate-50" : ""
              }`}
            />
          )}
          <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-3">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {bookingLabel(status, locale)}
            </span>
            {kids.map((label) => (
              <span
                key={label}
                className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </a>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-snug">
          <a href={href} className="transition hover:text-[color:var(--teal)]">
            {pickOrOther(trip.title, locale)}
          </a>
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {formatDateRange(trip.startDate, trip.endDate, locale)}
          {pick(trip.place, locale) && ` · ${pick(trip.place, locale)}`}
        </p>

        {price && !past && (
          <p className="mt-3 font-display text-lg text-[color:var(--teal)]">{price}</p>
        )}

        <a
          href={href}
          className="mt-5 inline-flex w-fit items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
        >
          {past ? COPY.photos[locale] : COPY.view[locale]}
        </a>
      </div>
    </article>
  );
}
