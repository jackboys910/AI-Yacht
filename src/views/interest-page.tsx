import { SectionHead } from "@/components/section-head";
import { SiteFoot } from "@/components/site-foot";
import { SiteNav } from "@/components/site-nav";
import { TripList } from "@/components/interest/trip-list";
import type { Locale } from "@/i18n/config";
import type { ListedTrip } from "@/lib/content/lookup";
import type { Interest } from "@/lib/content/types";
import { pick, pickOrOther } from "@/lib/content/trip-view";
import type { SiteChrome } from "./trip-page";

const COPY = {
  upcoming: { en: "Upcoming trips", ru: "Ближайшие поездки" },
  past: { en: "Past trips", ru: "Прошедшие поездки" },
  show: { en: "Show past trips", ru: "Показать прошедшие" },
  hide: { en: "Hide past trips", ru: "Скрыть прошедшие" },
  soon: {
    en: "New trips coming soon. Subscribe and be the first to know.",
    ru: "Скоро новые поездки. Подпишитесь, и узнаете первым.",
  },
} as const;

/**
 * A tab page (§6.2): the interest, its upcoming trips, and its past ones
 * tucked away behind a toggle.
 *
 * The "Past trips" block is a `<details>` element, so it opens without any
 * JavaScript having to load first — and it is closed to begin with, which is
 * what §6.2 asks for.
 *
 * Which past trips appear at all is decided before this component sees them:
 * the interest's own switch can hide the block entirely and a single trip can
 * be kept out of it, and both live in `tabTrips` so the rules exist once.
 *
 * "+ Subscribe to [interest]" belongs here too and arrives with plan item 2.1,
 * together with the dialog it opens.
 */
export function InterestPage({
  interest,
  upcoming,
  past,
  locale,
  today,
  chrome,
}: {
  interest: Interest;
  upcoming: ListedTrip[];
  past: ListedTrip[];
  locale: Locale;
  today: string;
  chrome: SiteChrome;
}) {
  const title = pickOrOther(interest.name, locale);
  const description = pick(interest.description, locale);
  const cover = interest.cover;

  return (
    <div className="bg-background text-foreground">
      <SiteNav
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
        active={interest.slug}
      />

      <section className="relative isolate overflow-hidden bg-primary pb-16 pt-32 text-white sm:pb-24 sm:pt-44">
        {cover?.url && (
          <img
            src={cover.url}
            alt={pickOrOther(cover.alt, locale)}
            width={cover.width || 1920}
            height={cover.height || 1080}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/50 to-primary" />

        <div className="container-narrow relative">
          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
          {description && (
            <p className="mt-6 max-w-2xl text-base text-white/80 sm:text-lg">{description}</p>
          )}
        </div>
      </section>

      <section id="upcoming" className="bg-background py-16 sm:py-24">
        <div className="container-narrow">
          <SectionHead>{COPY.upcoming[locale]}</SectionHead>

          {upcoming.length > 0 ? (
            <TripList
              trips={upcoming}
              locale={locale}
              today={today}
              filterable={interest.collectsKidFriendly}
            />
          ) : (
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {COPY.soon[locale]}
            </p>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section id="past" className="bg-muted/40 py-16 sm:py-24">
          <div className="container-narrow">
            <details className="group">
              <summary className="inline-flex cursor-pointer list-none items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground">
                <span className="group-open:hidden">
                  {COPY.show[locale]} ({past.length})
                </span>
                <span className="hidden group-open:inline">{COPY.hide[locale]}</span>
                <span
                  aria-hidden="true"
                  className="text-[color:var(--teal)] transition group-open:rotate-180"
                >
                  ↓
                </span>
              </summary>

              <div className="mt-8">
                <SectionHead>{COPY.past[locale]}</SectionHead>
                <TripList
                  trips={past}
                  locale={locale}
                  today={today}
                  filterable={interest.collectsKidFriendly}
                />
              </div>
            </details>
          </div>
        </section>
      )}

      {/* The interest's YouTube playlist belongs here and arrives with item 3.1. */}

      <SiteFoot
        locale={locale}
        interests={chrome.interests}
        solutionsHref={chrome.solutionsHref}
        languageHrefs={chrome.languageHrefs}
      />
    </div>
  );
}
