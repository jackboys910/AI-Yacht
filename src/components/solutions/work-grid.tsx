import type { Locale } from "@/i18n/config";
import type { Localized, WorkProject } from "@/lib/content/types";
import { Eyebrow } from "../eyebrow";
import { solutionsCopy } from "./solutions-copy";

interface WorkCard {
  key: string;
  title: Localized<string>;
  description: Localized<string>;
  url: string;
  screenshot?: { url: string; thumbUrl?: string; width?: number; height?: number };
}

/**
 * "Our work" (§6.6, А-18).
 *
 * The cards come from the `projects` collection, which the owner edits in
 * Settings → Solutions: a screenshot, a name, one line and a link, in the
 * order he arranged them. Until there is one, the two projects §6.6 names
 * stand in — a section that says "no projects yet" on a page whose job is to
 * sell work would do the opposite of selling it.
 *
 * A project with no screenshot gets its address in large type instead. The
 * owner adding three projects from a phone will not have three screenshots to
 * hand, and a grid with one hole in it looks broken in a way the text does
 * not.
 */
export function WorkGrid({
  locale,
  projects,
}: {
  locale: Locale;
  projects: WorkProject[];
}) {
  const own = [...projects]
    .filter((project) => project.title.en.trim() || project.title.ru.trim())
    .sort((a, b) => a.order - b.order);

  const cards: WorkCard[] = own.length
    ? own.map((project) => ({
        key: project.id,
        title: project.title,
        description: project.description,
        url: project.url,
        screenshot: project.screenshot,
      }))
    : solutionsCopy.defaultWork.map((project) => ({
        key: project.url,
        title: project.title,
        description: project.description,
        url: project.url,
      }));

  return (
    <section id="work" className="bg-background py-20 sm:py-28">
      <div className="container-narrow">
        <Eyebrow>{solutionsCopy.workEyebrow[locale]}</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          {solutionsCopy.workTitle[locale]}
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const title = card.title[locale] || card.title.en || card.title.ru;
            const description =
              card.description[locale] || card.description.en || card.description.ru;
            const href = card.url.trim();

            return (
              <article
                key={card.key}
                className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:border-[color:var(--teal)]"
              >
                {card.screenshot?.url ? (
                  <img
                    src={card.screenshot.thumbUrl || card.screenshot.url}
                    alt={title}
                    width={card.screenshot.width || 1200}
                    height={card.screenshot.height || 750}
                    loading="lazy"
                    className="aspect-[16/10] w-full border-b border-border object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/10] w-full place-items-center border-b border-border bg-muted/60 px-6 text-center">
                    <span className="fit-words font-display text-xl text-foreground/70">
                      {title}
                    </span>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="fit-words font-display text-xl">{title}</h3>
                  {description && (
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--teal)] underline-offset-4 hover:underline"
                    >
                      {solutionsCopy.workVisit[locale]}
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
