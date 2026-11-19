#!/usr/bin/env node
/**
 * Putting a backup back (Т-04).
 *
 *   FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" \
 *     node scripts/firestore-restore.mjs backup/2026-11-19 --project nazarov-test
 *
 * Reads what `firestore-backup.mjs` wrote and writes the documents into a
 * project, keeping every id. Three things about it are deliberate:
 *
 *  - **It says what it would do and stops.** Without `--force` nothing is
 *    written. A restore is the one operation that can destroy more than it
 *    repairs — it overwrites live documents with older copies — so the safe
 *    thing has to be the default, and the dangerous one has to be typed.
 *  - **It wants the project named.** `--project` is required when `--force`
 *    is given. The point of a rehearsal is restoring into a test project, and
 *    a default of "the live one" is how a rehearsal becomes an incident.
 *  - **It merges rather than clearing first.** A document the backup does not
 *    have stays. Deleting what is not in the backup is a different operation
 *    with a different risk, and it is not this script's.
 *
 * Collections can be narrowed: `--only trips,interests`.
 */

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { accessToken } from "./firestore-backup.mjs";

const args = process.argv.slice(2);
const dir = args.find((one) => !one.startsWith("--"));
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? (args[index + 1] ?? "") : null;
};

const force = args.includes("--force");
const project = flag("project");
const only = (flag("only") ?? "")
  .split(",")
  .map((one) => one.trim())
  .filter(Boolean);

/** How many documents go in one `:commit`. Firestore's limit is 500. */
const BATCH = 200;

function readAccount(raw) {
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set — see DEPLOY.md §8a.");
  const parsed = JSON.parse(raw);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT has no client_email or private_key.");
  }
  return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

export function commitPayload(project, collection, documents) {
  return {
    writes: documents.map((document) => ({
      update: {
        name: `projects/${project}/databases/(default)/documents/${collection}/${document.id}`,
        fields: document.fields,
      },
      // Every field the backup holds, and only those: without a mask a field
      // added since the backup would be deleted by the restore.
      updateMask: { fieldPaths: Object.keys(document.fields) },
    })),
  };
}

async function main() {
  if (!dir) {
    console.error(
      "Usage: node scripts/firestore-restore.mjs <backup dir> [--only a,b] [--project id --force]",
    );
    process.exit(1);
  }

  const files = (await readdir(dir)).filter(
    (name) => name.endsWith(".json") && name !== "manifest.json",
  );

  const sets = [];
  for (const file of files) {
    const parsed = JSON.parse(await readFile(join(dir, file), "utf8"));
    if (only.length > 0 && !only.includes(parsed.collection)) continue;
    sets.push(parsed);
  }

  const total = sets.reduce((sum, set) => sum + set.documents.length, 0);
  for (const set of sets) {
    console.log(`${set.collection}: ${set.documents.length}`);
  }
  console.log(`\n${total} documents in ${sets.length} collections.`);

  if (!force) {
    console.log(
      "\nNothing was written. This was a rehearsal — add --force --project <id> " +
        "to actually restore, and point it at a test project first.",
    );
    return;
  }
  if (!project) {
    console.error("\n--force needs --project <id>. Name the project on purpose.");
    process.exit(1);
  }

  const token = await accessToken(readAccount(process.env.FIREBASE_SERVICE_ACCOUNT));
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`;

  let written = 0;
  for (const set of sets) {
    for (let i = 0; i < set.documents.length; i += BATCH) {
      const slice = set.documents.slice(i, i + BATCH);
      const response = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(commitPayload(project, set.collection, slice)),
      });
      if (!response.ok) {
        throw new Error(
          `writing ${set.collection} failed: ${response.status} ${await response.text()}`,
        );
      }
      written += slice.length;
      console.log(`  ${set.collection}: ${written}/${total}`);
    }
  }

  console.log(`\nRestored ${written} documents into ${project}.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  main().catch((error) => {
    console.error(String(error));
    process.exit(1);
  });
}
