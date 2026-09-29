import type { DocumentData } from "firebase/firestore/lite";
import { locales, type Locale } from "@/i18n/config";
import type {
  Interest,
  Localized,
  Person,
  Settings,
  Trip,
  WorkProject,
} from "@/lib/content/types";

/**
 * Turning Firestore documents into the types in src/lib/content/types.ts.
 *
 * Shared by the build-time reader and the admin panel so a field is understood
 * the same way in both; a mismatch there would show the owner one thing in the
 * form and print another on the site.
 *
 * Firestore has no schema, so a document written by an older version of the
 * admin panel can be missing a field the renderer expects. Every reader here
 * fills such a gap with an empty value rather than letting `undefined` reach a
 * component — an unfilled block is simply not rendered (§6.3), which is the
 * same outcome as a block the owner never touched.
 */

export function text(value: unknown): Localized<string> {
  const source = (value ?? {}) as Partial<Record<Locale, unknown>>;
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      typeof source[locale] === "string" ? (source[locale] as string) : "",
    ]),
  ) as Localized<string>;
}

export function textList(value: unknown): Localized<string[]> {
  const source = (value ?? {}) as Partial<Record<Locale, unknown>>;
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      Array.isArray(source[locale])
        ? (source[locale] as unknown[]).filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    ]),
  ) as Localized<string[]>;
}

export function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function toInterest(id: string, data: DocumentData): Interest {
  return {
    id,
    slug: str(data.slug, id),
    name: text(data.name),
    description: text(data.description),
    tileCaption: text(data.tileCaption),
    cover: data.cover ?? undefined,
    order: num(data.order),
    youtubePlaylistId: data.youtubePlaylistId || undefined,
    // A missing flag shows past trips: hiding content nobody asked to hide
    // would look like data loss to the owner.
    showPastTrips: bool(data.showPastTrips, true),
    hidden: bool(data.hidden),
    collectsKidFriendly: bool(data.collectsKidFriendly),
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

export function toTrip(id: string, data: DocumentData): Trip {
  return {
    id,
    interestId: str(data.interestId),
    slug: str(data.slug, id),
    status:
      data.status === "draft" || data.status === "archived" ? data.status : "published",

    title: text(data.title),
    subtitle: text(data.subtitle),
    startDate: str(data.startDate),
    endDate: str(data.endDate),
    place: text(data.place),
    gallery: list(data.gallery),
    coverIndex: num(data.coverIndex),

    bookingStatus: data.bookingStatus ?? "open",
    totalSeats: num(data.totalSeats),
    seatsLeft: num(data.seatsLeft),
    goingOverride:
      typeof data.goingOverride === "number" ? data.goingOverride : undefined,

    kidFriendly: bool(data.kidFriendly),
    kidAgeFrom: typeof data.kidAgeFrom === "number" ? data.kidAgeFrom : undefined,
    kidAgeTo: typeof data.kidAgeTo === "number" ? data.kidAgeTo : undefined,
    showInPast: bool(data.showInPast, true),

    price: data.price
      ? {
          amount: text(data.price.amount),
          included: textList(data.price.included),
          notIncluded: textList(data.price.notIncluded),
        }
      : undefined,
    placeDetails: data.placeDetails
      ? { paragraphs: textList(data.placeDetails.paragraphs) }
      : undefined,
    audience: data.audience
      ? {
          items: textList(data.audience.items),
          note: data.audience.note ? text(data.audience.note) : undefined,
        }
      : undefined,
    whatYouGet: data.whatYouGet ? cards(data.whatYouGet) : undefined,
    howToPrepare: data.howToPrepare ? cards(data.howToPrepare) : undefined,
    program: data.program
      ? {
          stages: list<DocumentData>(data.program.stages).map((stage) => ({
            duration: text(stage.duration),
            place: text(stage.place),
            text: text(stage.text),
          })),
          note: data.program.note ? text(data.program.note) : undefined,
        }
      : undefined,
    route: data.route
      ? {
          days: list<DocumentData>(data.route.days).map((day, index) => ({
            number: num(day.number, index + 1),
            date: day.date ? text(day.date) : undefined,
            place: text(day.place),
            text: text(day.text),
            photo: day.photo ?? undefined,
          })),
          intro: data.route.intro ? text(data.route.intro) : undefined,
        }
      : undefined,
    map: data.map
      ? {
          images: list(data.map.images),
          caption: data.map.caption ? text(data.map.caption) : undefined,
          latitude:
            typeof data.map.latitude === "number" ? data.map.latitude : undefined,
          longitude:
            typeof data.map.longitude === "number" ? data.map.longitude : undefined,
        }
      : undefined,
    media: data.media
      ? {
          photos: list(data.media.photos),
          youtubeUrls: list<string>(data.media.youtubeUrls),
        }
      : undefined,
    crewPersonIds: list<string>(data.crewPersonIds),
    rules: data.rules
      ? { title: text(data.rules.title), text: text(data.rules.text) }
      : undefined,
    faq: list<DocumentData>(data.faq).map((item) => ({
      question: text(item.question),
      answer: text(item.answer),
    })),

    social: {
      image: data.social?.image ?? undefined,
      title: text(data.social?.title),
      description: text(data.social?.description),
    },
    announcementSentAt: data.announcementSentAt || undefined,

    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
    publishedAt: data.publishedAt || undefined,
  };
}

function cards(data: DocumentData) {
  return {
    cards: list<DocumentData>(data.cards).map((card) => ({
      title: text(card.title),
      text: text(card.text),
    })),
    note: data.note ? text(data.note) : undefined,
  };
}

export function toPerson(id: string, data: DocumentData): Person {
  return {
    id,
    name: text(data.name),
    role: text(data.role),
    bio: text(data.bio),
    photo: data.photo ?? undefined,
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

export function toWorkProject(id: string, data: DocumentData): WorkProject {
  return {
    id,
    title: text(data.title),
    description: text(data.description),
    url: str(data.url),
    screenshot: data.screenshot ?? undefined,
    order: num(data.order),
  };
}

export function toSettings(data: DocumentData): Settings {
  return {
    story: {
      title: text(data.story?.title),
      text: text(data.story?.text),
      photo: data.story?.photo ?? undefined,
      youtubeChannelId: data.story?.youtubeChannelId || undefined,
      socialLinks: list(data.story?.socialLinks),
    },
    solutions: {
      heroTitle: text(data.solutions?.heroTitle),
      heroSubtitle: text(data.solutions?.heroSubtitle),
      services: list<DocumentData>(data.solutions?.services).map((service) => ({
        title: text(service.title),
        text: text(service.text),
      })),
      process: list<DocumentData>(data.solutions?.process).map(text),
    },
    counterThresholds: {
      // §6.3 fixes the launch thresholds: "1 going" puts people off more than
      // showing nothing does.
      going: num(data.counterThresholds?.going, 3),
      interested: num(data.counterThresholds?.interested, 10),
    },
    postalAddress: str(data.postalAddress),
    updatedAt: str(data.updatedAt),
  };
}

/**
 * Firestore rejects a write containing `undefined`, and our types use optional
 * fields for blocks the owner left empty — so an absent block has to be an
 * absent key rather than a key set to nothing.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) out[key] = stripUndefined(item);
    }
    return out as T;
  }
  return value;
}
