"use client";

import type { WorkProject } from "@/lib/content/types";
import { blankProject } from "@/lib/firebase/projects";
import { LocalizedInput, LocalizedTextarea, TextInput } from "../fields";
import { useAdmin } from "../i18n";
import { ImageField } from "../image-field";
import { Repeatable } from "../repeatable";

/** A project as the form holds it: an id only once it has been saved. */
export type ProjectRow = Omit<WorkProject, "id" | "order"> & { id?: string };

export function toRows(projects: WorkProject[]): ProjectRow[] {
  // `order` is dropped on the way in and recomputed from the position on the
  // way out: the list in the form *is* the order.
  return [...projects]
    .sort((a, b) => a.order - b.order)
    .map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      url: project.url,
      screenshot: project.screenshot,
    }));
}

/**
 * "Our work" in the panel (§7.7, А-18).
 *
 * Inside the Solutions section of the settings rather than in a menu item of
 * its own: to the owner these are three lines of the services page, and
 * §7.7 lists them there. They are saved by the page's own Save button along
 * with the text around them, even though they live in another collection —
 * one button for one screen is the whole point of putting them here.
 *
 * Order is the position in this list, so the arrows are the sort. The page
 * prints them in exactly this order, which is what А-18 asks to be able to
 * change without a developer.
 */
export function WorkProjects({
  rows,
  onChange,
  onRemove,
}: {
  rows: ProjectRow[];
  onChange: (rows: ProjectRow[]) => void;
  /** Told about a saved project that has just been taken out of the list. */
  onRemove: (id: string) => void;
}) {
  const { locale, t } = useAdmin();
  const c = t.settings.solutionsFields;

  return (
    <div>
      <span className="block text-sm font-medium">{c.projects}</span>
      <p className="mt-1 text-xs text-muted-foreground">{c.projectsHint}</p>
      <div className="mt-3">
        <Repeatable
          items={rows}
          onChange={(next) => {
            // A row that was in the list and is not any more has to be
            // deleted from the database as well; the form on its own would
            // leave it on the page.
            for (const row of rows) {
              if (row.id && !next.some((one) => one.id === row.id)) onRemove(row.id);
            }
            onChange(next);
          }}
          // Typed, so `items` and `create` agree on the row rather than on
          // the draft: a new row simply has no id yet.
          create={(): ProjectRow => blankProject()}
          addLabel={c.addProject}
          itemLabel={(index, item) =>
            item.title[locale] || item.title.en || `${c.project} ${index + 1}`
          }
          max={12}
          empty={c.projectsEmpty}
          render={(item, update, index) => (
            <div className="space-y-4">
              <LocalizedInput
                id={`settings-project-title-${index}`}
                label={c.projectTitle}
                value={item.title}
                onChange={(title) => update({ ...item, title })}
              />
              <LocalizedTextarea
                optional
                id={`settings-project-text-${index}`}
                label={c.projectText}
                value={item.description}
                onChange={(description) => update({ ...item, description })}
                rows={2}
              />
              <TextInput
                id={`settings-project-url-${index}`}
                label={c.projectUrl}
                value={item.url}
                onChange={(url) => update({ ...item, url })}
                hint={c.projectUrlHint}
              />
              <ImageField
                id={`settings-project-shot-${index}`}
                label={c.projectShot}
                value={item.screenshot}
                onChange={(screenshot) => update({ ...item, screenshot })}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
