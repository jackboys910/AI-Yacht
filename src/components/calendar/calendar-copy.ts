import type { Locale } from "@/i18n/config";

/**
 * The words of the calendar page (the client's list of 24.11.2026).
 *
 * Its own file for the same reason the Suggest page has one: this is one
 * page's copy, and the shared dictionaries are for what is said in several
 * places.
 */

type Text = Record<Locale, string>;

const t = (en: string, ru: string): Text => ({ en, ru });

export const calendarCopy = {
  meta: {
    title: t("Calendar — every trip, month by month", "Календарь — все поездки по месяцам"),
    description: t(
      "Every trip on the site on one calendar: what is coming up, what has already happened, and when each one is.",
      "Все поездки сайта в одном календаре: что впереди, что уже прошло и когда именно.",
    ),
  },

  eyebrow: t("Calendar", "Календарь"),
  title: t("Everything, by date", "Всё по датам"),
  text: t(
    "Every trip on the site in one place — the directions together, the way a " +
      "month actually looks. The home page shows what is next; this shows when.",
    "Все поездки сайта в одном месте — направления вместе, так, как месяц выглядит " +
      "на самом деле. Главная показывает, что ближайшее; здесь видно, когда.",
  ),

  previous: t("Previous month", "Предыдущий месяц"),
  next: t("Next month", "Следующий месяц"),
  inThisMonth: t("Trips this month", "Поездки этого месяца"),
  nothing: t(
    "Nothing in this month yet. Look at the months on either side, or subscribe and hear when something appears.",
    "В этом месяце пока ничего. Посмотрите соседние месяцы или подпишитесь — напишем, когда что-то появится.",
  ),
  keyUpcoming: t("Ahead", "Впереди"),
  keyPast: t("Already happened", "Уже прошло"),
  kidFriendly: t("With kids", "С детьми"),

  booking: {
    open: t("open for booking", "набор открыт"),
    fewSpots: t("few spots left", "мест мало"),
    soldOut: t("sold out", "мест нет"),
    completed: t("completed", "прошла"),
  },

  /** The way in from the pages that list trips. */
  seeAll: t("See the calendar", "Смотреть календарь"),
} as const;
