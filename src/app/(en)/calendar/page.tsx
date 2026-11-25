import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { calendarEvents } from "@/lib/content/calendar";
import { interestLinks } from "@/lib/content/nav";
import { todayUtc } from "@/lib/content/schedule";
import { getSiteContent } from "@/lib/firebase/content";
import { CalendarPage } from "@/views/calendar-page";

export const metadata = buildMetadata("en", "calendar");

export default async function Page() {
  const content = await getSiteContent();
  const today = todayUtc();

  return (
    <CalendarPage
      locale="en"
      today={today}
      events={calendarEvents(content, "en", today)}
      chrome={{
        interests: interestLinks(content.interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        storyHref: pagePath("story", "en"),
        suggestHref: pagePath("suggest", "en"),
        calendarHref: pagePath("calendar", "en"),
        languageHrefs: localeHrefs("/calendar/"),
      }}
    />
  );
}
