import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore/lite";
import { locales, type Locale } from "@/i18n/config";
import type {
  Interest,
  Localized,
  Person,
  Settings,
  SiteContent,
  Trip,
  WorkProject,
} from "@/lib/content/types";
import { firestore } from "./app";
import { SETTINGS_DOC_ID, collections, isFirebaseConfigured } from "./config";

/**
 * Everything the public side of the site needs, read once per build.
 *
 * `next build` runs this, prints the HTML, and the result sits on Cloudflare
 * until the next build — which is what §3.1 of the plan trades a few minutes
 * of publish latency for.
 *
 * Two failure modes, deliberately treated differently:
 *
 *  - No project configured at all: return an empty site and say so. That is a
 *    developer working without Firebase, and the build should still finish.
 *  - A project configured but unreachable: throw. Swallowing that would ship an
 *    empty nazarov.net over a working one, which is far worse than a red build.
 *
 * An empty database is neither of those — it is a legitimately empty site.
 */
export async function getSiteContent(): Promise<SiteContent> {
  if (!isFirebaseConfigured) {
    console.warn(
      "[content] Firebase is not configured — building the site with no trips.",
    );
    return emptyContent();
  }

  const db = firestore();

  try {
    const [interests, trips, people, projects, settings] = await Promise.all([
      readAll(db, collections.interests, toInterest),
      readPublishedTrips(db),
      readAll(db, collections.people, toPerson),
      readAll(db, collections.projects, toWorkProject),
      readSettings(db),
    ]);

    return { interests, trips, people, projects, settings };
  } catch (cause) {
    throw new Error(
      "[content] Could not read the site content from Firestore. Refusing to " +
        "build an empty site over a working one.",
      { cause },
    );
  }
}

function emptyContent(): SiteContent {
  return { interests: [], trips: [], people: [], projects: [], settings: null };
}

type Db = ReturnType<typeof firestore>;

async function readAll<T>(
  db: Db,
  name: string,
  map: (id: string, data: DocumentData) => T,
): Promise<T[]> {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => map(d.id, d.data()));
}

/**
 * Only published trips. The filter is not an optimisation: `firestore.rules`
 * refuses an anonymous read of anything else, so a query without it would fail
 * outright — which is exactly the guarantee П-09 asks for.
 */
async function readPublishedTrips(db: Db): Promise<Trip[]> {
  const snapshot = await getDocs(
    query(collection(db, collections.trips), where("status", "==", "published")),
  );
  return snapshot.docs.map((d) => toTrip(d.id, d.data()));
}

async function readSettings(db: Db): Promise<Settings | null> {
  const snapshot = await getDoc(doc(db, collections.settings, SETTINGS_DOC_ID));
  return snapshot.exists() ? toSettings(snapshot.data()) : null;
}

/* -------------------------------------------------------------------------
   Turning documents into the types in src/lib/content/types.ts.

   Firestore has no schema, so a document written by an older version of the
   admin panel can be missing a field the renderer expects. Every reader below
   fills such a gap with an empty value rather than letting `undefined` reach a
   component — an unfilled block is simply not rendered (§6.3), and that is the
   same outcome the owner would see for a block they never touched.
   ------------------------------------------------------------------------- */

function text(value: unknown): Localized<string> {
  const source = (value ?? {}) as Partial<Record<Locale, unknown>>;
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      typeof source[locale] === "string" ? (source[locale] as string) : "",
    ]),
  ) as Localized<string>;
}

function textList(value: unknown): Localized<string[]> {
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

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toInterest(id: string, data: DocumentData): Interest {
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

function toTrip(id: string, data: DocumentData): Trip {
  return {
    id,
    interestId: str(data.interestId),
    slug: str(data.slug, id),
    status: data.status === "draft" || data.status === "archived" ? data.status : "published",

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
    goingOverride: typeof data.goingOverride === "number" ? data.goingOverride : undefined,

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
          latitude: typeof data.map.latitude === "number" ? data.map.latitude : undefined,
          longitude: typeof data.map.longitude === "number" ? data.map.longitude : undefined,
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

function toPerson(id: string, data: DocumentData): Person {
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

function toWorkProject(id: string, data: DocumentData): WorkProject {
  return {
    id,
    title: text(data.title),
    description: text(data.description),
    url: str(data.url),
    screenshot: data.screenshot ?? undefined,
    order: num(data.order),
  };
}

function toSettings(data: DocumentData): Settings {
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
