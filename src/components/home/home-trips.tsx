"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/eyebrow";
import { ALL_CHIP, FilterChips } from "@/components/filter-chips";
import { TripGrid } from "@/components/trip-grid";
import type { Locale } from "@/i18n/config";
import type { HomeChip, HomeTrip } from "@/lib/content/home";

/** §6.1: three nearest trips, with the rest a click away. */
const SHOWN_AT_FIRST = 3;

const COPY = {
  heading: { en: "Upcoming trips", ru: "Ближайшие поездки" },
  all: { en: "See all trips", ru: "Все поездки" },
  fewer: { en: "Show fewer", ru: "Показать меньше" },
  soon: {
    en: "New trips coming soon. Subscribe and be the first to know.",
    ru: "Скоро новые поездки. Подпишитесь, и узнаете первым.",
  },
} as const;

/**
 * The "Upcoming trips" block (§6.1): the three nearest published trips of
 * every interest, soonest first, with the filter and "See all trips".
 *
 * "See all trips" opens the rest of the list here instead of leading somewhere
 * else, because there is nowhere else to lead: §6.1 calls the home page the one
 * place where the trips of every interest are shown together, and the spec's
 * site map has no all-trips page. A tab shows one interest, so sending the
 * visitor there would show them less, not more.
 *
 * The three cards are rendered on the server, so they are in the HTML a search
 * engine and a visitor without JavaScript get. The filter and the expansion are
 * improvements on top of that.
 */
export function HomeTrips({
  trips,
  chips,
  locale,
  today,
}: {
  trips: HomeTrip[];
  chips: HomeChip[];
  locale: Locale;
  today: string;
}) {
  const [filter, setFilter] = useState<string>(ALL_CHIP);
  const [expanded, setExpanded] = useState(false);

  const matching =
    filter === ALL_CHIP ? trips : trips.filter((item) => item.tabs.includes(filter));
  const shown = expanded ? matching : matching.slice(0, SHOWN_AT_FIRST);

  return (
    <section id="upcoming" className="bg-muted/40 py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{COPY.heading[locale]}</Eyebrow>

        {trips.length === 0 ? (
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {COPY.soon[locale]}
          </p>
        ) : (
          <>
            <FilterChips
              chips={chips}
              active={filter}
              onChange={setFilter}
              locale={locale}
            />

            <TripGrid trips={shown} locale={locale} today={today} />

            {matching.length > SHOWN_AT_FIRST && (
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-foreground"
              >
                {expanded ? COPY.fewer[locale] : COPY.all[locale]}
                <span
                  aria-hidden="true"
                  className={`text-[color:var(--teal)] transition ${
                    expanded ? "rotate-180" : ""
                  }`}
                >
                  ↓
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
