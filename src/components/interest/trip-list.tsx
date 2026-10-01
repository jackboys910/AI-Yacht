"use client";

import { useMemo, useState } from "react";
import { ALL_CHIP, FilterChips } from "@/components/filter-chips";
import { TripGrid } from "@/components/trip-grid";
import type { Locale } from "@/i18n/config";
import type { ListedTrip } from "@/lib/content/lookup";

/**
 * A grid of trips, with the source filter the Son tab needs (§6.4).
 *
 * This is a client component, but every card is in the static HTML: Next
 * prerenders client components too, so the page arrives complete and the
 * filter is an improvement on top rather than a condition for seeing anything.
 */
export function TripList({
  trips,
  locale,
  today,
  filterable = false,
}: {
  trips: ListedTrip[];
  locale: Locale;
  today: string;
  filterable?: boolean;
}) {
  const [filter, setFilter] = useState<string>(ALL_CHIP);

  // The chips follow the trips actually gathered here, so a tab never offers a
  // filter that would empty the list.
  const chips = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of trips) seen.set(item.interestSlug, item.interestLabel);
    return [...seen.entries()].map(([slug, label]) => ({ slug, label }));
  }, [trips]);

  const shown =
    filter === ALL_CHIP ? trips : trips.filter((item) => item.interestSlug === filter);

  return (
    <>
      {filterable && (
        <FilterChips
          chips={chips}
          active={filter}
          onChange={setFilter}
          locale={locale}
        />
      )}
      <TripGrid trips={shown} locale={locale} today={today} />
    </>
  );
}
