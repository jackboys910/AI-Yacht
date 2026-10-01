import { rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Removes the placeholder trip pages from the exported site.
 *
 * `output: "export"` refuses to build a dynamic route whose
 * `generateStaticParams` returns nothing, so the trip routes always emit one
 * path — `/_/_/` — when the database has no published trips. See
 * PLACEHOLDER_TRIP_PATH in src/lib/content/lookup.ts for why that cannot simply
 * be avoided.
 *
 * The page answers that address with `notFound()`, but a statically exported
 * `notFound()` writes an empty shell rather than the 404 page, so the file has
 * to go. Once it is gone Cloudflare falls back to 404.html, which is both the
 * right content and the right status code.
 *
 * When trips exist the placeholder is never generated and this does nothing.
 */
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

const PLACEHOLDERS = [join(OUT, "_"), join(OUT, "ru", "_")];

let removed = 0;
for (const path of PLACEHOLDERS) {
  try {
    await stat(path);
  } catch {
    continue;
  }
  await rm(path, { recursive: true, force: true });
  removed += 1;
}

console.log(
  removed === 0
    ? "clean-export: поездки есть, убирать нечего."
    : `clean-export: убрано страниц-заглушек: ${removed} (опубликованных поездок пока нет).`,
);
