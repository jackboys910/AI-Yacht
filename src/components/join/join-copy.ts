import type { Locale } from "@/i18n/config";

type Text = Record<Locale, string>;

/**
 * The application form's words (ТЗ v4 §2.2 and §12, plan item 2.8).
 *
 * The questions are not small talk. ТЗ v4 §2.2 says in as many words what the
 * owner wanted this role for — «посмотреть, с кем вообще ехать придётся, и
 * выбирать» — so what somebody writes here is the record, and the form says
 * why it is being asked rather than leaving three large boxes unexplained.
 */
export const joinCopy = {
  heading: { en: "Join this trip", ru: "Поехать в эту поездку" } satisfies Text,
  lead: {
    en: "No account, no password. Tell me who you are and I will write back — I pick the group myself, which is why these questions are here.",
    ru: "Ни аккаунта, ни пароля. Расскажите о себе, и я отвечу — группу я собираю сам, поэтому и спрашиваю.",
  } satisfies Text,

  name: { en: "Name", ru: "Имя" } satisfies Text,
  namePlaceholder: { en: "Marta Lindqvist", ru: "Марта Линдквист" } satisfies Text,
  email: { en: "Email", ru: "Почта" } satisfies Text,
  city: { en: "Where you live", ru: "Откуда вы" } satisfies Text,
  cityPlaceholder: { en: "Lisbon", ru: "Лиссабон" } satisfies Text,
  cityHint: {
    en: "So we can work out how you get there.",
    ru: "Чтобы понять, как вам удобнее добираться.",
  } satisfies Text,
  contact: { en: "Phone, WhatsApp or Telegram", ru: "Телефон, WhatsApp или Telegram" } satisfies Text,
  contactHint: {
    en: "Optional. The answer goes to your email either way.",
    ru: "Необязательно. Ответ в любом случае придёт на почту.",
  } satisfies Text,

  socialHeading: { en: "Where to see you", ru: "Где на вас посмотреть" } satisfies Text,
  socialHint: {
    en: "One link is enough. This is the part everybody on the trip would want to see about the others.",
    ru: "Хватит одной ссылки. Это ровно то, что о попутчиках хочет знать каждый.",
  } satisfies Text,

  aboutHeading: { en: "About you", ru: "О вас" } satisfies Text,
  why: { en: "Why this trip", ru: "Почему именно эта поездка" } satisfies Text,
  whyPlaceholder: {
    en: "What made you stop on this one.",
    ru: "Что вас в ней зацепило.",
  } satisfies Text,
  about: { en: "What you are like to travel with", ru: "Какой вы попутчик" } satisfies Text,
  aboutPlaceholder: {
    en: "Experience, what you value in a group, what you cannot stand.",
    ru: "Опыт, что цените в группе, чего не выносите.",
  } satisfies Text,
  bring: { en: "What you bring to the group", ru: "Что принесёте группе" } satisfies Text,
  bringPlaceholder: {
    en: "Cooking, a guitar, a licence, patience — anything.",
    ru: "Готовка, гитара, права, терпение — что угодно.",
  } satisfies Text,

  kids: { en: "Children and their age", ru: "Дети и их возраст" } satisfies Text,
  kidsHint: {
    en: "This trip is kid-friendly — say who is coming with you.",
    ru: "Эта поездка с детьми — напишите, кто едет с вами.",
  } satisfies Text,

  submit: { en: "Send the application", ru: "Отправить заявку" } satisfies Text,
  sending: { en: "Sending…", ru: "Отправляем…" } satisfies Text,
  consent: {
    en: "What you write here goes to the owner of the site and to the trip's organizer, and nowhere else.",
    ru: "Написанное уходит владельцу сайта и организатору поездки — и больше никуда.",
  } satisfies Text,
  required: { en: "Required", ru: "Обязательно" } satisfies Text,

  /** §9 fixes this sentence; it is a promise the owner keeps, not decoration. */
  sent: {
    title: { en: "Got it!", ru: "Заявка принята!" } satisfies Text,
    text: {
      en: "Got it! I'll contact you within 24 hours.",
      ru: "Заявка получена. Я свяжусь с вами в течение 24 часов.",
    } satisfies Text,
    note: {
      en: "The answer comes to the address you gave. If it is not there tomorrow, look in the spam folder.",
      ru: "Ответ придёт на указанную почту. Если завтра его нет — загляните в спам.",
    } satisfies Text,
    again: { en: "Send another one", ru: "Отправить ещё одну" } satisfies Text,
  },

  closed: {
    en: "This trip is not taking applications: the seats are gone. Subscribe and you will hear about the next one first.",
    ru: "Заявки на эту поездку закрыты — мест нет. Подпишитесь, и о следующей узнаете первым.",
  } satisfies Text,
  over: {
    en: "This trip is over. Subscribe and you will hear about the next one first.",
    ru: "Эта поездка уже прошла. Подпишитесь, и о следующей узнаете первым.",
  } satisfies Text,

  check: {
    loading: { en: "Checking you are not a robot…", ru: "Проверяем, что вы не робот…" } satisfies Text,
    failed: {
      en: "The robot check did not load — something in the browser is blocking it. Write instead:",
      ru: "Проверка не загрузилась — её что-то блокирует в браузере. Тогда напишите:",
    } satisfies Text,
  },

  failure: {
    notConfigured: {
      en: "The form is not switched on yet. Write instead:",
      ru: "Форма пока не включена. Тогда напишите:",
    } satisfies Text,
    spam: {
      en: "The robot check did not pass. Reload the page and try again.",
      ru: "Проверка на робота не прошла. Обновите страницу и попробуйте ещё раз.",
    } satisfies Text,
    rejected: {
      en: "One of the answers was refused:",
      ru: "Один из ответов не принят:",
    } satisfies Text,
    text: {
      en: "Something broke on our side. Try again, or write:",
      ru: "Что-то сломалось на нашей стороне. Попробуйте ещё раз или напишите:",
    } satisfies Text,
  },
} as const;
