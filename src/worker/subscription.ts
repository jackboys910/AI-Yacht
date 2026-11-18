import {
  decodeFields,
  listDocuments,
  patchDocument,
  queryDocuments,
} from "./firestore";
import { readServiceAccount } from "./google-auth";
import type { Env } from "./env";

/**
 * `/api/subscription` — the page behind the Unsubscribe link (Н-09, Н-10, §8.3).
 *
 * It answers to a key and to nothing else. No password, because §8.3 says one
 * or two clicks and a password is neither; and no email in the address,
 * because an address in a link is an address anyone can guess — somebody
 * could unsubscribe a stranger by typing their email into the query string.
 * `manageKey` is 256 bits from the platform's generator, written on every
 * subscriber since the first version of the subscription form.
 *
 * Unsubscribing happens on POST, never on GET. Link checkers and mail
 * scanners fetch the links in a letter; a GET that took somebody off the
 * list would take them off it without their ever seeing the page.
 *
 * The address comes back masked. The key is theirs, but letters get
 * forwarded, and `ma***@example.com` is enough to recognise your own
 * subscription without handing the whole address to whoever has the letter.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const DEFAULT_PROJECT = "nazarov-net";

/** The key as it travels in a link: hex, 64 characters. */
const KEY = /^[A-Za-z0-9_-]{16,128}$/;

function mask(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "…";
  const name = email.slice(0, at);
  const domain = email.slice(at);
  const head = name.slice(0, Math.min(2, name.length));
  return `${head}${"*".repeat(Math.max(1, Math.min(6, name.length - head.length)))}${domain}`;
}

interface Found {
  id: string;
  email: string;
  interestIds: string[];
  unsubscribed: boolean;
}

function toFound(row: { id: string; fields: Record<string, Record<string, unknown>> }): Found {
  const fields = decodeFields(row.fields);
  return {
    id: row.id,
    email: typeof fields.email === "string" ? fields.email : "",
    interestIds: Array.isArray(fields.interestIds)
      ? (fields.interestIds as unknown[]).filter((one): one is string => typeof one === "string")
      : [],
    unsubscribed: fields.unsubscribed === true,
  };
}

const answer = (found: Found) => ({
  ok: true,
  email: mask(found.email),
  interestIds: found.interestIds,
  unsubscribed: found.unsubscribed,
});

export async function subscription(request: Request, env: Env): Promise<Response> {
  const account = readServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
  if (!account) return json({ error: "not-configured" }, 503);

  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  let key = url.searchParams.get("key") ?? "";
  let action = "";
  let wanted: string[] = [];

  if (method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.key === "string") key = body.key;
    action = typeof body.action === "string" ? body.action : "";
    wanted = Array.isArray(body.interestIds)
      ? [...new Set(body.interestIds.filter((one): one is string => typeof one === "string"))].slice(0, 50)
      : [];
  }

  if (!KEY.test(key)) return json({ error: "unknown" }, 404);

  const rows = await queryDocuments(account, projectId, {
    from: [{ collectionId: "subscribers" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "manageKey" },
        op: "EQUAL",
        value: { stringValue: key },
      },
    },
    limit: 1,
  });

  if (rows.length === 0) return json({ error: "unknown" }, 404);
  const found = toFound(rows[0]);

  if (method === "GET") return json(answer(found));

  const now = new Date().toISOString();

  if (action === "unsubscribe") {
    await patchDocument(account, projectId, `subscribers/${found.id}`, {
      unsubscribed: true,
      updatedAt: now,
    });
    return json({ ...answer({ ...found, unsubscribed: true }) });
  }

  if (action === "resubscribe") {
    // Somebody who came back and found an empty list: resubscribing with no
    // directions would be a subscription to nothing, so this only undoes the
    // leaving and leaves the choosing to the checkboxes.
    await patchDocument(account, projectId, `subscribers/${found.id}`, {
      unsubscribed: false,
      updatedAt: now,
    });
    return json({ ...answer({ ...found, unsubscribed: false }) });
  }

  if (action === "interests") {
    // Checked against the real directions: an id nobody recognises would sit
    // in the list forever, matching no trip and receiving no announcement,
    // which looks exactly like a subscription that silently does not work.
    const interests = await listDocuments(account, projectId, "interests");
    const known = new Set(interests.map((one) => one.id));
    const chosen = wanted.filter((id) => known.has(id));

    // Everything unticked is the same wish as "unsubscribe", said with the
    // checkboxes instead of the button.
    const unsubscribed = chosen.length === 0;

    await patchDocument(account, projectId, `subscribers/${found.id}`, {
      interestIds: chosen,
      unsubscribed,
      updatedAt: now,
    });
    return json({ ...answer({ ...found, interestIds: chosen, unsubscribed }) });
  }

  return json({ error: "bad-request", field: "action" }, 400);
}
