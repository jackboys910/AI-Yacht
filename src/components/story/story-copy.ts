import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

/**
 * The Story page's own words (§6.5).
 *
 * Only the furniture is here: the headings, the buttons and the line that
 * stands in until the owner writes his own. What the page is actually about
 * — his text, his photograph, his links — lives in the settings, because
 * §7.7 says it is his to change without a developer.
 *
 * The button labels are Appendix В's, word for word, and they stay English in
 * the Russian version the way the section names do: they lead to YouTube,
 * where the words are English anyway.
 */
export const storyCopy = {
  eyebrow: { en: "Story", ru: "История" } satisfies Text,

  /** Until the settings hold a headline of his own. */
  title: {
    en: "Behind the trips",
    ru: "Кто всё это затеял",
  } satisfies Text,
  lead: {
    en: "The channel is the long version: the boats, the mountains, the jumps, and what it takes to put a week like that together.",
    ru: "Канал — это длинная версия: лодки, горы, прыжки и то, из чего складывается такая неделя.",
  } satisfies Text,

  watch: { en: "Watch on YouTube", ru: "Watch on YouTube" } satisfies Text,
  subscribe: { en: "Subscribe on YouTube", ru: "Subscribe on YouTube" } satisfies Text,

  links: { en: "Elsewhere", ru: "Где ещё" } satisfies Text,
  photoAlt: {
    en: "The owner of nazarov.net",
    ru: "Владелец nazarov.net",
  } satisfies Text,
} as const;
