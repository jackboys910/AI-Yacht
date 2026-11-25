import { Suspense } from "react";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { manageCopy } from "@/components/subscribe/manage-copy";
import { ManageSubscription } from "@/components/subscribe/manage-subscription";
import type { SubscribeOption } from "@/components/subscribe/subscribe";
import type { Locale } from "@/i18n/config";
import type { SiteChrome } from "./trip-page";

/**
 * `/unsubscribe/` — where the link at the bottom of every letter leads
 * (Н-09, Н-10, §8.3).
 *
 * Dark, like the other pages where the site is being spoken to rather than
 * read: this one is a conversation about somebody's own subscription.
 *
 * The page is printed at build time and holds nothing about anybody. The
 * subscription is fetched in the browser from the key in the address, which
 * `useSearchParams` reads — hence the boundary around it, because a static
 * export prerenders this page with no query string at all.
 */
export function UnsubscribePage({
  locale,
  options,
  homeHref,
  chrome,
}: {
  locale: Locale;
  options: SubscribeOption[];
  homeHref: string;
  chrome: SiteChrome;
}) {
  const c = manageCopy;

  return (
    <div className="bg-primary text-white">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        aboutHref={chrome.aboutHref}
        storyHref={chrome.storyHref}
        suggestHref={chrome.suggestHref}

        calendarHref={chrome.calendarHref}
        languageHrefs={chrome.languageHrefs}
      />

      <section className="relative isolate overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(620px 420px at 78% 12%, #D0994533, transparent)",
          }}
        />
        <div className="container-narrow relative max-w-3xl">
          <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
            {c.title[locale]}
          </h1>
          <p className="mt-4 text-lg text-white/70">{c.lead[locale]}</p>

          <div className="mt-10">
            <Suspense fallback={<p className="text-white/70">{c.loading[locale]}</p>}>
              <ManageSubscription locale={locale} options={options} homeHref={homeHref} />
            </Suspense>
          </div>
        </div>
      </section>

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
