import { HomeHero } from "@/components/home/home-hero";
import { HomeTrips } from "@/components/home/home-trips";
import { InterestTiles } from "@/components/home/interest-tiles";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import type { HomeChip, HomeTile, HomeTrip } from "@/lib/content/home";
import type { SiteChrome } from "./trip-page";

/**
 * The home page (§6.1) — the one place where the trips of every interest are
 * shown together.
 *
 * In order: the first screen, the "My interests" tiles, the nearest upcoming
 * trips with their filter. Past trips never appear here.
 *
 * Two blocks of §6.1 are still to come and are marked below: "Latest videos"
 * needs the YouTube channel (item 3.1) and the subscription strip needs the
 * mailing list behind it (item 2.1). Each arrives with the code that makes it
 * work, rather than standing here as something that looks ready and is not.
 */
export function HomePage({
  tiles,
  trips,
  chips,
  locale,
  today,
  chrome,
}: {
  tiles: HomeTile[];
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
        languageHrefs={chrome.languageHrefs}
      />

      <HomeHero locale={locale} />
      <InterestTiles tiles={tiles} locale={locale} />
      <HomeTrips trips={trips} chips={chips} locale={locale} today={today} />

      {/* "Latest videos" (item 3.1) and the subscription strip (item 2.1). */}

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
