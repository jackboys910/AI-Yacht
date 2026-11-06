import type { ReactNode } from "react";
import type { HomeLane } from "@/lib/content/home";

/**
 * The letter S the home page is built on (ТЗ v4, §4).
 *
 * Every interest of the owner's starts with the same letter — Sailing,
 * Snowboarding, Skydiving, Son, Software — and the Community Concept makes
 * that the meaning of the site rather than a flourish: "one S, many
 * directions, one community". So the S is not decoration laid behind the
 * sections; the sections are what draws it.
 *
 * They are laid out in a serpentine — each one offset to the side opposite the
 * one above it, its photograph on the opposite side too — with a gold ribbon
 * threaded through. Read down the page, that is an S.
 *
 * The banner the owner asked to come first ("a community, not a business") is
 * the top of the letter rather than a heading above it, which is how his
 * mock-up has it and what leaves the S the height to be a letter at all.
 *
 * Why the letter is drawn and not a picture: the owner can add an interest
 * from the panel (А-14), and a picture of an S with exactly five lobes would
 * then be a picture of the wrong letter. The path is generated from however
 * many sections there are.
 */
export function SLanes({ lanes, banner }: { lanes: HomeLane[]; banner: ReactNode }) {
  if (lanes.length === 0) return null;

  return (
    <div className="relative isolate mx-auto w-full max-w-3xl lg:max-w-4xl">
      <Ribbon count={lanes.length + 1} />

      <ul className="relative flex flex-col gap-2 sm:gap-3">
        {/* The top of the letter: wider than the rest, offset the same way the
            first direction is not, so the curve starts from it. */}
        <li className="w-[96%] self-start">{banner}</li>

        {lanes.map((lane, index) => (
          <li
            key={lane.id}
            // The offset that bends the column into a letter. 85% leaves 15%
            // to swing through: enough to read as a curve, little enough that
            // the names still scan as one list.
            className={`w-[85%] ${index % 2 === 0 ? "self-end" : "self-start"}`}
          >
            <Lane lane={lane} mirrored={index % 2 === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The shell every section of the letter shares, banner included. */
export function Lobe({
  children,
  className = "",
  href,
  title,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  title?: string;
}) {
  // Opaque on purpose: the gold ribbon runs behind the sections, and a
  // see-through section would show it crossing the name like a wire. Hidden
  // here, it surfaces only in the gaps and past the ends — which is what makes
  // it read as one ribbon woven through the letter.
  const shell = `group relative flex items-center overflow-hidden rounded-full border border-[color:var(--gold)]/45 bg-[color:var(--primary)] shadow-[0_0_30px_-18px_var(--gold)] transition duration-300 ${className}`;

  if (!href) return <div className={shell}>{children}</div>;

  return (
    <a
      href={href}
      title={title}
      className={`${shell} hover:border-[color:var(--gold)] hover:shadow-[0_0_45px_-12px_var(--gold)] lg:hover:scale-[1.03]`}
    >
      {children}
    </a>
  );
}

function Lane({ lane, mirrored }: { lane: HomeLane; mirrored: boolean }) {
  return (
    <Lobe
      href={lane.href}
      // The whole section is the link, not just the arrow — §4.3 asks for
      // that, and on a phone an arrow alone is a target you miss.
      className={`h-[100px] gap-3 py-1.5 pr-4 sm:h-28 sm:gap-5 sm:py-2 sm:pr-6 lg:h-[104px] ${
        mirrored ? "pl-6 sm:pl-9" : "pl-1.5 sm:pl-2"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[color:var(--gold)]/0 transition duration-300 group-hover:bg-[color:var(--gold)]/10"
      />

      {/* The photograph swaps sides from one section to the next; the arrow
          stays where a reader looks for it, at the end of the row. */}
      <span
        className={`relative block h-full w-[88px] shrink-0 overflow-hidden rounded-full bg-primary sm:w-40 lg:w-48 ${
          mirrored ? "order-2" : "order-1"
        }`}
      >
        {lane.image ? (
          <img
            src={lane.image.url}
            alt={lane.image.alt}
            width={lane.image.width}
            height={lane.image.height}
            loading="lazy"
            // Where to crop. A round thumbnail is nothing like the shape of
            // the photograph, and the middle of a photograph of a person is
            // their chest.
            style={{
              objectPosition: `${(lane.image.focusX ?? 0.5) * 100}% ${
                (lane.image.focusY ?? 0.5) * 100
              }%`,
            }}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <span className="block h-full w-full bg-gradient-to-br from-white/15 to-transparent" />
        )}
      </span>

      <span className={`min-w-0 flex-1 ${mirrored ? "order-1" : "order-2"}`}>
        {/* Never wrapped: the gold initial is an inline-block, which gives the
            browser a break opportunity right after it, and "Snowboarding" duly
            split into "S" and "nowboarding" on a narrow phone. */}
        <span className="block whitespace-nowrap font-display text-[17px] leading-none tracking-tight text-white sm:text-3xl lg:text-4xl">
          <Initial label={lane.label} />
        </span>
        {lane.caption && (
          // Two lines at most. The section has a fixed height, so a long
          // caption on a narrow phone has to stop rather than grow.
          <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/65 sm:text-sm">
            {lane.caption}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className="order-3 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/60 text-sm text-[color:var(--gold)] transition group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--gold-foreground)] sm:h-11 sm:w-11"
      >
        →
      </span>
    </Lobe>
  );
}

/**
 * The name, with its S picked out in gold and set larger.
 *
 * Only when the name actually begins with one. An interest the owner adds from
 * the panel may well be called Hiking, and a gold "H" would claim a meaning
 * the site does not have.
 *
 * The glyph is sized in `em` so it follows the heading at every width, and
 * `leading-none` on both keeps the taller letter from pushing the line box
 * open — the sections have a height budget to fit a phone screen (§4.3).
 */
function Initial({ label }: { label: string }) {
  const first = label.slice(0, 1);
  if (first.toLowerCase() !== "s") return <>{label}</>;

  return (
    <>
      <span className="inline-block align-[-0.06em] text-[1.45em] leading-none text-[color:var(--gold)]">
        {first}
      </span>
      {label.slice(1)}
    </>
  );
}

/**
 * The gold ribbon threaded through the sections.
 *
 * One cubic curve per section, alternating side to side, stretched to whatever
 * height the sections take with `preserveAspectRatio="none"`. Two strokes, not
 * one: a wide faint pass that reads as a glow and a narrow bright pass that
 * reads as the line itself. Both are exempt from the stretch, so neither turns
 * into a wedge.
 */
function Ribbon({ count }: { count: number }) {
  const step = 100;
  const right = 96;
  const left = 4;

  let path = `M ${left} -20`;
  for (let index = 0; index < count; index += 1) {
    const from = index % 2 === 0 ? left : right;
    const to = index % 2 === 0 ? right : left;
    const top = index * step - 20;
    path += ` C ${from} ${top + step * 0.6}, ${to} ${top + step * 0.4}, ${to} ${top + step}`;
  }

  return (
    <svg
      viewBox={`0 0 100 ${count * step}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -inset-y-5 inset-x-0 -z-10 h-[calc(100%+2.5rem)] w-full"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="14"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.1"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.75"
      />
    </svg>
  );
}
