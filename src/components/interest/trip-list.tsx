"use client";

import { useMemo, useState } from "react";
import { TripCard } from "@/components/trip-card";
import type { Locale } from "@/i18n/config";
import type { ListedTrip } from "@/lib/content/lookup";

const ALL = { en: "All", ru: "Все" } as const;

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
  const [filter, setFilter] = useState<string>("all");

  // The chips follow the trips actually gathered here, so a tab never offers a
  // filter that would empty the list.
  const sources = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of trips) seen.set(item.interestSlug, item.interestLabel);
    return [...seen.entries()].map(([slug, label]) => ({ slug, label }));
  }, [trips]);

  const shown = filter === "all" ? trips : trips.filter((t) => t.interestSlug === filter);
  const showChips = filterable && sources.length > 1;

  return (
    <>
      {showChips && (
        <div
          role="group"
          aria-label={locale === "en" ? "Filter by section" : "Фильтр по направлению"}
          className="mt-6 flex flex-wrap gap-2"
        >
          {[{ slug: "all", label: ALL[locale] }, ...sources].map((chip) => (
            <button
              key={chip.slug}
              type="button"
              onClick={() => setFilter(chip.slug)}
              aria-pressed={filter === chip.slug}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === chip.slug
                  ? "border-[color:var(--teal)] bg-[color:var(--teal)] text-[color:var(--teal-foreground)]"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <TripCard
            key={`${item.interestSlug}/${item.trip.slug}`}
            trip={item.trip}
            interestSlug={item.interestSlug}
            locale={locale}
            today={today}
          />
        ))}
      </div>
    </>
  );
}
