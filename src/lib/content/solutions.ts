/**
 * The four kinds of project a Solutions enquiry can be about (§6.6).
 *
 * Here rather than in the page's copy module because three places need the
 * same four words: the form, the letter to the studio and the panel's list.
 * Two of them run in the Cloudflare Worker, which is bundled by wrangler and
 * knows nothing about Next's `@/` aliases — so this file imports nothing at
 * all, and the worker can reach it by a relative path.
 *
 * The ids are what travels to `/api/solutions` and what is stored; the labels
 * are only ever shown. Renaming a label is a translation, renaming an id
 * would orphan every enquiry already saved.
 */

export const PROJECT_TYPES = ["website", "webApp", "mobileApp", "other"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, { en: string; ru: string }> = {
  website: { en: "Website", ru: "Сайт" },
  webApp: { en: "Web app", ru: "Веб-приложение" },
  mobileApp: { en: "Mobile app", ru: "Мобильное приложение" },
  other: { en: "Other", ru: "Другое" },
};

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && value in PROJECT_TYPE_LABELS;
}

/**
 * A project type as a person reads it. An unknown id is shown as it is:
 * a letter that says "webApp" is odd, a letter that says nothing is worse.
 */
export function projectTypeLabel(type: string, locale: "en" | "ru" = "en"): string {
  return isProjectType(type) ? PROJECT_TYPE_LABELS[type][locale] : type;
}
