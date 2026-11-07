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
 * Three things, in this order and on one screen: that this is a community
 * and not a business, the five directions drawn as the letter S, and what the
 * community does. The owner raised the first of those himself — "A community,
 * not a business" has to be the thing a visitor reads before anything else.
 *
 * It is a single line above the letter, not a block of its own. It had a
 * photograph and the shape of a section once, and that was wrong twice over:
 * it made the opening look like six directions instead of five, and the photo
 * it used was the same one Sailing uses, so the page appeared to start by
 * repeating itself.
 *
 * The whole thing is held to one viewport height on a phone. §4.3 makes that
 * a requirement rather than a wish, which is what every height here is
 * budgeted against.
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
          that the gold letter and the names stay the brightest things here. */}
      <img
        src="/assets/marina-bay.jpg"
        alt={COPY.backdropAlt[locale]}
        width={1280}
        height={583}
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/88 via-primary/82 to-primary" />

      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-center pb-6 pt-16 sm:pb-10 sm:pt-24 lg:pb-8 lg:pt-20">
        <SLanes
          lanes={lanes}
          banner={<CommunityBanner locale={locale} />}
          headline={<Headline locale={locale} />}
        />
      </div>
    </section>
  );
}

/** One line, centred, above the letter: what this place is. */
function CommunityBanner({ locale }: { locale: Locale }) {
  return (
    <div className="text-center">
      <p className="font-display text-base leading-tight sm:text-2xl">
        {COPY.communityA[locale]}{" "}
        <span className="text-white/55">{COPY.communityB[locale]}</span>
      </p>

      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="inline-flex rounded-full bg-[color:var(--gold)] px-3 py-0.5 font-display text-xs text-[color:var(--gold-foreground)] sm:px-4 sm:py-1 sm:text-base">
          {COPY.free[locale]}
        </span>
        <span className="text-[9px] uppercase tracking-[0.12em] text-white/50 sm:text-[11px] sm:tracking-[0.14em]">
          {COPY.noFees[locale]}
        </span>
      </p>
    </div>
  );
}

/**
 * The headline.
 *
 * On a wide screen it sits inside the upper bowl of the S, which is the one
 * place in the composition that is deliberately empty — a counter with
 * nothing in it reads as a gap rather than as part of a letter. On a phone
 * there is no beside, so it goes under the letter.
 */
function Headline({ locale }: { locale: Locale }) {
  return (
    <h1 className="text-center font-display text-xl leading-[1.15] lg:text-left lg:text-[28px] xl:text-4xl">
      {COPY.titleA[locale]}{" "}
      <span className="block text-[color:var(--gold)]">{COPY.titleB[locale]}</span>
    </h1>
  );
}
