import { readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
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

/* ---------------------------------------------------------------------------
   Расширение .png картинкам превью.

   Next кладёт сгенерированную картинку файлом без расширения —
   `opengraph-image-1wlz21`. Для сервера на Cloudflare тип файла определяется
   расширением, и без него картинка уезжает как application/octet-stream;
   краулер Facebook на такой ответ говорит «изображение не удалось скачать», и
   превью остаётся без картинки (Ш-03, Ш-04).

   Поэтому файл переименовывается, а все ссылки на него в выгрузке правятся.
   Имя уникальное и ни на что не похоже, так что замена по тексту безопасна.
--------------------------------------------------------------------------- */

const IMAGE = /^(opengraph-image|twitter-image)-[^.]+$/;

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push({ path, name: entry.name });
  }
  return found;
}

const files = await walk(OUT);
const renamed = new Map();

for (const file of files) {
  if (!IMAGE.test(file.name)) continue;
  await rename(file.path, `${file.path}.png`);
  renamed.set(file.name, `${file.name}.png`);
}

if (renamed.size > 0) {
  let touched = 0;
  for (const file of files) {
    if (!/\.(html|txt|json|xml)$/i.test(file.name)) continue;
    const before = await readFile(file.path, "utf8");
    let after = before;
    for (const [from, to] of renamed) after = after.split(from).join(to);
    if (after !== before) {
      await writeFile(file.path, after);
      touched += 1;
    }
  }
  console.log(
    `clean-export: картинкам превью добавлено расширение (${renamed.size} шт.), ссылки поправлены в ${touched} файлах.`,
  );
}
