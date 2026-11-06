import type { Locale } from "@/i18n/config";
import type { HomeLane } from "@/lib/content/home";
import { Lobe, SLanes } from "./s-lanes";

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
  bannerAlt: {
    en: "Yasha at the helm at sunset",
    ru: "Яша за штурвалом на закате",
  },
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
 * business" has to be the thing a visitor reads before anything else.
 *
 * It sits inside the top of the S rather than in a block above it. Stacked
 * above, the three lines of it and the headline took a third of a phone
 * screen, and what was left could only hold a thin letter. Inside the letter,
 * the same words cost one section and the S gets the height to be a letter.
 *
 * The whole thing is held to one viewport height on a phone. §4.3 makes that a
 * requirement rather than a wish, which is what every height here is budgeted
 * against.
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
          that the gold ribbon and the names stay the brightest things here. */}
      <img
        src="/assets/marina-bay.jpg"
        alt={COPY.backdropAlt[locale]}
        width={1280}
        height={583}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/80 to-primary" />

      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-center gap-3 pb-6 pt-16 sm:gap-5 sm:pb-10 sm:pt-24 lg:pb-8 lg:pt-20">
        <SLanes lanes={lanes} banner={<CommunityBanner locale={locale} />} />

        <h1 className="text-center font-display text-xl leading-[1.15] sm:text-3xl lg:text-4xl">
          {COPY.titleA[locale]}{" "}
          <span className="block text-[color:var(--gold)] sm:inline">
            {COPY.titleB[locale]}
          </span>
        </h1>
      </div>
    </section>
  );
}

/** The top of the letter: what this place is, in three lines and a photo. */
function CommunityBanner({ locale }: { locale: Locale }) {
  return (
    <Lobe className="h-[124px] gap-3 py-1.5 pl-1.5 pr-4 sm:h-[140px] sm:gap-5 sm:py-2 sm:pl-2 sm:pr-7 lg:h-[132px]">
      <span className="relative block h-full w-[104px] shrink-0 overflow-hidden rounded-full bg-primary sm:w-44 lg:w-52">
        <img
          src="/assets/yasha-helm-sunrise.jpg"
          alt={COPY.bannerAlt[locale]}
          width={1280}
          height={960}
          className="h-full w-full object-cover"
          style={{ objectPosition: "60% 40%" }}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] leading-tight sm:text-2xl lg:text-[26px]">
          {COPY.communityA[locale]}{" "}
          <span className="text-white/55">{COPY.communityB[locale]}</span>
        </span>

        <span className="mt-1.5 inline-flex rounded-full bg-[color:var(--gold)] px-3 py-0.5 font-display text-xs text-[color:var(--gold-foreground)] sm:mt-2.5 sm:px-5 sm:py-1 sm:text-lg">
          {COPY.free[locale]}
        </span>

        <span className="mt-1.5 block text-[9px] uppercase leading-snug tracking-[0.12em] text-white/55 sm:mt-2.5 sm:text-[11px] sm:tracking-[0.14em]">
          {COPY.noFees[locale]}
        </span>
      </span>
    </Lobe>
  );
}
