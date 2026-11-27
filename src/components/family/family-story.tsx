import type { Locale } from "@/i18n/config";
import type { FamilyTree } from "@/lib/family/types";
import { familyCopy as c } from "./family-copy";
import { EarthGlobe } from "./earth-globe";
import { FamilyCount } from "./family-count";
import { FamilyTreeView } from "./family-tree";
import { FamilyWorld } from "./family-world";
import "./family.css";

/**
 * A whole ancestry page, drawn from one `FamilyTree`: the hero, the tree
 * with its timeline, the journey on the globe, and the chapters the years
 * link down to. Hand it another family's data and it draws their page.
 */
export function FamilyStory({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  return (
    <>
      <FamilyHero tree={tree} locale={locale} />
      <FamilyTreeView tree={tree} locale={locale} />
      <FamilyWorld tree={tree} locale={locale} />
      <FamilyChapters tree={tree} locale={locale} />
    </>
  );
}

function FamilyHero({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  const { hero } = tree;
  return (
    <section className="fam fam-stars relative isolate overflow-hidden pb-16 pt-28 text-white sm:pb-24 sm:pt-36">
      <div className="fam-twinkle" />
      {/* The planet rising behind the title: the first sight of the globe the
          page ends on. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-24 opacity-60 sm:-right-16 sm:top-16 sm:opacity-80 lg:right-[4%] lg:top-1/2 lg:-translate-y-1/2 lg:opacity-100"
      >
        <EarthGlobe lon={25} lat={34} spin={4} className="w-[260px] sm:w-[380px] lg:w-[460px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[color:var(--night)]" />

      <div className="container-narrow relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--gold)] sm:text-xs">
          {hero.eyebrow[locale]}
        </p>
        <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.02] sm:text-7xl">{hero.title[locale]}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{hero.lead[locale]}</p>

        <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {hero.stats.map((stat) => (
            <div key={stat.label.en} className="border-l border-[color:var(--gold)]/50 pl-4">
              <dt className="sr-only">{stat.label[locale]}</dt>
              <dd className="font-display text-4xl leading-none text-[color:var(--gold)] sm:text-5xl">
                <FamilyCount value={stat.value} prefix={stat.prefix} suffix={stat.suffix?.[locale]} />
              </dd>
              <dd aria-hidden="true" className="mt-2 text-xs uppercase tracking-[0.14em] text-white/60">
                {stat.label[locale]}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#tree"
            className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
          >
            {c.toTree[locale]} ↓
          </a>
          <a
            href="#world"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white"
          >
            {c.toMap[locale]}
          </a>
        </div>
      </div>
    </section>
  );
}

function FamilyChapters({ tree, locale }: { tree: FamilyTree; locale: Locale }) {
  const rows = new Map(tree.rows.map((row) => [row.id, row]));
  return (
    <section className="fam bg-[color:var(--paper)] py-16 text-[color:var(--ink)] sm:py-24">
      <div className="container-narrow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
          {c.timeline[locale]}
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{c.chaptersTitle[locale]}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-[color:var(--ink-soft)]">{c.chaptersLead[locale]}</p>

        <div className="relative mt-12">
          {/* The thread the chapters hang on. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[7px] top-0 w-px bg-[color:var(--gold-line)] md:left-[calc(10rem+1.25rem)]"
          />
          {tree.chapters.map((chapter) => {
            const row = rows.get(chapter.rowId);
            if (!row) return null;
            return (
              <article
                key={chapter.rowId}
                id={`era-${chapter.rowId}`}
                className="fam-chapter relative scroll-mt-24 pb-10 pl-8 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10 md:pl-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 size-[15px] rounded-full border-2 border-[color:var(--gold)] bg-[color:var(--paper)] md:left-[calc(10rem+1.25rem-7px)]"
                />
                <p className="font-display text-3xl leading-none md:sticky md:top-28 md:self-start md:pt-1 md:text-right md:text-[2rem]">
                  {row.year[locale]}
                </p>
                <div className="fam-reveal fam-chapter-card mt-3 rounded-3xl border border-[color:var(--paper-deep)] bg-white/70 p-6 shadow-[0_20px_50px_-30px_color-mix(in_oklab,var(--ink)_45%,transparent)] sm:p-8 md:mt-0">
                  <h3 className="font-display text-2xl leading-tight sm:text-3xl">{row.title[locale]}</h3>
                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    {chapter.world.length > 0 && (
                      <ChapterPart title={c.world[locale]} lines={chapter.world.map((one) => one[locale])} />
                    )}
                    {chapter.family.length > 0 && (
                      <ChapterPart title={c.family[locale]} lines={chapter.family.map((one) => one[locale])} gold />
                    )}
                  </div>
                  <a
                    href={`#row-${row.id}`}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)] transition hover:text-[color:var(--gold)]"
                  >
                    <span aria-hidden="true">↑</span> {c.backToTree[locale]}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl border border-[color:var(--paper-deep)] bg-white/50 p-6 sm:p-8">
          <h2 className="font-display text-2xl sm:text-3xl">{c.sourcesTitle[locale]}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[color:var(--ink-soft)]">
            {tree.sources.credit[locale]}
          </p>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <SourceList title={c.archives[locale]} items={tree.sources.archives} locale={locale} />
            <SourceList title={c.literature[locale]} items={tree.sources.literature} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChapterPart({ title, lines, gold = false }: { title: string; lines: string[]; gold?: boolean }) {
  return (
    <div>
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
          gold ? "text-[color:var(--gold)]" : "text-[color:var(--ink-soft)]"
        }`}
      >
        {title}
      </p>
      <ul className="mt-3 space-y-3">
        {lines.map((line) => (
          <li key={line} className="flex gap-3 text-[15px] leading-relaxed">
            <span
              aria-hidden="true"
              className={`mt-2.5 size-1.5 shrink-0 rounded-full ${gold ? "bg-[color:var(--gold)]" : "bg-[color:var(--ink-soft)]/50"}`}
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceList({
  title,
  items,
  locale,
}: {
  title: string;
  items: FamilyTree["sources"]["archives"];
  locale: Locale;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item.label.en}>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener"
                className="group inline underline decoration-[color:var(--gold)]/50 underline-offset-4 transition hover:text-[color:var(--gold)] hover:decoration-[color:var(--gold)]"
              >
                {item.label[locale]}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="ml-1 inline size-3 -translate-y-px align-baseline opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h7v7M13 3 4 12" />
                </svg>
              </a>
            ) : (
              item.label[locale]
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
