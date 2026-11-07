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

/**
 * One value, back out of Firestore's tagged form.
 *
 * The reverse of `encode`, and deliberately partial: the Worker reads one
 * document — a trip, to find out who is organizing it — and the fields it
 * cares about are strings and maps of strings. Anything unrecognised comes
 * back as `undefined` rather than as a guess.
 */
function decode(value: Value): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: Value[] }).values ?? [];
    return values.map(decode);
  }
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, Value> }).fields ?? {};
    return decodeFields(fields);
  }
  return undefined;
}

export function decodeFields(
  fields: Record<string, Value>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decode(value)]),
  );
}

/**
 * Reading and writing **as the signed-in caller**, not as the service account.
 *
 * `/api/organizer-invite` could use the service account — it has one — and
 * that is exactly why it does not. Under the owner's own token the endpoint
 * can reach no document the owner could not reach from the panel, so a bug
 * here cannot turn into a way around `firestore.rules`. The service account
 * is kept for the one job that needs it: writing a collection no browser may
 * touch at all.
 *
 * `null` means no such document. Anything else that went wrong throws, since
 * "missing" and "refused" lead to different answers for the caller.
 */
export async function readDocumentAsUser(
  idToken: string,
  projectId: string,
  path: string,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`,
    { headers: { authorization: `Bearer ${idToken}` } },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { fields?: Record<string, Value> };
  return decodeFields(body.fields ?? {});
}

/**
 * Changes the named fields and leaves the rest of the document alone.
 *
 * The `updateMask` is not optional for this to be true: a PATCH without one
 * replaces the whole document, which here would mean a letter about a trip
 * erasing the trip.
 */
export async function patchDocumentAsUser(
  idToken: string,
  projectId: string,
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  const mask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?${mask}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields: encodeFields(data) }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  }
}

/**
 * A query, run with the service account.
 *
 * Used for the one question the subscription has to ask before writing:
 * is this address already on the list? Н-06 turns on the answer, and a
 * browser cannot ask it — `subscribers` is shut to browsers precisely so
 * that nobody can find out who is on it.
 *
 * Returns the documents with their ids, which `runQuery` otherwise buries
 * inside a full resource path.
 */
export async function queryDocuments(
  account: ServiceAccount,
  projectId: string,
  structuredQuery: Record<string, unknown>,
): Promise<{ id: string; fields: Record<string, Value> }[]> {
  const token = await accessToken(account);

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ structuredQuery }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  }

  const rows = (await response.json()) as {
    document?: { name: string; fields?: Record<string, Value> };
  }[];

  return rows
    .filter((row) => row.document)
    .map((row) => ({
      id: row.document!.name.split("/").pop() ?? "",
      fields: row.document!.fields ?? {},
    }));
}

/**
 * Changes the named fields of a document, with the service account.
 *
 * The `updateMask` is what makes this an update rather than a replacement:
 * a PATCH without one writes the document the body describes and drops
 * everything the body left out.
 */
export async function patchDocument(
  account: ServiceAccount,
  projectId: string,
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  const token = await accessToken(account);
  const mask = Object.keys(data)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?${mask}`,
    {
      method: "PATCH",
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
}

/**
 * Every document in a collection, with the service account.
 *
 * Only used for small, finite collections — the interests, which is seven
 * documents the owner maintains by hand. There is no paging here on purpose:
 * a collection that needs paging should not be read whole in a Worker.
 */
export async function listDocuments(
  account: ServiceAccount,
  projectId: string,
  collection: string,
): Promise<{ id: string; fields: Record<string, Value> }[]> {
  const token = await accessToken(account);

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=300`,
    { headers: { authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    documents?: { name: string; fields?: Record<string, Value> }[];
  };

  return (body.documents ?? []).map((document) => ({
    id: document.name.split("/").pop() ?? "",
    fields: document.fields ?? {},
  }));
}
