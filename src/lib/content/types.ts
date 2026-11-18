import type { Locale } from "@/i18n/config";

/**
 * The shape of everything the owner manages from the admin panel.
 *
 * Mirrors "Основные данные" in Appendix A of the spec and the block table in
 * §6.3. Two rules run through the whole file:
 *
 *  - Anything a visitor reads is `Localized`, because the site is English and
 *    Russian and §11 requires the content to be filled in separately for each.
 *  - Optional blocks are optional fields. An absent field means "the owner did
 *    not fill this block in", and §6.3 says such a block is not rendered at all
 *    — no empty headings, no placeholders.
 */

/** A value the owner fills in for every language the site speaks. */
export type Localized<T> = Record<Locale, T>;

/** A calendar date without a time, as `YYYY-MM-DD`. */
export type IsoDate = string;

/** An instant, as a full ISO 8601 string in UTC. */
export type IsoDateTime = string;

/**
 * A photo in Firebase Storage. `storagePath` is kept alongside the URL because
 * deleting a trip, or duplicating one, has to act on the file itself and a
 * download URL carries a token that cannot be turned back into a path.
 */
export interface StoredImage {
  url: string;
  /** Smaller variant for cards and phones; falls back to `url` when absent. */
  thumbUrl?: string;
  width: number;
  height: number;
  storagePath: string;
  alt: Localized<string>;
  /**
   * Which part of the photo to keep when the frame it is shown in has other
   * proportions, as a share of the photo's width and height: 0 is the left or
   * top edge, 1 the right or bottom, 0.5 the middle.
   *
   * Needed because a frame that is not the photo's shape crops it from the
   * middle, and the middle of a photograph of a person is their chest. The
   * freefall shot lost its subject's face exactly that way in the wide
   * sections of the home page, and the round thumbnails there take a narrow
   * vertical slice that can miss the subject sideways just as easily.
   *
   * Absent means 0.5, which is what `object-cover` does on its own.
   */
  focusX?: number;
  focusY?: number;
}

/* -------------------------------------------------------------------------
   Interests — the site's tabs (§6.2, §7.3)
   ------------------------------------------------------------------------- */

export interface Interest {
  id: string;
  /** Address segment, e.g. `sailing` for `/sailing/`. Latin, lowercase. */
  slug: string;
  /**
   * §16.1 fixes the tab labels as English in both language versions, so the
   * four launch interests carry the same string twice. The field stays
   * localized because А-14 lets the owner add an interest with an EN and a RU
   * name, and a future interest may well want a Russian label.
   */
  name: Localized<string>;
  description: Localized<string>;
  /** The line under the tile on the home page, e.g. "On the water". */
  tileCaption: Localized<string>;
  cover?: StoredImage;
  /** Position in the header's "MY INTERESTS" block and among the tiles. */
  order: number;
  youtubePlaylistId?: string;
  /** Off hides the whole "Past trips" block of this tab (§6.2). */
  showPastTrips: boolean;
  /** Hides the tab without touching its trips (§7.3). */
  hidden: boolean;
  /**
   * Son is the one interest that also gathers kid-friendly trips belonging to
   * the others (§6.4). A flag rather than a hardcoded slug, so the owner could
   * point it elsewhere without a developer.
   */
  collectsKidFriendly: boolean;
  /**
   * Offer this direction as a category in the Suggest an Adventure form
   * (ТЗ v4, §3.5).
   *
   * Separate from `hidden` on purpose. The Functional Specification lists
   * seven categories and the site has four tabs: Hiking & Camping and Road
   * Trips should be suggestable before either has a single trip to show, and a
   * tab with nothing under it is worse than no tab.
   */
  suggestable: boolean;
  /**
   * "Other Adventures": ask the author to name their own category.
   *
   * A flag rather than a hardcoded slug, so the owner can move it — the same
   * reason `collectsKidFriendly` is one.
   */
  suggestOther: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/* -------------------------------------------------------------------------
   People — the crew directory (§7.4)
   ------------------------------------------------------------------------- */

export interface Person {
  id: string;
  name: Localized<string>;
  role: Localized<string>;
  bio: Localized<string>;
  photo?: StoredImage;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/* -------------------------------------------------------------------------
   Trip blocks (§6.3)
   ------------------------------------------------------------------------- */

/** What visitors see about availability. `completed` is set by the calendar. */
export type BookingStatus = "open" | "fewSpots" | "soldOut" | "completed";

/** Where a trip stands in the admin panel. Only `published` reaches the site. */
export type PublicationStatus = "draft" | "published" | "archived";

export interface PriceBlock {
  /** Free text, because "$3,500" and "3500 $" are written differently. */
  amount: Localized<string>;
  included: Localized<string[]>;
  notIncluded: Localized<string[]>;
}

export interface PlaceBlock {
  /** Two to four paragraphs describing where the trip goes. */
  paragraphs: Localized<string[]>;
}

export interface AudienceBlock {
  items: Localized<string[]>;
  note?: Localized<string>;
}

export interface TitledCard {
  title: Localized<string>;
  text: Localized<string>;
}

/** "What you get" (1–6 cards) and "How to prepare" share this shape. */
export interface CardsBlock {
  cards: TitledCard[];
  note?: Localized<string>;
}

export interface ProgramStage {
  duration: Localized<string>;
  place: Localized<string>;
  text: Localized<string>;
}

export interface ProgramBlock {
  stages: ProgramStage[];
  note?: Localized<string>;
}

export interface RouteDay {
  /** Position in the itinerary, 1-based. */
  number: number;
  /** Display text such as "Nov 12" / "12 ноября", not a machine date. */
  date?: Localized<string>;
  place: Localized<string>;
  text: Localized<string>;
  photo?: StoredImage;
}

export interface RouteBlock {
  days: RouteDay[];
  intro?: Localized<string>;
}

export interface MapBlock {
  images: StoredImage[];
  caption?: Localized<string>;
  /** Optional pin, when the owner wants a point rather than a drawn route. */
  latitude?: number;
  longitude?: number;
}

export interface MediaBlock {
  photos: StoredImage[];
  youtubeUrls: string[];
}

export interface RulesBlock {
  title: Localized<string>;
  text: Localized<string>;
}

export interface FaqItem {
  question: Localized<string>;
  answer: Localized<string>;
}

/** Overrides for the link preview; §7.2 fills these in automatically. */
export interface SocialPreview {
  image?: StoredImage;
  title: Localized<string>;
  description: Localized<string>;
}

/* -------------------------------------------------------------------------
   Trips (§6.3, §7.2)
   ------------------------------------------------------------------------- */

export interface Trip {
  id: string;
  interestId: string;
  /** Address segment inside the interest: `/sailing/grenadines-nov-2026/`. */
  slug: string;
  status: PublicationStatus;

  // First screen — mandatory block.
  title: Localized<string>;
  subtitle: Localized<string>;
  startDate: IsoDate;
  endDate: IsoDate;
  place: Localized<string>;
  /** 3–10 photos. The last slide is usually the map. */
  gallery: StoredImage[];
  /** Index into `gallery`; that photo is the cover on cards and in previews. */
  coverIndex: number;

  // Status and seats — mandatory block.
  bookingStatus: BookingStatus;
  totalSeats: number;
  seatsLeft: number;
  /**
   * "Going" defaults to `totalSeats - seatsLeft`; §6.3 lets the owner correct
   * it by hand, and this field holds that correction.
   */
  goingOverride?: number;

  // Flags.
  kidFriendly: boolean;
  kidAgeFrom?: number;
  kidAgeTo?: number;
  /** Off hides just this trip from its tab's "Past trips" block (§6.2). */
  showInPast: boolean;

  // Optional blocks — absent means the block is not rendered.
  price?: PriceBlock;
  placeDetails?: PlaceBlock;
  audience?: AudienceBlock;
  whatYouGet?: CardsBlock;
  howToPrepare?: CardsBlock;
  program?: ProgramBlock;
  route?: RouteBlock;
  map?: MapBlock;
  media?: MediaBlock;
  /** Ids into the people directory, in display order. */
  crewPersonIds: string[];
  rules?: RulesBlock;
  faq: FaqItem[];

  social: SocialPreview;

  /**
   * The person this trip is opened to besides the owner (ТЗ v4, §2.3).
   *
   * An email rather than an account id, because the organizer has no account
   * when the owner approves their idea — they create one afterwards, and the
   * verified address in their sign-in token is what matches them to this
   * field. Plan item 2.6 is where `firestore.rules` starts enforcing it.
   */
  organizerEmail?: string;
  /** Who is shown as the organizer on the page, from the people directory. */
  organizerPersonId?: string;
  /** The idea this trip grew out of, so the queue knows it is dealt with. */
  suggestionId?: string;
  /**
   * When the organizer was told the panel exists (С-12).
   *
   * Written by the Worker that sends that letter, never by the form. The
   * owner opening a trip weeks later has no other way of knowing whether the
   * person was ever written to, and "did I send it?" is exactly the question
   * that gets a second copy sent.
   */
  organizerInvitedAt?: IsoDateTime;

  /** Set once the announcement went out; a resend needs its own confirmation. */
  announcementSentAt?: IsoDateTime;
  /**
   * What the trip was before it went to the archive.
   *
   * А-10 wants Archive and Restore to be one action each. Without this,
   * returning an archived trip could only ever produce a draft, and the owner
   * would have to publish it again — two steps where the spec promises one.
   */
  statusBeforeArchive?: Exclude<PublicationStatus, "archived">;

  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  publishedAt?: IsoDateTime;
}

/**
 * How many people pressed "I'm interested" on one trip (§6.3).
 *
 * A record of its own, outside the trip, because it is the one number on the
 * page that changes without anybody opening the panel. The site is printed
 * ahead of time, so a number written into the trip would be as old as the
 * last build; this one is printed too, and then read again in the browser.
 *
 * "Going" is not here and does not need to be. It is seats taken, or the
 * owner's correction of that — both edited in the panel, which rebuilds the
 * site, so the page can never show a going count older than itself. Keeping
 * a second copy of it here would only create a copy that can disagree.
 *
 * The faces beside the numbers are not here either: they come from the
 * trip's crew in the people directory, which the page already has.
 */
export interface TripCounters {
  tripId: string;
  interested: number;
  updatedAt: IsoDateTime;
}

/* -------------------------------------------------------------------------
   Suggest an Adventure — the idea queue (ТЗ v4, §3)
   ------------------------------------------------------------------------- */

/** Where an idea stands. §5 of the Functional Specification fixes this list. */
export type SuggestionStatus =
  | "new"
  | "underReview"
  | "needsInfo"
  | "approved"
  | "published"
  | "declined";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "allLevels";

/**
 * A trip somebody proposed.
 *
 * Almost every field is optional and almost every one is free text. That is
 * the point of the form: at the idea stage nobody knows the dates, and a
 * required field is a reason not to send it at all. Only the title, the
 * category, the description, a name and an email are insisted on, because
 * without them there is nothing to judge and nobody to answer.
 *
 * Nothing here is localized. The author writes in one language, theirs, and
 * translating their words into a second column would be inventing them.
 */
export interface AdventureSuggestion {
  id: string;
  status: SuggestionStatus;
  /** The direction it belongs to. */
  interestId: string;
  /** The author's own category, when the chosen direction asks for one. */
  categoryOther?: string;

  title: string;
  description: string;
  place?: string;
  /** "Late spring", "September-ish" — a time of year, not a date. */
  when?: string;
  budget?: string;
  groupSize?: string;
  experienceLevel?: ExperienceLevel;

  name: string;
  email: string;
  /** Instagram, Facebook, LinkedIn — the owner looks at who he lets in. */
  links: string[];
  experience?: string;
  audience?: string;
  /** Links, never uploads: see ТЗ v4 §3.2. */
  photoLinks: string[];

  /** Which language version of the site the form was filled in on. */
  locale: Locale;
  /** The page the form was opened from. */
  source?: string;

  /** The owner's note to himself. The author never sees it. */
  adminNote?: string;
  /** The trip made from this idea, so a second press cannot make another. */
  tripId?: string;

  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/* -------------------------------------------------------------------------
   People who write in (§7.5, §7.6, §8)
   ------------------------------------------------------------------------- */

export interface Subscriber {
  id: string;
  email: string;
  /** Ids of the interests this person wants to hear about. */
  interestIds: string[];
  locale: Locale;
  /** Where the visit came from, e.g. a Facebook ad (§7.5). */
  source?: string;
  /** True when the subscription came from the "I'm interested" button. */
  viaInterested: boolean;
  unsubscribed: boolean;
  /**
   * Long random key used by the unsubscribe link, so the address cannot be
   * guessed from someone else's email.
   */
  manageKey: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** One press of "I'm interested", kept for the counter and for the history. */
export interface InterestedRecord {
  id: string;
  tripId: string;
  email: string;
  createdAt: IsoDateTime;
}

/** What the owner decided about an application (ТЗ v4, §12). */
export type ApplicationStatus = "new" | "accepted" | "declined";

/**
 * Somebody asking to come on a trip.
 *
 * ТЗ v4 §2.2 makes this the whole of the "Member" role: no account, no
 * password, just the form. Which is why it holds more than a contact — the
 * reason the owner wanted the role at all was "to see who I am travelling
 * with", so the social link and what they wrote about themselves are the
 * point of the record rather than extras on it (С-06).
 *
 * The fields are the ones a member profile would have, so that accounts, if
 * they ever arrive, can be matched to these by email instead of asking
 * everybody to type it all again.
 */
export interface TripApplication {
  id: string;
  tripId: string;
  /**
   * The organizer's address, copied off the trip when the application
   * arrives.
   *
   * Duplicated rather than looked up, and `firestore.rules` is the reason:
   * a list query may only run a handful of document lookups in total, so a
   * rule that fetched the trip for every application would break the moment
   * a trip had more than twenty of them. Copied, the rule is one string
   * comparison and the query stays cheap however long the list grows.
   */
  organizerEmail?: string;
  name: string;
  email: string;
  /** Where they live — §9 asks, because a flight is part of the plan. */
  city?: string;
  /** Instagram, Facebook, LinkedIn — whatever they chose to show. */
  links: string[];
  /** Why this trip. */
  why?: string;
  /** Values and experience — what kind of traveller they are. */
  about?: string;
  /** What they bring to the group. */
  bring?: string;
  /** Only asked on a kid-friendly trip, and only shown there. */
  kids?: string;
  /** Phone, WhatsApp or Telegram — one free-text field, as §9 specifies. */
  contact?: string;
  locale: Locale;
  /** Where the visit came from (§7.5). */
  source?: string;
  status: ApplicationStatus;
  /** Read and dealt with, whatever was decided. */
  handled: boolean;
  /** The owner's own note, invisible to the applicant. */
  adminNote?: string;
  createdAt: IsoDateTime;
  updatedAt?: IsoDateTime;
}

export type SolutionsProjectType = "website" | "webApp" | "mobileApp" | "other";

export interface SolutionsInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: SolutionsProjectType;
  message: string;
  handled: boolean;
  createdAt: IsoDateTime;
}

/* -------------------------------------------------------------------------
   Solutions and settings (§6.6, §7.7)
   ------------------------------------------------------------------------- */

export interface WorkProject {
  id: string;
  title: Localized<string>;
  description: Localized<string>;
  url: string;
  screenshot?: StoredImage;
  order: number;
}

export interface Settings {
  /**
   * The first screen of the home page (ТЗ v4, §4.2).
   *
   * Six short strings, and they are in the settings for one reason: they are
   * the sentence the owner cares most about on the whole site — "A community,
   * not a business" is his line — and asking a developer to change six words
   * is exactly what §7.7 exists to avoid.
   *
   * An empty value means "whatever the site says now": the renderer falls
   * back to the text in the code, per language. That is what keeps a
   * half-filled settings document from wiping a finished page.
   */
  home: {
    communityA: Localized<string>;
    communityB: Localized<string>;
    free: Localized<string>;
    noFees: Localized<string>;
    titleA: Localized<string>;
    titleB: Localized<string>;
  };
  /**
   * The top and the bottom of the About page.
   *
   * Not the whole of it. The middle is the Community Concept (ТЗ v4, §5) —
   * nine sections of a manifesto that is agreed as a document rather than
   * edited as copy, and a form with sixty nested fields is a form nobody
   * opens. What the owner would actually rewrite is how the page opens and
   * how it signs off, and that is what is here. Empty falls back to the code.
   */
  about: {
    heroEyebrow: Localized<string>;
    heroTitle: Localized<string>;
    heroParagraphs: Localized<string[]>;
    closingTitle: Localized<string>;
    closingParagraphs: Localized<string[]>;
    closingSign: Localized<string>;
  };
  /** The Story page (§6.5). */
  story: {
    title: Localized<string>;
    text: Localized<string>;
    photo?: StoredImage;
    youtubeChannelId?: string;
    socialLinks: { label: string; url: string }[];
  };
  /** Free-form headings and copy of the Solutions page (§6.6). */
  solutions: {
    heroTitle: Localized<string>;
    heroSubtitle: Localized<string>;
    services: TitledCard[];
    process: Localized<string>[];
  };
  /**
   * Where /solutions/ books a consultation (ТЗ v4, §7).
   *
   * A setting rather than a constant so the client can point it at another
   * calendar without a developer — which is the only reason it is not simply
   * written into the page.
   */
  calendlyUrl: string;
  /** Below these numbers the counters stay hidden (§6.3). */
  counterThresholds: { going: number; interested: number };
  /**
   * The sender's physical address every email must carry under CAN-SPAM
   * (§8.2). Announcements stay blocked while it is empty.
   */
  postalAddress: string;
  updatedAt: IsoDateTime;
}

/** Everything the public side of the site needs from one build-time read. */
export interface SiteContent {
  interests: Interest[];
  trips: Trip[];
  people: Person[];
  projects: WorkProject[];
  /** What the counters said when the site was printed; the browser re-reads them. */
  counters: TripCounters[];
  settings: Settings | null;
}
