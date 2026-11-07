/**
 * An access token for a Google service account, minted inside the Worker.
 *
 * Why a service account at all. The idea form is filled in by people who are
 * signed in to nothing, and `firestore.rules` gives `adventureSuggestions` to
 * the owner alone — deliberately, because it holds email addresses and what
 * people wrote about themselves. Opening it to anonymous writes would also
 * make Turnstile pointless: a browser can be told to skip the widget, so the
 * only check that counts is one made somewhere a stranger cannot reach. That
 * somewhere is here, and a service account is how this code gets past rules
 * that are meant to stop browsers.
 *
 * The flow is the standard JWT bearer grant: sign a short-lived assertion with
 * the account's private key, exchange it for an access token. There is no
 * Google library in a Worker, so it is done with WebCrypto, which is about
 * forty lines.
 */

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";

/**
 * The account, out of the one secret that holds it.
 *
 * The whole JSON that Firebase hands out when a key is created, pasted into
 * the secret as it came. Asking for the fields separately would mean pulling
 * a PEM with newlines in it through a form field, which is where this goes
 * wrong for people.
 */
export function readServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      client_email: parsed.client_email,
      // A key pasted through a shell or a dashboard field often arrives with
      // its newlines escaped. Both forms have to work.
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

const base64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const encodeJson = (value: unknown) =>
  base64url(new TextEncoder().encode(JSON.stringify(value)));

/** The PEM body, decoded. Service-account keys are PKCS#8, which WebCrypto takes. */
function pemToBytes(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signAssertion(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: "RS256", typ: "JWT" });
  const claim = encodeJson({
    iss: account.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(account.private_key) as unknown as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`),
  );

  return `${header}.${claim}.${base64url(signature)}`;
}

/**
 * A token, reused while it lasts.
 *
 * Module scope outlives a single request on a warm isolate, so a burst of
 * submissions costs one round trip to Google rather than one each. Sixty
 * seconds are shaved off the expiry so a token can never go stale between
 * being handed out and being used.
 */
let cached: { token: string; expiresAt: number } | null = null;

export async function accessToken(account: ServiceAccount): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: await signAssertion(account),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("Google token: no access_token in the answer");

  cached = {
    token: body.access_token,
    expiresAt: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 60) * 1000,
  };
  return cached.token;
}
