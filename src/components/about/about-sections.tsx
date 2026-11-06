import { Eyebrow } from "@/components/eyebrow";
import { SectionHead } from "@/components/section-head";
import type { Locale } from "@/i18n/config";
import { ABOUT } from "./about-copy";

/**
 * The About page, block by block (ТЗ v4, §5).
 *
 * The text is long — it is the owner's whole community concept — and read as
 * one column it would be a charter rather than a manifesto. So the blocks
 * alternate dark and light the way a trip page does, and his own photographs
 * sit between them to break the reading up.
 */

/** The first screen: who wrote this and why the site exists. */
export function AboutHero({ locale }: { locale: Locale }) {
  const t = ABOUT.hero;

  return (
    <section className="relative isolate overflow-hidden bg-primary pb-16 pt-28 text-white sm:pb-24 sm:pt-36">
      <img
        src="/assets/yasha-helm-sunrise.jpg"
        alt={t.imageAlt[locale]}
        width={1280}
        height={960}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/85 to-primary" />

      <div className="container-narrow relative">
        <Eyebrow tone="light">{t.eyebrow[locale]}</Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-3xl leading-[1.1] sm:text-5xl lg:text-6xl">
          {t.title[locale]}
        </h1>

        <div className="mt-10 max-w-2xl space-y-5 text-base leading-relaxed text-white/80 sm:text-lg">
          {t.paragraphs[locale].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Why the letter S — the five directions, each with its initial picked out. */
export function AboutLetter({ locale }: { locale: Locale }) {
  const t = ABOUT.letter;

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow[locale]}</Eyebrow>
        <div className="mt-6">
          <SectionHead>{t.title[locale]}</SectionHead>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t.lead[locale]}
        </p>

        {/* Separate cards rather than one panel split by hairlines: there are
            five directions and three columns, and a split panel would end on a
            visible empty sixth cell. Five is not a number the owner is stuck
            with either — he can add a direction from the panel. */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item) => (
            <li key={item.name} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-2xl leading-none">
                <span className="text-[1.4em] leading-none text-[color:var(--gold)]">
                  {item.name.slice(0, 1)}
                </span>
                {item.name.slice(1)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.text[locale]}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center font-display text-xl text-[color:var(--teal)] sm:text-2xl">
          {t.note[locale]}
        </p>
      </div>
    </section>
  );
}

/** What the community is for, with a photograph beside the list. */
export function AboutIdea({ locale }: { locale: Locale }) {
  const t = ABOUT.idea;

  return (
    <section className="bg-muted/40 py-16 sm:py-24">
      <div className="container-narrow grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>{t.eyebrow[locale]}</Eyebrow>
          <div className="mt-6">
            <SectionHead>{t.title[locale]}</SectionHead>
          </div>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.paragraphs[locale].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div>
          <img
            src="/assets/heliski-group.jpg"
            alt={t.imageAlt[locale]}
            width={1280}
            height={960}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-card"
          />
          <ul className="mt-8 space-y-3">
            {t.items[locale].map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--teal)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The four roles. */
export function AboutRoles({ locale }: { locale: Locale }) {
  const t = ABOUT.roles;

  return (
    <section id="roles" className="bg-primary py-16 text-white sm:py-24">
      <div className="container-narrow">
        <Eyebrow tone="light">{t.eyebrow[locale]}</Eyebrow>
        <div className="mt-6">
          <SectionHead tone="light">{t.title[locale]}</SectionHead>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {t.lead[locale]}
        </p>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2">
          {t.items.map((role, index) => (
            <li
              key={role.name.en}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
            >
              <span className="font-display text-sm text-[color:var(--gold)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-2xl leading-tight">
                {role.name[locale]}
              </h3>
              <p className="mt-1 text-sm uppercase tracking-[0.14em] text-white/45">
                {role.tagline[locale]}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                {role.text[locale]}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** The six steps from finding something to going on it. */
export function AboutSteps({ locale }: { locale: Locale }) {
  const t = ABOUT.steps;

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow[locale]}</Eyebrow>
        <div className="mt-6">
          <SectionHead>{t.title[locale]}</SectionHead>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((step, index) => (
            <li
              key={step.name.en}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display text-3xl leading-none text-[color:var(--teal)]/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl leading-tight">
                {step.name[locale]}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.text[locale]}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/[0.07] p-6 sm:p-8">
          <h3 className="font-display text-xl leading-tight sm:text-2xl">
            {t.orTitle[locale]}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t.orText[locale]}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Free, and what a trip can still cost. */
export function AboutFree({ locale }: { locale: Locale }) {
  const t = ABOUT.free;

  return (
    <section className="relative isolate overflow-hidden bg-primary py-16 text-white sm:py-24">
      <img
        src="/assets/marina-bay.jpg"
        alt={t.imageAlt[locale]}
        width={1280}
        height={583}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

      <div className="container-narrow relative">
        <Eyebrow tone="light">{t.eyebrow[locale]}</Eyebrow>
        <div className="mt-6">
          <SectionHead tone="light">{t.title[locale]}</SectionHead>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {t.lead[locale]}
        </p>

        <ul className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {t.items[locale].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
            >
              <span aria-hidden="true" className="text-[color:var(--gold)]">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/55">
          {t.note[locale]}
        </p>
      </div>
    </section>
  );
}

/** The seven values. */
export function AboutValues({ locale }: { locale: Locale }) {
  const t = ABOUT.values;

  return (
    <section className="bg-muted/40 py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow[locale]}</Eyebrow>
        <div className="mt-6">
          <SectionHead>{t.title[locale]}</SectionHead>
        </div>

        <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((value) => (
            <div key={value.name.en}>
              <dt className="font-display text-xl leading-tight">
                {value.name[locale]}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {value.text[locale]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** What applying commits you to — the quiet block, deliberately. */
export function AboutTerms({ locale }: { locale: Locale }) {
  const t = ABOUT.terms;

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow[locale]}</Eyebrow>
        <h2 className="mt-5 font-display text-2xl leading-tight sm:text-3xl">
          {t.title[locale]}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.lead[locale]}
        </p>

        <ul className="mt-8 grid max-w-4xl gap-x-10 gap-y-3 sm:grid-cols-2">
          {t.items[locale].map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
              />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl border-l-2 border-border pl-5 text-sm leading-relaxed text-muted-foreground">
          {t.note[locale]}
        </p>
      </div>
    </section>
  );
}

/** The closing thought. */
export function AboutClosing({
  locale,
  tripsHref,
}: {
  locale: Locale;
  tripsHref: string;
}) {
  const t = ABOUT.closing;

  return (
    <section className="bg-primary py-16 text-white sm:py-24">
      <div className="container-narrow max-w-3xl text-center">
        <h2 className="font-display text-2xl leading-tight sm:text-4xl">
          {t.title[locale]}
        </h2>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-white/75">
          {t.paragraphs[locale].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <a
          href={tripsHref}
          className="mt-10 inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.98]"
        >
          {locale === "en" ? "See upcoming trips" : "Смотреть ближайшие поездки"}
        </a>

        <p className="mt-10 font-display text-lg text-[color:var(--gold)] sm:text-xl">
          {t.sign[locale]}
        </p>
      </div>
    </section>
  );
}
