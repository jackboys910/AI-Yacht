import type { Locale } from "@/i18n/config";
import type { Trip } from "@/lib/content/types";
import {
  bookingLabel,
  coverOf,
  formatDateRange,
  kidsLabel,
  pick,
  pickOrOther,
} from "@/lib/content/trip-view";
import { effectiveBookingStatus } from "@/lib/content/schedule";

/**
 * The first screen of a trip page (§6.3), built from the slider the owner
 * filled in rather than from a photograph hardcoded in the markup.
 *
 * The slider is CSS scroll-snap, with no JavaScript behind it: the page is a
 * static export, so a slider that needs to hydrate before it can be dragged
 * would be dead for the first second on exactly the slow phones §11 is about.
 */
export function TripHero({
  trip,
  locale,
  today,
}: {
  trip: Trip;
  locale: Locale;
  today: string;
}) {
  const cover = coverOf(trip);
  const status = effectiveBookingStatus(trip, today);
  const kids = kidsLabel(trip, locale);
  const dates = formatDateRange(trip.startDate, trip.endDate, locale);
  const place = pick(trip.place, locale);
  const rest = trip.gallery.filter((_, index) => index !== trip.coverIndex);

  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-primary text-white"
    >
      {cover && (
        <img
          src={cover.url}
          alt={pickOrOther(cover.alt, locale)}
          width={cover.width || 1920}
          height={cover.height || 1280}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-transparent to-transparent" />

      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-end pb-16 pt-32 sm:pb-24 sm:pt-40">
        <div className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
              {bookingLabel(status, locale)}
            </span>
            {kids && (
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                {kids}
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
            {pickOrOther(trip.title, locale)}
          </h1>

          {pick(trip.subtitle, locale) && (
            <p className="mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
              {pick(trip.subtitle, locale)}
            </p>
          )}

          {(dates || place) && (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm uppercase tracking-[0.14em] text-white/70 sm:text-base">
              {dates && <span className="text-[color:var(--gold)]">{dates}</span>}
              {dates && place && <span aria-hidden="true">·</span>}
              {place && <span>{place}</span>}
            </p>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="relative pb-10">
          <div className="container-narrow flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-2">
            {rest.map((photo) => (
              <img
                key={photo.url}
                src={photo.thumbUrl ?? photo.url}
                alt={pickOrOther(photo.alt, locale)}
                width={photo.width || 640}
                height={photo.height || 420}
                loading="lazy"
                className="h-28 w-44 shrink-0 snap-start rounded-xl border border-white/15 object-cover sm:h-36 sm:w-56"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
