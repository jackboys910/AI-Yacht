import type { Dictionary } from "@/i18n";
import { Eyebrow } from "../eyebrow";
import { QuoteLink } from "./quote-link";

export function ItServices({ t }: { t: Dictionary["it"]["services"] }) {
  return (
    <section id="services" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t.intro}</p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, index) => (
            <div
              key={item.key}
              className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
            >
              <span className="font-display text-3xl text-[color:var(--gold)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-2xl leading-snug">
                {item.title}
              </h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
              <QuoteLink service={item.key}>{t.quote}</QuoteLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
