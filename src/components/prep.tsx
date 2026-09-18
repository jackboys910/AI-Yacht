import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Prep({ t }: { t: Dictionary["home"]["prep"] }) {
  return (
    <section id="prep" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.items.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-card p-8 shadow-card"
            >
              <h3 className="fit-words font-display text-2xl">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border-l-4 border-[color:var(--gold)] bg-muted/60 p-6 text-[15px] leading-relaxed text-foreground/85">
          {t.note}
        </div>
      </div>
    </section>
  );
}
