import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";
import { FaqList } from "./faq-list";

export function Faq({ t }: { t: Dictionary["home"]["faq"] }) {
  return (
    <section className="bg-background py-20 sm:py-32">
      <div className="container-narrow grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h2>
          <div className="mt-8 aspect-[4/5] overflow-hidden rounded-3xl">
            <img
              src="/assets/islands.jpg"
              alt={t.imageAlt}
              width={1400}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <FaqList items={t.items} />
      </div>
    </section>
  );
}
