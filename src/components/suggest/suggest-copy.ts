import type { Locale } from "@/i18n/config";

/**
 * Every word of the Suggest an Adventure page (ТЗ v4, §3).
 *
 * Kept here rather than in `i18n/dictionaries` for the same reason the About
 * page keeps its own: this is one page's copy, it is long, and the shared
 * dictionaries are for things said in several places.
 *
 * The form asks fourteen questions and insists on five. That ratio is the
 * point. At the idea stage nobody knows the dates or the price, and every
 * field marked required is a reason to close the tab instead of sending
 * something half-formed — which is the one outcome this page cannot afford.
 */

type Text = Record<Locale, string>;

const t = (en: string, ru: string): Text => ({ en, ru });

export const suggestCopy = {
  meta: {
    title: t("Suggest an Adventure", "Предложите приключение"),
    description: t(
      "Propose a trip, an event or a project, and gather people around it. Free, like everything here.",
      "Предложите поездку, событие или проект и соберите вокруг людей. Бесплатно, как и всё здесь.",
    ),
  },

  hero: {
    eyebrow: t("Suggest an Adventure", "Предложите приключение"),
    title: t("Got an idea? Bring it.", "Есть идея? Несите."),
    text: t(
      "You do not have to be an organizer to start something. Describe what you " +
        "want to do and who you want to do it with — if it fits, we work out the " +
        "details together and you run it yourself.",
      "Чтобы что-то начать, не нужно быть организатором. Опишите, что хотите " +
        "сделать и с кем, — если идея подойдёт, детали обсудим вместе, а вести " +
        "поездку будете вы сами.",
    ),
    points: [
      t("No dates or prices needed yet.", "Даты и цены пока не нужны."),
      t("One person reads these — not a form inbox.", "Это читает человек, а не папка «входящие»."),
      t("Approved, and the panel for your trip is yours.", "Если одобрим, панель этой поездки станет вашей."),
    ],
  },

  form: {
    ideaHeading: t("The idea", "Идея"),
    aboutHeading: t("About you", "О вас"),
    required: t("Required", "Обязательно"),

    title: t("What is the adventure?", "Что за приключение?"),
    titlePlaceholder: t("A week sailing the Lofoten islands", "Неделя под парусом по Лофотенам"),

    category: t("Category", "Категория"),
    categoryChoose: t("Choose one…", "Выберите…"),
    categoryOther: t("Name your own category", "Впишите свою категорию"),
    categoryOtherPlaceholder: t("Diving, cycling, something else…", "Дайвинг, велосипед, что-то ещё…"),

    description: t("Describe it", "Расскажите подробнее"),
    descriptionPlaceholder: t(
      "What would happen, and why it is worth doing.",
      "Что произойдёт и почему это стоит сделать.",
    ),

    place: t("Destination or location", "Куда"),
    placePlaceholder: t("A city, a region, a marina, a dropzone", "Город, регион, марина, дропзона"),

    when: t("When, roughly", "Когда примерно"),
    whenPlaceholder: t("Late spring, or September", "Поздняя весна или сентябрь"),

    budget: t("Budget per person", "Бюджет на человека"),
    budgetPlaceholder: t("About €1,500 — or “no idea yet”", "Около 1500 € — или «пока не знаю»"),

    groupSize: t("How many people", "Сколько человек"),
    groupSizePlaceholder: t("6–8", "6–8"),

    level: t("Experience level", "Уровень подготовки"),
    levels: {
      "": t("Not sure yet", "Пока не знаю"),
      beginner: t("Beginner", "Начинающий"),
      intermediate: t("Intermediate", "Средний"),
      advanced: t("Advanced", "Опытный"),
      allLevels: t("All levels", "Любой"),
    },

    name: t("Your name", "Ваше имя"),
    namePlaceholder: t("Marta Lindqvist", "Антон Кравцов"),

    email: t("Email", "Почта"),
    emailPlaceholder: t("you@example.com", "you@example.com"),
    emailHint: t(
      "Questions, the decision and — if it goes ahead — access to your trip all come here.",
      "Сюда придут вопросы, решение и, если всё сложится, доступ к вашей поездке.",
    ),

    facebook: t("Facebook", "Facebook"),
    instagram: t("Instagram", "Instagram"),
    linkedin: t("LinkedIn", "LinkedIn"),
    socialHint: t(
      "Not required, but asked for a reason: trips are small, and knowing who " +
        "is proposing one is how the group stays a group.",
      "Не обязательно, но просим не из любопытства: поездки маленькие, и знать, " +
        "кто их предлагает, — это то, что держит группу группой.",
    ),

    experience: t("Have you organized anything like this?", "Организовывали подобное?"),
    experiencePlaceholder: t(
      "Even “never, but I have been on four” is an answer.",
      "«Нет, но сам ездил четыре раза» — тоже ответ.",
    ),

    audience: t("Who do you want to bring together?", "Кого хотите собрать?"),
    audiencePlaceholder: t(
      "The kind of people this is for.",
      "Для кого это.",
    ),

    photos: t("Photos or links for reference", "Фото или ссылки для примера"),
    photosPlaceholder: t("One link per line", "По одной ссылке на строку"),
    photosHint: t(
      "Links only — nothing is uploaded here. Real photos come later, when the trip is made.",
      "Только ссылки, ничего не загружается. Настоящие фотографии появятся позже, когда поездка будет собрана.",
    ),

    submit: t("Send the idea", "Отправить идею"),
    sending: t("Sending…", "Отправляем…"),
    consent: t(
      "Sending this shares your answers with the owner of the site, and nobody else.",
      "Отправляя, вы показываете ответы владельцу сайта — и больше никому.",
    ),
  },

  check: {
    loading: t("Checking you are not a robot…", "Проверяем, что вы не робот…"),
    failed: t(
      "The anti-spam check could not load, so the form cannot be sent. An ad " +
        "blocker or a strict network is the usual reason. Write to us instead:",
      "Проверка от спама не загрузилась, и форму не отправить. Обычно мешает " +
        "блокировщик рекламы или строгая сеть. Тогда напишите нам:",
    ),
  },

  sent: {
    title: t("Idea received", "Идея получена"),
    text: t(
      "Thank you. It is in the queue and one person — not a team — reads them. " +
        "The answer comes to the address you gave.",
      "Спасибо. Она в очереди, и читает их один человек, а не отдел. Ответ " +
        "придёт на указанную вами почту.",
    ),
    next: t("What happens now", "Что дальше"),
    steps: [
      t("It gets read and, if anything is unclear, we ask.", "Её прочитают и, если что-то непонятно, спросят."),
      t("If it fits, we work out the dates, the route and the price together.", "Если идея подойдёт, вместе определим даты, маршрут и цену."),
      t(
        "The trip goes on the site, and you get the panel for it — yours alone.",
        "Поездка появится на сайте, а вы получите панель для неё — только для неё.",
      ),
    ],
    home: t("Back to the home page", "На главную"),
    another: t("Suggest another one", "Предложить ещё одну"),
  },

  failure: {
    title: t("It did not go through", "Не отправилось"),
    text: t(
      "Something broke on our side, not yours. Try again in a minute, or write to:",
      "Что-то сломалось на нашей стороне, не на вашей. Попробуйте через минуту или напишите на:",
    ),
    retry: t("Try again", "Попробовать ещё раз"),
    notConfigured: t(
      "The form is not switched on yet — the site is still being set up. Write to us directly:",
      "Форма ещё не включена — сайт пока настраивается. Напишите нам напрямую:",
    ),
    rejected: t(
      "One of the answers was not accepted. Check this field:",
      "Один из ответов не приняли. Проверьте поле:",
    ),
    spam: t(
      "The anti-spam check did not pass. Reload the page and try once more.",
      "Проверка от спама не прошла. Обновите страницу и попробуйте ещё раз.",
    ),
  },
} as const;
