/**
 * Is the caller the owner?
 *
 * Shared by `/api/rebuild` and `/api/organizer-invite`, which are the two
 * endpoints only he may call. Both put the question to Firestore under the
 * caller's own token, so the answer comes from `firestore.rules` — the same
 * `/owners/{uid}` entry the panel is gated on, rather than a second copy of
 * that rule living in the Worker and drifting from the first.
 */

/**
 * The uid inside a Firebase ID token, read without checking the signature.
 *
 * That is safe because nothing is believed on the strength of this value: it
 * only builds the address of the document the next request asks Firestore
 * for, and Firestore checks the token itself. A token with a uid someone else
 * wrote into it is refused there.
 */
export function uidOf(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const text = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(text) as { user_id?: unknown; sub?: unknown };
    const uid = claims.user_id ?? claims.sub;
    return typeof uid === "string" && uid.length > 0 ? uid : null;
  } catch {
    return null;
  }
}

/** The bearer token from a request, or "" when there is none. */
export function bearerOf(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function isOwner(idToken: string, projectId: string): Promise<boolean> {
  const uid = uidOf(idToken);
  if (!uid) return false;

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/owners/${uid}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );
  return response.ok;
}
