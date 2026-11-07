/**
 * Cloudflare Turnstile, checked where it counts.
 *
 * The widget in the page produces a token; that token means nothing until
 * Cloudflare is asked about it, and that question has to be asked with a
 * secret. Anything the browser does on its own — the widget rendering, the
 * token existing — can be skipped by whoever is not using a browser, which is
 * exactly the case this guards against.
 *
 * A token is good for one check and about five minutes.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileOutcome {
  ok: boolean;
  /** Cloudflare's own codes, for the Worker's log. Never shown to a visitor. */
  codes: string[];
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null,
): Promise<TurnstileOutcome> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { ok: false, codes: [`http-${response.status}`] };
  }

  const result = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };
  return { ok: Boolean(result.success), codes: result["error-codes"] ?? [] };
}
