import { localeHrefs, pagePath } from "@/i18n/config";
import { buildMetadata } from "@/i18n/metadata";
import { interestLinks } from "@/lib/content/nav";
import { readChannelVideos } from "@/lib/content/youtube";
import { getSiteContent } from "@/lib/firebase/content";
import { StoryPage } from "@/views/story-page";

export const metadata = buildMetadata("ru", "story");

export default async function Page() {
  const content = await getSiteContent();

  return (
    <StoryPage
      locale="ru"
      settings={content.settings}
      // Read here rather than in the view: the feed is a network call, and a
      // page that renders is a page that already has its answer — or has
      // given up on it (П-16).
      videos={await readChannelVideos(content.settings?.story.youtubeChannelId)}
      chrome={{
        interests: interestLinks(content.interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        aboutHref: pagePath("about", "ru"),
        storyHref: pagePath("story", "ru"),
        suggestHref: pagePath("suggest", "ru"),
        calendarHref: pagePath("calendar", "ru"),
        languageHrefs: localeHrefs("/story/"),
      }}
    />
  );
}
