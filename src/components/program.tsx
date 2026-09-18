import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Program({ t }: { t: Dictionary["home"]["program"] }) {
  return (
    <section className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:gap-6">
          {t.stages.map((stage, index) => (
            <div
              key={stage.place}
              className="relative rounded-3xl border border-border bg-card p-8"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl text-[color:var(--teal)]">
                  {stage.duration}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t.stageLabel} {index + 1}
                </span>
              </div>
              <div className="mt-4 font-medium">{stage.place}</div>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {stage.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
