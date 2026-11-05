/**
 * The sections of the admin panel, in menu order.
 *
 * They follow §7 of the spec, with the moderation queue §3.4 of ТЗ v4 adds:
 * trips, interests, people, suggestions, applications, subscribers, settings.
 * Each one is filled in by a later plan item, and `comingIn` names that item so
 * the placeholder says what is missing rather than looking broken.
 */
export const ADMIN_VIEWS = [
  {
    id: "trips",
    label: "Поездки",
    description: "Создание, публикация, архив и рассылка анонсов.",
    comingIn: "1.4 и 1.7",
  },
  {
    id: "interests",
    label: "Направления",
    description: "Вкладки Sailing, Snowboarding, Skydiving, Son и новые.",
    comingIn: "1.2",
  },
  {
    id: "people",
    label: "Люди",
    description: "Справочник команды: фото, роль и описание на двух языках.",
    comingIn: "1.3",
  },
  {
    id: "suggestions",
    label: "Идеи поездок",
    description: "Предложенные посетителями поездки: рассмотреть, одобрить, отклонить.",
    comingIn: "2.5",
  },
  {
    id: "applications",
    label: "Заявки",
    description: "Заявки на участие в поездках и заявки Solutions.",
    comingIn: "2.8",
  },
  {
    id: "subscribers",
    label: "Подписчики",
    description: "Списки по направлениям и выгрузка в CSV.",
    comingIn: "3.4",
  },
  {
    id: "settings",
    label: "Настройки",
    description: "Story, About, тексты Solutions, Calendly, пороги счётчиков.",
    comingIn: "4.3",
  },
] as const;

export type AdminViewId = (typeof ADMIN_VIEWS)[number]["id"];

export const DEFAULT_VIEW: AdminViewId = "trips";

/** The view named by `?view=`, or the default when it names nothing valid. */
export function resolveView(value: string | null): AdminViewId {
  const match = ADMIN_VIEWS.find((view) => view.id === value);
  return match ? match.id : DEFAULT_VIEW;
}
