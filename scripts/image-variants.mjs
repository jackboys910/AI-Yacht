#!/usr/bin/env node
/**
 * Smaller copies of the photographs in `public/assets`, for Т-01.
 *
 *   node scripts/image-variants.mjs          # write them and the manifest
 *   node scripts/image-variants.mjs --check  # say what is missing, write nothing
 *
 * The site is a static export, so Next's image optimiser is not available and
 * nothing resizes a photograph on the way to the visitor: the file in the
 * repository is the file the phone downloads. A 1920-pixel-wide photograph
 * shown in a box 480 pixels wide is four times the bytes for no visible
 * difference, and on the home page that was most of a megabyte — enough, on
 * Lighthouse's throttled connection, to push Largest Contentful Paint past
 * four seconds and the score under the 85 the ТЗ asks for.
 *
 * So each photograph gets WebP copies at the widths the layout actually uses,
 * and `<Photo>` offers them through `srcset`. The original JPEG stays as the
 * fallback in `<img src>`: it is what a browser without WebP downloads, and
 * keeping it means nothing breaks if this script has never been run.
 *
 * It is **not** part of `npm run build`. It needs `sharp` and several seconds
 * per photograph, and the photographs change a few times a year — the owner's
 * own uploads go to Cloud Storage, which makes its own thumbnails. The
 * variants are committed, like the photographs themselves.
 *
 * After adding a photograph to `public/assets`, run it and commit what
 * appears. `--check` is there for a hook or a review that wants to know
 * whether somebody forgot.
 */

import { createRequire } from "node:module";
import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, parse } from "node:path";

const require = createRequire(import.meta.url);

const ASSETS = "public/assets";
const VARIANTS = join(ASSETS, "v");
const MANIFEST = "src/lib/content/asset-variants.json";

/**
 * The widths worth having.
 *
 * 480 is a lane photograph on a phone (about 170 CSS pixels at twice the
 * density, rounded up), 960 the same on a wide screen and a card anywhere,
 * 1440 a photograph that fills the window. Anything wider than the original
 * is skipped rather than upscaled.
 */
const WIDTHS = [480, 960, 1440];

/** Below this there is nothing to gain: the file is already small. */
const FLOOR_BYTES = 30 * 1024;

const check = process.argv.includes("--check");

function loadSharp() {
  try {
    return require("sharp");
  } catch (cause) {
    throw new Error(
      "нужен sharp: `npm install --no-save sharp`. " +
        "Он не записан в зависимости — в сборке на раннере он не нужен. " +
        `(${String(cause).split("\n")[0]})`,
    );
  }
}

async function main() {
  const sharp = check ? null : loadSharp();
  const names = (await readdir(ASSETS)).filter((name) => /\.(jpe?g|png)$/i.test(name));
  if (!check) await mkdir(VARIANTS, { recursive: true });

  const manifest = {};
  const missing = [];
  let wrote = 0;
  let bytes = 0;

  for (const name of names.sort()) {
    const source = join(ASSETS, name);
    const { size } = await stat(source);
    if (size < FLOOR_BYTES) continue;

    const { name: base } = parse(name);
    const original = check ? null : sharp(source);
    const meta = check ? null : await original.metadata();
    const widths = [];

    for (const width of WIDTHS) {
      if (meta && width >= meta.width) continue;
      const target = join(VARIANTS, `${base}-${width}.webp`);
      widths.push(width);

      if (check) {
        try {
          await stat(target);
        } catch {
          missing.push(target);
        }
        continue;
      }

      const body = await sharp(source).resize({ width }).webp({ quality: 72 }).toBuffer();
      await writeFile(target, body);
      wrote += 1;
      bytes += body.length;
      console.log(`  ${String(Math.round(body.length / 1024)).padStart(4)} КБ  ${target}`);
    }

    if (widths.length > 0) manifest[`/assets/${name}`] = widths;
  }

  if (check) {
    // The manifest on disk is what the pages were built against, so a photo
    // listed there without its files is the failure worth reporting.
    const listed = JSON.parse(await readFile(MANIFEST, "utf8").catch(() => "{}"));
    const gone = [];
    for (const [address, widths] of Object.entries(listed)) {
      const { name: base } = parse(address);
      for (const width of widths) {
        const target = join(VARIANTS, `${base}-${width}.webp`);
        try {
          await stat(target);
        } catch {
          gone.push(target);
        }
      }
    }
    if (gone.length === 0) {
      console.log(`все варианты на месте (${Object.keys(listed).length} фотографий)`);
      return;
    }
    console.error(`не хватает ${gone.length} файлов, первый — ${gone[0]}`);
    console.error("Запустите: node scripts/image-variants.mjs");
    process.exitCode = 1;
    return;
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `\n${wrote} файлов, ${Math.round(bytes / 1024 / 1024 * 10) / 10} МБ в ${VARIANTS}; ` +
      `манифест на ${Object.keys(manifest).length} фотографий — ${MANIFEST}`,
  );
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
