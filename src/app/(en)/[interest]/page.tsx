import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeHrefs, pagePath } from "@/i18n/config";
import { resolveInterestPage, withInterestPlaceholder } from "@/lib/content/lookup";
import { interestLinks } from "@/lib/content/nav";
import { todayUtc } from "@/lib/content/schedule";
import { pick, pickOrOther } from "@/lib/content/trip-view";
import { visibleInterests } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { siteConfig } from "@/lib/site";
import { InterestPage } from "@/views/interest-page";

type Params = { interest: string };

/**
 * A page per visible interest. Hidden ones get none, which is how §7.3 takes a
 * tab off the site without touching its trips.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const { interests } = await getSiteContent();
  return withInterestPlaceholder(
    visibleInterests(interests).map((interest) => ({ interest: interest.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { interest: slug } = await params;
  const found = resolveInterestPage(await getSiteContent(), slug, todayUtc());
  if (!found) return {};

  const path = `/${slug}/`;
  return {
    metadataBase: new URL(siteConfig.url),
    title: pickOrOther(found.interest.name, "en"),
    description: pick(found.interest.description, "en"),
    alternates: {
      canonical: path,
      languages: { en: path, ru: `/ru${path}`, "x-default": path },
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { interest: slug } = await params;
  const content = await getSiteContent();
  const today = todayUtc();
  const found = resolveInterestPage(content, slug, today);
  if (!found) notFound();

  return (
    <InterestPage
      interest={found.interest}
      upcoming={found.upcoming}
      past={found.past}
      locale="en"
      today={today}
      chrome={{
        interests: interestLinks(content.interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        languageHrefs: localeHrefs(`/${slug}/`),
      }}
    />
  );
}
