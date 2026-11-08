import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import type { Locale } from "@/i18n/config";

/**
 * The picture a link turns into when somebody shares it (Ш-03, Ш-04).
 *
 * Drawn at build time, not on request: the site is static files on an edge,
 * and there is nothing running to draw a picture when Facebook asks for one.
 * That works precisely because every address is known in advance — the same
 * reason the pages themselves can be printed ahead of time.
 *
 * Everything the card needs is read from disk or fetched here, deliberately.
 * A font fetched from fonts.google.com during a build makes the deploy fail
 * whenever that server is slow, for a reason nobody can act on.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Where the two families live; see the README beside them for why. */
const FONT_DIR = join(process.cwd(), "src", "assets", "fonts");

let cached: { display: ArrayBuffer; text: ArrayBuffer } | null = null;

/**
 * The fonts, read once per build.
 *
 * Six hundred kilobytes read from disk for every trip page, in both
 * languages, is time spent on nothing — the files cannot change between two
 * images of the same build.
 */
export async function ogFonts() {
  if (!cached) {
    const [display, text] = await Promise.all([
      readFile(join(FONT_DIR, "PlayfairDisplay.ttf")),
      readFile(join(FONT_DIR, "Manrope.ttf")),
    ]);
    cached = {
      display: display.buffer.slice(
        display.byteOffset,
        display.byteOffset + display.byteLength,
      ) as ArrayBuffer,
      text: text.buffer.slice(
        text.byteOffset,
        text.byteOffset + text.byteLength,
      ) as ArrayBuffer,
    };
  }

  return [
    { name: "Playfair", data: cached.display, style: "normal" as const, weight: 400 as const },
    { name: "Manrope", data: cached.text, style: "normal" as const, weight: 400 as const },
  ];
}

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Keep the card from carrying more than the services will accept. */
const MAX_PHOTO = 6_000_000;

const photos = new Map<string, string | null>();

/**
 * The cover photograph, as something the drawing can embed.
 *
 * Read in here rather than left as a `<img src>` for the renderer to
 * resolve, so that a photograph that will not load costs the card its
 * background and not the build its life. A trip whose picture is missing
 * still gets a card with its name on it.
 *
 * Two kinds of address arrive. A photograph the owner uploaded lives in
 * Firebase Storage and is fetched; one that shipped with the repository is a
 * path like `/assets/sunset-cat.jpg` and is **read from `public/`**. That
 * second branch is not a shortcut — handing a relative path to `fetch`
 * inside a build makes it a request to localhost:3000, where nothing is
 * listening, and the build sat there until it was killed at sixty seconds a
 * picture.
 *
 * The result is kept: the English and Russian cards for one trip are the
 * same photograph, and so are the two sizes of it.
 */
export async function ogBackground(url: string | undefined): Promise<string | null> {
  if (!url) return null;

  const cachedPhoto = photos.get(url);
  if (cachedPhoto !== undefined) return cachedPhoto;

  const data = url.startsWith("/") ? await fromPublic(url) : await fromNetwork(url);
  photos.set(url, data);
  return data;
}

async function fromPublic(url: string): Promise<string | null> {
  try {
    const path = join(process.cwd(), "public", url.split("?")[0].split("/").join(sep));
    const bytes = await readFile(path);
    if (bytes.byteLength > MAX_PHOTO) return null;
    const dot = path.lastIndexOf(".");
    const type = TYPES[path.slice(dot).toLowerCase()] ?? "image/jpeg";
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fromNetwork(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > MAX_PHOTO) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

const COPY = {
  dates: { en: "Dates", ru: "Даты" },
} as const;

/**
 * One card: the photograph, a dark wash over it, and the words.
 *
 * Plain flexbox and inline styles because that is all satori understands —
 * no Tailwind class reaches this, and a gap in its CSS support shows up as a
 * build error rather than a wrong picture, which is the better of the two.
 */
export function OgCard({
  title,
  place,
  dates,
  kicker,
  background,
  locale,
}: {
  title: string;
  place?: string;
  dates?: string;
  /** The section the page belongs to, in small caps above the title. */
  kicker?: string;
  background: string | null;
  locale: Locale;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#0B1F3A",
        fontFamily: "Manrope",
      }}
    >
      {background && (
        <img
          src={background}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Dark at the bottom, where the words are, and clear at the top,
          where the photograph is worth seeing. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(to bottom, rgba(11,31,58,0.35) 0%, rgba(11,31,58,0.75) 55%, rgba(11,31,58,0.95) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 30,
              letterSpacing: 8,
              color: "#FFFFFF",
              fontFamily: "Playfair",
            }}
          >
            NAZAROV
          </span>
          {kicker && (
            <span
              style={{
                fontSize: 20,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#D09945",
              }}
            >
              {kicker}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Playfair",
              fontSize: title.length > 48 ? 64 : 80,
              lineHeight: 1.05,
              color: "#FFFFFF",
              // Satori has no line clamp: a title long enough to push the
              // dates off the card is cut here instead.
              display: "flex",
            }}
          >
            {title.length > 110 ? `${title.slice(0, 107)}…` : title}
          </span>

          {(place || dates) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginTop: 28,
                fontSize: 30,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {place && <span style={{ display: "flex" }}>{place}</span>}
              {place && dates && (
                <span style={{ display: "flex", color: "#D09945" }}>·</span>
              )}
              {dates && (
                <span style={{ display: "flex" }}>
                  <span style={{ color: "#D09945", marginRight: 10 }}>
                    {COPY.dates[locale]}:
                  </span>
                  {dates}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
