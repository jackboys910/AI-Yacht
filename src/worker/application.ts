import {
  buildApplicationOwnerEmail,
  buildApplicationReceiptEmail,
  type ApplicationEmailData,
} from "../lib/email/application";
import { ownerCopies, readEmailJs, sendEmail } from "./emailjs";
import { createDocument, getDocument } from "./firestore";
import { readServiceAccount } from "./google-auth";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

/**
 * `/api/application` — "Join this trip" (ТЗ v4 §12, С-06).
 *
 * The collection it writes to is the most private one on the site: a name,
 * an address, where somebody lives and a page of writing about themselves,
 * for every person who ever asked to come. No browser may read or write it,
 * which means the write happens here, through a service account.
 *
 * Two checks make the difference between a form and a funnel for nonsense.
 * Turnstile, which needs a secret and therefore a server. And the trip: the
 * id arrives from the page, so it is checked against the database and
 * refused unless it names a trip that is actually published — otherwise a
 * guessed id would attach a stranger's details to a draft nobody has seen.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

/** Only a document id. A slash would walk out of `trips/` into anything. */
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

const LIMITS = {
  name: 160,
  email: 320,
  city: 160,
  contact: 200,
  why: 3000,
  about: 3000,
  bring: 3000,
  kids: 300,
  link: 500,
  source: 300,
} as const;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function readLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clip(item, LIMITS.link))
    .filter((item) => /^https?:\/\/\S+$/i.test(item))
    .slice(0, 5);
}

interface Submission {
  tripId: string;
  name: string;
  email: string;
  city?: string;
  contact?: string;
  links: string[];
  why: string;
  about?: string;
  bring?: string;
  kids?: string;
  locale: "en" | "ru";
  source?: string;
}

/** The body, or the name of the first thing wrong with it. */
function read(raw: unknown): Submission | string {
  if (typeof raw !== "object" || raw === null) return "body";
  const body = raw as Record<string, unknown>;

  const tripId = clip(body.tripId, 160);
  const name = clip(body.name, LIMITS.name);
  const email = clip(body.email, LIMITS.email).toLowerCase();
  const why = clip(body.why, LIMITS.why);

  if (!ID.test(tripId)) return "tripId";
  if (!name) return "name";
  if (!looksLikeEmail(email)) return "email";
  if (!why) return "why";

  return {
    tripId,
    name,
    email,
    city: clip(body.city, LIMITS.city) || undefined,
    contact: clip(body.contact, LIMITS.contact) || undefined,
    links: readLinks(body.links),
    why,
    about: clip(body.about, LIMITS.about) || undefined,
    bring: clip(body.bring, LIMITS.bring) || undefined,
    kids: clip(body.kids, LIMITS.kids) || undefined,
    locale: body.locale === "ru" ? "ru" : "en",
    source: clip(body.source, LIMITS.source) || undefined,
  };
}

/** One half of a bilingual field, falling back to whichever half exists. */
function localized(value: unknown, locale: "en" | "ru"): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const map = value as Record<string, unknown>;
  for (const key of locale === "ru" ? ["ru", "en"] : ["en", "ru"]) {
    const half = map[key];
    if (typeof half === "string" && half.trim()) return half.trim();
  }
  return "";
}

export async function application(request: Request, env: Env): Promise<Response> {
  const account = readServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  if (!account) return json({ error: "not-configured" }, 503);

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-request", field: "body" }, 400);
  }

  const parsed = read(body);
  if (typeof parsed === "string") {
    return json({ error: "bad-request", field: parsed }, 400);
  }

  let checked = false;
  if (env.TURNSTILE_SECRET) {
    const token = clip((body as Record<string, unknown>).turnstileToken, 4000);
    const outcome = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      token,
      request.headers.get("cf-connecting-ip"),
    );
    if (!outcome.ok) {
      console.log(`turnstile refused an application: ${outcome.codes.join(", ") || "no codes"}`);
      return json({ error: "turnstile" }, 400);
    }
    checked = true;
  }

  const trip = await getDocument(account, projectId, `trips/${parsed.tripId}`);
  // Published is the test, not merely existing. A draft has no page, so
  // nobody can have applied to it from one.
  if (!trip || trip.status !== "published") {
    return json({ error: "bad-request", field: "tripId" }, 400);
  }

  const organizerEmail =
    typeof trip.organizerEmail === "string" ? trip.organizerEmail.toLowerCase() : "";

  const now = new Date().toISOString();
  const id = await createDocument(account, projectId, "applications", {
    tripId: parsed.tripId,
    // Copied so that `firestore.rules` can let the organizer list these
    // without a document lookup per application. See the rules for why that
    // matters at twenty applicants.
    organizerEmail: organizerEmail || undefined,
    name: parsed.name,
    email: parsed.email,
    city: parsed.city,
    contact: parsed.contact,
    links: parsed.links,
    why: parsed.why,
    about: parsed.about,
    bring: parsed.bring,
    kids: parsed.kids,
    locale: parsed.locale,
    source: parsed.source,
    status: "new",
    handled: false,
    createdAt: now,
    updatedAt: now,
  });

  // The application is safe from here on. Everything below is a courtesy,
  // and a courtesy that fails must not be reported as the application
  // failing — it would be sent again, and read twice.
  const mail = readEmailJs(env);
  let letters = 0;

  if (mail) {
    const data: ApplicationEmailData = {
      ...parsed,
      tripTitle: localized(trip.title, parsed.locale) || parsed.tripId,
      tripDates: [trip.startDate, trip.endDate]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" — "),
    };

    // The deciding letter is in English whatever language the form was in,
    // so the trip is named in English too — the Russian title in an English
    // letter would be the one line its reader has to translate.
    const deciding = { ...data, tripTitle: localized(trip.title, "en") || data.tripTitle };

    const owner = buildApplicationOwnerEmail(deciding);
    const letterList: [string, typeof owner][] = [
      // The owner and whoever watches the owner's mail; the applicant's own
      // receipt below is not copied to anybody.
      ...ownerCopies(mail).map((to) => [to, owner] as [string, typeof owner]),
      // The person running the trip decides who comes on it, so they are
      // told as directly as the owner is rather than having to notice a new
      // row in the panel.
      ...(organizerEmail
        ? ([[organizerEmail, buildApplicationOwnerEmail(deciding, true)]] as [
            string,
            typeof owner,
          ][])
        : []),
      [parsed.email, buildApplicationReceiptEmail(data)],
    ];

    for (const [to, letter] of letterList) {
      try {
        await sendEmail(mail, to, letter);
        letters += 1;
      } catch (error) {
        console.log(`application ${id}: email to ${to} failed — ${String(error)}`);
      }
    }
  }

  return json({ ok: true, id, checked, letters });
}
