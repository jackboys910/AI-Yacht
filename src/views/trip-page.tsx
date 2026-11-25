import { JoinSection } from "@/components/join/join-section";
import { SiteFoot } from "@/components/site-foot";
import { ShareButtons } from "@/components/trip/share-buttons";
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
import {
  printedInterest,
  thresholdsOf,
  type CounterSet,
} from "@/lib/content/counters";
import { subscribeOptions, type NavLink } from "@/lib/content/nav";
import type { Person, Trip } from "@/lib/content/types";
import { pickOrOther } from "@/lib/content/trip-view";

/** Header and footer. Absent in the admin preview, which brings its own bar. */
export interface SiteChrome {
  interests: NavLink[];
  solutionsHref: string;
  aboutHref: string;
  /** ТЗ v3 §6.5 — the owner's own page. */
  storyHref: string;
  suggestHref: string;
  /** Every trip by date (the client's list of 24.11.2026). */
  calendarHref: string;
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
  interestName,
  counters,
  chrome,
}: {
  trip: Trip;
  people: Person[];
  locale: Locale;
  today: string;
  interestSlug: string;
  /** The direction's name, said in the "I'm interested" window. */
  interestName?: string;
  /**
   * The counters and their thresholds. Absent in the admin preview, where
   * the defaults of §6.3 apply and nothing has been counted yet.
   */
  counters?: CounterSet;
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
        storyHref={chrome.storyHref}
          suggestHref={chrome.suggestHref}
          languageHrefs={chrome.languageHrefs}
          active={interestSlug}
        />
      )}

      <TripHero trip={trip} locale={locale} today={today} />
      <TripSeats
        trip={trip}
        locale={locale}
        today={today}
        thresholds={thresholdsOf(counters)}
        interested={printedInterest(counters, trip.id)}
        crew={people}
        interestName={interestName ?? interestSlug}
        joinable={Boolean(chrome)}
        live={Boolean(chrome)}
      />
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

      {/* Ш-01: the buttons sit between the page and the form, where somebody
          who has just read the whole thing is deciding what to do about it. */}
      {chrome && (
        <ShareButtons title={pickOrOther(trip.title, locale)} locale={locale} />
      )}

      {/*

          The application form is left out of the admin preview along with the
          rest of the chrome. The preview is the real page (А-07), but a form
          that posts for real is not something to leave under the owner's
          cursor while he reads his own draft. */}
      {chrome && <JoinSection trip={trip} locale={locale} today={today} />}

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
        storyHref={chrome.storyHref}
          suggestHref={chrome.suggestHref}
          languageHrefs={chrome.languageHrefs}
        />
      )}
    </div>
  );
}
