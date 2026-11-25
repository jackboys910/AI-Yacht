import { calendarCopy } from "@/components/calendar/calendar-copy";
import { CalendarView } from "@/components/calendar/calendar-view";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { Subscribe } from "@/components/subscribe/subscribe";
import type { Locale } from "@/i18n/config";
import type { CalendarEvent } from "@/lib/content/calendar";
import { subscribeOptions } from "@/lib/content/nav";
import type { SiteChrome } from "./trip-page";

/**
 * `/calendar/` — every trip on the site by date (the client's list of
 * 24.11.2026).
 *
 * Light rather than dark, like the tab pages: this is the site showing
 * something, not asking for something, and the dark pages are the ones where
 * it asks.
 *
 * The subscription strip at the foot is the answer to an empty month. A
 * visitor who came to find out when something is happening and found nothing
 * in February has a reason to leave an address that no other page can offer
 * as well.
 */
export function CalendarPage({
  events,
  locale,
  today,
  chrome,
}: {
  events: CalendarEvent[];
  locale: Locale;
  today: string;
  chrome: SiteChrome;
}) {
  const c = calendarCopy;

  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
        active="calendar"
      />

      <section className="bg-primary pb-14 pt-28 text-white sm:pb-16 sm:pt-36">
        <div className="container-narrow max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
            {c.eyebrow[locale]}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
            {c.title[locale]}
          </h1>
          <p className="mt-5 text-white/75">{c.text[locale]}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container-narrow">
          <CalendarView events={events} locale={locale} today={today} />
        </div>
      </section>

      <Subscribe locale={locale} options={subscribeOptions(chrome.interests)} variant="strip" />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
