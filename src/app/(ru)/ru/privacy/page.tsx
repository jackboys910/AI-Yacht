import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { PrivacyPage } from "@/views/privacy-page";

export const metadata = buildMetadata("ru", "privacy");

export default async function Page() {
  const { interests, settings } = await getSiteContent();

  return (
    <PrivacyPage
      locale="ru"
      postalAddress={settings?.postalAddress}
      chrome={{
        interests: interestLinks(interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        storyHref: pagePath("story", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        calendarHref: pagePath("calendar", "ru"),
        languageHrefs: localeHrefs("/privacy/"),
      }}
    />
  );
}
