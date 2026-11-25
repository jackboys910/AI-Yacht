import type { Locale } from "@/i18n/config";
import { writeDay } from "@/lib/dates";

/**
 * Turning what the form's controls hold into the two lines a person reads.
 *
 * The record keeps `budget` and `when` as text, and that has not changed: the
 * owner reads them in a letter and on a card, and "€1,500" and "8 — 16 May
 * 2027" are what he needs there. What changed on 24.11.2026 is where the text
 * comes from — a number with a currency beside it, and two calendars, instead
 * of a free line each. A number typed into a box with "€" next to it cannot
 * arrive as "1500" and leave the owner guessing which currency that is, which
 * is what was happening.
 */

/** The currencies the form offers, in the order they appear in the list. */
export const CURRENCIES = ["USD", "EUR", "GBP", "RUB"] as const;

export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
};

/** Thousands separated by a thin space: readable in both languages. */
function groups(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * "€1500" from 1500 and EUR.
 *
 * The amount is whatever was typed, stripped of everything but digits and a
 * decimal point: a number field still accepts a pasted "about 1500$", and the
 * currency is asked for separately precisely so that part is not needed.
 * Nothing typed means nothing to say, which is the honest answer at the idea
 * stage and the one the form's placeholder invites.
 */
export function composeBudget(amount: string, currency: string): string {
  const cleaned = amount.replace(/[^\d.,]/g, "").replace(",", ".");
  const number = Number.parseFloat(cleaned);
  if (!Number.isFinite(number) || number <= 0) return "";

  const code = (CURRENCIES as readonly string[]).includes(currency)
    ? (currency as Currency)
    : "USD";
  const written = groups(String(Math.round(number)));

  // The rouble sign goes after the number and the others before it, which is
  // how each is written where it is used.
  return code === "RUB" ? `${written} ${SYMBOLS.RUB}` : `${SYMBOLS[code]}${written}`;
}

/**
 * "8 May 2027 — 16 May 2027", or whichever half of it was filled in.
 *
 * Both dates are optional and so is the pair. Somebody who knows only that it
 * is after the spring says so in the description; the form asks for dates it
 * can be sure of rather than for a sentence it would have to guess at.
 */
export function composeWhen(from: string, to: string, locale: Locale): string {
  const ru = locale === "ru";
  if (from && to) return `${writeDay(from, locale)} — ${writeDay(to, locale)}`;
  if (from) return ru ? `с ${writeDay(from, locale)}` : `from ${writeDay(from, locale)}`;
  if (to) return ru ? `до ${writeDay(to, locale)}` : `until ${writeDay(to, locale)}`;
  return "";
}
