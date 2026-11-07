import { buildWelcomeEmail } from "../lib/email/welcome";
import { readEmailJs, sendEmail } from "./emailjs";
import {
  createDocument,
  decodeFields,
  listDocuments,
  patchDocument,
  queryDocuments,
} from "./firestore";
import { readServiceAccount } from "./google-auth";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

/**
 * `/api/subscribe` — the mailing list behind the "+" button (Н-01…Н-06, С-05).
 *
 * Here rather than in the page for the same three reasons as the idea form.
 * `subscribers` is shut to browsers, because a collection of email addresses
 * that any visitor can list is a collection of email addresses that will be
 * listed. The Turnstile token means nothing until something holding the
 * secret has asked Cloudflare about it (Н-12). And the welcome letter goes
 * out with the EmailJS private key, which may never reach a bundle.
 *
 * There is one more reason particular to this endpoint: Н-06, no duplicates.
 * Deciding that in the browser would mean letting the browser read the list
 * to find out whether an address is on it, which is the whole thing we are
 * trying to prevent. So the lookup happens here, and the answer the page gets
 * back is only "you are on the list" either way.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Shaped like an address. Whether it exists is what the letter finds out. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * A key the unsubscribe link travels on (plan item 3.3).
 *
 * Written now, not then: the link has to work for people who subscribed
 * before that page existed, and a key invented later cannot be put into a
 * letter that has already been sent. 256 bits from the platform's own
 * generator — the point is that it cannot be guessed from the address.
 */
function manageKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface Submission {
  email: string;
  interestIds: string[];
  locale: "en" | "ru";
  source?: string;
}

function read(raw: unknown): Submission | string {
  if (typeof raw !== "object" || raw === null) return "body";
  const body = raw as Record<string, unknown>;

  const email = clip(body.email, 320).toLowerCase();
  if (!looksLikeEmail(email)) return "email";

  const ids = Array.isArray(body.interestIds)
    ? [...new Set(body.interestIds.map((id) => clip(id, 200)).filter(Boolean))].slice(0, 30)
    : [];
  if (ids.length === 0) return "interestIds";

  return {
    email,
    interestIds: ids,
    locale: body.locale === "ru" ? "ru" : "en",
    source: clip(body.source, 300) || undefined,
  };
}

/** The tab name, by the same rule the site's header uses. */
function labelOf(fields: Record<string, unknown>): string {
  const name = (fields.name ?? {}) as Record<string, unknown>;
  const en = typeof name.en === "string" ? name.en.trim() : "";
  const ru = typeof name.ru === "string" ? name.ru.trim() : "";
  const slug = typeof fields.slug === "string" ? fields.slug : "";
  return en || ru || slug;
}

export async function subscribe(request: Request, env: Env): Promise<Response> {
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

  // Н-12: a check the visitor never sees unless it fails. Not configured is a
  // deployment that has not finished rather than a refusal, and the answer
  // says which of the two happened so it can be settled by looking.
  let checked = false;
  if (env.TURNSTILE_SECRET) {
    const token = clip((body as Record<string, unknown>).turnstileToken, 4000);
    const outcome = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      token,
      request.headers.get("cf-connecting-ip"),
    );
    if (!outcome.ok) {
      console.log(`turnstile refused a subscription: ${outcome.codes.join(", ") || "no codes"}`);
      return json({ error: "turnstile" }, 400);
    }
    checked = true;
  }

  // The ids are checked against the real directions rather than trusted. An
  // id nobody recognises would sit in the list forever, matching no trip and
  // receiving no announcement, which looks exactly like a subscription that
  // silently does not work.
  const interests = await listDocuments(account, projectId, "interests");
  const known = new Map(
    interests.map((interest) => [interest.id, labelOf(decodeFields(interest.fields))]),
  );
  const interestIds = parsed.interestIds.filter((id) => known.has(id));
  if (interestIds.length === 0) {
    return json({ error: "bad-request", field: "interestIds" }, 400);
  }

  const now = new Date().toISOString();
  const existing = await queryDocuments(account, projectId, {
    from: [{ collectionId: "subscribers" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "email" },
        op: "EQUAL",
        value: { stringValue: parsed.email },
      },
    },
    limit: 1,
  });

  let created = true;
  let changed = true;

  if (existing.length > 0) {
    // Н-06: the same address twice is one subscriber. The directions are
    // added to rather than replaced — somebody subscribing from Snowboarding
    // after Sailing wants both, and the window they used had no way of
    // knowing what they chose the first time.
    created = false;
    const row = existing[0];
    const fields = decodeFields(row.fields);
    const before: string[] = Array.isArray(fields.interestIds)
      ? (fields.interestIds as unknown[]).filter((id): id is string => typeof id === "string")
      : [];
    const merged = [...new Set([...before, ...interestIds])];
    const wasOut = fields.unsubscribed === true;

    changed = wasOut || merged.length !== before.length;

    await patchDocument(account, projectId, `subscribers/${row.id}`, {
      interestIds: merged,
      // Subscribing again is how somebody comes back; there is no other
      // button for it.
      unsubscribed: false,
      locale: parsed.locale,
      source: parsed.source ?? (fields.source as string | undefined),
      updatedAt: now,
    });
  } else {
    await createDocument(account, projectId, "subscribers", {
      email: parsed.email,
      interestIds,
      locale: parsed.locale,
      source: parsed.source,
      viaInterested: false,
      unsubscribed: false,
      manageKey: manageKey(),
      createdAt: now,
      updatedAt: now,
    });
  }

  // The subscription is safe at this point. The letter is a courtesy, and a
  // courtesy that fails must not be reported as the subscription failing —
  // the person would press the button again.
  const directions = interestIds.map((id) => known.get(id) ?? id);
  let letter = false;
  const mail = readEmailJs(env);

  // Nothing changed means nothing to greet: somebody pressed the button on a
  // page they were already subscribed to, and a second identical welcome
  // would be the mailing list spamming its own subscriber.
  if (mail && changed) {
    try {
      await sendEmail(
        mail,
        parsed.email,
        buildWelcomeEmail({
          directions,
          locale: parsed.locale,
          ownerEmail: mail.owner,
          returning: !created,
        }),
      );
      letter = true;
    } catch (error) {
      console.log(`welcome letter to ${parsed.email} failed — ${String(error)}`);
    }
  }

  return json({ ok: true, created, checked, letter, directions });
}
