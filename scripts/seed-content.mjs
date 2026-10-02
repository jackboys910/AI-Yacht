// Puts the site's starting content into Firestore: the four interests, the
// people of the AI Yacht crew and the AI Yacht trip itself, on both languages.
//
// This is how the landing that used to live in `src/i18n/dictionaries` became
// a trip the owner can edit in the panel (plan item 1.11). It is kept because
// it is also the answer to "the database was emptied, now what" and to "give
// the test project the same content as the real one".
//
// Usage:
//
//   node scripts/seed-content.mjs owner@example.com 'password'
//   node scripts/seed-content.mjs owner@example.com 'password' --force
//
// It signs in as the owner, because the rules let nobody else write (§9) —
// the same email and password the admin panel is entered with. Without
// --force a document that already exists is left alone, so running it twice
// cannot overwrite something the owner has since edited.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The same public values as src/lib/firebase/config.ts, which this script
// cannot import: it runs in plain Node, outside the bundler and its aliases.
const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  "AIzaSyDON3Ue9vCXee9YQ-_-atPZXb9b2fQB08E";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nazarov-net";
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const [email, password, ...flags] = process.argv.slice(2);
const force = flags.includes("--force");

if (!email || !password) {
  console.error("Нужны почта и пароль владельца:");
  console.error("  node scripts/seed-content.mjs owner@example.com 'password'");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "seed-content.json"), "utf8"));

/** Plain JS values in Firestore's shapes. */
function encode(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, encode(item)]),
      ),
    },
  };
}

async function signIn() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`вход не удался: ${body.error?.message ?? response.status}`);
  }
  return body.idToken;
}

async function exists(collection, id, token) {
  const response = await fetch(`${DOCS}/${collection}/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.ok;
}

async function write(collection, id, data, token) {
  const response = await fetch(`${DOCS}/${collection}/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields: encode(data).mapValue.fields }),
  });
  if (!response.ok) {
    throw new Error(`${collection}/${id}: ${await response.text()}`);
  }
}

const token = await signIn();
const now = new Date().toISOString();
let written = 0;
let skipped = 0;

for (const [collection, records] of Object.entries(seed)) {
  for (const record of records) {
    const { id, ...fields } = record;

    if (!force && (await exists(collection, id, token))) {
      console.log(`· ${collection}/${id} уже есть — пропускаю`);
      skipped += 1;
      continue;
    }

    await write(
      collection,
      id,
      {
        ...fields,
        createdAt: now,
        updatedAt: now,
        ...(fields.status === "published" ? { publishedAt: now } : {}),
      },
      token,
    );
    console.log(`+ ${collection}/${id}`);
    written += 1;
  }
}

console.log(`\nзаписано: ${written}, пропущено: ${skipped}`);
if (written > 0) {
  console.log("Чтобы это появилось на сайте, нужна пересборка: npm run build");
}
