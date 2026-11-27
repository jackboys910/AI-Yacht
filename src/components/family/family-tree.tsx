"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/photo";
import type { Locale } from "@/i18n/config";
import type { FamilyTree, Person, TreeRow } from "@/lib/family/types";
import { familyCopy as c } from "./family-copy";
import { PersonPortrait } from "./person-portrait";

/**
 * The tree, read from today into the past.
 *
 * Each generation is one row: on the left, on paper, the year and what was
 * happening then; on the right, in the night colour, the people. A click on
 * the year goes down to that era's chapter; a click on a person opens what
 * the records say about them.
 *
 * The rows grow into view as the page scrolls (CSS scroll-driven animations
 * in family.css — no script involved), the gold lines between generations
 * draw themselves, and a small globe in the corner turns to wherever the
 * generation on screen lived.
 */
export function FamilyTreeView({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(tree.rows[0].id);
  const [inView, setInView] = useState(false);
  const [open, setOpen] = useState<{ person: Person; row: TreeRow } | null>(null);

  // Which generation is crossing the middle of the screen.
  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const rows = root.querySelectorAll<HTMLElement>("[data-row]");
    const middle = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.getAttribute("data-row") ?? "");
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    rows.forEach((row) => middle.observe(row));
    const whole = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "-40% 0px -40% 0px",
    });
    whole.observe(root);
    return () => {
      middle.disconnect();
      whole.disconnect();
    };
  }, []);

  const activeRow = tree.rows.find((row) => row.id === active) ?? tree.rows[0];
  const place = tree.places.find((one) => one.id === activeRow.placeId);
  const firstPair = tree.rows.findIndex((row) => row.kind === "pair");

  return (
    <section ref={section} id="tree" className="fam scroll-mt-16 bg-[color:var(--paper)] text-[color:var(--ink)]">
      <div className="container-narrow pb-10 pt-16 sm:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
          {c.timeline[locale]} · {c.generations[locale]}
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.treeTitle[locale]}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-[color:var(--ink-soft)]">{c.treeLead[locale]}</p>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden border-y border-[color:var(--paper-deep)] md:rounded-3xl md:border md:shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid">
          <p className="px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {c.timeline[locale]}
          </p>
          <p className="bg-[color:var(--night)] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
            {c.generations[locale]}
          </p>
        </div>

        {tree.rows.map((row, index) => (
          <Row
            key={row.id}
            row={row}
            tree={tree}
            locale={locale}
            index={index}
            last={index === tree.rows.length - 1}
            fork={index === firstPair}
            active={row.id === active}
            onOpen={(person) => setOpen({ person, row })}
          />
        ))}
      </div>

      <div className="container-narrow py-10">
        {tree.notes.map((note) => (
          <p key={note.en} className="text-xs leading-relaxed text-[color:var(--ink-soft)]">
            {note[locale]}
          </p>
        ))}
      </div>

      <MiniGlobe
        visible={inView}
        lng={place?.lng ?? 40}
        label={place?.name[locale] ?? ""}
        year={activeRow.year[locale]}
        locale={locale}
      />

      <PersonDialog open={open} locale={locale} tree={tree} onClose={() => setOpen(null)} />
    </section>
  );
}

const PAPER: Record<TreeRow["era"], string> = {
  today: "oklch(97.2% 0.012 85)",
  modern: "oklch(95.8% 0.02 82)",
  imperial: "oklch(94.2% 0.03 78)",
  early: "oklch(92% 0.04 74)",
};

function Row({
  row,
  tree,
  locale,
  index,
  last,
  fork,
  active,
  onOpen,
}: {
  row: TreeRow;
  tree: FamilyTree;
  locale: Locale;
  index: number;
  last: boolean;
  fork: boolean;
  active: boolean;
  onOpen: (person: Person) => void;
}) {
  const people = row.people.map((id) => tree.people[id]).filter(Boolean);
  const first = index === 0;
  const line = "fam-draw absolute w-px bg-[color:var(--gold-line)]";

  return (
    <div
      id={`row-${row.id}`}
      data-row={row.id}
      className="grid scroll-mt-24 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      {/* ——— The year and its time ——— */}
      <div
        className="relative border-t border-[color:var(--paper-deep)] px-5 py-8 sm:px-8 md:py-12"
        style={{ background: PAPER[row.era] }}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1 bg-[color:var(--gold)] transition-opacity duration-500 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
        <a href={`#era-${row.id}`} className="fam-reveal group block">
          <span className="block font-display text-4xl leading-none tracking-tight transition-colors group-hover:text-[color:var(--gold)] sm:text-5xl">
            {row.year[locale]}
          </span>
          <span className="mt-3 block text-lg font-semibold leading-snug">{row.title[locale]}</span>
          <span className="mt-2 block text-sm leading-relaxed text-[color:var(--ink-soft)]">
            {row.summary[locale]}
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
            {c.readMore[locale]}
            <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </span>
        </a>
      </div>

      {/* ——— The people ——— */}
      <div className="relative flex flex-col justify-center bg-[color:var(--night)] px-3 py-10 text-white sm:px-6 md:py-12">
        {row.kind === "single" && (
          <span
            aria-hidden="true"
            className={`${line} left-1/2 ${first ? "top-1/2" : "top-0"} ${last ? "h-1/2" : "bottom-0"}`}
          />
        )}

        {row.kind === "pair" && fork && (
          <>
            <span aria-hidden="true" className={`${line} left-1/2 top-0 h-7`} />
            <span
              aria-hidden="true"
              className="absolute left-1/4 right-1/4 top-7 h-px bg-[color:var(--gold-line)]"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--night)] px-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)]"
            >
              {c.marriage[locale]}
            </span>
            <span aria-hidden="true" className={`${line} left-1/4 top-7 bottom-0`} />
            <span aria-hidden="true" className={`${line} left-3/4 top-7 bottom-0`} />
          </>
        )}

        {row.kind === "pair" && !fork && (
          <>
            <span aria-hidden="true" className={`${line} left-1/4 top-0 ${last ? "h-1/2" : "bottom-0"}`} />
            <span aria-hidden="true" className={`${line} left-3/4 top-0 ${last ? "h-1/2" : "bottom-0"}`} />
          </>
        )}

        {row.kind === "single" ? (
          <div className="relative flex flex-col items-center gap-3">
            <PersonCard person={people[0]} row={row} locale={locale} onOpen={onOpen} />
            {people.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2">
                {people.slice(1).map((sibling) => (
                  <button
                    key={sibling.id}
                    type="button"
                    onClick={() => onOpen(sibling)}
                    className="fam-reveal flex items-center gap-2 rounded-full border border-white/15 bg-[color:var(--night-2)] py-1 pl-1 pr-4 text-sm text-white/85 transition hover:border-[color:var(--gold)]"
                  >
                    <PersonPortrait person={sibling} locale={locale} size={32} era={row.era} />
                    <span>
                      {sibling.short[locale]}
                      {sibling.role && <span className="ml-1.5 text-xs text-white/45">· {sibling.role[locale]}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`relative grid grid-cols-2 gap-2 sm:gap-4 ${fork ? "pt-8" : ""}`}>
            {fork &&
              tree.lines.map((title) => (
                <p
                  key={title.en}
                  className="mx-auto -mt-3 mb-1 rounded-full bg-[color:var(--night)] px-2 text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.16em] text-[color:var(--gold)] sm:text-[11px]"
                >
                  {title[locale]}
                </p>
              ))}
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                row={row}
                locale={locale}
                onOpen={onOpen}
                compact
                hideSpouse={fork}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  row,
  locale,
  compact = false,
  hideSpouse = false,
  onOpen,
}: {
  person: Person;
  row: TreeRow;
  locale: Locale;
  compact?: boolean;
  /** The couple stand side by side; naming each other would be noise. */
  hideSpouse?: boolean;
  onOpen: (person: Person) => void;
}) {
  const photos = person.photos?.length ?? 0;
  const spouse = person.spouses?.[0];

  return (
    <button
      type="button"
      onClick={() => onOpen(person)}
      className={`fam-reveal group relative w-full rounded-2xl border border-white/10 bg-[color:var(--night-2)] text-white transition hover:-translate-y-0.5 hover:border-[color:var(--gold)]/60 hover:shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--gold)_45%,transparent)] ${
        compact
          ? "flex flex-col items-center gap-3 p-3 text-center sm:p-4 lg:flex-row lg:items-center lg:text-left"
          : "flex max-w-md items-center gap-4 p-4 text-left sm:gap-5 sm:p-5"
      } ${person.focus ? "border-[color:var(--gold)]/50" : ""}`}
    >
      <PersonPortrait person={person} locale={locale} size={compact ? 64 : 92} era={row.era} />
      <span className="min-w-0">
        <span
          className={`fit-words block font-display leading-tight ${compact ? "text-[15px] sm:text-lg" : "text-xl sm:text-2xl"}`}
        >
          {person.short[locale]}
        </span>
        {(person.life || person.role) && (
          <span className="mt-1 block text-xs text-white/60">
            {[person.life?.[locale], !compact ? person.role?.[locale] : null].filter(Boolean).join(" · ")}
          </span>
        )}
        {person.place && <span className="mt-0.5 block text-xs text-white/45">{person.place[locale]}</span>}
        {compact && spouse && !hideSpouse && (
          <span className="mt-1.5 line-clamp-2 block text-[11px] leading-snug text-white/45">
            + {spouse.name[locale]}
            {person.spouses && person.spouses.length > 1 ? ` +${person.spouses.length - 1}` : ""}
          </span>
        )}
        {person.memorial && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/80">
            ✦ {c.inMemory[locale]}
          </span>
        )}
        <span className="mt-2 block text-xs font-medium text-[color:var(--gold)]">
          {photos > 0 ? `${c.photos[locale]} (${photos})` : c.more[locale]}{" "}
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
            ↗
          </span>
        </span>
      </span>
    </button>
  );
}

function PersonDialog({
  open,
  tree,
  locale,
  onClose,
}: {
  open: { person: Person; row: TreeRow } | null;
  tree: FamilyTree;
  locale: Locale;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const person = open?.person;
  const row = open?.row;
  const chapter = row && tree.chapters.some((one) => one.rowId === row.id);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fam m-auto max-h-[88svh] w-[min(640px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--night)] p-0 text-white shadow-[var(--shadow-elegant)] backdrop:bg-[#060b16]/70 backdrop:backdrop-blur-sm"
    >
      {person && row && (
        <div className="max-h-[88svh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <PersonPortrait person={person} locale={locale} size={88} era={row.era} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                {row.year[locale]}
              </p>
              <h3 className="fit-words mt-1 font-display text-2xl leading-tight sm:text-3xl">{person.name[locale]}</h3>
              <p className="mt-1.5 text-sm text-white/60">
                {[person.life?.[locale], person.place?.[locale]].filter(Boolean).join(" · ")}
              </p>
              {person.role && <p className="mt-0.5 text-sm text-white/45">{person.role[locale]}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={c.close[locale]}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white hover:text-white"
            >
              ✕
            </button>
          </div>

          {person.memorial && (
            <p className="mt-5 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
              ✦ {c.inMemory[locale]}
            </p>
          )}

          <dl className="mt-6 space-y-4 text-sm">
            {person.spouses && person.spouses.length > 0 && (
              <Fact title={person.spouses.length > 1 ? c.spouses[locale] : c.spouse[locale]}>
                <ul className="space-y-1.5">
                  {person.spouses.map((one) => (
                    <li key={one.name.en}>
                      <span className="text-white">{one.name[locale]}</span>
                      {one.note && <span className="text-white/55"> — {one.note[locale]}</span>}
                    </li>
                  ))}
                </ul>
              </Fact>
            )}
            {person.siblings && <Fact title={c.siblings[locale]}>{person.siblings[locale]}</Fact>}
            {person.children && <Fact title={c.children[locale]}>{person.children[locale]}</Fact>}
            {person.notes && person.notes.length > 0 && (
              <Fact title={c.records[locale]}>
                <ul className="space-y-2">
                  {person.notes.map((note) => (
                    <li key={note.en} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[color:var(--gold)]" />
                      <span>{note[locale]}</span>
                    </li>
                  ))}
                </ul>
              </Fact>
            )}
            <Fact title={c.photos[locale]}>
              {person.photos && person.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {person.photos.map((photo) => (
                    <figure key={photo.src}>
                      <Photo
                        src={photo.src}
                        alt={photo.alt[locale]}
                        width={photo.width}
                        height={photo.height}
                        sizes="200px"
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      {photo.caption && (
                        <figcaption className="mt-1 text-xs text-white/50">{photo.caption[locale]}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              ) : (
                <span className="text-white/50">{c.noPhotos[locale]}</span>
              )}
            </Fact>
          </dl>

          {chapter && (
            <a
              href={`#era-${row.id}`}
              onClick={onClose}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
            >
              {c.thisEra[locale]}: {row.title[locale]} <span aria-hidden="true">↓</span>
            </a>
          )}
        </div>
      )}
    </dialog>
  );
}

function Fact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{title}</dt>
      <dd className="mt-2 leading-relaxed text-white/85">{children}</dd>
    </div>
  );
}

/**
 * The Earth that is always on screen while the tree is read (the client's
 * brief: "эта часть Земли всегда на экране"). It turns to the generation in
 * the middle of the screen, and a tap on it goes down to the full globe.
 */
function MiniGlobe({
  visible,
  lng,
  label,
  year,
  locale,
}: {
  visible: boolean;
  lng: number;
  label: string;
  year: string;
  locale: Locale;
}) {
  return (
    <a
      href="#world"
      aria-label={c.globeLabel[locale]}
      tabIndex={visible ? 0 : -1}
      className={`fam fixed bottom-4 right-4 z-40 flex items-center gap-3 transition-all duration-500 sm:bottom-6 sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <span className="hidden rounded-2xl border border-white/10 bg-[#0b1222]/85 px-3 py-2 text-right text-white shadow-lg backdrop-blur-md min-[420px]:block">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">{year}</span>
        <span key={label} className="block text-sm motion-safe:animate-[fam-rise_0.5s_ease-out_both]">
          {label}
        </span>
      </span>
      <span
        className="fam-globe [--d:60px] sm:[--d:78px]"
        style={{ "--lon": lng } as React.CSSProperties}
      />
    </a>
  );
}
