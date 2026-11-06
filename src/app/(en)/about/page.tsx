import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { AboutPage } from "@/views/about-page";

export const metadata = buildMetadata("en", "about");

export default async function Page() {
  const content = await getSiteContent();

  return (
    <AboutPage
      locale="en"
      tripsHref={`${pagePath("home", "en")}#upcoming`}
      chrome={{
        interests: interestLinks(content.interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        languageHrefs: localeHrefs("/about/"),
      }}
    />
  );
}
