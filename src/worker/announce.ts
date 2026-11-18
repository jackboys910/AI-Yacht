import { buildAnnouncementEmail } from "../lib/email/announcement";
import { manageUrl, unsubscribeUrl } from "../lib/email/manage";
import { siteConfig } from "../lib/site";
import { readEmailJs, sendEmail } from "./emailjs";
import {
  decodeFields,
  getDocument,
  patchDocument,
  queryDocuments,
} from "./firestore";
import { readServiceAccount, type ServiceAccount } from "./google-auth";
import { bearerOf, isOwner } from "./owner";
import type { Env } from "./env";

/**
 * `/api/announce` — "Send to subscribers" (Н-07, Н-08, §8.2).
 *
 * The only endpoint here that writes to strangers in bulk, so most of this
 * file is about not doing that twice and not doing it unlawfully.
 *
 * **Who gets it.** Only subscribers of the direction this trip belongs to,
 * each in the language they subscribed in. Н-07 is tested with two
 * subscribers on different directions, and that is the whole point of the
 * list being per-direction rather than one pile.
 *
 * **Once.** Every address that has been written to is recorded as it is
 * written to, so a second press resumes rather than repeats, and a finished
 * mailing refuses to start again without `confirm` (Н-08).
 *
 * **In batches.** A Worker request may make a limited number of outgoing
 * requests, and EmailJS rejects a burst, so one call sends a handful and
 * says what is left. The panel calls again until nothing is. Closing the tab
 * therefore stops the mailing — it does not break it: the progress is in the
 * database, and reopening the trip offers to carry on from where it stopped.
 *
 * **Lawfully.** CAN-SPAM wants the sender's postal address in every mailing
 * (§8.2). It lives in the settings, and while it is empty this endpoint
 * refuses to send at all rather than send something that breaks the law.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

/**
 * How many letters one call sends.
 *
 * Bounded by the Worker's outgoing-request budget rather than by taste: each
 * letter is a send plus a write recording it, and the token and the reads
 * come on top. Twelve leaves room to spare.
 */
const BATCH = 12;

/** A pause between letters, so a mailing does not arrive as a burst. */
const PAUSE_MS = 150;

/** EmailJS Personal, shared with ctmass.com (§8.2). */
const MONTHLY_LIMIT = 2000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Subscriber {
  id: string;
  email: string;
  locale: "en" | "ru";
  manageKey: string;
}

interface Progress {
  sent: string[];
  failed: string[];
  startedAt?: string;
  finishedAt?: string;
}

function readProgress(data: Record<string, unknown> | null): Progress {
  const list = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((one): one is string => typeof one === "string") : [];
  return {
    sent: list(data?.sent),
    failed: list(data?.failed),
    startedAt: typeof data?.startedAt === "string" ? data.startedAt : undefined,
    finishedAt: typeof data?.finishedAt === "string" ? data.finishedAt : undefined,
  };
}

/** The name of a direction, by the rule the site's header uses. */
function labelOf(fields: Record<string, unknown>, locale: "en" | "ru"): string {
  const name = (fields.name ?? {}) as Record<string, unknown>;
  const wanted = typeof name[locale] === "string" ? (name[locale] as string).trim() : "";
  const en = typeof name.en === "string" ? name.en.trim() : "";
  const ru = typeof name.ru === "string" ? name.ru.trim() : "";
  const slug = typeof fields.slug === "string" ? fields.slug : "";
  return wanted || en || ru || slug;
}

function localized(value: unknown, locale: "en" | "ru"): string {
  const map = (value ?? {}) as Record<string, unknown>;
  const wanted = typeof map[locale] === "string" ? (map[locale] as string).trim() : "";
  const en = typeof map.en === "string" ? map.en.trim() : "";
  const ru = typeof map.ru === "string" ? map.ru.trim() : "";
  return wanted || en || ru;
}

/**
 * The dates, written the way the site writes them.
 *
 * Repeated here rather than imported from `lib/content/trip-view`, which
 * pulls in the whole trip model for one function — and the Worker bundle is
 * sent to the edge on every deploy.
 */
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
} as const;

function dateRange(start: string, end: string, locale: "en" | "ru"): string {
  const from = start.split("-").map(Number);
  const to = end.split("-").map(Number);
  if (from.length !== 3 || to.length !== 3 || from.some(Number.isNaN) || to.some(Number.isNaN)) {
    return "";
  }
  const month = (index: number) => MONTHS[locale][index - 1] ?? "";

  if (locale === "ru") {
    if (from[0] === to[0] && from[1] === to[1]) {
      return `${from[2]}–${to[2]} ${month(from[1])} ${from[0]}`;
    }
    if (from[0] === to[0]) {
      return `${from[2]} ${month(from[1])} – ${to[2]} ${month(to[1])} ${from[0]}`;
    }
    return `${from[2]} ${month(from[1])} ${from[0]} – ${to[2]} ${month(to[1])} ${to[0]}`;
  }
  if (from[0] === to[0] && from[1] === to[1]) {
    return `${month(from[1])} ${from[2]}–${to[2]}, ${from[0]}`;
  }
  if (from[0] === to[0]) {
    return `${month(from[1])} ${from[2]} – ${month(to[1])} ${to[2]}, ${from[0]}`;
  }
  return `${month(from[1])} ${from[2]}, ${from[0]} – ${month(to[1])} ${to[2]}, ${to[0]}`;
}

function coverOf(trip: Record<string, unknown>): string | undefined {
  const gallery = Array.isArray(trip.gallery) ? trip.gallery : [];
  const index = typeof trip.coverIndex === "number" ? trip.coverIndex : 0;
  const photo = (gallery[index] ?? gallery[0]) as Record<string, unknown> | undefined;
  const url = photo?.url;
  return typeof url === "string" && url.length > 0 ? url : undefined;
}

interface Ready {
  trip: Record<string, unknown>;
  interest: Record<string, unknown>;
  interestSlug: string;
  postalAddress: string;
  subscribers: Subscriber[];
  progress: Progress;
}

/** Everything both halves of this endpoint need, read once. */
async function gather(
  account: ServiceAccount,
  projectId: string,
  tripId: string,
): Promise<Ready | { error: string; status: number }> {
  const trip = await getDocument(account, projectId, `trips/${tripId}`);
  if (!trip) return { error: "no-trip", status: 404 };
  if (trip.status !== "published") return { error: "not-published", status: 409 };

  const interestId = typeof trip.interestId === "string" ? trip.interestId : "";
  const interest = interestId
    ? await getDocument(account, projectId, `interests/${interestId}`)
    : null;
  if (!interest) return { error: "no-interest", status: 409 };

  const settings = await getDocument(account, projectId, "settings/site");
  const postalAddress =
    typeof settings?.postalAddress === "string" ? settings.postalAddress.trim() : "";

  // Only the direction is filtered on. Adding `unsubscribed == false` to the
  // query would pair an array-contains with an equality, which Firestore
  // serves only from a composite index somebody has to remember to create —
  // and the list is small enough to sieve here.
  const rows = await queryDocuments(account, projectId, {
    from: [{ collectionId: "subscribers" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "interestIds" },
        op: "ARRAY_CONTAINS",
        value: { stringValue: interestId },
      },
    },
    limit: 5000,
  });

  const subscribers: Subscriber[] = [];
  for (const row of rows) {
    const fields = decodeFields(row.fields);
    if (fields.unsubscribed === true) continue;
    const email = typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
    if (!email) continue;
    subscribers.push({
      id: row.id,
      email,
      locale: fields.locale === "ru" ? "ru" : "en",
      manageKey: typeof fields.manageKey === "string" ? fields.manageKey : "",
    });
  }

  const progress = readProgress(await getDocument(account, projectId, `announcements/${tripId}`));

  return {
    trip,
    interest,
    interestSlug: typeof interest.slug === "string" ? interest.slug : "",
    postalAddress,
    subscribers,
    progress,
  };
}

function letterFor(
  ready: Ready,
  subscriber: Pick<Subscriber, "locale" | "manageKey">,
  ownerEmail?: string,
) {
  const { trip, interest, interestSlug, postalAddress } = ready;
  const locale = subscriber.locale;
  const slug = typeof trip.slug === "string" ? trip.slug : "";
  const path = `/${interestSlug}/${slug}/`;

  return buildAnnouncementEmail({
    tripTitle: localized(trip.title, locale),
    subtitle: localized(trip.subtitle, locale),
    dates: dateRange(String(trip.startDate ?? ""), String(trip.endDate ?? ""), locale),
    place: localized(trip.place, locale),
    tripUrl: `${siteConfig.url}${locale === "ru" ? "/ru" : ""}${path}`,
    coverUrl: coverOf(trip),
    direction: labelOf(interest, locale),
    locale,
    postalAddress,
    unsubscribeUrl: unsubscribeUrl(subscriber.manageKey, locale),
    manageUrl: manageUrl(subscriber.manageKey, locale),
    ownerEmail,
  });
}

/** What the panel shows before anybody presses anything. */
function state(ready: Ready) {
  const sent = new Set(ready.progress.sent);
  const left = ready.subscribers.filter((one) => !sent.has(one.email));
  return {
    recipients: ready.subscribers.length,
    sentCount: ready.progress.sent.length,
    failed: ready.progress.failed,
    remaining: left.length,
    byLocale: {
      en: ready.subscribers.filter((one) => one.locale === "en").length,
      ru: ready.subscribers.filter((one) => one.locale === "ru").length,
    },
    finishedAt: ready.progress.finishedAt,
    startedAt: ready.progress.startedAt,
    postalAddress: ready.postalAddress.length > 0,
    limit: MONTHLY_LIMIT,
  };
}

export async function announce(request: Request, env: Env): Promise<Response> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;

  // The owner and nobody else. An organizer may not write to a mailing list
  // (С-11 keeps publishing away from them, and this is louder than publishing).
  const idToken = bearerOf(request);
  if (!idToken || !(await isOwner(idToken, projectId))) {
    return json({ error: "unauthorized" }, 401);
  }

  const account = readServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  if (!account) return json({ error: "not-configured" }, 503);

  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  let tripId = url.searchParams.get("tripId") ?? "";
  let confirm = false;

  if (method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    tripId = typeof body.tripId === "string" ? body.tripId : tripId;
    confirm = body.confirm === true;
  }

  if (!/^[A-Za-z0-9_-]{1,200}$/.test(tripId)) {
    return json({ error: "bad-request", field: "tripId" }, 400);
  }

  const ready = await gather(account, projectId, tripId);
  if ("error" in ready) return json({ error: ready.error }, ready.status);

  if (method === "GET") {
    // The preview is the letter itself, built for a subscriber who does not
    // exist — the owner should be looking at what will arrive, not at an
    // impression of it.
    const sample = { locale: "en" as const, manageKey: "preview" };
    return json({
      ...state(ready),
      preview: {
        en: letterFor(ready, sample).html,
        ru: letterFor(ready, { ...sample, locale: "ru" }).html,
        subject: letterFor(ready, sample).subject,
      },
    });
  }

  const mail = readEmailJs(env);
  if (!mail) return json({ error: "no-emailjs", ...state(ready) }, 503);
  if (!ready.postalAddress) return json({ error: "no-postal-address", ...state(ready) }, 409);

  const sent = new Set(ready.progress.sent);
  const left = ready.subscribers.filter((one) => !sent.has(one.email));

  // Н-08: a mailing that has already gone out in full does not go out again
  // by accident.
  if (left.length === 0) {
    if (!confirm) {
      return json({ needsConfirmation: true, ...state(ready) });
    }
    // Starting over, on purpose: the record of who has been written to is
    // cleared, and the next call sends to everybody again.
    await patchDocument(account, projectId, `announcements/${tripId}`, {
      sent: [],
      failed: [],
      startedAt: new Date().toISOString(),
      finishedAt: null,
    });
    const fresh = { ...ready, progress: { sent: [], failed: [] } };
    return json({ restarted: true, ...state(fresh) });
  }

  const startedAt = ready.progress.startedAt ?? new Date().toISOString();
  const failed = [...ready.progress.failed];
  const batch = left.slice(0, BATCH);
  let delivered = 0;

  for (const subscriber of batch) {
    try {
      await sendEmail(mail, subscriber.email, letterFor(ready, subscriber, mail.owner));
      sent.add(subscriber.email);
      delivered += 1;
    } catch (error) {
      // Recorded as written-to anyway. A send that failed and is retried on
      // the next press can just as easily have arrived, and a duplicate
      // announcement is worse than a missing one — the failures are listed
      // so the owner can decide.
      sent.add(subscriber.email);
      if (!failed.includes(subscriber.email)) failed.push(subscriber.email);
      console.log(`announcement to ${subscriber.email} failed — ${String(error)}`);
    }

    // Written after every letter, not after the batch: a Worker that dies
    // mid-batch must not forget who it has already written to.
    await patchDocument(account, projectId, `announcements/${tripId}`, {
      tripId,
      sent: [...sent],
      failed,
      startedAt,
      lastAt: new Date().toISOString(),
    });

    if (subscriber !== batch[batch.length - 1]) await wait(PAUSE_MS);
  }

  const remaining = left.length - batch.length;

  if (remaining === 0) {
    const finishedAt = new Date().toISOString();
    await patchDocument(account, projectId, `announcements/${tripId}`, { finishedAt });
    // On the trip itself, where the list screen and the form can see it
    // without reading a second collection.
    await patchDocument(account, projectId, `trips/${tripId}`, {
      announcementSentAt: finishedAt,
    });
  }

  const after = {
    ...ready,
    progress: {
      sent: [...sent],
      failed,
      startedAt,
      finishedAt: remaining === 0 ? new Date().toISOString() : undefined,
    },
  };

  return json({ ok: true, delivered, ...state(after) });
}
