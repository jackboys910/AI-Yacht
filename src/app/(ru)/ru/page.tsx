import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { homeLanes, homeUpcoming } from "@/lib/content/home";
import { interestLinks } from "@/lib/content/nav";
import { todayUtc } from "@/lib/content/schedule";
import { getSiteContent } from "@/lib/firebase/content";
import { HomePage } from "@/views/home-page";

export const metadata = buildMetadata("ru", "home");

export default async function Page() {
  const content = await getSiteContent();
  const today = todayUtc();
  const { trips, chips } = homeUpcoming(content, today);

  return (
    <HomePage
      lanes={homeLanes(content.interests, "ru", pagePath("itSolutions", "ru"))}
      trips={trips}
      chips={chips}
      locale="ru"
      today={today}
      chrome={{
        interests: interestLinks(content.interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        languageHrefs: localeHrefs("/"),
      }}
    />
  );
}
