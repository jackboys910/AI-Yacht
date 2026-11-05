import type { Locale } from "@/i18n/config";
import type { HomeLane } from "@/lib/content/home";
import { SLanes } from "./s-lanes";

const COPY = {
  communityA: { en: "A community,", ru: "Сообщество," },
  communityB: { en: "not a business.", ru: "а не бизнес." },
  free: { en: "100% free. Forever.", ru: "Бесплатно. Навсегда." },
  noFees: {
    en: "No fees · No subscriptions · No commissions",
    ru: "Без взносов · Без подписок · Без комиссий",
  },
  titleA: { en: "Sail. Ride. Jump.", ru: "Плывём. Катаемся. Прыгаем." },
  titleB: { en: "Explore. Build. Together.", ru: "Открываем. Создаём. Вместе." },
  backdropAlt: {
    en: "Yachts moored in a quiet bay at dusk",
    ru: "Яхты на стоянке в тихой бухте в сумерках",
  },
} as const;

/**
 * The first screen of the home page (ТЗ v4, §4.2).
 *
 * Three things, in this order and on one screen: that this is a community and
 * not a business, what the community does, and the five directions it does it
 * in. The owner raised the first of those himself — "A community, not a
 * business" has to be the thing a visitor reads before anything else — so it
 * sits above the headline rather than in the page's small print.
 *
 * The whole thing is held to one viewport height on a phone. §4.3 makes that a
 * requirement rather than a wish, which is what every height on the sections
 * below is budgeted against.
 */
export function CommunityOpening({
  lanes,
  locale,
}: {
  lanes: HomeLane[];
  locale: Locale;
}) {
  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-primary text-white"
    >
      {/* A photograph, not a flat colour: the page is dark, and a dark page
          with nothing behind it reads as a loading state. Dimmed far enough
          that the gold line and the names stay the brightest things here. */}
      <img
        src="/assets/marina-bay.jpg"
        alt={COPY.backdropAlt[locale]}
        width={1280}
        height={583}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/80 to-primary" />

      {/* The gaps and the padding shrink again at lg: a laptop screen is wider
          than a phone but no taller, and the whole screen still has to fit. */}
      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-center gap-6 pb-10 pt-20 sm:gap-10 sm:pb-16 sm:pt-28 lg:gap-6 lg:pb-12 lg:pt-24">
        <div className="text-center">
          <p className="font-display text-xl leading-tight sm:text-3xl lg:text-4xl">
            {COPY.communityA[locale]}{" "}
            <span className="text-white/55">{COPY.communityB[locale]}</span>
          </p>

          <p className="mt-3 inline-flex rounded-full bg-[color:var(--gold)] px-4 py-1 font-display text-sm text-[color:var(--gold-foreground)] sm:px-6 sm:py-1.5 sm:text-lg">
            {COPY.free[locale]}
          </p>

          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/55 sm:text-xs">
            {COPY.noFees[locale]}
          </p>
        </div>

        <h1 className="text-center font-display text-2xl leading-[1.1] sm:text-4xl">
          {COPY.titleA[locale]}
          <span className="block text-[color:var(--gold)]">{COPY.titleB[locale]}</span>
        </h1>

        <SLanes lanes={lanes} />
      </div>
    </section>
  );
}
