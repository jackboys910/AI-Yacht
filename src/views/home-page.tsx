import { CommunityActions } from "@/components/home/community-actions";
import { CommunityOpening } from "@/components/home/community-opening";
import { HomeTrips } from "@/components/home/home-trips";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import type { HomeChip, HomeLane, HomeTrip } from "@/lib/content/home";
import type { SiteChrome } from "./trip-page";

/**
 * The home page (§6.1, rewritten by ТЗ v4 §4) — the way into the community and
 * the one place where the trips of every interest are shown together.
 *
 * In order: the first screen, which is the letter S the whole site is built on;
 * what a visitor can do here; the nearest upcoming trips with their filter.
 * Past trips never appear here.
 *
 * Two blocks of §6.1 are still to come and are marked below: the videos need
 * the YouTube playlists (item 2.11) and the subscription strip needs the
 * mailing list behind it (item 2.7). Each arrives with the code that makes it
 * work, rather than standing here as something that looks ready and is not.
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
        languageHrefs={chrome.languageHrefs}
      />

      <CommunityOpening lanes={lanes} locale={locale} />
      <CommunityActions locale={locale} solutionsHref={chrome.solutionsHref} />
      <HomeTrips trips={trips} chips={chips} locale={locale} today={today} />

      {/* Videos from the channel (item 2.11) and the subscription strip
          (item 2.7). */}

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
