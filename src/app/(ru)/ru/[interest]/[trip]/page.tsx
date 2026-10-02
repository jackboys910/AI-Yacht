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
 * The Russian mirror. §5 keeps the same Latin address in both languages, so a
 * link shared from either version leads to the same trip — only the /ru/
 * prefix differs.
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
  const title = pick(trip.social.title, "ru") || pickOrOther(trip.title, "ru");
  const description = pick(trip.social.description, "ru") || pick(trip.subtitle, "ru");
  const path = `/${interest}/${tripSlug}/`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    alternates: {
      canonical: `/ru${path}`,
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
      locale="ru"
      today={todayUtc()}
      interestSlug={interest}
      thresholds={content.settings?.counterThresholds}
      chrome={{
        interests: interestLinks(content.interests, "ru"),
        solutionsHref: pagePath("itSolutions", "ru"),
        languageHrefs: localeHrefs(`/${interest}/${tripSlug}/`),
      }}
    />
  );
}
