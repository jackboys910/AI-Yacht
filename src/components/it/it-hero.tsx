import type { Dictionary } from "@/i18n";

export function ItHero({ t }: { t: Dictionary["it"]["hero"] }) {
  return (
    <section
      id="top"
      className="relative isolate min-h-[88svh] overflow-hidden bg-primary text-white"
    >
      <img
        src="/assets/laptop-deck.jpg"
        alt={t.imageAlt}
        width={1400}
        height={1000}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/20 to-transparent" />

      <div className="container-narrow relative flex min-h-[88svh] flex-col justify-end pb-16 pt-32 sm:pb-24 sm:pt-40">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />
            {t.badge}
          </div>

          <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl md:text-7xl">
            {t.titleLine1}
            <span className="mt-3 block text-[color:var(--gold)]">
              {t.titleLine2}
            </span>
            <span className="mt-2 block text-white/95">{t.titleLine3}</span>
          </h1>

          <p className="mt-8 max-w-2xl text-base text-white/80 sm:text-lg">
            {t.lead}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#it-apply"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110 active:scale-[0.98]"
            >
              {t.ctaPrimary}
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition hover:border-white/60"
            >
              {t.ctaSecondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
