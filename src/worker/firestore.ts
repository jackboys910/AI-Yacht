import { accessToken, type ServiceAccount } from "./google-auth";

/**
 * Writing to Firestore from the Worker, over its REST API.
 *
 * The browser SDK is not an option here: it is built around a long-lived
 * connection and an authenticated user, and this code has neither. REST wants
 * values wrapped in type tags — `{"stringValue": "…"}` — so most of this file
 * is that wrapping.
 */

type Value = Record<string, unknown>;

/**
 * One value, in Firestore's tagged form.
 *
 * `undefined` becomes a null rather than being dropped, because dropping it
 * silently would turn a bug in the caller into a field that simply is not
 * there. Callers that mean "leave this out" leave it out.
 */
function encode(value: unknown): Value {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
}

export function encodeFields(data: Record<string, unknown>): Record<string, Value> {
  return Object.fromEntries(
    Object.entries(data)
      // An absent field is absent, not null: that is what the readers in
      // `lib/firebase/mappers.ts` expect of an answer nobody gave.
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encode(value)]),
  );
}

/** Creates a document with an id Firestore picks. Returns that id. */
export async function createDocument(
  account: ServiceAccount,
  projectId: string,
  collection: string,
  data: Record<string, unknown>,
): Promise<string> {
  const token = await accessToken(account);

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields: encodeFields(data) }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { name?: string };
  return body.name?.split("/").pop() ?? "";
}
