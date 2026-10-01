import { TripCard } from "@/components/trip-card";
import type { Locale } from "@/i18n/config";
import type { ListedTrip } from "@/lib/content/lookup";

/** A row of trip cards. Each one links to the tab that owns it (§6.4). */
export function TripGrid({
  trips,
  locale,
  today,
}: {
  trips: ListedTrip[];
  locale: Locale;
  today: string;
}) {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((item) => (
        <TripCard
          key={`${item.interestSlug}/${item.trip.slug}`}
          trip={item.trip}
          interestSlug={item.interestSlug}
          locale={locale}
          today={today}
        />
      ))}
    </div>
  );
}
