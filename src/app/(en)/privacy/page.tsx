import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { PrivacyPage } from "@/views/privacy-page";

export const metadata = buildMetadata("en", "privacy");

export default async function Page() {
  const { interests, settings } = await getSiteContent();

  return (
    <PrivacyPage
      locale="en"
      postalAddress={settings?.postalAddress}
      chrome={{
        interests: interestLinks(interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        storyHref: pagePath("story", "en"),
        suggestHref: pagePath("suggest", "en"),
        calendarHref: pagePath("calendar", "en"),
        languageHrefs: localeHrefs("/privacy/"),
      }}
    />
  );
}
