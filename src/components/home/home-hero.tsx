import type { Locale } from "@/i18n/config";

const COPY = {
  title: {
    en: "Sail, ride, jump — together.",
    ru: "Плывём, катаемся, прыгаем — вместе.",
  },
  lead: {
    en: "Small-group sailing, snowboarding, skydiving and kid-friendly trips across the US and beyond.",
    ru: "Небольшие группы: парусные походы, сноуборд, прыжки с парашютом и поездки с детьми — по США и дальше.",
  },
  cta: { en: "See upcoming trips", ru: "Смотреть ближайшие поездки" },
  imageAlt: {
    en: "Catamaran under sail at sunset",
    ru: "Катамаран под парусом на закате",
  },
} as const;

/**
 * The first screen of the home page (§6.1): the headline, one line about what
 * this is, and the way down to the trips.
 *
 * The wording is fixed by Appendix В, so it lives here rather than in the
 * database — unlike a trip, the owner is not meant to rewrite it from the
 * panel. The photograph is the one the current site opens with, which keeps
 * the page recognisable; §6.1 would rather have the owner's own photo or a
 * muted clip here, and that becomes editable with the settings screen in
 * item 3.1.
 *
 * "+ Subscribe" belongs beside the button and arrives with item 2.1, together
 * with the dialog it opens.
 */
export function HomeHero({ locale }: { locale: Locale }) {
  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-primary text-white"
    >
      <img
        src="/assets/hero-catamaran.jpg"
        alt={COPY.imageAlt[locale]}
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-transparent to-transparent" />

      {/* Centred rather than sitting on the floor: this block is half the
          height of the landing's that the full-screen photo was built around,
          and bottom-aligning a short block leaves the top of the screen
          empty. */}
      <div className="container-narrow relative flex min-h-[100svh] flex-col justify-center pb-16 pt-28 sm:pb-24 sm:pt-32">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
            {COPY.title[locale]}
          </h1>

          <p className="mt-8 max-w-2xl text-base text-white/80 sm:text-lg">
            {COPY.lead[locale]}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#upcoming"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.98]"
            >
              {COPY.cta[locale]}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
