import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { suggestCategories } from "@/lib/content/suggest";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { SuggestPage } from "@/views/suggest-page";

export const metadata = buildMetadata("en", "suggest");

export default async function Page() {
  const { interests } = await getSiteContent();

  return (
    <SuggestPage
      locale="en"
      categories={suggestCategories(interests, "en")}
      homeHref={pagePath("home", "en")}
      chrome={{
        interests: interestLinks(interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        suggestHref: pagePath("suggest", "en"),
        languageHrefs: localeHrefs("/suggest/"),
      }}
    />
  );
}
