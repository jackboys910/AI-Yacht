import type { Dictionary } from "@/i18n";
import { emailConfig } from "@/lib/site";
import { Eyebrow } from "../eyebrow";
import { FaqList } from "../faq-list";

export function ItFaq({
  t,
  cta,
}: {
  t: Dictionary["it"]["faq"];
  cta: string;
}) {
  return (
    <section id="faq" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.title}
          </h2>
          <div className="mt-8 rounded-3xl border border-border bg-card p-7 shadow-card">
            <a
              href={`mailto:${emailConfig.recipient}`}
              className="font-display text-xl text-[color:var(--teal)] hover:underline"
            >
              {emailConfig.recipient}
            </a>
            <a
              href="#it-apply"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:var(--teal)]"
            >
              {cta}
            </a>
          </div>
        </div>

        <FaqList items={t.items} />
      </div>
    </section>
  );
}
