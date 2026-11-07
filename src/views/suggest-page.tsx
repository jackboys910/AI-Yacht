import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { suggestCopy } from "@/components/suggest/suggest-copy";
import { SuggestForm, type SuggestCategory } from "@/components/suggest/suggest-form";
import type { Locale } from "@/i18n/config";
import type { SiteChrome } from "./trip-page";

/**
 * `/suggest/` — Suggest an Adventure (ТЗ v4, §3).
 *
 * Dark from top to bottom, like the first screen of the home page and the IT
 * form: this is the site asking for something rather than showing something,
 * and the dark pages are the ones where it does.
 *
 * The categories are baked in at build time from the directions marked
 * "offer in the idea form". That is right rather than a compromise — a
 * direction added in the panel rebuilds the site anyway (А-14), and a
 * dropdown fetched in the browser would be a loading state on the one page
 * that has to be answerable in one sitting.
 */
export function SuggestPage({
  locale,
  chrome,
  categories,
  homeHref,
}: {
  locale: Locale;
  chrome: SiteChrome;
  categories: SuggestCategory[];
  homeHref: string;
}) {
  const c = suggestCopy;

  return (
    <div className="bg-primary text-white">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
        active="suggest"
      />

      <section className="relative isolate overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(620px 420px at 78% 12%, #D0994533, transparent)",
          }}
        />
        <div className="container-narrow relative max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-xs">
            {c.hero.eyebrow[locale]}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-6xl">
            {c.hero.title[locale]}
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/75 sm:text-lg">
            {c.hero.text[locale]}
          </p>

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-3">
            {c.hero.points.map((point) => (
              <li
                key={point.en}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-snug text-white/70"
              >
                {point[locale]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="container-narrow max-w-3xl">
          <SuggestForm locale={locale} categories={categories} homeHref={homeHref} />
        </div>
      </section>

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        suggestHref={chrome.suggestHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
