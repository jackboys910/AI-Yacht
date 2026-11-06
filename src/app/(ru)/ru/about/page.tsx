import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { AboutPage } from "@/views/about-page";

export const metadata = buildMetadata("ru", "about");

export default async function Page() {
  const content = await getSiteContent();

  return (
    <AboutPage
      locale="ru"
      tripsHref={`${pagePath("home", "ru")}#upcoming`}
      chrome={{
        interests: interestLinks(content.interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        languageHrefs: localeHrefs("/about/"),
      }}
    />
  );
}
