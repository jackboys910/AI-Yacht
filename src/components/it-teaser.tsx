import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

/** Home-page bridge to the IT Solutions page. */
export function ItTeaser({
  t,
  href,
}: {
  t: Dictionary["home"]["itTeaser"];
  href: string;
}) {
  return (
    <section id="it-solutions" className="bg-muted/40 py-20 sm:py-28">
      <div className="container-narrow">
        <div className="grid gap-10 rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              {t.title}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {t.text}
            </p>
          </div>

          <div>
            <ul className="space-y-3">
              {t.bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-[15px] font-medium"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--teal)] text-white">
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
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={href}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition hover:bg-[color:var(--teal)]"
            >
              {t.cta}
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
