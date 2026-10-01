import { Eyebrow } from "@/components/eyebrow";
import type { Locale } from "@/i18n/config";
import type { HomeTile } from "@/lib/content/home";
import { pickOrOther } from "@/lib/content/trip-view";

const COPY = {
  heading: { en: "My interests", ru: "My interests" },
} as const;

/**
 * The "My interests" tiles (§6.1): a photo, the tab's name and the line under
 * it — "Sailing — On the water".
 *
 * The heading stays English in both languages, to read as the same label as
 * "MY INTERESTS" in the header, which §16.1 fixes that way.
 *
 * Both the name and the caption come from the database, so an interest the
 * owner adds in the panel gets its tile with no developer involved (А-14).
 */
export function InterestTiles({
  tiles,
  locale,
}: {
  tiles: HomeTile[];
  locale: Locale;
}) {
  if (tiles.length === 0) return null;

  return (
    <section id="interests" className="bg-background py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{COPY.heading[locale]}</Eyebrow>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <a
              key={tile.slug}
              href={tile.href}
              className="group relative isolate flex min-h-64 flex-col justify-end overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-sm transition hover:shadow-card"
            >
              {tile.cover?.url && (
                <img
                  src={tile.cover.thumbUrl || tile.cover.url}
                  alt={pickOrOther(tile.cover.alt, locale)}
                  width={tile.cover.width || 640}
                  height={tile.cover.height || 800}
                  loading="lazy"
                  className="absolute inset-0 -z-10 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-90"
                />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/40 to-transparent" />

              <h3 className="font-display text-2xl leading-tight">{tile.label}</h3>
              {tile.caption && (
                <p className="mt-1 text-sm text-white/75">{tile.caption}</p>
              )}
              <span
                aria-hidden="true"
                className="mt-4 text-sm text-[color:var(--gold)] opacity-0 transition group-hover:opacity-100"
              >
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
