import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Benefits({ t }: { t: Dictionary["home"]["benefits"] }) {
  return (
    <section id="benefits" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.items.map((item) => (
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
