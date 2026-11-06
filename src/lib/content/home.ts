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

/**
 * One section of the S the home page is built on (ТЗ v4, §4.2).
 *
 * A picture, a name whose first letter carries the whole idea, and one line
 * saying what happens there. The sections are laid out in a serpentine that
 * draws the letter, so their order is the order of the letter — which is the
 * order the owner arranged the interests in.
 */
export interface HomeLane {
  id: string;
  label: string;
  caption: string;
  href: string;
  image?: LaneImage;
}

export interface LaneImage {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** Where to crop; see `StoredImage.focusX` and `focusY`. */
  focusX?: number;
  focusY?: number;
}

/**
 * The fifth section.
 *
 * Software is not an interest: it has no trips, no tab and no row in the
 * database, and it leads to Solutions. Composing it here rather than leaving
 * the renderer to invent it keeps the S one list, built in one place, wherever
 * it is drawn.
 *
 * The word itself is still open (ТЗ v4, §13): the concept document says Studio,
 * the mock-up the owner sent says Software, the header says Solutions. Software
 * is what the mock-up says, and the choice moves to settings with item 4.3.
 */
const SOFTWARE = {
  id: "software",
  label: "Software",
  // Short enough to hold to two lines on a narrow phone, where the section
  // has a fixed height and a third line would simply be cut off.
  caption: {
    en: "Digital products, from idea to tool.",
    ru: "Цифровые продукты из ваших идей.",
  },
  image: {
    url: "/assets/software-team.jpg",
    width: 1600,
    height: 1067,
    // The code on the monitor is right of centre; a plain middle crop lands
    // between the two people and shows the bezel.
    focusX: 0.62,
    alt: {
      en: "Two people at their monitors, writing code",
      ru: "Двое за мониторами пишут код",
    },
  },
} as const;

/**
 * The sections of the S, in the order the owner arranged the interests, with
 * Software last.
 *
 * An interest added in the panel gets its section without a developer (А-14),
 * and a hidden one loses it along with its tab (§7.3) — which is also why the
 * letter is drawn from the number of sections rather than sitting behind them
 * as a picture of an S with exactly five lobes.
 */
export function homeLanes(
  interests: Interest[],
  locale: Locale,
  solutionsHref: string,
): HomeLane[] {
  const fromInterests = visibleInterests(interests).map((interest) => ({
    id: interest.slug,
    label: interestLabel(interest),
    caption: interest.tileCaption[locale] || interest.tileCaption.en || "",
    href: localized(`/${interest.slug}/`, locale),
    image: laneImage(interest.cover, locale),
  }));

  return [
    ...fromInterests,
    {
      id: SOFTWARE.id,
      label: SOFTWARE.label,
      caption: SOFTWARE.caption[locale],
      href: solutionsHref,
      image: { ...SOFTWARE.image, alt: SOFTWARE.image.alt[locale] },
    },
  ];
}

/** The cover as the section needs it: one resolved URL, one resolved caption. */
function laneImage(cover: StoredImage | undefined, locale: Locale): LaneImage | undefined {
  if (!cover?.url) return undefined;
  return {
    url: cover.thumbUrl || cover.url,
    alt: cover.alt[locale] || cover.alt.en || "",
    width: cover.width || 640,
    height: cover.height || 480,
    focusX: cover.focusX,
    focusY: cover.focusY,
  };
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
