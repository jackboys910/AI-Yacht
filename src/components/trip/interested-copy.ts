import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

/**
 * Everything the "I'm interested" button says (§6.3, plan item 3.1).
 *
 * The English is Appendix В's, word for word: the button, the line about what
 * the address is for, and the thank-you. They are the part of the page the
 * owner reads and corrects, so they live apart from the markup.
 */
export const interestedCopy = {
  button: { en: "I'm interested", ru: "Мне интересно" } satisfies Text,

  dialog: {
    title: { en: "I'm interested", ru: "Мне интересно" } satisfies Text,
    /** The sentence §6.3 asks for, verbatim. */
    lead: {
      en: "We'll email you when spots open or the price changes.",
      ru: "Напишем, когда освободятся места или изменится цена.",
    } satisfies Text,
    /**
     * Said before the field, because this is the part people are not
     * expecting: one press puts them on the list for the whole direction,
     * not only for this trip.
     */
    note: {
      en: (direction: string) =>
        `You will also hear about new ${direction} trips. One letter at a time, and you can stop whenever you like.`,
      ru: (direction: string) =>
        `Заодно будете узнавать о новых поездках — ${direction}. По письму за раз, отписаться можно в любой момент.`,
    },
    email: { en: "Email", ru: "Почта" } satisfies Text,
    emailPlaceholder: { en: "you@example.com", ru: "you@example.com" } satisfies Text,
    submit: { en: "Keep me posted", ru: "Держите в курсе" } satisfies Text,
    sending: { en: "Sending…", ru: "Отправляем…" } satisfies Text,
    close: { en: "Close", ru: "Закрыть" } satisfies Text,
  },

  done: {
    title: { en: "Thanks!", ru: "Спасибо!" } satisfies Text,
    text: {
      en: (trip: string) => `You're on the list for ${trip}.`,
      ru: (trip: string) => `Вы в списке: ${trip}.`,
    },
    already: {
      en: "This address was already on it — nothing counted twice.",
      ru: "Этот адрес уже был в списке — второй раз он не считается.",
    } satisfies Text,
  },

  failure: {
    notConfigured: {
      en: "The list is not switched on yet. Write to",
      ru: "Список пока не подключён. Напишите на",
    } satisfies Text,
    spam: {
      en: "The robot check did not pass. Reload the page and try once more.",
      ru: "Проверка не прошла. Обновите страницу и попробуйте ещё раз.",
    } satisfies Text,
    rejected: {
      en: "That address does not look right — check it and send again.",
      ru: "Адрес выглядит неправильным — проверьте и отправьте ещё раз.",
    } satisfies Text,
    text: {
      en: "It did not send. Try again in a minute, or write to",
      ru: "Не отправилось. Попробуйте через минуту или напишите на",
    } satisfies Text,
  },

  check: {
    loading: { en: "Checking you are not a robot…", ru: "Проверяем, что вы не робот…" } satisfies Text,
    failed: {
      en: "The robot check did not load — an extension may be blocking it. Write to",
      ru: "Проверка не загрузилась — возможно, её блокирует расширение. Напишите на",
    } satisfies Text,
  },

  figures: {
    going: { en: "going", ru: "едут" },
    interested: { en: "interested", ru: "интересуются" },
  } satisfies Record<string, Text>,

  /** The tail of the row of faces: "+7 more". */
  more: {
    en: (count: number) => `+${count} more`,
    ru: (count: number) => `ещё ${count}`,
  },

  /** The same two numbers on a card, where they are one line of text. */
  card: {
    going: {
      en: (count: number) => `${count} going`,
      ru: (count: number) => `${count} едут`,
    },
    interested: {
      en: (count: number) => `${count} interested`,
      ru: (count: number) => `${count} интересуются`,
    },
  },
} as const;
