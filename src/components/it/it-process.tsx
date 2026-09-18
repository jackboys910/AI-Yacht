import type { Dictionary } from "@/i18n";
import { Eyebrow } from "../eyebrow";

export function ItProcess({ t }: { t: Dictionary["it"]["process"] }) {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-primary py-20 text-white sm:py-28"
    >
      <img
        src="/assets/sunset-cat.jpg"
        alt=""
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/90 to-primary" />

      <div className="container-narrow relative">
        <Eyebrow tone="light">{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>

        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-3xl border border-white/15 bg-white/[0.04] p-7 backdrop-blur-md"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--gold)]/60 font-display text-lg text-[color:var(--gold)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
