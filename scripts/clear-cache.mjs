import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Clears Next's build cache before every build.
 *
 * The site's content comes from Firestore through the Firebase SDK, which is an
 * ordinary async call — not a `fetch` Next can key a cache on. So Next has no
 * way to know the data changed, and a second build happily reuses the HTML it
 * rendered the first time: a trip is published, the site rebuilds, and nothing
 * on it changes.
 *
 * That is precisely the failure А-08 and А-09 are about, and it would be
 * invisible — the build succeeds and reports nothing wrong. Starting clean
 * costs a few seconds of recompilation and removes the whole class of problem.
 *
 * It also clears the stale route types Next leaves behind when a route folder
 * is renamed, which otherwise fail `tsc` until the directory is removed by hand.
 */
const NEXT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".next");

await rm(NEXT_DIR, { recursive: true, force: true });
console.log("clear-cache: кэш сборки очищен — данные будут прочитаны заново.");
