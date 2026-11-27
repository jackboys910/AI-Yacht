import { Photo } from "@/components/photo";
import type { Locale } from "@/i18n/config";
import type { Person, TreeRow } from "@/lib/family/types";

/**
 * A round portrait: the first photograph when the family has one, the
 * person's initials otherwise. Monograms rather than grey silhouettes — a
 * tree of empty heads looks unfinished, a tree of monograms looks designed.
 *
 * The ring says something too: gold for the generations in living memory,
 * old brass for the archive centuries, silver for the one who fell in the
 * war, and a soft glow for the person the tree is drawn for.
 */
export function PersonPortrait({
  person,
  locale,
  size,
  era,
}: {
  person: Person;
  locale: Locale;
  size: number;
  era: TreeRow["era"];
}) {
  const photo = person.photos?.[0];
  const ring = person.memorial
    ? "conic-gradient(from 210deg, #f4f1ea, #9aa3b5, #f4f1ea, #6f7890, #f4f1ea)"
    : era === "early" || era === "imperial"
      ? "conic-gradient(from 210deg, #d9b878, #7a5a2c, #e8cf98, #6b4e26, #d9b878)"
      : "conic-gradient(from 210deg, #f1cf7f, #a9802f, #ffe6a8, #8e6a25, #f1cf7f)";

  return (
    <span
      className={`fam-develop relative grid shrink-0 place-items-center rounded-full p-[2.5px] ${
        person.focus ? "shadow-[0_0_28px_6px_color-mix(in_oklab,var(--gold)_45%,transparent)]" : ""
      }`}
      style={{ width: size, height: size, background: ring }}
    >
      <span
        className={`grid size-full place-items-center overflow-hidden rounded-full font-display text-white ${
          era === "early" || era === "imperial"
            ? "bg-[radial-gradient(circle_at_32%_26%,#4a3a26,#1c150d)]"
            : "bg-[radial-gradient(circle_at_32%_26%,#2f4572,#0f1a2e)]"
        }`}
        style={{ fontSize: Math.round(size * (person.initials[locale].length > 1 ? 0.34 : 0.42)) }}
      >
        {photo ? (
          <Photo
            src={photo.src}
            alt={photo.alt[locale]}
            width={photo.width}
            height={photo.height}
            sizes={`${size}px`}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="tracking-wide opacity-90">
            {person.initials[locale]}
          </span>
        )}
      </span>
    </span>
  );
}
