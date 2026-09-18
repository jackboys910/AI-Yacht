import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Audience({ t }: { t: Dictionary["home"]["audience"] }) {
  return (
    <section className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.titleLine1}
            <br />
            <span className="text-[color:var(--teal)]">{t.titleLine2}</span>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">{t.intro}</p>
        </div>

        <div>
          <ul className="space-y-4">
            {t.criteria.map((item) => (
              <li
                key={item}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--teal)] text-white">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      d="M4 10.5l4 4 8-9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[15px] leading-relaxed text-foreground/90">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border-l-4 border-[color:var(--gold)] bg-muted/60 p-5 text-sm leading-relaxed text-foreground/80">
            {t.note.before}
            <span className="font-semibold text-foreground">{t.note.strong}</span>
            {t.note.after}
          </div>
        </div>
      </div>
    </section>
  );
}
