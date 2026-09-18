import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Format({ t }: { t: Dictionary["home"]["format"] }) {
  return (
    <section
      id="format"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
    >
      <img
        src="/assets/laptop-deck.jpg"
        alt=""
        width={1400}
        height={1000}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

      <div className="container-narrow relative grid gap-10 md:grid-cols-[auto_1fr] md:items-center md:gap-14">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[color:var(--gold)]/50 bg-white/5 backdrop-blur">
          <svg
            viewBox="0 0 48 48"
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              d="M14 8h20l-3 14a7 7 0 01-7 5.5A7 7 0 0117 22L14 8z"
              strokeLinejoin="round"
            />
            <path d="M24 27.5V38" strokeLinecap="round" />
            <path d="M17 40h14" strokeLinecap="round" />
            <path d="M10 10l28 28" stroke="#C99A3C" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <Eyebrow tone="light">{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-6 max-w-2xl text-white/85">{t.text}</p>
        </div>
      </div>
    </section>
  );
}
