import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

/**
 * The unsubscribe page, in both languages (§8.3, Н-09, Н-10).
 *
 * Written to be read by somebody who is mildly annoyed: the way out is the
 * first thing offered, it takes one press, and nothing on the page argues
 * with them about it. The choice of directions comes after, for the smaller
 * group who want less rather than none.
 */
export const manageCopy = {
  title: { en: "Your subscription", ru: "Ваша подписка" } satisfies Text,
  lead: {
    en: "No password, nothing to confirm. One press and it is done.",
    ru: "Без пароля и без подтверждений. Одно нажатие — и готово.",
  } satisfies Text,

  loading: { en: "One moment…", ru: "Секунду…" } satisfies Text,

  noKey: {
    title: { en: "Open the link from a letter", ru: "Откройте ссылку из письма" } satisfies Text,
    text: {
      en: "This page needs the link at the bottom of any letter we have sent you — it is what tells us whose subscription to change. Cannot find one? Write to",
      ru: "Этой странице нужна ссылка из любого нашего письма — по ней понятно, чью подписку менять. Письма не нашлось? Напишите на",
    } satisfies Text,
  },

  unknown: {
    title: { en: "This link no longer works", ru: "Эта ссылка больше не работает" } satisfies Text,
    text: {
      en: "The subscription it pointed to is gone. If letters are still arriving, send one of them to",
      ru: "Подписки, на которую она вела, больше нет. Если письма всё-таки приходят, перешлите одно на",
    } satisfies Text,
  },

  address: {
    en: (masked: string) => `Subscription for ${masked}`,
    ru: (masked: string) => `Подписка для ${masked}`,
  },

  directions: {
    en: "What we write to you about",
    ru: "О чём вам пишут",
  } satisfies Text,
  directionsHint: {
    en: "Untick what you do not want. Untick everything and the subscription stops altogether.",
    ru: "Снимите то, что не нужно. Если снять всё, подписка прекращается совсем.",
  } satisfies Text,

  save: { en: "Save", ru: "Сохранить" } satisfies Text,
  saving: { en: "Saving…", ru: "Сохраняем…" } satisfies Text,
  saved: { en: "Saved.", ru: "Сохранено." } satisfies Text,

  unsubscribe: { en: "Unsubscribe from everything", ru: "Отписаться от всего" } satisfies Text,
  unsubscribing: { en: "Unsubscribing…", ru: "Отписываем…" } satisfies Text,

  gone: {
    title: { en: "You're off the list", ru: "Вы отписаны" } satisfies Text,
    text: {
      en: "No more letters will arrive. Nothing else about you changes, and the address is not passed anywhere.",
      ru: "Писем больше не будет. Больше ничего не меняется, и адрес никуда не передаётся.",
    } satisfies Text,
  },
  back: { en: "Subscribe again", ru: "Подписаться снова" } satisfies Text,

  failed: {
    en: "That did not go through. Try again in a minute, or write to",
    ru: "Не получилось. Попробуйте через минуту или напишите на",
  } satisfies Text,

  toSite: { en: "Back to the site", ru: "На сайт" } satisfies Text,
} as const;
