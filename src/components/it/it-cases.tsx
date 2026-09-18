import type { Dictionary } from "@/i18n";
import { Eyebrow } from "../eyebrow";

/**
 * "What we built for CTMASS → what we build for you": each card pairs a
 * real, shipped piece of the CTMASS platform with the service it proves.
 */
export function ItCases({ t }: { t: Dictionary["it"]["cases"] }) {
  const last = t.items.length - 1;

  return (
    <section id="cases" className="bg-background py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t.intro}</p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {t.items.map((item, index) => {
            // An odd count leaves the final card alone on its row; let it
            // span the full width with the two halves side by side.
            const wide = index === last && t.items.length % 2 === 1;
            return (
              <article
                key={item.caseTitle}
                className={`flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card ${
                  wide ? "md:col-span-2 md:grid md:grid-cols-2" : ""
                }`}
              >
                <div className="flex-1 bg-muted/60 p-7 sm:p-8">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--teal)]">
                    {t.builtLabel}
                  </span>
                  <h3 className="mt-3 font-display text-xl">{item.caseTitle}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {item.caseText}
                  </p>
                </div>

                <div
                  className={`relative flex-1 border-t border-border p-7 sm:p-8 ${
                    wide ? "md:border-l md:border-t-0" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -top-5 left-7 grid h-10 w-10 place-items-center rounded-full bg-[color:var(--gold)] text-[color:var(--gold-foreground)] shadow-elegant sm:left-8 ${
                      wide ? "md:-left-5 md:top-1/2 md:-translate-y-1/2" : ""
                    }`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-4 w-4 ${wide ? "rotate-90 md:rotate-0" : "rotate-90"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                    >
                      <path
                        d="M4 10h12M11 5l5 5-5 5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    {t.offerLabel}
                  </span>
                  <h3 className="mt-3 font-display text-2xl">{item.offerTitle}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">
                    {item.offerText}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
