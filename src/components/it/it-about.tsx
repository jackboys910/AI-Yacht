import type { Dictionary } from "@/i18n";
import { Eyebrow } from "../eyebrow";

export function ItAbout({ t }: { t: Dictionary["it"]["about"] }) {
  return (
    <section id="about" className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.title}
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            {t.paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 self-center sm:gap-5">
          {t.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7"
            >
              <div className="font-display text-3xl text-[color:var(--gold)] sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm leading-snug text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ItPrinciples({ t }: { t: Dictionary["it"]["about"] }) {
  return (
    <section className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.principlesEyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.principlesTitle}
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.principles.map((item) => (
            <div
              key={item.num}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-8 shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
            >
              <span className="font-display text-4xl text-[color:var(--gold)]">
                {item.num}
              </span>
              <h3 className="mt-6 font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
