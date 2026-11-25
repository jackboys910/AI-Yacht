import type { Metadata } from "next";
import { localeHrefs, pagePath } from "@/i18n/config";
import { interestLinks, subscribeOptions } from "@/lib/content/nav";
import { getSiteContent } from "@/lib/firebase/content";
import { UnsubscribePage } from "@/views/unsubscribe-page";

/** The Russian half of the unsubscribe page; see the English one for why. */
export const metadata: Metadata = {
  title: "Ваша подписка — nazarov.net",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { interests } = await getSiteContent();
  const links = interestLinks(interests, "ru");

  return (
    <UnsubscribePage
      locale="ru"
      options={subscribeOptions(links)}
      homeHref={pagePath("home", "ru")}
      chrome={{
        interests: links,
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        storyHref: pagePath("story", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        calendarHref: pagePath("calendar", "ru"),
        languageHrefs: localeHrefs("/unsubscribe/"),
      }}
    />
  );
}
