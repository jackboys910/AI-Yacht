import { buildWelcomeEmail } from "../lib/email/welcome";
import { readEmailJs, sendEmail } from "./emailjs";
import {
  createDocument,
  decodeFields,
  getDocument,
  patchDocument,
  queryDocuments,
} from "./firestore";
import { readServiceAccount } from "./google-auth";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

/**
 * `/api/interested` — the "I'm interested" button on a trip (П-13, §6.3).
 *
 * One press does three things that have to happen together: it records the
 * press, it adds the person to the mailing list of the trip's direction, and
 * it moves the number the page shows. Here rather than in the browser for the
 * reasons the subscription form is here — `interested` and `subscribers` are
 * both shut to browsers, the Turnstile token means nothing until something
 * holding the secret has asked about it, and the letter needs the EmailJS
 * private key.
 *
 * There is a fourth reason of its own. The counter is a number anyone can
 * read, so if the browser were allowed to write it, anyone could write any
 * number into it. Counting happens here, from the records, and the browser
 * is only told the result.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

/**
 * How many presses one trip is counted over.
 *
 * The records are read to count them and to find out whether this address is
 * already among them, which is one request instead of two. A trip with more
 * presses than this would stop counting — and a thousand people interested in
 * one trip is a different site than this one, with a different problem.
 */
const MAX_RECORDS = 2000;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** The same key the unsubscribe link of item 3.3 will travel on. */
function manageKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface Press {
  tripId: string;
  email: string;
  locale: "en" | "ru";
  source?: string;
}

function read(raw: unknown): Press | string {
  if (typeof raw !== "object" || raw === null) return "body";
  const body = raw as Record<string, unknown>;

  const tripId = clip(body.tripId, 200);
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(tripId)) return "tripId";

  const email = clip(body.email, 320).toLowerCase();
  if (!looksLikeEmail(email)) return "email";

  return {
    tripId,
    email,
    locale: body.locale === "ru" ? "ru" : "en",
    source: clip(body.source, 300) || undefined,
  };
}

/** The direction's name, by the rule the site's header uses. */
function labelOf(fields: Record<string, unknown>): string {
  const name = (fields.name ?? {}) as Record<string, unknown>;
  const en = typeof name.en === "string" ? name.en.trim() : "";
  const ru = typeof name.ru === "string" ? name.ru.trim() : "";
  const slug = typeof fields.slug === "string" ? fields.slug : "";
  return en || ru || slug;
}

export async function interested(request: Request, env: Env): Promise<Response> {
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

  if (env.TURNSTILE_SECRET) {
    const token = clip((body as Record<string, unknown>).turnstileToken, 4000);
    const outcome = await verifyTurnstile(
      env.TURNSTILE_SECRET,
      token,
      request.headers.get("cf-connecting-ip"),
    );
    if (!outcome.ok) {
      console.log(`turnstile refused an interest: ${outcome.codes.join(", ") || "no codes"}`);
      return json({ error: "turnstile" }, 400);
    }
  }

  // The trip is read rather than trusted, for two different reasons. The id
  // decides which direction the person is subscribed to, so a made-up id
  // would otherwise put them on a list nobody keeps. And a draft or archived
  // trip has no page to press a button on, so a press against one is not a
  // visitor.
  const trip = await getDocument(account, projectId, `trips/${parsed.tripId}`);
  if (!trip || trip.status !== "published") {
    return json({ error: "bad-request", field: "tripId" }, 400);
  }
  const interestId = typeof trip.interestId === "string" ? trip.interestId : "";

  const now = new Date().toISOString();

  // Every press on this trip, with only the address read back: it answers
  // "has this person already pressed?" and "how many are there?" at once.
  const records = await queryDocuments(account, projectId, {
    from: [{ collectionId: "interested" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "tripId" },
        op: "EQUAL",
        value: { stringValue: parsed.tripId },
      },
    },
    select: { fields: [{ fieldPath: "email" }] },
    limit: MAX_RECORDS,
  });

  const already = records.some((row) => {
    const fields = decodeFields(row.fields);
    return typeof fields.email === "string" && fields.email.toLowerCase() === parsed.email;
  });

  // Pressing twice is one person being interested once. The answer is the
  // same either way, so nobody can use the button to find out who else
  // pressed it.
  if (!already) {
    await createDocument(account, projectId, "interested", {
      tripId: parsed.tripId,
      email: parsed.email,
      locale: parsed.locale,
      source: parsed.source,
      createdAt: now,
    });
  }

  const count = records.length + (already ? 0 : 1);

  // PATCH with a field mask creates the document when there is none, which
  // is what the first press on a trip needs.
  await patchDocument(account, projectId, `counters/${parsed.tripId}`, {
    tripId: parsed.tripId,
    interested: count,
    updatedAt: now,
  });

  // §6.3: whoever presses this becomes a subscriber of the trip's direction.
  // Merged into an existing subscription rather than replacing it — somebody
  // already hearing about Sailing who presses on a Snowboarding trip wants
  // both, and this button never showed them a list to choose from.
  let subscribed = false;
  let changed = false;
  let returning = false;

  if (interestId) {
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

    if (existing.length > 0) {
      returning = true;
      const row = existing[0];
      const fields = decodeFields(row.fields);
      const before: string[] = Array.isArray(fields.interestIds)
        ? (fields.interestIds as unknown[]).filter((id): id is string => typeof id === "string")
        : [];
      const merged = [...new Set([...before, interestId])];
      changed = fields.unsubscribed === true || merged.length !== before.length;

      await patchDocument(account, projectId, `subscribers/${row.id}`, {
        interestIds: merged,
        unsubscribed: false,
        locale: parsed.locale,
        source: parsed.source ?? (fields.source as string | undefined),
        updatedAt: now,
      });
    } else {
      changed = true;
      await createDocument(account, projectId, "subscribers", {
        email: parsed.email,
        interestIds: [interestId],
        locale: parsed.locale,
        source: parsed.source,
        // What separates this list from the one the "+" button fills: these
        // people gave their address about one trip, not about a direction,
        // and item 3.4 shows the owner which is which.
        viaInterested: true,
        unsubscribed: false,
        manageKey: manageKey(),
        createdAt: now,
        updatedAt: now,
      });
    }
    subscribed = true;
  }

  // The press is recorded and the subscription is live by this point. The
  // letter is a courtesy, and a courtesy that fails must not be reported as
  // the button failing — the person would press it again.
  let letter = false;
  const mail = readEmailJs(env);

  if (mail && changed && interestId) {
    try {
      const direction = await getDocument(account, projectId, `interests/${interestId}`);
      await sendEmail(
        mail,
        parsed.email,
        buildWelcomeEmail({
          directions: [direction ? labelOf(direction) : interestId],
          locale: parsed.locale,
          ownerEmail: mail.owner,
          returning,
        }),
      );
      letter = true;
    } catch (error) {
      console.log(`welcome letter to ${parsed.email} failed — ${String(error)}`);
    }
  }

  return json({ ok: true, interested: count, counted: !already, subscribed, letter });
}
