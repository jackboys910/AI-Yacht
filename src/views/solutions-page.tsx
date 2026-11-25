import { Eyebrow } from "@/components/eyebrow";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { CalendlyBooking } from "@/components/solutions/calendly-booking";
import { solutionsCopy } from "@/components/solutions/solutions-copy";
import { SolutionsForm } from "@/components/solutions/solutions-form";
import { WorkGrid } from "@/components/solutions/work-grid";
import type { Locale } from "@/i18n/config";
import {
  solutionsHero,
  solutionsProcess,
  solutionsServices,
} from "@/lib/content/site-copy";
import type { Settings, WorkProject } from "@/lib/content/types";
import type { SiteChrome } from "./trip-page";

/**
 * `/solutions/` — the services page (§6.6, П-17).
 *
 * It replaces the IT Solutions landing that was here before, which sold
 * "a complete tech team" in nine sections. §6.6 asks for something shorter
 * and more concrete: what we build, what we have built, how it goes, and a
 * form. The order is the order of the decision a visitor makes — can you do
 * this, have you done it, what happens if I write, and then the two ways to
 * start.
 *
 * Booking comes before the form on purpose. A call is the easier commitment
 * of the two, and the form stays below it for whoever would rather write.
 *
 * Everything on the page except the headings comes from the panel: the
 * headline and subtitle from the settings, the services and the steps from
 * the settings when they are filled in, the projects from their own
 * collection. Each of those falls back to the text in `solutions-copy`, so
 * an untouched settings document leaves this page exactly as §6.6 writes it.
 */
export function SolutionsPage({
  locale,
  settings,
  projects,
  chrome,
  calendlyUrl,
}: {
  locale: Locale;
  settings: Settings | null;
  /** "Our work", from the panel. Empty falls back to the two in §6.6. */
  projects: WorkProject[];
  chrome: SiteChrome;
  /** Where a consultation is booked (ТЗ v4 §7). Empty hides the block. */
  calendlyUrl?: string;
}) {
  const c = solutionsCopy;
  const hero = solutionsHero(settings);
  const services = solutionsServices(settings);
  const steps = solutionsProcess(settings);

  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
        active="solutions"
      />

      <section className="relative isolate overflow-hidden bg-primary pb-16 pt-28 text-white sm:pb-24 sm:pt-36">
        <img
          src="/assets/laptop-deck.jpg"
          alt=""
          width={1400}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/85 to-primary" />

        <div className="container-narrow relative max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
            {c.eyebrow[locale]}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-6xl">
            {hero.title[locale]}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
            {hero.subtitle[locale]}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#start"
              className="rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
            >
              {c.heroCta[locale]}
            </a>
            {calendlyUrl && (
              <a
                href="#book"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white"
              >
                {c.heroCallCta[locale]}
              </a>
            )}
          </div>
        </div>
      </section>

      <section id="services" className="bg-muted/40 py-20 sm:py-28">
        <div className="container-narrow">
          <Eyebrow>{c.servicesEyebrow[locale]}</Eyebrow>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <div
                key={`${service.title.en}-${index}`}
                className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
              >
                <span className="font-display text-3xl text-[color:var(--gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="fit-words mt-4 font-display text-xl leading-snug">
                  {service.title[locale] || service.title.en || service.title.ru}
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  {service.text[locale] || service.text.en || service.text.ru}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WorkGrid locale={locale} projects={projects} />

      <section
        id="process"
        className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
      >
        <img
          src="/assets/sunset-cat.jpg"
          alt=""
          width={1600}
          height={900}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/90 to-primary" />

        <div className="container-narrow relative">
          <Eyebrow tone="light">{c.processEyebrow[locale]}</Eyebrow>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{c.processLead[locale]}</p>

          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={`${step.en}-${index}`}
                className="rounded-3xl border border-white/15 bg-white/[0.04] p-7 backdrop-blur-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--gold)]/60 font-display text-lg text-[color:var(--gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="fit-words mt-6 font-display text-xl">
                  {step[locale] || step.en || step.ru}
                </h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {calendlyUrl && <CalendlyBooking url={calendlyUrl} locale={locale} />}

      <SolutionsForm locale={locale} />

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
