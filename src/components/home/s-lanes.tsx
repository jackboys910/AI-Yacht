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
 * one above it, its photograph on the opposite side too — with a single gold
 * line threaded through. Read down the page, that is an S.
 *
 * Why the letter is drawn and not a picture: the owner can add an interest
 * from the panel (А-14), and a picture of an S with exactly five lobes would
 * then be a picture of the wrong letter. The path is generated from however
 * many sections there are.
 */
export function SLanes({ lanes }: { lanes: HomeLane[] }) {
  if (lanes.length === 0) return null;

  return (
    <div className="relative isolate mx-auto w-full max-w-3xl lg:max-w-4xl">
      <Ribbon count={lanes.length} />

      <ul className="relative flex flex-col gap-2 sm:gap-3">
        {lanes.map((lane, index) => (
          <li
            key={lane.id}
            // The offset that bends the column into a letter. 87% leaves 13%
            // to swing through: enough to read as a curve, little enough that
            // the names still scan as one list.
            className={`w-[87%] ${index % 2 === 0 ? "self-start" : "self-end"}`}
          >
            <Lane lane={lane} mirrored={index % 2 === 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lane({ lane, mirrored }: { lane: HomeLane; mirrored: boolean }) {
  return (
    <a
      href={lane.href}
      // The whole section is the link, not just the arrow — §4.3 asks for
      // that, and on a phone an arrow alone is a target you miss.
      // A fixed height, not one the text decides. §4.3 holds the whole screen
      // to one phone viewport, which only works if five sections cost a known
      // number of pixels — a caption that wraps to a third line on a narrow
      // phone would otherwise push the last section off the screen.
      // Opaque on purpose: the gold line runs behind the sections, and a
      // see-through section would show it crossing the name like a wire.
      // Hidden here, it surfaces only in the gaps and past the ends — which is
      // what makes it read as one ribbon woven through the letter. The hover
      // wash is therefore painted on top rather than let through from below.
      className={`group relative flex h-[72px] items-center gap-3 overflow-hidden rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--primary)] py-1.5 pr-4 transition duration-300 hover:border-[color:var(--gold)] hover:shadow-[0_0_45px_-14px_var(--gold)] sm:h-[88px] sm:gap-5 sm:py-2 sm:pr-6 lg:h-[90px] lg:hover:scale-[1.03] ${
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
        className={`relative block h-full w-[72px] shrink-0 overflow-hidden rounded-full bg-primary sm:w-32 lg:w-40 ${
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
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <span className="block h-full w-full bg-gradient-to-br from-white/15 to-transparent" />
        )}
      </span>

      <span className={`min-w-0 flex-1 ${mirrored ? "order-1" : "order-2"}`}>
        <span className="block font-display text-lg leading-none tracking-tight sm:text-2xl lg:text-3xl">
          <Initial label={lane.label} />
        </span>
        {lane.caption && (
          // Two lines at most. The section has a fixed height, so a long
          // caption on a narrow phone has to stop rather than grow.
          <span className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/65 sm:text-sm">
            {lane.caption}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className="order-3 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/60 text-sm text-[color:var(--gold)] transition group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--gold-foreground)] sm:h-10 sm:w-10"
      >
        →
      </span>
    </a>
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
 * The gold line threaded through the sections.
 *
 * One cubic curve per section, alternating side to side, stretched to whatever
 * height the sections take with `preserveAspectRatio="none"`. The stroke is
 * exempted from that stretch so it stays an even line rather than a wedge.
 */
function Ribbon({ count }: { count: number }) {
  const step = 100;
  const right = 94;
  const left = 6;

  let path = `M ${right} 0`;
  for (let index = 0; index < count; index += 1) {
    const from = index % 2 === 0 ? right : left;
    const to = index % 2 === 0 ? left : right;
    const top = index * step;
    path += ` C ${from} ${top + step * 0.6}, ${to} ${top + step * 0.4}, ${to} ${top + step}`;
  }

  return (
    <svg
      viewBox={`0 0 100 ${count * step}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -inset-y-4 inset-x-0 -z-10 h-[calc(100%+2rem)] w-full"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.55"
      />
    </svg>
  );
}
