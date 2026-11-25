import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { calendarEvents } from "@/lib/content/calendar";
import { interestLinks } from "@/lib/content/nav";
import { todayUtc } from "@/lib/content/schedule";
import { getSiteContent } from "@/lib/firebase/content";
import { CalendarPage } from "@/views/calendar-page";

export const metadata = buildMetadata("ru", "calendar");

export default async function Page() {
  const content = await getSiteContent();
  const today = todayUtc();

  return (
    <CalendarPage
      locale="ru"
      today={today}
      events={calendarEvents(content, "ru", today)}
      chrome={{
        interests: interestLinks(content.interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        storyHref: pagePath("story", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        calendarHref: pagePath("calendar", "ru"),
        languageHrefs: localeHrefs("/calendar/"),
      }}
    />
  );
}
