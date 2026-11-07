import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { Subscribe } from "@/components/subscribe/subscribe";
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
import type { Locale } from "@/i18n/config";
import { subscribeOptions, type NavLink } from "@/lib/content/nav";
import type { Person, Settings, Trip } from "@/lib/content/types";

/** Header and footer. Absent in the admin preview, which brings its own bar. */
export interface SiteChrome {
  interests: NavLink[];
  solutionsHref: string;
  aboutHref: string;
  suggestHref: string;
  languageHrefs: Record<Locale, string>;
}

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
  thresholds,
  chrome,
}: {
  trip: Trip;
  people: Person[];
  locale: Locale;
  today: string;
  interestSlug: string;
  /** From the settings; the defaults of §6.3 apply when they are not set. */
  thresholds?: Settings["counterThresholds"];
  /** Absent in the admin preview, which has nowhere to navigate to. */
  chrome?: SiteChrome;
}) {
  return (
    <div className="bg-background text-foreground">
      {chrome && (
        <SiteNav
          locale={locale}
          interests={chrome.interests}
          solutionsHref={chrome.solutionsHref}
          aboutHref={chrome.aboutHref}
          suggestHref={chrome.suggestHref}
          languageHrefs={chrome.languageHrefs}
          active={interestSlug}
        />
      )}

      <TripHero trip={trip} locale={locale} today={today} />
      <TripSeats trip={trip} locale={locale} today={today} thresholds={thresholds} />
      <TripPrice trip={trip} locale={locale} />
      <TripPlace trip={trip} locale={locale} />
      <TripAudience trip={trip} locale={locale} />
      <TripCards
        id="what-you-get"
        block={trip.whatYouGet}
        heading={cardHeadings.whatYouGet(locale)}
        locale={locale}
        numbered
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

      {/* "Book my spot" and the share buttons belong to items 2.8 and 2.10.
          A form that cannot send would be worse than no form, so they arrive
          with the code that makes them work. */}

      {/* Н-01: the trip page offers the list too, with this trip's direction
          already ticked. Left out of the admin preview along with the rest of
          the chrome — there is nothing to subscribe to in a draft. */}
      {chrome && (
        <Subscribe
          locale={locale}
          options={subscribeOptions(chrome.interests)}
          preselect={subscribeOptions(
            chrome.interests.filter((link) => link.id === interestSlug),
          ).map((option) => option.id)}
          variant="strip"
        />
      )}

      {chrome && (
        <SiteFoot
          locale={locale}
          interests={chrome.interests}
          solutionsHref={chrome.solutionsHref}
          aboutHref={chrome.aboutHref}
          suggestHref={chrome.suggestHref}
          languageHrefs={chrome.languageHrefs}
        />
      )}
    </div>
  );
}
