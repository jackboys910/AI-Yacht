import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { suggestCategories } from "@/lib/content/suggest";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { SuggestPage } from "@/views/suggest-page";

export const metadata = buildMetadata("ru", "suggest");

export default async function Page() {
  const { interests } = await getSiteContent();

  return (
    <SuggestPage
      locale="ru"
      categories={suggestCategories(interests, "ru")}
      homeHref={pagePath("home", "ru")}
      chrome={{
        interests: interestLinks(interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        languageHrefs: localeHrefs("/suggest/"),
      }}
    />
  );
}
