import type { ReactNode } from "react";
import type { HomeLane } from "@/lib/content/home";

/**
 * The letter S the home page is built on (ТЗ v4, §4, mock-up
 * `docs/sources/mockup-home-s.png`).
 *
 * Every interest of the owner's starts with the same letter — Sailing,
 * Snowboarding, Skydiving, Son, Software — and the Community Concept makes
 * that the meaning of the site rather than a flourish: "one S, many
 * directions, one community". So the S is not decoration behind the sections.
 * It is the thing you see first, and the sections live inside it.
 *
 * The first attempt drew the sections as capsules with a hairline threaded
 * between them, and it failed for a reason worth writing down: the capsules
 * were opaque, so the line could only ever appear in the gaps, and five
 * outlined pills in a column read as a list no matter what is behind them.
 * This version inverts that. There are no capsules. One thick gold stroke is
 * drawn **over** the photographs, the way it is in the mock-up, and the text
 * sits above the stroke so nothing crosses a word. What the eye follows is
 * the letter.
 *
 * Why the letter is drawn and not a picture: the owner can add an interest
 * from the panel (А-14), and a picture of an S with exactly five lobes would
 * then be a picture of the wrong letter. The path is one fixed S stretched to
 * whatever height the sections take.
 */
export function SLanes({
  lanes,
  banner,
  headline,
}: {
  lanes: HomeLane[];
  /** "A community, not a business" — one line above the letter. */
  banner: ReactNode;
  /** Sits in the top-right counter of the S on a wide screen, below it on a phone. */
  headline: ReactNode;
}) {
  if (lanes.length === 0) return null;

  // Where the stroke runs changes halfway down: the upper bowl of an S comes
  // down its left side, the lower bowl down its right. The photographs follow
  // it, so the gold line crosses imagery rather than text.
  const waist = Math.ceil(lanes.length / 2);

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
      {banner}

      {/* The gap is the headroom the top arc needs: the letter is drawn into
          it, and anything less puts the curve through the line above. */}
      <div className="relative mt-12 sm:mt-16">
        <SStroke />

        <ul className="flex flex-col gap-2 sm:gap-3">
          {lanes.map((lane, index) => (
            <li
              key={lane.id}
              // The top two sections give up their right-hand side on a wide
              // screen: that space is the counter of the upper bowl, and the
              // headline goes in it.
              className={index < 2 ? "lg:w-[60%]" : ""}
            >
              <Lane lane={lane} photoLeft={index < waist} />
            </li>
          ))}
        </ul>

        {/* Wide screens only. Lower down the headline would sit on the waist
            of the letter, and there is no room beside anything on a phone. */}
        <div className="pointer-events-none absolute right-0 top-[6%] z-20 hidden w-[36%] lg:block">
          {headline}
        </div>
      </div>

      <div className="mt-4 lg:hidden">{headline}</div>
    </div>
  );
}

/**
 * The letter itself: one stroke, drawn twice.
 *
 * The wide faint pass is the glow and the narrow bright one is the line.
 * Both are exempt from the stretch — `vectorEffect` keeps a stroke the same
 * width however the box is squashed, which is what stops the letter turning
 * into a wedge on a tall phone.
 *
 * The path is a plain S: upper terminal top right, over the top, down the
 * left of the upper bowl, across the waist, down the right of the lower bowl,
 * round the bottom and out at the lower left. Stretched vertically it reads
 * as a condensed S rather than as a curve, which is the whole point.
 */
function SStroke() {
  const path =
    "M 92 6 C 92 -1, 56 -4, 32 2 C 12 7, 7 24, 26 35 " +
    "C 43 45, 80 49, 88 63 C 97 78, 80 99, 50 99 C 26 99, 12 90, 12 78";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      // Headroom above the sections, and the top arc drawn into it. Without
      // it the arc has nowhere to go but through the first section's heading,
      // and a gold line across a word is a mistake rather than a flourish.
      className="pointer-events-none absolute -top-11 bottom-0 left-0 z-10 h-[calc(100%+2.75rem)] w-full"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="22"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.13"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="4.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.95"
      />
    </svg>
  );
}

function Lane({ lane, photoLeft }: { lane: HomeLane; photoLeft: boolean }) {
  return (
    <a
      href={lane.href}
      title={lane.label}
      // The whole section is the link, not just the arrow — §4.3 asks for
      // that, and on a phone an arrow alone is a target you miss.
      className="group flex h-[104px] items-center gap-4 rounded-2xl transition duration-300 sm:h-28 sm:gap-6 lg:h-[118px] lg:hover:scale-[1.02]"
    >
      {/* Painted under the stroke on purpose: the gold line crossing a
          photograph is what the mock-up does and what makes the letter read
          as one continuous thing rather than five fragments. */}
      <span
        className={`relative z-0 block h-full w-[42%] shrink-0 overflow-hidden rounded-2xl bg-[color:var(--primary)]/60 sm:w-[44%] ${
          photoLeft ? "order-1" : "order-2"
        }`}
      >
        {lane.image ? (
          <img
            src={lane.image.url}
            alt={lane.image.alt}
            width={lane.image.width}
            height={lane.image.height}
            loading="lazy"
            // Where to crop. The frame is nothing like the shape of the
            // photograph, and the middle of a photograph of a person is
            // their chest.
            style={{
              objectPosition: `${(lane.image.focusX ?? 0.5) * 100}% ${
                (lane.image.focusY ?? 0.5) * 100
              }%`,
            }}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <span className="block h-full w-full bg-gradient-to-br from-white/15 to-transparent" />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[color:var(--primary)]/35 transition duration-300 group-hover:bg-transparent"
        />
      </span>

      {/* Above the stroke: a gold line through a name would be a mistake,
          not a flourish. */}
      <span
        className={`relative z-20 min-w-0 flex-1 ${photoLeft ? "order-2" : "order-1"}`}
      >
        {/* Never wrapped: the gold initial is an inline-block, which gives the
            browser a break opportunity right after it, and "Snowboarding"
            duly split into "S" and "nowboarding" on a narrow phone. */}
        <span className="block whitespace-nowrap font-display text-[17px] uppercase leading-none tracking-[0.02em] text-white sm:text-[26px] lg:text-3xl">
          <Initial label={lane.label} />
        </span>

        {lane.caption && (
          // Two lines at most. The section has a fixed height, so a long
          // caption on a narrow phone has to stop rather than grow.
          <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/70 sm:mt-2 sm:text-sm">
            {lane.caption}
          </span>
        )}

        <span
          aria-hidden="true"
          className="mt-2 grid h-7 w-7 place-items-center rounded-full border border-[color:var(--gold)]/70 text-xs text-[color:var(--gold)] transition group-hover:bg-[color:var(--gold)] group-hover:text-[color:var(--gold-foreground)] sm:mt-3 sm:h-9 sm:w-9 sm:text-sm"
        >
          →
        </span>
      </span>
    </a>
  );
}

/**
 * The name, with its S picked out in gold and set larger.
 *
 * Only when the name actually begins with one. An interest the owner adds
 * from the panel may well be called Hiking, and a gold "H" would claim a
 * meaning the site does not have.
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
      <span className="inline-block align-[-0.08em] text-[1.5em] leading-none text-[color:var(--gold)] drop-shadow-[0_0_12px_rgba(208,153,69,0.5)]">
        {first}
      </span>
      {label.slice(1)}
    </>
  );
}
