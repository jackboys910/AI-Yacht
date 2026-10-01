import { LanguageSwitcher } from "@/components/language-switcher";
import { TripHero } from "@/components/trip/trip-hero";
import {
  TripAudience,
  TripCards,
  TripFaq,
  TripPlace,
  TripPrice,
  TripProgram,
  TripRules,
  TripSeats,
  cardHeadings,
} from "@/components/trip/trip-sections";
import {
  TripCrew,
  TripMap,
  TripMedia,
  TripRouteDays,
} from "@/components/trip/trip-journey";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import type { Person, Trip } from "@/lib/content/types";

/**
 * A whole trip page, assembled from what the owner filled in (§6.3).
 *
 * The same component renders the published page and the preview in the admin
 * panel (А-07), so what the owner is shown before publishing is not an
 * approximation of the result — it is the result, drawn from the draft instead
 * of from the database.
 *
 * Blocks decide for themselves whether to appear: each returns nothing when its
 * part of the trip is empty, which is what П-10 checks.
 */
export function TripPage({
  trip,
  people,
  locale,
  today,
  interestSlug,
  chrome = true,
}: {
  trip: Trip;
  people: Person[];
  locale: Locale;
  today: string;
  interestSlug: string;
  /** Off in the admin preview, which brings its own bar and has nowhere to navigate to. */
  chrome?: boolean;
}) {
  return (
    <div className="bg-background text-foreground">
      {chrome && (
        <TripTopBar locale={locale} interestSlug={interestSlug} tripSlug={trip.slug} />
      )}

      <TripHero trip={trip} locale={locale} today={today} />
      <TripSeats trip={trip} locale={locale} today={today} />
      <TripPrice trip={trip} locale={locale} />
      <TripPlace trip={trip} locale={locale} />
      <TripAudience trip={trip} locale={locale} />
      <TripCards
        id="what-you-get"
        block={trip.whatYouGet}
        heading={cardHeadings.whatYouGet(locale)}
        locale={locale}
      />
      <TripCards
        id="prepare"
        block={trip.howToPrepare}
        heading={cardHeadings.prepare(locale)}
        locale={locale}
        dark
      />
      <TripProgram trip={trip} locale={locale} />
      <TripRouteDays trip={trip} locale={locale} />
      <TripMap trip={trip} locale={locale} />
      <TripMedia trip={trip} locale={locale} />
      <TripCrew trip={trip} people={people} locale={locale} />
      <TripRules trip={trip} locale={locale} />
      <TripFaq trip={trip} locale={locale} />

      {/* "Book my spot", the subscribe strip and the share buttons belong to
          items 2.3, 2.1 and 3.2. A form that cannot send would be worse than
          no form, so they arrive with the code that makes them work. */}
    </div>
  );
}

/**
 * A minimal bar so the page is navigable on its own.
 *
 * The real header — "NAZAROV", the MY INTERESTS block, Story, Solutions and
 * "+ Subscribe" — is plan item 1.8, and it needs the interests out of the
 * database to build its menu. This stands in until then.
 */
function TripTopBar({
  locale,
  interestSlug,
  tripSlug,
}: {
  locale: Locale;
  interestSlug: string;
  tripSlug: string;
}) {
  const hrefs = Object.fromEntries(
    locales.map((l) => [
      l,
      l === defaultLocale
        ? `/${interestSlug}/${tripSlug}/`
        : `/${l}/${interestSlug}/${tripSlug}/`,
    ]),
  ) as Record<Locale, string>;

  return (
    <header className="fixed top-0 z-40 w-full bg-transparent">
      <div className="container-narrow flex items-center justify-between gap-2 py-3 sm:py-4">
        <a
          href={locale === defaultLocale ? "/" : `/${locale}/`}
          className="font-display text-xl font-bold leading-none tracking-[0.14em] text-white sm:text-2xl"
        >
          NAZAROV
        </a>
        <LanguageSwitcher
          locale={locale}
          hrefs={hrefs}
          label={locale === "en" ? "Language" : "Язык"}
        />
      </div>
    </header>
  );
}
