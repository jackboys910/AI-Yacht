import { CommunityActions } from "@/components/home/community-actions";
import { CommunityOpening } from "@/components/home/community-opening";
import { HomeTrips } from "@/components/home/home-trips";
import { SiteFoot } from "@/components/site-foot";
import { Subscribe } from "@/components/subscribe/subscribe";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import type { HomeChip, HomeLane, HomeTrip } from "@/lib/content/home";
import { subscribeOptions } from "@/lib/content/nav";
import type { SiteChrome } from "./trip-page";

/**
 * The home page (§6.1, rewritten by ТЗ v4 §4) — the way into the community and
 * the one place where the trips of every interest are shown together.
 *
 * In order: the first screen, which is the letter S the whole site is built on;
 * what a visitor can do here; the nearest upcoming trips with their filter.
 * Past trips never appear here.
 *
 * One block of §6.1 is still to come and is marked below: the videos need the
 * YouTube playlists (item 2.11). It arrives with the code that makes it work,
 * rather than standing here as something that looks ready and is not.
 */
export function HomePage({
  lanes,
  trips,
  chips,
  locale,
  today,
  chrome,
}: {
  lanes: HomeLane[];
  trips: HomeTrip[];
  chips: HomeChip[];
  locale: Locale;
  today: string;
  chrome: SiteChrome;
}) {
  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />

      <CommunityOpening lanes={lanes} locale={locale} />
      <CommunityActions
        locale={locale}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
      />
      <HomeTrips trips={trips} chips={chips} locale={locale} today={today} />

      {/* Videos from the channel (item 2.11). */}

      {/* Н-01: the way onto the mailing list is on the home page as well as
          on every tab. Nothing is ticked for it here — from the home page
          the window offers the whole community. */}
      <Subscribe locale={locale} options={subscribeOptions(chrome.interests)} variant="strip" />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
