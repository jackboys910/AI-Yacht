import { idToken } from "./firebase/auth";

/**
 * Telling an organizer that the panel exists (С-12).
 *
 * The browser's side of `/api/organizer-invite`. It carries almost nothing:
 * the id of the trip, and the language and name to write the letter with. The
 * address it goes to is read out of the trip by the Worker, so this call
 * cannot choose a recipient — which is the point, since the letter goes out
 * under the site's own name.
 *
 * Like `rebuild.ts`, it treats "no Worker here" as a state rather than an
 * error: during development `next dev` answers an unknown path with HTML, and
 * the panel should say the letter cannot be sent from here instead of
 * showing a stack trace.
 */

const ENDPOINT = "/api/organizer-invite";

export type InviteResult =
  | { kind: "sent"; at: string; to: string }
  /** The letter had already gone; `at` is when. */
  | { kind: "already"; at: string }
  /** No Worker on the other end — the panel is running from `next dev`. */
  | { kind: "absent" }
  /** The Worker is there but has no EmailJS private key. */
  | { kind: "unconfigured" }
  /** Nobody is written on the trip yet. */
  | { kind: "noOrganizer" }
  | { kind: "failed"; detail?: string };

interface Payload {
  sent?: boolean;
  reason?: string;
  at?: string;
  to?: string;
  error?: string;
  detail?: string;
}

export async function sendOrganizerInvite(options: {
  tripId: string;
  locale: "en" | "ru";
  name?: string;
  /** A second copy, asked for deliberately. */
  resend?: boolean;
}): Promise<InviteResult> {
  const token = await idToken();
  if (!token) return { kind: "failed" };

  let payload: Payload;
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.headers.get("content-type")?.includes("application/json")) {
      return { kind: "absent" };
    }
    payload = (await response.json()) as Payload;
  } catch {
    return { kind: "absent" };
  }

  if (payload.error === "not-configured") return { kind: "unconfigured" };
  if (payload.error === "no-organizer") return { kind: "noOrganizer" };
  if (payload.error) return { kind: "failed", detail: payload.detail };
  if (payload.sent) return { kind: "sent", at: payload.at ?? "", to: payload.to ?? "" };
  if (payload.reason === "already-sent") return { kind: "already", at: payload.at ?? "" };
  return { kind: "failed" };
}
