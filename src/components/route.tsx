import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Route({ t }: { t: Dictionary["home"]["route"] }) {
  return (
    <section id="route" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t.intro}</p>

        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible lg:grid-cols-5">
          {t.days.map((item) => (
            <div
              key={item.day}
              className="min-w-[78%] shrink-0 snap-start rounded-2xl border border-border bg-card p-5 md:min-w-0"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xl">{item.day}</span>
                <span className="text-xs text-muted-foreground">
                  {item.date}
                </span>
              </div>
              <div className="mt-2 font-medium text-[color:var(--teal)]">
                {item.place}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Eyebrow>{t.chartEyebrow}</Eyebrow>
          <div className="mt-6 grid gap-5 sm:gap-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img
                src="/assets/map-wide.jpg"
                alt={t.mapWideAlt}
                loading="lazy"
                className="block w-full"
              />
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <img
                src="/assets/map-close.jpg"
                alt={t.mapCloseAlt}
                loading="lazy"
                className="block w-full"
              />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t.caption}
          </p>
        </div>
      </div>
    </section>
  );
}
