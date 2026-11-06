import type { AdminCopy } from "./copy-en";

/**
 * The same interface in Russian (ТЗ v4, §6).
 *
 * Typed as `AdminCopy`, which is the shape of the English file — so a key added
 * there and forgotten here fails to compile rather than silently falling back
 * to English at runtime.
 *
 * Russian needs number agreement where English does not, so a few of these are
 * functions with a `plural` helper rather than templates. That is also why the
 * two files are not generated from one another.
 */

/** "1 минуту", "2 минуты", "5 минут" — the three forms Russian needs. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const RU: AdminCopy = {
  shell: {
    documentTitle: "Админка — nazarov.net",
    panel: "Панель управления",
    menu: "Меню",
    interface: "Интерфейс",
    interfaceLanguage: "Язык панели",
    toSite: "Открыть сайт",
    signOut: "Выйти",
    comingSoon: (item: string) => `Раздел появится на пункте ${item} плана работ.`,
  },

  app: {
    loading: "Загрузка…",
    notOwner: (email: string) => `Аккаунт ${email} не является владельцем сайта.`,
    notOwnerHow: (uid: string) =>
      `Войдите под аккаунтом владельца. Если это ваш аккаунт, его нужно ` +
      `добавить в список владельцев в базе — коллекция «owners», документ с ` +
      `идентификатором ${uid}.`,
    unreachable: "Не удалось связаться с базой.",
    unreachableHow:
      "Проверьте интернет и обновите страницу. Если не помогает — возможно, " +
      "не опубликованы правила доступа Firestore.",
  },

  signIn: {
    subtitle: "Панель управления сайтом",
    email: "Почта",
    password: "Пароль",
    submit: "Войти",
    submitting: "Входим…",
    failed: {
      invalidEmail: "Неверный адрес почты.",
      invalidCredential: "Неверная почта или пароль.",
      disabled: "Этот аккаунт отключён.",
      tooManyAttempts:
        "Слишком много попыток входа. Подождите несколько минут и попробуйте снова.",
      offline: "Нет связи с сервером. Проверьте интернет.",
      unknown: "Не удалось войти. Попробуйте ещё раз.",
    },
  },

  views: {
    trips: {
      label: "Поездки",
      description: "Создание, публикация, архив и рассылка анонсов.",
    },
    interests: {
      label: "Направления",
      description: "Вкладки Sailing, Snowboarding, Skydiving, Son и новые.",
    },
    people: {
      label: "Люди",
      description: "Справочник команды: фото, роль и описание на двух языках.",
    },
    suggestions: {
      label: "Идеи поездок",
      description: "Предложенные посетителями поездки: рассмотреть, одобрить, отклонить.",
    },
    applications: {
      label: "Заявки",
      description: "Заявки на участие в поездках и заявки Solutions.",
    },
    subscribers: {
      label: "Подписчики",
      description: "Списки по направлениям и выгрузка в CSV.",
    },
    settings: {
      label: "Настройки",
      description: "Story, About, тексты Solutions, Calendly, пороги счётчиков.",
    },
  },

  rebuild: {
    unconfigured:
      "Автоматическое обновление сайта не настроено — у воркера нет токена GitHub.",
    updating: "Сайт обновляется…",
    updated: (ago: string) => (ago ? `Сайт обновлён ${ago}.` : "Сайт обновлён."),
    failed: (ago: string) =>
      ago
        ? `Последнее обновление сайта не удалось ${ago}.`
        : "Последнее обновление сайта не удалось.",
    button: "Обновить сайт",
    refused: "Сайт обновлялся только что — изменения уже на нём.",
    ago: (seconds: number) => {
      if (seconds < 90) return "только что";
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) {
        return `${minutes} ${plural(minutes, "минуту", "минуты", "минут")} назад`;
      }
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${hours} ${plural(hours, "час", "часа", "часов")} назад`;
      const days = Math.round(hours / 24);
      return `${days} ${plural(days, "день", "дня", "дней")} назад`;
    },
  },

  field: {
    contentLanguage: "Язык содержимого",
    contentLanguageHint: "На каком языке вы сейчас заполняете текст ниже",
    hasGaps: "есть незаполненные поля",
    empty: "не заполнено",
    lineCount: (count: number) => `${count} ${plural(count, "строка", "строки", "строк")}`,
    up: "Выше",
    down: "Ниже",
    remove: "Убрать",
    noMoreThan: (max: number) => `Больше ${max} добавить нельзя.`,
    addBlock: "+ Добавить блок",
    removeBlock: "Убрать блок",
    blockAbsent: "Блока нет — на странице поездки он не появится.",
    save: "Сохранить",
    saving: "Сохраняем…",
    cancel: "Отмена",
    delete: "Удалить",
    deleteConfirm: "Удалить?",
    deleteYes: "Да, удалить",
    deleteNo: "Нет",
    toList: "К списку",
  },

  image: {
    compressing: "Сжимаем…",
    uploading: "Загружаем…",
    replace: "Заменить фото",
    upload: "Загрузить фото",
    clear: "Убрать",
    showAddress: "указать адресом",
    hideAddress: "скрыть адрес",
    address: "Адрес картинки",
    addressHint:
      "Для картинок, которые уже лежат на сайте. Загруженные через кнопку " +
      "выше сюда подставляются сами.",
    uploadFailed: (detail: string) => `Не удалось загрузить: ${detail}`,
    measuring: "Определяем размер картинки…",
    stored: (size: string) =>
      `Загружено, ${size}. Хранится уменьшенная копия для карточек и телефонов.`,
    linked: (size: string) =>
      `Картинка с сайта, ${size}. Не загружалась в хранилище и не будет удалена.`,
    advice:
      "С телефона можно снять камерой или выбрать из галереи. Фото уменьшается " +
      "и сжимается перед загрузкой.",
  },

  trips: {
    loading: "Загружаем поездки…",
    notFound: "Поездка не найдена.",
    noInterests:
      "Сначала заведите хотя бы одно направление — поездка должна куда-то попасть.",
    toInterests: "К направлениям",
    create: "Новая поездка",
    none: "Поездок пока нет.",
    showing: (shown: number, total: number) => `Показано ${shown} из ${total}.`,
    untitled: "Без названия",
    noInterest: "направление не задано",
    filterStatus: "Статус",
    filterInterest: "Направление",
    statuses: {
      all: "Все",
      draft: "Черновики",
      published: "Опубликованные",
      past: "Прошедшие",
      archived: "Архив",
    },
    badges: {
      archived: "в архиве",
      past: "прошедшая",
      published: "опубликована",
      draft: "черновик",
      kidFriendly: "с детьми",
      hiddenInPast: "скрыта в прошедших",
    },
    booking: {
      open: "набор открыт",
      fewSpots: "мест мало",
      soldOut: "мест нет",
      completed: "прошла",
    },
    edit: "Изменить",
    duplicate: "Дублировать",
    archive: "В архив",
    restore: "Вернуть",
    duplicated:
      "Копия создана как черновик. Фотографии у копии те же — файлы общие с оригиналом.",
    restoredLive: "Поездка вернулась на сайт.",
    restoredDraft: "Поездка вернулась в черновики.",
    archived: "Поездка убрана с сайта в архив.",
    emptyFilter: "По этому фильтру поездок нет.",
    showAll: "Показать все",
    loadFailed: (detail: string) => `Не удалось загрузить поездки: ${detail}`,
  },

  tripForm: {
    edit: "Изменить поездку",
    create: "Новая поездка",
    live: "опубликована",
    contents: "Блоки",
    backup: "В прошлый раз эта поездка осталась несохранённой.",
    backupRestore: "Восстановить",
    backupDiscard: "Не нужно",
    missing: "Не хватает для публикации",
    missingNone: "Всё обязательное заполнено — поездку можно публиковать.",
    worthFinishing: "Стоит доделать",
    saveChanges: "Сохранить изменения",
    saveDraft: "Сохранить черновик",
    publish: "Опубликовать",
    unpublish: "Снять с публикации",
    preview: "Предпросмотр",
    discard: "Отменить изменения",
    back: "Назад",
    deleteConfirm: "Удалить поездку?",
    saveFailed: (detail: string) => `Не удалось сохранить: ${detail}`,

    basics: { title: "Основное", subtitle: "Первый экран страницы поездки." },
    interest: "Направление",
    interestPlaceholder: "Выберите направление…",
    name: "Название поездки",
    subtitle: "Подзаголовок",
    startDate: "Дата начала",
    startDateHint: "В виде 2026-11-12.",
    endDate: "Дата окончания",
    endDateHint: "После неё поездка сама уйдёт в «Past».",
    place: "Место",

    seats: {
      title: "Статус и места",
      subtitle: "Показывается на карточке и на странице поездки.",
    },
    bookingStatus: "Статус набора",
    bookingStatusHint:
      "После даты окончания статус сам станет «Completed», менять его вручную не нужно.",
    totalSeats: "Всего мест",
    seatsLeft: "Свободно мест",
    going: "Сколько человек едет",
    goingHint:
      "Если оставить пустым, считается как «всего мест» минус «свободно». Заполните, чтобы поставить своё число.",

    gallery: {
      title: "Фото первого экрана",
      subtitle:
        "От трёх до десяти фото. Последним слайдом обычно ставят карту. Обложка — то фото, которое видно в карточке поездки и в превью ссылки.",
    },
    galleryPhoto: (index: number) => `Фото ${index}`,
    galleryCover: (index: number) => `Фото ${index} · обложка`,
    galleryAdd: "Добавить фото",
    galleryEmpty: "Фотографий пока нет. Без трёх штук поездку опубликовать нельзя.",
    photoAddress: "Адрес фото",
    photoAlt: "Описание для незрячих и для поиска",
    makeCover: "Сделать обложкой",

    price: { title: "Цена", subtitle: "Заголовок на сайте — «Price»." },
    priceAmount: "Сумма",
    priceAmountHint:
      "Обычный текст, а не число: «$3,500» и «3500 $» пишутся по-разному.",
    priceIncluded: "Что входит в цену",
    priceIncludedHint: "По одному пункту на строку.",
    priceNotIncluded: "Что не входит",

    placeBlock: {
      title: "Место",
      subtitle: "Заголовок на сайте — «The place». Два-четыре абзаца.",
    },
    placeParagraphs: "Описание места",
    placeParagraphsHint: "Пустые строки не нужны — каждый абзац на своей строке.",

    audience: {
      title: "Кому подходит",
      subtitle: "Заголовок на сайте — «Is this trip for you?».",
    },
    audienceItems: "Пункты списка",
    note: "Примечание",

    whatYouGet: {
      title: "Что получишь",
      subtitle: "Заголовок на сайте — «What you get». От одной до шести карточек.",
    },
    howToPrepare: {
      title: "Подготовка",
      subtitle: "Заголовок на сайте — «How to prepare».",
    },
    card: (index: number) => `Карточка ${index}`,
    cardAdd: "Добавить карточку",
    cardsEmpty: "Карточек пока нет.",
    cardTitle: "Заголовок",
    cardText: "Текст",

    program: {
      title: "Программа по этапам",
      subtitle: "Заголовок на сайте — «Program».",
    },
    stage: (index: number) => `Этап ${index}`,
    stageAdd: "Добавить этап",
    stagesEmpty: "Этапов пока нет.",
    stageDuration: "Длительность",
    stagePlace: "Место",
    stageText: "Описание",
    programNote: "Примечание к программе",

    route: {
      title: "Маршрут по дням",
      subtitle: "Заголовок на сайте — «Day by day».",
    },
    routeIntro: "Вступление",
    day: (index: number) => `День ${index}`,
    dayAdd: "Добавить день",
    daysEmpty: "Дней пока нет.",
    dayDate: "Дата, как её показать",
    dayDateHint: "Обычный текст: по-английски и по-русски месяц пишется по-разному.",
    dayPlace: "Место",
    dayText: "Что в этот день",
    dayPhoto: "Фото дня",

    map: {
      title: "Карта",
      subtitle:
        "Заголовок на сайте — «Route map». Картинки маршрута и, если нужно, точка на карте.",
    },
    mapImage: (index: number) => `Картинка ${index}`,
    mapImageAdd: "Добавить картинку",
    mapImagesEmpty: "Картинок пока нет.",
    mapImageAddress: "Адрес картинки",
    mapCaption: "Подпись под картой",
    latitude: "Широта",
    longitude: "Долгота",

    media: {
      title: "Фото и видео",
      subtitle: "Заголовок на сайте — «Photos & videos».",
    },
    mediaPhotosEmpty: "Фотографий пока нет.",
    video: (index: number) => `Видео ${index}`,
    videoAdd: "Добавить видео",
    videosEmpty: "Ссылок на видео пока нет.",
    videoUrl: "Ссылка на YouTube",

    crew: {
      title: "Команда",
      subtitle:
        "Заголовок на сайте — «Your crew». Люди берутся из справочника, заново вводить их не нужно.",
    },
    crewNoDirectory:
      "Справочник пуст. Заведите людей в разделе «Люди» — потом их можно будет добавлять в любые поездки.",
    crewNobody: "Никто не добавлен.",
    crewAdd: "Добавить из справочника",
    crewChoose: "Выберите человека…",

    rules: {
      title: "Формат и правила",
      subtitle: "Заголовок на сайте — «Rules & safety».",
    },
    rulesTitle: "Заголовок",
    rulesText: "Текст",

    faq: {
      title: "Вопросы и ответы",
      subtitle: "Заголовок на сайте — «FAQ». Если пар нет, блок не появится.",
    },
    question: (index: number) => `Вопрос ${index}`,
    questionAdd: "Добавить вопрос",
    questionsEmpty: "Вопросов пока нет.",
    faqQuestion: "Вопрос",
    faqAnswer: "Ответ",

    flags: {
      title: "Отметки и адрес",
      subtitle: "Служебное — на странице поездки этого блока нет.",
    },
    slug: "Адрес страницы",
    kidFriendly: "С детьми можно (kid-friendly)",
    kidFriendlyHint:
      "Поездка получит значок «Kids welcome», в заявке появится поле про детей, и она покажется во вкладке Son.",
    kidAgeFrom: "Возраст детей, от",
    kidAgeTo: "Возраст детей, до",
    showInPast: "Показывать в прошедших",
    showInPastHint:
      "Выключено — после окончания поездка не появится в блоке «Past trips» этой вкладки.",

    social: {
      title: "Для соцсетей",
      subtitle:
        "Заголовок и описание, которые видно при отправке ссылки в Facebook, Telegram и WhatsApp.",
    },
    socialTitle: "Заголовок превью",
    socialTitleHint: "Если оставить пустым, возьмём название поездки.",
    socialDescription: "Описание превью",
    socialDescriptionHint: "Если оставить пустым, возьмём подзаголовок.",

    bookingLabels: {
      open: "Open for booking — набор открыт",
      fewSpots: "Few spots left — мест мало",
      soldOut: "Sold out — мест нет",
      completed: "Completed — поездка прошла",
    },
  },

  preview: {
    banner: "Предпросмотр — так поездку увидят посетители.",
    draft: "Черновик, на сайте его ещё нет.",
    back: "Вернуться к форме",
  },

  interests: {
    loading: "Загружаем направления…",
    notFound: "Направление не найдено",
    create: "Новое направление",
    none: "Пока ни одного направления.",
    count: (total: number) =>
      `Направлений: ${total}. Порядок здесь — порядок в меню сайта.`,
    hidden: "скрыто с сайта",
    noPast: "без прошедших",
    collector: "собирает поездки с детьми",
    edit: "Изменить",
    editTitle: "Изменить направление",
    createTitle: "Новое направление",
    name: "Название вкладки",
    nameHint:
      "По §16 ТЗ вкладки названы по-английски в обеих языковых версиях — но русское поле есть, если захотите иначе.",
    slug: "Адрес вкладки",
    slugHint: (slug: string) =>
      `Страница будет доступна по адресу nazarov.net/${slug}/ и nazarov.net/ru/${slug}/`,
    caption: "Подпись под секцией на главной",
    description: "Описание вкладки",
    cover: "Обложка вкладки",
    order: "Порядок в меню",
    orderHint: "Меньше — левее в блоке «MY INTERESTS» и выше на главной.",
    playlist: "Плейлист YouTube",
    playlistHint: "Необязательно. Видео из этого плейлиста появятся на странице вкладки.",
    showPast: "Показывать прошедшие поездки",
    showPastHint:
      "Выключено — блока «Past trips» на этой вкладке не будет совсем, даже если прошедшие поездки есть.",
    hide: "Скрыть вкладку с сайта",
    hideHint:
      "Вкладка пропадёт из меню и с главной, но поездки сохранятся и вернутся вместе с ней.",
    collects: "Собирать поездки с детьми из других вкладок",
    collectsHint:
      "Так устроена вкладка Son: в ней показываются все поездки с отметкой «kid-friendly». Это те же поездки, а не копии.",
    loadFailed: (detail: string) => `Не удалось загрузить направления: ${detail}`,
    saveFailed: (detail: string) => `Не удалось сохранить: ${detail}`,
    deleteFailed: (detail: string) => `Не удалось удалить: ${detail}`,
  },

  people: {
    loading: "Загружаем справочник…",
    notFound: "Человек не найден.",
    create: "Новый человек",
    none: "Пока никого. Людей из справочника можно добавлять в любые поездки, не вводя заново.",
    count: (total: number) =>
      `Людей: ${total}. Их можно добавлять в любые поездки, не вводя заново.`,
    unnamed: "Без имени",
    edit: "Изменить",
    editTitle: "Изменить человека",
    createTitle: "Новый человек",
    name: "Имя",
    role: "Роль",
    roleHint: "Как подписан человек в блоке «Your crew» на странице поездки.",
    bio: "Описание",
    photo: "Фото",
    loadFailed: (detail: string) => `Не удалось загрузить справочник: ${detail}`,
    saveFailed: (detail: string) => `Не удалось сохранить: ${detail}`,
    deleteFailed: (detail: string) => `Не удалось удалить: ${detail}`,
  },

  error: {
    permissionDenied:
      "база отказала в доступе — либо не опубликованы правила Firestore, либо " +
      "этот аккаунт не внесён в список владельцев.",
  },
};

export default RU;
