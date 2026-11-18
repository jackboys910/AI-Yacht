import { idToken } from "./firebase/auth";

/**
 * The panel's side of "Send to subscribers" (Н-07, Н-08).
 *
 * The Worker does the sending; this only asks and reports. Two things are
 * deliberately left to it. How many letters go out per call is its business,
 * because the limit is the Worker's own request budget — the panel just
 * calls again while anything is left. And whether a second mailing is
 * allowed is its business too, because the record of who has been written to
 * lives in the database, not in this tab.
 *
 * `null` means there is no Worker at all, which is what `next dev` looks
 * like: the panel then says the mailing is unavailable here rather than
 * showing a broken button.
 */

const ENDPOINT = "/api/announce";

export interface AnnounceState {
  /** Subscribers of this trip's direction who have not unsubscribed. */
  recipients: number;
  /** How many of them have already been written to about this trip. */
  sentCount: number;
  remaining: number;
  byLocale: { en: number; ru: number };
  failed: string[];
  startedAt?: string;
  finishedAt?: string;
  /** False while the settings have no postal address — nothing may be sent. */
  postalAddress: boolean;
  limit: number;
  /** Built by the Worker: the letter itself, not an impression of it. */
  preview?: { en: string; ru: string; subject: string };
  /** The mailing is finished; pressing again needs `confirm`. */
  needsConfirmation?: boolean;
  /** How many letters the last call actually sent. */
  delivered?: number;
  error?: string;
}

async function call(
  method: "GET" | "POST",
  tripId: string,
  body?: Record<string, unknown>,
): Promise<AnnounceState | null> {
  const token = await idToken();
  if (!token) return null;

  const response = await fetch(
    method === "GET" ? `${ENDPOINT}?tripId=${encodeURIComponent(tripId)}` : ENDPOINT,
    {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify({ tripId, ...body }) : undefined,
    },
  );

  // `next dev` answers an unknown path with its own HTML 404; anything that
  // is not JSON means there is no Worker on the other end.
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  return (await response.json()) as AnnounceState;
}

/** Who would receive the announcement, and what it looks like. */
export function readAnnounce(tripId: string): Promise<AnnounceState | null> {
  return call("GET", tripId);
}

/** Sends the next batch. Call again while `remaining` is above zero. */
export function sendAnnounceBatch(
  tripId: string,
  confirm = false,
): Promise<AnnounceState | null> {
  return call("POST", tripId, confirm ? { confirm: true } : {});
}
