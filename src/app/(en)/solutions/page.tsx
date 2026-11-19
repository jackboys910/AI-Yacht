import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { DEFAULT_CALENDLY_URL } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { SolutionsPage } from "@/views/solutions-page";

export const metadata = buildMetadata("en", "itSolutions");

export default async function Page() {
  const { interests, projects, settings } = await getSiteContent();

  return (
    <SolutionsPage
      locale="en"
      settings={settings}
      projects={projects}
      chrome={{
        interests: interestLinks(interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        storyHref: pagePath("story", "en"),
        suggestHref: pagePath("suggest", "en"),
        languageHrefs: localeHrefs(pagePath("itSolutions", "en")),
      }}
      // No settings document at all yet, so the fallback lives here too:
      // the mapper's default only applies to a document that exists.
      calendlyUrl={settings?.calendlyUrl || DEFAULT_CALENDLY_URL}
    />
  );
}
