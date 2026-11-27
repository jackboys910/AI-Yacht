import type { Text } from "@/lib/family/types";

/** The furniture of the family pages: headings, buttons, small print. The
 *  family's own story lives in the tree's data file, not here. */
export const familyCopy = {
  toTree: { en: "See the tree", ru: "Смотреть древо" },
  toMap: { en: "The journey on the globe", ru: "Путь на глобусе" },

  timeline: { en: "Historical timeline", ru: "Исторический таймлайн" },
  generations: { en: "Our generations", ru: "Наши поколения" },
  treeTitle: { en: "The family tree", ru: "Родословное древо" },
  treeLead: {
    en: "From today into the past. Tap a person for what the records say; tap a year for the story of that time.",
    ru: "От сегодняшнего дня — в прошлое. Нажмите на человека, чтобы узнать, что о нём говорят документы, а на год — чтобы прочитать о том времени.",
  },
  readMore: { en: "Read about this time", ru: "Читать про это время" },
  parents: { en: "parents", ru: "родители" },
  marriage: { en: "marriage", ru: "брак" },
  more: { en: "More", ru: "Подробнее" },
  photos: { en: "Photographs", ru: "Фотографии" },
  noPhotos: { en: "No photographs yet.", ru: "Фотографий пока нет." },

  spouse: { en: "Married to", ru: "Супруг(а)" },
  spouses: { en: "Marriages", ru: "Браки" },
  siblings: { en: "Brothers and sisters", ru: "Братья и сёстры" },
  children: { en: "Children", ru: "Дети" },
  records: { en: "What the records say", ru: "Что говорят документы" },
  inMemory: { en: "In memory", ru: "Память" },
  close: { en: "Close", ru: "Закрыть" },
  thisEra: { en: "This era", ru: "Эта эпоха" },

  worldTitle: { en: "The family's world", ru: "Мир семьи" },
  worldTag: { en: "Live Earth", ru: "Живая Земля" },
  worldLead: {
    en: "Four centuries of moves on one globe: up the Vaga, to the White Sea, to Moscow — and across the ocean.",
    ru: "Четыре века переездов на одном глобусе: вверх по Ваге, к Белому морю, в Москву — и через океан.",
  },
  play: { en: "Play", ru: "Смотреть" },
  pause: { en: "Pause", ru: "Пауза" },
  replay: { en: "Again", ru: "Сначала" },
  previous: { en: "Previous", ru: "Назад" },
  next: { en: "Next", ru: "Дальше" },
  mapLoading: { en: "Bringing up the globe…", ru: "Загружаем глобус…" },
  mapFailed: {
    en: "This browser cannot draw the interactive globe, but the journey is all here, step by step.",
    ru: "Этот браузер не может показать интерактивный глобус, но весь путь здесь, по шагам.",
  },
  watchJourney: { en: "Watch the family's journey", ru: "Смотреть путь семьи" },
  placeHint: {
    en: "Click any lit place on the globe to jump to its moment.",
    ru: "Нажмите на любую светящуюся точку на глобусе — история перенесётся к ней.",
  },
  mapHint: {
    en: "Drag to turn the globe; Ctrl + wheel or two fingers to zoom.",
    ru: "Тяните, чтобы вращать глобус; Ctrl + колесо или два пальца — чтобы приблизить.",
  },
  approximate: {
    en: "Village positions are approximate; Matveevskaya and Zakharovskaya are placed by the records' description.",
    ru: "Положение деревень приблизительное; Матвеевская и Захаровская поставлены по описанию в документах.",
  },
  globeLabel: { en: "Open the journey map", ru: "Открыть карту переездов" },

  chaptersTitle: { en: "Through the centuries", ru: "Сквозь века" },
  chaptersLead: {
    en: "What the country was living through — and what the family was doing at the same time.",
    ru: "Чем жила страна — и что в это время происходило в семье.",
  },
  world: { en: "In the country", ru: "В стране" },
  family: { en: "In the family", ru: "В семье" },
  backToTree: { en: "Back to the tree", ru: "Назад к древу" },

  sourcesTitle: { en: "Sources", ru: "Источники" },
  archives: { en: "Archive documents", ru: "Архивные документы" },
  literature: { en: "Literature", ru: "Литература" },

  channelTitle: { en: "The channel", ru: "Канал" },
} satisfies Record<string, Text>;
