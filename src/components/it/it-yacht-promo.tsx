import type { Dictionary } from "@/i18n";
import { Eyebrow } from "../eyebrow";

/** Cross-sell back to the bootcamp for people who would rather build it. */
export function ItYachtPromo({
  t,
  homeHref,
}: {
  t: Dictionary["it"]["yachtPromo"];
  homeHref: string;
}) {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2">
          <div className="relative aspect-[16/10] lg:aspect-auto">
            <img
              src="/assets/hero-catamaran.jpg"
              alt={t.imageAlt}
              width={1920}
              height={1280}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="p-8 sm:p-12">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
              {t.title}
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              {t.text}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={homeHref}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] px-8 py-4 text-base font-semibold text-[color:var(--gold-foreground)] shadow-elegant transition hover:brightness-110"
              >
                {t.cta}
              </a>
              <a
                href={`${homeHref}#price`}
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-base font-medium transition hover:border-[color:var(--teal)] hover:text-[color:var(--teal)]"
              >
                {t.price}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
