import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { ItSolutionsPage } from "@/views/it-solutions-page";

export const metadata = buildMetadata("ru", "itSolutions");

export default async function Page() {
  const { interests } = await getSiteContent();

  return (
    <ItSolutionsPage
      locale="ru"
      chrome={{
        interests: interestLinks(interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        languageHrefs: localeHrefs(pagePath("itSolutions", "en")),
      }}
    />
  );
}
