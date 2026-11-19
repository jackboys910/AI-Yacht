#!/usr/bin/env node
/**
 * A backup of everything in Firestore, as files (Т-04).
 *
 * Run by `.github/workflows/backup.yml` once a day and by hand whenever
 * somebody wants a copy before doing something risky:
 *
 *   FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" node scripts/firestore-backup.mjs
 *
 * It writes one JSON file per collection, in Firestore's own REST shape —
 * `{"fields": {"email": {"stringValue": "…"}}}` — rather than a friendlier
 * one. That is the point: a backup exists to be restored, and the REST shape
 * is what `:commit` takes back without anybody having to guess whether a
 * number was an integer or a double.
 *
 * What it does **not** copy: the photographs in Cloud Storage. They are
 * objects in a bucket with their own durability, and copying a few hundred
 * megabytes of images every night to protect against a risk Google already
 * covers is the wrong trade. Instead every image's address is in the
 * documents this does copy, so a lost bucket is a known list of files to put
 * back rather than a mystery. The manifest says so out loud.
 *
 * The service account is read from the environment and never written
 * anywhere. The backup files themselves hold personal data — addresses, what
 * people wrote about themselves — so where they end up matters: the workflow
 * keeps them as a private artifact of this repository and nothing else.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";
const PAGE_SIZE = 300;

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nazarov-net";

const outDir =
  process.env.BACKUP_DIR || join("backup", new Date().toISOString().slice(0, 10));

function readAccount(raw) {
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Paste the whole service-account " +
        "JSON into it — see DEPLOY.md §8a.",
    );
  }
  const parsed = JSON.parse(raw);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT has no client_email or private_key.");
  }
  // A key pasted through a shell or a dashboard field often arrives with its
  // newlines escaped; both forms have to work.
  return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const base64url = (bytes) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const encodeJson = (value) => base64url(Buffer.from(JSON.stringify(value), "utf8"));

function pemToBytes(pem) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  return Buffer.from(body, "base64");
}

/** The standard JWT bearer grant, the same one the Worker uses. */
export async function accessToken(account) {
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
    pemToBytes(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`),
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${base64url(signature)}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`token exchange failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return body.access_token;
}

const api = (project) =>
  `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

/** Every top-level collection, asked for rather than listed by hand. */
export async function listCollections(token, project) {
  const response = await fetch(`${api(project)}:listCollectionIds`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ pageSize: 100 }),
  });
  if (!response.ok) {
    throw new Error(`listCollectionIds failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return (body.collectionIds ?? []).sort();
}

/** One collection, in pages, because a backup must not depend on its size. */
export async function readCollection(token, project, collection) {
  const documents = [];
  let pageToken;

  do {
    const url = new URL(`${api(project)}/${collection}`);
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(
        `reading ${collection} failed: ${response.status} ${await response.text()}`,
      );
    }
    const body = await response.json();
    for (const document of body.documents ?? []) {
      documents.push({
        // The id, kept apart from the full path: a restore into another
        // project must not carry this project's name in it.
        id: document.name.split("/").pop(),
        fields: document.fields ?? {},
        createTime: document.createTime,
        updateTime: document.updateTime,
      });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);

  return documents;
}

async function main() {
  const account = readAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  const token = await accessToken(account);

  const collections = await listCollections(token, projectId);
  if (collections.length === 0) {
    throw new Error("no collections came back — refusing to write an empty backup");
  }

  await mkdir(outDir, { recursive: true });

  const manifest = {
    project: projectId,
    takenAt: new Date().toISOString(),
    collections: {},
    note:
      "Documents only. Photographs live in Cloud Storage and are not copied " +
      "here; their addresses are in these documents, so a lost bucket is a " +
      "known list of files rather than a mystery. Restore with " +
      "scripts/firestore-restore.mjs — it refuses to write into a project " +
      "without --force.",
  };

  for (const collection of collections) {
    const documents = await readCollection(token, projectId, collection);
    await writeFile(
      join(outDir, `${collection}.json`),
      JSON.stringify({ collection, documents }, null, 2),
      "utf8",
    );
    manifest.collections[collection] = documents.length;
    console.log(`${collection}: ${documents.length}`);
  }

  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  const total = Object.values(manifest.collections).reduce((sum, n) => sum + n, 0);
  console.log(`\n${total} documents in ${collections.length} collections → ${outDir}`);
}

// Importable for tests; only the direct run does the work.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  main().catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
}
