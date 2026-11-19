import type { Env } from "./env";

/**
 * `/api/capi` — the server half of every pixel event (Ш-06).
 *
 * §11.1 of the spec explains why this exists: browser events are lost. Ad
 * blockers drop the script, Apple's limits drop the rest, and a subscription
 * that never reaches the advertising account is a subscription the ads cannot
 * learn from. So each event is sent twice, from the browser and from here,
 * with one shared `eventId` — Facebook keeps the first copy and discards the
 * second, which is the whole reason the id travels.
 *
 * It holds a token, which is why it is a Worker endpoint. The pixel id is
 * public and sits in the page; the Conversions API token can send events as
 * that account and so can never leave this side.
 *
 * Open to anybody, like the forms, and that is a deliberate limit of what it
 * may do: the body only chooses between four named events and carries an
 * email address to be hashed. Nothing here can be made to write to the
 * database, address a letter or report an event this site does not have.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const GRAPH = "https://graph.facebook.com/v21.0";

/** The same four names the page uses — see `lib/analytics/events.ts`. */
const EVENT_NAMES = {
  subscribe: "Subscribe",
  interested: "Interested",
  application: "SubmitApplication",
  solutions: "Lead",
} as const;

type SiteEvent = keyof typeof EVENT_NAMES;

const isEvent = (value: unknown): value is SiteEvent =>
  typeof value === "string" && value in EVENT_NAMES;

const clip = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * SHA-256 of a lowercased address, which is the only form Facebook may have
 * it in. Hashing happens here rather than in the page for a plain reason: a
 * page cannot be trusted to have done it, and an address that arrives
 * unhashed must not be forwarded.
 */
async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function capi(request: Request, env: Env): Promise<Response> {
  const pixelId = env.FACEBOOK_PIXEL_ID;
  const token = env.FACEBOOK_CAPI_TOKEN;

  // Not an error: until the advertising account exists, the browser half is
  // off too and the page is told plainly rather than being left to time out.
  if (!pixelId || !token) return json({ ok: false, error: "not-configured" }, 503);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "bad-request", field: "body" }, 400);

  const event = body.event;
  if (!isEvent(event)) return json({ error: "bad-request", field: "event" }, 400);

  const eventId = clip(body.eventId, 100);
  if (!eventId) return json({ error: "bad-request", field: "eventId" }, 400);

  const sourceUrl = clip(body.sourceUrl, 500);
  const email = clip(body.email, 320);

  const userData: Record<string, unknown> = {
    client_ip_address: request.headers.get("cf-connecting-ip") ?? undefined,
    client_user_agent: request.headers.get("user-agent") ?? undefined,
  };
  if (email.includes("@")) userData.em = [await hash(email)];

  const custom: Record<string, unknown> = {};
  const contentName = clip(body.contentName, 200);
  const contentCategory = clip(body.contentCategory, 100);
  if (contentName) custom.content_name = contentName;
  if (contentCategory) custom.content_category = contentCategory;

  const payload = {
    data: [
      {
        event_name: EVENT_NAMES[event],
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl || undefined,
        action_source: "website",
        user_data: userData,
        ...(Object.keys(custom).length > 0 ? { custom_data: custom } : {}),
      },
    ],
    ...(env.FACEBOOK_TEST_EVENT_CODE
      ? { test_event_code: env.FACEBOOK_TEST_EVENT_CODE }
      : {}),
  };

  const response = await fetch(`${GRAPH}/${pixelId}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, access_token: token }),
  });

  if (!response.ok) {
    // Logged, not returned: the answer can name the pixel and quote the
    // token's permissions, and this endpoint answers a public page.
    console.log(`capi ${event} failed: ${response.status} ${await response.text()}`);
    return json({ ok: false, error: "upstream" }, 502);
  }

  return json({ ok: true });
}
