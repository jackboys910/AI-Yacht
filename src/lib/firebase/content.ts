import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
} from "firebase/firestore/lite";
import type { Settings, SiteContent, Trip } from "@/lib/content/types";
import { firestore } from "./app";
import { SETTINGS_DOC_ID, collections, isFirebaseConfigured } from "./config";
import {
  toInterest,
  toPerson,
  toSettings,
  toTrip,
  toWorkProject,
} from "./mappers";

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
/**
 * One read per build, not one per page file.
 *
 * Several route files ask for the content — the trip pages in each language,
 * their `generateStaticParams`, their metadata — and without this the build
 * would walk the whole database once for each. Only in a production build:
 * caching in `next dev` would mean restarting the server to see a change the
 * admin panel just made.
 */
let cached: Promise<SiteContent> | null = null;

export function getSiteContent(): Promise<SiteContent> {
  if (process.env.NODE_ENV !== "production") return readSiteContent();
  cached ??= readSiteContent();
  return cached;
}

async function readSiteContent(): Promise<SiteContent> {
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
