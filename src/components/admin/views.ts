/**
 * The sections of the admin panel, in menu order.
 *
 * They follow §7 of the spec, with the moderation queue §3.4 of ТЗ v4 adds:
 * trips, interests, people, suggestions, applications, subscribers, settings.
 *
 * Only the ids live here. What each section is *called* is interface text and
 * belongs with the rest of it in `i18n/copy-en.ts`, keyed by these ids — so a
 * section added here fails to compile until both languages name it.
 */
export const ADMIN_VIEW_IDS = [
  "trips",
  "interests",
  "people",
  "suggestions",
  "applications",
  "subscribers",
  "settings",
] as const;

export type AdminViewId = (typeof ADMIN_VIEW_IDS)[number];

export const DEFAULT_VIEW: AdminViewId = "trips";

/**
 * The plan item that fills a section in, for the ones not built yet.
 *
 * A section listed in the menu with nothing behind it looks broken, so the
 * placeholder says which item brings it instead. A section missing from this
 * table is one that works.
 */
export const COMING_IN: Partial<Record<AdminViewId, string>> = {
  suggestions: "2.5",
  applications: "2.8",
  subscribers: "3.4",
  settings: "4.3",
};

/** The view named by `?view=`, or the default when it names nothing valid. */
export function resolveView(value: string | null): AdminViewId {
  const match = ADMIN_VIEW_IDS.find((view) => view === value);
  return match ?? DEFAULT_VIEW;
}
