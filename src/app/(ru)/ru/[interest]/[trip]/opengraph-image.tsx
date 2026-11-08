import { ImageResponse } from "next/og";
import { resolveTrip, withPlaceholder } from "@/lib/content/lookup";
import { coverOf, formatDateRange, pick, pickOrOther } from "@/lib/content/trip-view";
import { publishedTripPaths } from "@/lib/content/visibility";
import { getSiteContent } from "@/lib/firebase/content";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogBackground, ogFonts } from "@/lib/og-card";

/**
 * The share picture for one trip (Ш-03, Ш-04).
 *
 * Drawn during `next build`, into a PNG that sits beside the page as a file.
 * The addresses are known ahead of time — `generateStaticParams` on the page
 * beside this one lists them — which is the whole reason a static export can
 * have generated images at all.
 */
/**
 * A static export has nothing running to draw this on request, so the route
 * has to say outright that it is a file. Without it the build stops and says
 * so, which is the right way round.
 */
export const dynamic = "force-static";

export const alt = "Поездка на nazarov.net";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * The same list the page beside this one builds from.
 *
 * A metadata image is its own route, so it needs its own copy of the list —
 * and a copy that drifted from the page's would mean a trip whose link
 * previews a different trip. Hence the one shared helper, called twice,
 * rather than two lists written out.
 */
export async function generateStaticParams(): Promise<
  { interest: string; trip: string }[]
> {
  const { trips, interests } = await getSiteContent();
  return withPlaceholder(publishedTripPaths(trips, interests));
}

export default async function Image({
  params,
}: {
  params: Promise<{ interest: string; trip: string }>;
}) {
  const { interest, trip: slug } = await params;
  const found = resolveTrip(await getSiteContent(), interest, slug);

  const trip = found?.trip;
  const title = trip
    ? pick(trip.social.title, "ru") || pickOrOther(trip.title, "ru")
    : "nazarov.net";

  return new ImageResponse(
    (
      <OgCard
        locale="ru"
        title={title}
        place={trip ? pick(trip.place, "ru") : undefined}
        // Written out the way the page writes them. A card is read at a
        // glance, and "2027-01-14 — 2027-01-24" is not read at a glance.
        dates={trip ? formatDateRange(trip.startDate, trip.endDate, "ru") : undefined}
        kicker={found?.interest ? pickOrOther(found.interest.name, "ru") : undefined}
        // The owner's own picture wins where he gave one; otherwise the
        // cover of the trip, which is the photograph the site already leads
        // with.
        background={await ogBackground(
          trip?.social.image?.url ?? (trip ? coverOf(trip)?.url : undefined),
        )}
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
