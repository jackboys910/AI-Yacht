import { buildOrganizerInviteEmail } from "../lib/email/organizer";
import { readEmailJs, sendEmail } from "./emailjs";
import { patchDocumentAsUser, readDocumentAsUser } from "./firestore";
import { bearerOf, isOwner } from "./owner";
import type { Env } from "./env";

/**
 * `/api/organizer-invite` — the letter that tells an organizer the panel
 * exists (ТЗ v4, С-12).
 *
 * It is in the Worker for one reason: the EmailJS **private** key. A send
 * from the panel would have to carry the public key, and the public key can
 * only address the owner's own mailbox — the template's recipient is fixed in
 * `lib/email/send.ts` precisely so that a key visible in every visitor's
 * browser cannot be used to mail strangers. Sending to the organizer means
 * sending server-side.
 *
 * Who may be written to is decided by the database, not by the request. The
 * caller names a trip; the address comes out of that trip's `organizerEmail`.
 * So even the owner's own token cannot turn this endpoint into a way of
 * mailing an arbitrary address with the site's letterhead on it — the address
 * has to have been written on a trip first.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

/**
 * A document id and nothing else.
 *
 * The id goes into a Firestore path, so a slash in it would walk out of
 * `trips/` and into any collection the owner can read. Firestore's own ids
 * are alphanumeric; this is stricter than Firestore allows and deliberately
 * so.
 */
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

type Locale = "en" | "ru";

/** One half of a bilingual field, falling back to whichever half exists. */
function localized(value: unknown, locale: Locale): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const map = value as Record<string, unknown>;
  const order = locale === "ru" ? ["ru", "en"] : ["en", "ru"];
  for (const key of order) {
    const half = map[key];
    if (typeof half === "string" && half.trim()) return half.trim();
  }
  return "";
}

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function organizerInvite(request: Request, env: Env): Promise<Response> {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;

  const idToken = bearerOf(request);
  if (!idToken || !(await isOwner(idToken, projectId))) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => null)) as {
    tripId?: unknown;
    locale?: unknown;
    name?: unknown;
    /** A second copy, asked for on purpose. */
    resend?: unknown;
  } | null;

  const tripId = typeof body?.tripId === "string" ? body.tripId : "";
  if (!ID.test(tripId)) return json({ error: "bad-trip-id" }, 400);

  const locale: Locale = body?.locale === "ru" ? "ru" : "en";
  const name = text(body?.name, 160);

  const trip = await readDocumentAsUser(idToken, projectId, `trips/${tripId}`);
  if (!trip) return json({ error: "no-trip" }, 404);

  // Lowercased to match `firestore.rules`, which compares this field with the
  // address in the organizer's token — and Firebase lowercases that one.
  const to = text(trip.organizerEmail, 320).toLowerCase();
  if (!to.includes("@")) return json({ error: "no-organizer" }, 400);

  const alreadyAt = text(trip.organizerInvitedAt, 64);
  if (alreadyAt && body?.resend !== true) {
    // Not an error: the owner pressed a button whose work was already done,
    // and the panel turns this into "sent on …" rather than a failure.
    return json({ sent: false, reason: "already-sent", at: alreadyAt, to });
  }

  const config = readEmailJs(env);
  if (!config) return json({ error: "not-configured" }, 503);

  const email = buildOrganizerInviteEmail({
    email: to,
    name,
    tripTitle: localized(trip.title, locale),
    place: localized(trip.place, locale),
    startDate: text(trip.startDate, 40),
    endDate: text(trip.endDate, 40),
    ownerEmail: config.owner,
    locale,
  });

  await sendEmail(config, to, email);

  const at = new Date().toISOString();
  // The stamp is written after the send, not before: a stamp on a letter that
  // never went out is worse than no stamp, because the owner would believe
  // the organizer had been told. A failed write the other way round only
  // costs a repeated letter, which the owner can see is repeated.
  await patchDocumentAsUser(idToken, projectId, `trips/${tripId}`, {
    organizerInvitedAt: at,
  });

  return json({ sent: true, at, to });
}
