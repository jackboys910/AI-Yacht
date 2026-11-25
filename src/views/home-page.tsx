import { CommunityActions } from "@/components/home/community-actions";
import { CommunityOpening } from "@/components/home/community-opening";
import { HomeTrips } from "@/components/home/home-trips";
import { SiteFoot } from "@/components/site-foot";
import { VideoWall } from "@/components/video/video-wall";
import { Subscribe } from "@/components/subscribe/subscribe";
import { SiteNav } from "@/components/site-nav";
import type { Locale } from "@/i18n/config";
import type { CounterSet } from "@/lib/content/counters";
import type { HomeOpeningCopy } from "@/lib/content/site-copy";
import type { HomeChip, HomeLane, HomeTrip } from "@/lib/content/home";
import { subscribeOptions } from "@/lib/content/nav";
import type { ChannelVideo } from "@/lib/content/youtube";
import type { SiteChrome } from "./trip-page";

/**
 * The home page (§6.1, rewritten by ТЗ v4 §4) — the way into the community and
 * the one place where the trips of every interest are shown together.
 *
 * In order: the first screen, which is the letter S the whole site is built on;
 * what a visitor can do here; the nearest upcoming trips with their filter.
 * Past trips never appear here.
 *
 * Nothing on it is a placeholder: every block here is wired to the thing
 * behind it, which is why they arrived one at a time rather than together.
 */
export function HomePage({
  lanes,
  trips,
  chips,
  videos,
  locale,
  today,
  counters,
  opening,
  chrome,
}: {
  lanes: HomeLane[];
  trips: HomeTrip[];
  chips: HomeChip[];
  /** The channel's latest, read at build time. Empty hides the block. */
  videos: ChannelVideo[];
  locale: Locale;
  today: string;
  /** Going and Interested for the cards (§6.2). */
  counters?: CounterSet;
  /** The first screen's words, with the owner's own merged in (§7.7). */
  opening?: HomeOpeningCopy;
  chrome: SiteChrome;
}) {
  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />

      <CommunityOpening lanes={lanes} locale={locale} copy={opening} />
      <CommunityActions
        locale={locale}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
      />
      <HomeTrips
        trips={trips}
        chips={chips}
        locale={locale}
        today={today}
        counters={counters}
        calendarHref={chrome.calendarHref}
      />

      <VideoWall
        videos={videos}
        locale={locale}
        channelUrl="https://www.youtube.com/@captain_yasha"
      />

      {/* Н-01: the way onto the mailing list is on the home page as well as
          on every tab. Nothing is ticked for it here — from the home page
          the window offers the whole community. */}
      <Subscribe locale={locale} options={subscribeOptions(chrome.interests)} variant="strip" />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
