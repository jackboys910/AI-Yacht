import type { Metadata } from "next";
import { localeHrefs, pagePath } from "@/i18n/config";
import { interestLinks, subscribeOptions } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { UnsubscribePage } from "@/views/unsubscribe-page";

/**
 * The page behind the Unsubscribe link in every letter (Н-09, Н-10).
 *
 * Kept out of search results: it is a page about one person's subscription,
 * it says nothing to anybody who arrives without a key, and a search engine
 * following a key out of a leaked letter is the one visitor it must not have.
 */
export const metadata: Metadata = {
  title: "Your subscription — nazarov.net",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { interests } = await getSiteContent();
  const links = interestLinks(interests, "en");

  return (
    <UnsubscribePage
      locale="en"
      options={subscribeOptions(links)}
      homeHref={pagePath("home", "en")}
      chrome={{
        interests: links,
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        suggestHref: pagePath("suggest", "en"),
        languageHrefs: localeHrefs("/unsubscribe/"),
      }}
    />
  );
}
