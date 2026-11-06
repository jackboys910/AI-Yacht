import { locales, type Locale } from "@/i18n/config";
import { isValidSlug } from "./slug";
import type { Localized, Trip } from "./types";

/**
 * What stops a trip from being published.
 *
 * А-03 requires two things: publication is blocked until the mandatory blocks
 * are filled in for both languages, and the admin panel says exactly what is
 * missing. So this returns a list of problems rather than a boolean, and every
 * problem names the field and, where it matters, the language.
 *
 * Beyond the mandatory blocks there is a second rule that the spec implies but
 * does not spell out: an optional block filled in on one language tab and left
 * empty on the other would render as a hole in one version of the page. That is
 * reported too, so the site never ships half a translation.
 *
 * Every message is itself bilingual (ТЗ v4, §6). Two languages are in play at
 * once here and they are not the same thing: a message can be *about* the
 * English text of a trip while being *written* in Russian, because the panel's
 * own language is a separate choice. Hence `Localized<string>` messages that
 * name a language inside them.
 */

export interface ValidationIssue {
  /** Path of the offending field, for scrolling the form to it. */
  field: string;
  /** The problem, in both of the panel's languages. */
  message: Localized<string>;
  /** Set when only one language is at fault. */
  locale?: Locale;
  /** A missing mandatory block blocks publication; a half-translation warns. */
  severity: "error" | "warning";
}

/** Photos the first screen needs before it looks like anything (§6.3). */
const MIN_GALLERY = 3;
const MAX_GALLERY = 10;

/** A field's name, as the panel labels it. */
type Label = Localized<string>;

const label = (en: string, ru: string): Label => ({ en, ru });

/**
 * The name of a language, as each panel language writes it.
 *
 * Read as `LANGUAGE_NAMES[panelLanguage][languageAtFault]` — "нет текста на
 * английском" needs the Russian name of English, which no single table gives.
 */
const LANGUAGE_NAMES: Record<Locale, Record<Locale, string>> = {
  en: { en: "English", ru: "Russian" },
  ru: { en: "английском", ru: "русском" },
};

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

/** Locales where a localized text is empty. */
function blankLocales(value: Localized<string> | undefined): Locale[] {
  return locales.filter((locale) => isBlank(value?.[locale]));
}

/** Locales where a localized list has no non-empty entries. */
function blankListLocales(value: Localized<string[]> | undefined): Locale[] {
  return locales.filter((locale) => !(value?.[locale] ?? []).some((item) => !isBlank(item)));
}

/** A mandatory text: every language must carry it. */
function requireText(
  issues: ValidationIssue[],
  field: string,
  name: Label,
  value: Localized<string> | undefined,
): void {
  for (const locale of blankLocales(value)) {
    issues.push({
      field,
      locale,
      severity: "error",
      message: {
        en: `“${name.en}” has no ${LANGUAGE_NAMES.en[locale]} text`,
        ru: `«${name.ru}» не заполнено на ${LANGUAGE_NAMES.ru[locale]}`,
      },
    });
  }
}

/** The half-translation warning, shared by the two optional-field checks. */
function halfTranslated(
  issues: ValidationIssue[],
  field: string,
  name: Label,
  blank: Locale[],
): void {
  if (blank.length === 0 || blank.length === locales.length) return;

  for (const locale of blank) {
    issues.push({
      field,
      locale,
      severity: "warning",
      message: {
        en: `“${name.en}” is filled in for one language only — no ${LANGUAGE_NAMES.en[locale]} text`,
        ru: `«${name.ru}» заполнено не на всех языках — нет текста на ${LANGUAGE_NAMES.ru[locale]}`,
      },
    });
  }
}

/**
 * An optional text: filled in nowhere is fine, filled in everywhere is fine,
 * filled in one language only is a half-translation.
 */
function requireBothOrNeither(
  issues: ValidationIssue[],
  field: string,
  name: Label,
  value: Localized<string> | undefined,
): void {
  halfTranslated(issues, field, name, blankLocales(value));
}

/** The same rule for a list of bullet points. */
function requireListBothOrNeither(
  issues: ValidationIssue[],
  field: string,
  name: Label,
  value: Localized<string[]> | undefined,
): void {
  halfTranslated(issues, field, name, blankListLocales(value));
}

function checkMandatory(issues: ValidationIssue[], trip: Trip): void {
  requireText(issues, "title", label("Trip title", "Название поездки"), trip.title);
  requireText(issues, "subtitle", label("Subtitle", "Подзаголовок"), trip.subtitle);
  requireText(issues, "place", label("Place", "Место"), trip.place);

  if (isBlank(trip.startDate) || isBlank(trip.endDate)) {
    issues.push({
      field: "startDate",
      severity: "error",
      message: {
        en: "The start and end dates are not set",
        ru: "Не указаны даты начала и окончания",
      },
    });
  } else if (trip.endDate < trip.startDate) {
    issues.push({
      field: "endDate",
      severity: "error",
      message: {
        en: "The end date is earlier than the start date",
        ru: "Дата окончания раньше даты начала",
      },
    });
  }

  if (!isValidSlug(trip.slug)) {
    issues.push({
      field: "slug",
      severity: "error",
      message: {
        en: "The page address is empty or contains characters that are not allowed",
        ru: "Адрес страницы пустой или содержит недопустимые символы",
      },
    });
  }

  if (trip.gallery.length < MIN_GALLERY) {
    issues.push({
      field: "gallery",
      severity: "error",
      message: {
        en: `The first screen needs at least ${MIN_GALLERY} photos; there are ${trip.gallery.length}`,
        ru: `В слайдере первого экрана нужно не меньше ${MIN_GALLERY} фото, сейчас ${trip.gallery.length}`,
      },
    });
  } else if (trip.gallery.length > MAX_GALLERY) {
    issues.push({
      field: "gallery",
      severity: "error",
      message: {
        en: `The first screen takes at most ${MAX_GALLERY} photos; there are ${trip.gallery.length}`,
        ru: `В слайдере первого экрана не больше ${MAX_GALLERY} фото, сейчас ${trip.gallery.length}`,
      },
    });
  }

  if (trip.coverIndex < 0 || trip.coverIndex >= trip.gallery.length) {
    issues.push({
      field: "coverIndex",
      severity: "error",
      message: { en: "No cover photo has been chosen", ru: "Не выбрана обложка" },
    });
  }

  if (trip.totalSeats <= 0) {
    issues.push({
      field: "totalSeats",
      severity: "error",
      message: {
        en: "The total number of seats is not set",
        ru: "Не указано, сколько всего мест",
      },
    });
  }

  if (trip.seatsLeft < 0 || trip.seatsLeft > trip.totalSeats) {
    issues.push({
      field: "seatsLeft",
      severity: "error",
      message: {
        en: "Seats left cannot be below zero or above the total",
        ru: "Свободных мест не может быть меньше нуля или больше, чем всего мест",
      },
    });
  }

  if (trip.kidFriendly) {
    const { kidAgeFrom: from, kidAgeTo: to } = trip;
    if (from !== undefined && to !== undefined && from > to) {
      issues.push({
        field: "kidAgeFrom",
        severity: "error",
        message: {
          en: "The children's age “from” is greater than “to”",
          ru: "Возраст детей «от» больше, чем «до»",
        },
      });
    }
  }
}

function checkOptionalBlocks(issues: ValidationIssue[], trip: Trip): void {
  if (trip.price) {
    requireBothOrNeither(issues, "price.amount", label("Price", "Цена"), trip.price.amount);
    requireListBothOrNeither(
      issues,
      "price.included",
      label("What the price includes", "Что входит в цену"),
      trip.price.included,
    );
    requireListBothOrNeither(
      issues,
      "price.notIncluded",
      label("What the price does not include", "Что не входит в цену"),
      trip.price.notIncluded,
    );
  }

  if (trip.placeDetails) {
    requireListBothOrNeither(
      issues,
      "placeDetails.paragraphs",
      label("Description of the place", "Описание места"),
      trip.placeDetails.paragraphs,
    );
  }

  if (trip.audience) {
    requireListBothOrNeither(
      issues,
      "audience.items",
      label("Who it suits", "Кому подходит"),
      trip.audience.items,
    );
    requireBothOrNeither(
      issues,
      "audience.note",
      label("The note on “Who it suits”", "Примечание к «Кому подходит»"),
      trip.audience.note,
    );
  }

  for (const [key, name] of [
    ["whatYouGet", label("What you get", "Что получишь")],
    ["howToPrepare", label("How to prepare", "Подготовка")],
  ] as const) {
    const block = trip[key];
    if (!block) continue;

    block.cards.forEach((card, index) => {
      requireBothOrNeither(
        issues,
        `${key}.cards.${index}.title`,
        label(
          `${name.en}: heading of card ${index + 1}`,
          `${name.ru}: заголовок карточки ${index + 1}`,
        ),
        card.title,
      );
      requireBothOrNeither(
        issues,
        `${key}.cards.${index}.text`,
        label(
          `${name.en}: text of card ${index + 1}`,
          `${name.ru}: текст карточки ${index + 1}`,
        ),
        card.text,
      );
    });

    requireBothOrNeither(
      issues,
      `${key}.note`,
      label(`The note on “${name.en}”`, `Примечание к «${name.ru}»`),
      block.note,
    );
  }

  if (trip.whatYouGet && trip.whatYouGet.cards.length > 6) {
    issues.push({
      field: "whatYouGet.cards",
      severity: "error",
      message: {
        en: `The “What you get” block takes at most 6 cards; there are ${trip.whatYouGet.cards.length}`,
        ru: `В блоке «Что получишь» не больше 6 карточек, сейчас ${trip.whatYouGet.cards.length}`,
      },
    });
  }

  trip.program?.stages.forEach((stage, index) => {
    const at = `program.stages.${index}`;
    const n = index + 1;
    requireBothOrNeither(
      issues,
      `${at}.duration`,
      label(`Programme: length of stage ${n}`, `Программа: длительность этапа ${n}`),
      stage.duration,
    );
    requireBothOrNeither(
      issues,
      `${at}.place`,
      label(`Programme: place of stage ${n}`, `Программа: место этапа ${n}`),
      stage.place,
    );
    requireBothOrNeither(
      issues,
      `${at}.text`,
      label(`Programme: description of stage ${n}`, `Программа: описание этапа ${n}`),
      stage.text,
    );
  });

  trip.route?.days.forEach((day, index) => {
    const at = `route.days.${index}`;
    const n = day.number;
    requireBothOrNeither(
      issues,
      `${at}.place`,
      label(`Route: place of day ${n}`, `Маршрут: место дня ${n}`),
      day.place,
    );
    requireBothOrNeither(
      issues,
      `${at}.text`,
      label(`Route: description of day ${n}`, `Маршрут: описание дня ${n}`),
      day.text,
    );
    requireBothOrNeither(
      issues,
      `${at}.date`,
      label(`Route: date of day ${n}`, `Маршрут: дата дня ${n}`),
      day.date,
    );
  });

  if (trip.rules) {
    requireBothOrNeither(
      issues,
      "rules.title",
      label("Rules: heading", "Правила: заголовок"),
      trip.rules.title,
    );
    requireBothOrNeither(
      issues,
      "rules.text",
      label("Rules: text", "Правила: текст"),
      trip.rules.text,
    );
  }

  trip.faq.forEach((item, index) => {
    requireBothOrNeither(
      issues,
      `faq.${index}.question`,
      label(`Question ${index + 1}`, `Вопрос ${index + 1}`),
      item.question,
    );
    requireBothOrNeither(
      issues,
      `faq.${index}.answer`,
      label(`Answer ${index + 1}`, `Ответ ${index + 1}`),
      item.answer,
    );
  });
}

/** Everything wrong with a trip, mandatory problems first. */
export function validateTrip(trip: Trip): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkMandatory(issues, trip);
  checkOptionalBlocks(issues, trip);

  return issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
    return a.field.localeCompare(b.field);
  });
}

/** А-03: only a trip with no errors may go live. Warnings do not block. */
export function canPublish(trip: Trip): boolean {
  return !validateTrip(trip).some((issue) => issue.severity === "error");
}
