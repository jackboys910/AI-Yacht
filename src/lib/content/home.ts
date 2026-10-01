import { localized, type Locale } from "@/i18n/config";
import { interestLabel } from "./nav";
import type { Interest, IsoDate, SiteContent, StoredImage } from "./types";
import { homeTrips, visibleInterests } from "./visibility";

/**
 * What the home page is made of (§6.1).
 *
 * The home page is, in the words of the spec, the one place where trips from
 * every interest are shown together. That makes it the only page whose lists
 * cut across the tabs, so the rules for doing that live here rather than in the
 * markup — which also means the filter and the tiles cannot disagree about
 * which interests exist.
 */

/** One tile in the "My interests" block: a photo, a name and a line under it. */
export interface HomeTile {
  slug: string;
  label: string;
  caption: string;
  href: string;
  cover?: StoredImage;
}

/**
 * The tiles, in the order the owner arranged the interests. A new interest
 * added in the panel gets a tile without a developer (А-14), and a hidden one
 * loses it along with its tab (§7.3).
 */
export function homeTiles(interests: Interest[], locale: Locale): HomeTile[] {
  return visibleInterests(interests).map((interest) => ({
    slug: interest.slug,
    label: interestLabel(interest),
    caption: interest.tileCaption[locale] || interest.tileCaption.en || "",
    href: localized(`/${interest.slug}/`, locale),
    cover: interest.cover,
  }));
}

/** An upcoming trip together with every filter chip it answers to. */
export interface HomeTrip {
  trip: SiteContent["trips"][number];
  interestSlug: string;
  interestLabel: string;
  /** Slugs of the tabs this trip belongs to; what the filter matches on. */
  tabs: string[];
}

/** A filter chip: an interest, by the English label §16.1 fixes for the tabs. */
export interface HomeChip {
  slug: string;
  label: string;
}

/**
 * The "Upcoming trips" block: every published trip still to come, soonest
 * first, and the chips that filter them.
 *
 * Two things are worth saying about the filter.
 *
 * A trip carries the tabs it belongs to rather than just the one that owns it,
 * because Son gathers the kid-friendly trips of the other interests (§6.4).
 * Picking "Son" here therefore shows the same trips the Son tab would, and
 * each of them still links to the single page it has under its own interest.
 *
 * The chips are only the interests that some upcoming trip answers to. §6.1
 * names all four, which is what this produces once each has a trip, but
 * offering a chip that leads to an empty list would be a dead end — the same
 * rule the tab pages follow.
 */
export function homeUpcoming(
  content: SiteContent,
  today: IsoDate,
): { trips: HomeTrip[]; chips: HomeChip[] } {
  const visible = visibleInterests(content.interests);
  const byId = new Map(visible.map((interest) => [interest.id, interest]));
  const collectors = visible.filter((interest) => interest.collectsKidFriendly);

  const trips = homeTrips(content.trips, content.interests, today).flatMap<HomeTrip>(
    (trip) => {
      const owner = byId.get(trip.interestId);
      if (!owner) return [];

      const gathered = trip.kidFriendly
        ? collectors.filter((interest) => interest.id !== owner.id)
        : [];

      return [
        {
          trip,
          interestSlug: owner.slug,
          interestLabel: interestLabel(owner),
          tabs: [owner.slug, ...gathered.map((interest) => interest.slug)],
        },
      ];
    },
  );

  const answered = new Set(trips.flatMap((item) => item.tabs));
  const chips = visible
    .filter((interest) => answered.has(interest.slug))
    .map((interest) => ({ slug: interest.slug, label: interestLabel(interest) }));

  return { trips, chips };
}
