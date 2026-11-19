import { PROJECT_TYPE_LABELS } from "@/lib/content/solutions";
import type { Localized } from "@/lib/content/types";

type Text = Localized<string>;

/**
 * The words of `/solutions/` (§6.6).
 *
 * In code rather than in the database, and the settings override it field by
 * field — the same arrangement as the home page and About, and for the same
 * reason: the first save in the panel has every field empty, and an empty
 * field must mean "keep saying this" (see `lib/content/site-copy`).
 *
 * The English is the text of §6.6 word for word. That is deliberate: it is
 * what the client signed off and what the acceptance test П-17 reads, and
 * paraphrasing it here would make the two disagree. The Russian is the
 * translation; the page shows one language at a time.
 */
export const solutionsCopy = {
  eyebrow: { en: "Solutions · by CTMASS", ru: "Solutions · от CTMASS" } satisfies Text,
  heroTitle: {
    en: "We build websites and apps.",
    ru: "Делаем сайты и приложения.",
  } satisfies Text,
  heroSubtitle: {
    en: "From a landing page to a full platform — designed, built and launched for you.",
    ru: "От одной страницы до целой платформы — придумаем, соберём и запустим.",
  } satisfies Text,
  heroCta: { en: "Start a project", ru: "Начать проект" } satisfies Text,
  heroCallCta: { en: "Book a call", ru: "Записаться на звонок" } satisfies Text,

  servicesEyebrow: { en: "What we do", ru: "Что делаем" } satisfies Text,
  services: [
    {
      title: { en: "Websites", ru: "Сайты" } satisfies Text,
      text: {
        en: "Landing pages, business sites and online stores that load fast and look great on phones.",
        ru: "Лендинги, сайты компаний и магазины: быстро грузятся и хорошо смотрятся на телефоне.",
      } satisfies Text,
    },
    {
      title: { en: "Web applications", ru: "Веб-приложения" } satisfies Text,
      text: {
        en: "Platforms, booking systems, dashboards and admin panels.",
        ru: "Платформы, системы бронирования, панели с отчётами и админки.",
      } satisfies Text,
    },
    {
      title: { en: "Mobile apps", ru: "Мобильные приложения" } satisfies Text,
      text: {
        en: "Apps for iPhone and Android.",
        ru: "Приложения для iPhone и Android.",
      } satisfies Text,
    },
    {
      title: { en: "Support", ru: "Поддержка" } satisfies Text,
      text: {
        en: "Hosting, updates and fixes after launch.",
        ru: "Хостинг, обновления и починка после запуска.",
      } satisfies Text,
    },
  ],

  workEyebrow: { en: "Our work", ru: "Наши работы" } satisfies Text,
  workTitle: { en: "Built and running", ru: "Сделано и работает" } satisfies Text,
  workVisit: { en: "Open the site", ru: "Открыть сайт" } satisfies Text,
  /**
   * The two projects §6.6 names as the starting set.
   *
   * They are here rather than seeded into the database, so the section has
   * something true to show before anybody opens the panel — and so the first
   * project the owner adds replaces them instead of standing in a row beside
   * examples a developer left behind.
   */
  defaultWork: [
    {
      title: { en: "nazarov.net", ru: "nazarov.net" } satisfies Text,
      description: {
        en: "This community site: trips, subscriptions and an admin panel of its own.",
        ru: "Этот сайт сообщества: поездки, подписки и своя админка.",
      } satisfies Text,
      url: "https://nazarov.net",
    },
    {
      title: { en: "ctmass.com", ru: "ctmass.com" } satisfies Text,
      description: {
        en: "The studio's own site, with the booking calendar behind it.",
        ru: "Сайт студии с календарём записи за ним.",
      } satisfies Text,
      url: "https://ctmass.com",
    },
  ],

  processEyebrow: { en: "How we work", ru: "Как работаем" } satisfies Text,
  processLead: {
    en: "Four steps, and after the first one you know what it costs and how long it takes.",
    ru: "Четыре шага, и уже после первого вы знаете сроки и цену.",
  } satisfies Text,
  process: [
    { en: "Call", ru: "Звонок" } satisfies Text,
    { en: "Plan & estimate", ru: "План и смета" } satisfies Text,
    { en: "Build", ru: "Разработка" } satisfies Text,
    { en: "Launch & support", ru: "Запуск и поддержка" } satisfies Text,
  ],

  form: {
    eyebrow: { en: "Start a project", ru: "Начать проект" } satisfies Text,
    title: {
      en: "Tell us about your project",
      ru: "Расскажите о своём проекте",
    } satisfies Text,
    text: {
      en: "Two or three sentences are enough to start. We read every message ourselves and answer with questions, a plan and a price.",
      ru: "Для начала хватит двух-трёх предложений. Мы читаем каждое письмо сами и отвечаем вопросами, планом и ценой.",
    } satisfies Text,
    bullets: [
      {
        en: "One team does the design, the code and the launch.",
        ru: "Дизайн, код и запуск — одна команда.",
      } satisfies Text,
      {
        en: "The first call is free and commits you to nothing.",
        ru: "Первый звонок бесплатный и ни к чему не обязывает.",
      } satisfies Text,
      {
        en: "Or write to {email} directly.",
        ru: "Или напишите прямо на {email}.",
      } satisfies Text,
    ],

    name: { en: "Name", ru: "Имя" } satisfies Text,
    namePlaceholder: { en: "Alex Carter", ru: "Алексей Картер" } satisfies Text,
    email: { en: "Email", ru: "Почта" } satisfies Text,
    phone: { en: "Phone (optional)", ru: "Телефон (необязательно)" } satisfies Text,
    projectType: { en: "What do you need?", ru: "Что нужно?" } satisfies Text,
    // The four options are shared with the letter and the panel, which both
    // run where this module cannot be imported — see lib/content/solutions.
    projectTypes: PROJECT_TYPE_LABELS,
    choose: { en: "Choose one…", ru: "Выберите…" } satisfies Text,
    details: { en: "Tell us more", ru: "Подробнее" } satisfies Text,
    detailsPlaceholder: {
      en: "What it is for, who it is for, and anything you already have.",
      ru: "Для чего, для кого и что уже есть.",
    } satisfies Text,
    submit: { en: "Send", ru: "Отправить" } satisfies Text,
    sending: { en: "Sending…", ru: "Отправляем…" } satisfies Text,
    consent: {
      en: "By sending this you agree that we may use your address to answer you.",
      ru: "Отправляя форму, вы соглашаетесь, что мы ответим вам на эту почту.",
    } satisfies Text,

    sentTitle: { en: "Thanks!", ru: "Спасибо!" } satisfies Text,
    sentText: {
      en: "We'll get back to you within 1 business day.",
      ru: "Ответим в течение одного рабочего дня.",
    } satisfies Text,
    again: { en: "Send another", ru: "Отправить ещё" } satisfies Text,

    check: {
      loading: {
        en: "Checking you are not a robot…",
        ru: "Проверяем, что вы не робот…",
      } satisfies Text,
      failed: {
        en: "The spam check did not load — usually a blocker. Write to us directly:",
        ru: "Проверка не загрузилась — обычно из-за блокировщика. Напишите нам напрямую:",
      } satisfies Text,
    },
    failure: {
      text: {
        en: "The message did not go through. Try again, or write to",
        ru: "Письмо не ушло. Попробуйте ещё раз или напишите на",
      } satisfies Text,
      spam: {
        en: "The spam check refused the form. Reload the page and try once more.",
        ru: "Проверка не пропустила форму. Обновите страницу и попробуйте снова.",
      } satisfies Text,
      rejected: {
        en: "Something in the form was not filled in as expected:",
        ru: "Что-то в форме заполнено не так:",
      } satisfies Text,
      notConfigured: {
        en: "The form is not connected yet. Write to us directly:",
        ru: "Форма пока не подключена. Напишите нам напрямую:",
      } satisfies Text,
    },
  },
} as const;

export { PROJECT_TYPES } from "@/lib/content/solutions";
