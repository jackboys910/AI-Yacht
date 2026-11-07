import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

/**
 * Everything the subscription says, in both languages (ТЗ §15.3, plan 2.7).
 *
 * Kept away from the component for the same reason the idea form's copy is:
 * the wording is what the owner reads and corrects, and he should not have to
 * find it between a `useState` and a class list.
 *
 * "Join the crew" stays English in the Russian version. §16.1 fixes the
 * section names that way and this window is named after the same idea — the
 * crew of a boat, which is what the community calls itself.
 */
export const subscribeCopy = {
  /** The "+" next to a direction's name, and its plain version on the home page. */
  open: {
    one: {
      en: (name: string) => `+ Subscribe to ${name}`,
      ru: (name: string) => `+ Подписаться на ${name}`,
    },
    any: { en: "+ Subscribe", ru: "+ Подписаться" } satisfies Text,
  },

  strip: {
    kicker: { en: "Stay in the loop", ru: "Будьте в курсе" } satisfies Text,
    heading: {
      en: "The trips fill up from this list",
      ru: "Места в поездках разбирают по этому списку",
    } satisfies Text,
    text: {
      en: "One email and nothing else — no phone, no account. A letter goes out when a new trip opens in the directions you choose.",
      ru: "Только почта — ни телефона, ни регистрации. Письмо уходит, когда открывается новая поездка по выбранным направлениям.",
    } satisfies Text,
  },

  dialog: {
    title: { en: "Join the crew", ru: "Join the crew" } satisfies Text,
    lead: {
      en: "One email. No phone, no password, nothing to confirm — the subscription works the moment you send it.",
      ru: "Одна почта. Ни телефона, ни пароля, ничего подтверждать не нужно — подписка работает сразу.",
    } satisfies Text,
    email: { en: "Email", ru: "Почта" } satisfies Text,
    emailPlaceholder: { en: "you@example.com", ru: "you@example.com" } satisfies Text,
    directions: {
      en: "What to write to you about",
      ru: "О чём писать",
    } satisfies Text,
    directionsHint: {
      en: "Pick as many as you like. Letters come only about these.",
      ru: "Можно выбрать несколько. Письма будут только по ним.",
    } satisfies Text,
    needsOne: {
      en: "Pick at least one direction.",
      ru: "Выберите хотя бы одно направление.",
    } satisfies Text,
    consent: {
      en: "Yes, write to me about new trips. The address is used for this and nothing else.",
      ru: "Да, пишите мне о новых поездках. Адрес используется только для этого.",
    } satisfies Text,
    consentNote: {
      en: "One line in reply takes you off the list, any time.",
      ru: "Одна строка в ответ — и адрес убран из списка, в любой момент.",
    } satisfies Text,
    submit: { en: "Subscribe", ru: "Подписаться" } satisfies Text,
    sending: { en: "Subscribing…", ru: "Подписываем…" } satisfies Text,
    close: { en: "Close", ru: "Закрыть" } satisfies Text,
  },

  done: {
    title: { en: "You are on the list", ru: "Вы в списке" } satisfies Text,
    /** Н-04 asks for this sentence, with the directions named in it. */
    text: {
      en: (list: string) => `You are subscribed to news about ${list}.`,
      ru: (list: string) => `Вы подписались на новости по направлению ${list}.`,
    },
    already: {
      en: "This address was already on the list — the directions are updated.",
      ru: "Этот адрес уже был в списке — направления обновлены.",
    } satisfies Text,
    letter: {
      en: "A welcome letter is on its way. If it is not there in a few minutes, look in the spam folder.",
      ru: "Приветственное письмо уже в пути. Если его нет через несколько минут, загляните в спам.",
    } satisfies Text,
  },

  check: {
    loading: {
      en: "Checking you are not a robot…",
      ru: "Проверяем, что вы не робот…",
    } satisfies Text,
    failed: {
      en: "The robot check did not load — something in the browser is blocking it. Write instead:",
      ru: "Проверка не загрузилась — её что-то блокирует в браузере. Тогда напишите:",
    } satisfies Text,
  },

  failure: {
    notConfigured: {
      en: "The list is not switched on yet. Write instead:",
      ru: "Список пока не включён. Тогда напишите:",
    } satisfies Text,
    spam: {
      en: "The robot check did not pass. Reload the page and try again.",
      ru: "Проверка на робота не прошла. Обновите страницу и попробуйте ещё раз.",
    } satisfies Text,
    rejected: {
      en: "That address was refused. Check it for a typo.",
      ru: "Адрес не принят. Проверьте, нет ли опечатки.",
    } satisfies Text,
    text: {
      en: "Something broke on our side. Try again, or write:",
      ru: "Что-то сломалось на нашей стороне. Попробуйте ещё раз или напишите:",
    } satisfies Text,
  },
} as const;

/**
 * "Sailing, Snowboarding and Skydiving" — the list as a sentence.
 *
 * Н-04 wants the directions named back, and a comma-separated list reads like
 * a form field rather than an answer. The last pair gets "and" / «и».
 */
export function nameList(names: string[], locale: Locale): string {
  if (names.length <= 1) return names[0] ?? "";
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  return `${rest} ${locale === "ru" ? "и" : "and"} ${last}`;
}
