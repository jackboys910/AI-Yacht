import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeHrefs, pagePath } from "@/i18n/config";
import { todayUtc } from "@/lib/content/schedule";
import { interestLinks } from "@/lib/content/nav";
import { resolveTrip, withPlaceholder } from "@/lib/content/lookup";
import { formatDateRange, pick, pickOrOther } from "@/lib/content/trip-view";
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

  // Ш-03: the dates belong in what Facebook shows, not only on the page.
  // They are the first thing anybody checks about a trip, and a preview that
  // makes them open the link to find out is a preview that failed.
  const dates = formatDateRange(trip.startDate, trip.endDate, "en");
  const preview = [dates, description].filter(Boolean).join(" · ");

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    openGraph: {
      title,
      description: preview,
      type: "article",
      url: path,
      // The picture is the generated card beside this file; Next finds it
      // and fills in og:image, its size and its type by itself.
    },
    twitter: { card: "summary_large_image", title, description: preview },
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
      thresholds={content.settings?.counterThresholds}
      chrome={{
        interests: interestLinks(content.interests, "en"),
        solutionsHref: pagePath("itSolutions", "en"),
        aboutHref: pagePath("about", "en"),
        suggestHref: pagePath("suggest", "en"),
        languageHrefs: localeHrefs(`/${interest}/${tripSlug}/`),
      }}
    />
  );
}
