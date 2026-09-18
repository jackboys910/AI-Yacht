import type { Dictionary } from "@/i18n";
import { Eyebrow } from "./eyebrow";

export function Team({ t }: { t: Dictionary["home"]["team"] }) {
  return (
    <section id="team" className="bg-muted/40 py-20 sm:py-32">
      <div className="container-narrow">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {t.title}
        </h2>

        <div className="mt-12 flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
          {t.members.map((member) => (
            <article
              key={member.name}
              className="group w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-primary">
                {/* The photo is part of the dictionary: Ivan's has a speech
                    bubble baked into the image, localised per language. */}
                <img
                  src={member.photo}
                  alt={member.name}
                  width={900}
                  height={1200}
                  loading="lazy"
                  className="h-full w-full max-w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="font-display text-3xl text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">{member.role}</p>
                </div>
              </div>
              <p className="p-6 text-[15px] leading-relaxed text-foreground/85">
                {member.bio}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
