import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { DEFAULT_CALENDLY_URL } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { ItSolutionsPage } from "@/views/it-solutions-page";

export const metadata = buildMetadata("ru", "itSolutions");

export default async function Page() {
  const { interests, settings } = await getSiteContent();

  return (
    <ItSolutionsPage
      locale="ru"
      chrome={{
        interests: interestLinks(interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        languageHrefs: localeHrefs(pagePath("itSolutions", "en")),
      }}
      // No settings document at all yet, so the fallback lives here too:
      // the mapper's default only applies to a document that exists.
      calendlyUrl={settings?.calendlyUrl || DEFAULT_CALENDLY_URL}
    />
  );
}
