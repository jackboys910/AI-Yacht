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
 * Messages are Russian because the admin panel is (§7).
 */

export interface ValidationIssue {
  /** Path of the offending field, for scrolling the form to it. */
  field: string;
  message: string;
  /** Set when only one language is at fault. */
  locale?: Locale;
  /** A missing mandatory block blocks publication; a half-translation warns. */
  severity: "error" | "warning";
}

/** Photos the first screen needs before it looks like anything (§6.3). */
const MIN_GALLERY = 3;
const MAX_GALLERY = 10;

const LOCALE_NAMES: Record<Locale, string> = { en: "английском", ru: "русском" };

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
  label: string,
  value: Localized<string> | undefined,
): void {
  for (const locale of blankLocales(value)) {
    issues.push({
      field,
      locale,
      severity: "error",
      message: `«${label}» не заполнено на ${LOCALE_NAMES[locale]}`,
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
  label: string,
  value: Localized<string> | undefined,
): void {
  const blank = blankLocales(value);
  if (blank.length === 0 || blank.length === locales.length) return;

  for (const locale of blank) {
    issues.push({
      field,
      locale,
      severity: "warning",
      message: `«${label}» заполнено не на всех языках — нет текста на ${LOCALE_NAMES[locale]}`,
    });
  }
}

/** The same rule for a list of bullet points. */
function requireListBothOrNeither(
  issues: ValidationIssue[],
  field: string,
  label: string,
  value: Localized<string[]> | undefined,
): void {
  const blank = blankListLocales(value);
  if (blank.length === 0 || blank.length === locales.length) return;

  for (const locale of blank) {
    issues.push({
      field,
      locale,
      severity: "warning",
      message: `«${label}» заполнено не на всех языках — нет текста на ${LOCALE_NAMES[locale]}`,
    });
  }
}

function checkMandatory(issues: ValidationIssue[], trip: Trip): void {
  requireText(issues, "title", "Название поездки", trip.title);
  requireText(issues, "subtitle", "Подзаголовок", trip.subtitle);
  requireText(issues, "place", "Место", trip.place);

  if (isBlank(trip.startDate) || isBlank(trip.endDate)) {
    issues.push({
      field: "startDate",
      severity: "error",
      message: "Не указаны даты начала и окончания",
    });
  } else if (trip.endDate < trip.startDate) {
    issues.push({
      field: "endDate",
      severity: "error",
      message: "Дата окончания раньше даты начала",
    });
  }

  if (!isValidSlug(trip.slug)) {
    issues.push({
      field: "slug",
      severity: "error",
      message: "Адрес страницы пустой или содержит недопустимые символы",
    });
  }

  if (trip.gallery.length < MIN_GALLERY) {
    issues.push({
      field: "gallery",
      severity: "error",
      message: `В слайдере первого экрана нужно не меньше ${MIN_GALLERY} фото, сейчас ${trip.gallery.length}`,
    });
  } else if (trip.gallery.length > MAX_GALLERY) {
    issues.push({
      field: "gallery",
      severity: "error",
      message: `В слайдере первого экрана не больше ${MAX_GALLERY} фото, сейчас ${trip.gallery.length}`,
    });
  }

  if (trip.coverIndex < 0 || trip.coverIndex >= trip.gallery.length) {
    issues.push({ field: "coverIndex", severity: "error", message: "Не выбрана обложка" });
  }

  if (trip.totalSeats <= 0) {
    issues.push({ field: "totalSeats", severity: "error", message: "Не указано, сколько всего мест" });
  }

  if (trip.seatsLeft < 0 || trip.seatsLeft > trip.totalSeats) {
    issues.push({
      field: "seatsLeft",
      severity: "error",
      message: "Свободных мест не может быть меньше нуля или больше, чем всего мест",
    });
  }

  if (trip.kidFriendly) {
    const { kidAgeFrom: from, kidAgeTo: to } = trip;
    if (from !== undefined && to !== undefined && from > to) {
      issues.push({
        field: "kidAgeFrom",
        severity: "error",
        message: "Возраст детей «от» больше, чем «до»",
      });
    }
  }
}

function checkOptionalBlocks(issues: ValidationIssue[], trip: Trip): void {
  if (trip.price) {
    requireBothOrNeither(issues, "price.amount", "Цена", trip.price.amount);
    requireListBothOrNeither(issues, "price.included", "Что входит в цену", trip.price.included);
    requireListBothOrNeither(issues, "price.notIncluded", "Что не входит в цену", trip.price.notIncluded);
  }

  if (trip.placeDetails) {
    requireListBothOrNeither(issues, "placeDetails.paragraphs", "Описание места", trip.placeDetails.paragraphs);
  }

  if (trip.audience) {
    requireListBothOrNeither(issues, "audience.items", "Кому подходит", trip.audience.items);
    requireBothOrNeither(issues, "audience.note", "Примечание к «Кому подходит»", trip.audience.note);
  }

  for (const [key, label] of [
    ["whatYouGet", "Что получишь"],
    ["howToPrepare", "Подготовка"],
  ] as const) {
    const block = trip[key];
    if (!block) continue;

    block.cards.forEach((card, index) => {
      requireBothOrNeither(issues, `${key}.cards.${index}.title`, `${label}: заголовок карточки ${index + 1}`, card.title);
      requireBothOrNeither(issues, `${key}.cards.${index}.text`, `${label}: текст карточки ${index + 1}`, card.text);
    });
    requireBothOrNeither(issues, `${key}.note`, `Примечание к «${label}»`, block.note);
  }

  if (trip.whatYouGet && trip.whatYouGet.cards.length > 6) {
    issues.push({
      field: "whatYouGet.cards",
      severity: "error",
      message: `В блоке «Что получишь» не больше 6 карточек, сейчас ${trip.whatYouGet.cards.length}`,
    });
  }

  trip.program?.stages.forEach((stage, index) => {
    const at = `program.stages.${index}`;
    requireBothOrNeither(issues, `${at}.duration`, `Программа: длительность этапа ${index + 1}`, stage.duration);
    requireBothOrNeither(issues, `${at}.place`, `Программа: место этапа ${index + 1}`, stage.place);
    requireBothOrNeither(issues, `${at}.text`, `Программа: описание этапа ${index + 1}`, stage.text);
  });

  trip.route?.days.forEach((day, index) => {
    const at = `route.days.${index}`;
    requireBothOrNeither(issues, `${at}.place`, `Маршрут: место дня ${day.number}`, day.place);
    requireBothOrNeither(issues, `${at}.text`, `Маршрут: описание дня ${day.number}`, day.text);
    requireBothOrNeither(issues, `${at}.date`, `Маршрут: дата дня ${day.number}`, day.date);
  });

  if (trip.rules) {
    requireBothOrNeither(issues, "rules.title", "Правила: заголовок", trip.rules.title);
    requireBothOrNeither(issues, "rules.text", "Правила: текст", trip.rules.text);
  }

  trip.faq.forEach((item, index) => {
    requireBothOrNeither(issues, `faq.${index}.question`, `Вопрос ${index + 1}`, item.question);
    requireBothOrNeither(issues, `faq.${index}.answer`, `Ответ ${index + 1}`, item.answer);
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
