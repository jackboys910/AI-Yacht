import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeHrefs, pagePath } from "@/i18n/config";
import { todayUtc } from "@/lib/content/schedule";
import { interestLinks } from "@/lib/content/nav";
import { resolveTrip, withPlaceholder } from "@/lib/content/lookup";
import { pick, pickOrOther } from "@/lib/content/trip-view";
import { publishedTripPaths } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { siteConfig } from "@/lib/site";
import { TripPage } from "@/views/trip-page";

type Params = { interest: string; trip: string };

/**
 * Every published trip gets a page; nothing else does.
 *
 * A static export has no `dynamicParams`, so this list is the complete set of
 * trip pages the site will have until the next build. That is also what keeps
 * drafts and archived trips off the site entirely (П-09) — they are never
 * built, so there is no file to find.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const { trips, interests } = await getSiteContent();
  return withPlaceholder(publishedTripPaths(trips, interests));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { interest, trip: tripSlug } = await params;
  const found = resolveTrip(await getSiteContent(), interest, tripSlug);
  if (!found) return {};

  const { trip } = found;
  const title = pick(trip.social.title, "en") || pickOrOther(trip.title, "en");
  const description = pick(trip.social.description, "en") || pick(trip.subtitle, "en");
  const path = `/${interest}/${tripSlug}/`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical: path,
      languages: { en: path, ru: `/ru${path}`, "x-default": path },
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { interest, trip: tripSlug } = await params;
  const content = await getSiteContent();
  const found = resolveTrip(content, interest, tripSlug);
  if (!found) notFound();

  return (
    <TripPage
      trip={found.trip}
      people={found.crew}
      locale="en"
      today={todayUtc()}
      interestSlug={interest}
      chrome={{
        interests: interestLinks(content.interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        languageHrefs: localeHrefs(`/${interest}/${tripSlug}/`),
      }}
    />
  );
}
