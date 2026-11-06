import { defaultLocale } from "@/i18n/config";
import type { Localized } from "./content/types";

/**
 * A failure whose text the owner is meant to read.
 *
 * ТЗ v4 §6 makes the admin panel bilingual, but the code that notices a problem
 * — an address already taken, a trip that may not be published yet, a file that
 * is not an image — sits in modules with no idea which language is on screen.
 * Carrying both sentences instead of one lets the check stay where it belongs
 * and the panel still answer in the language the owner is working in.
 *
 * `message` is the English text, so an error that escapes to a console or a
 * crash report still reads as a sentence.
 */
export class LocalizedError extends Error {
  readonly text: Localized<string>;

  constructor(text: Localized<string>, options?: ErrorOptions) {
    super(text[defaultLocale], options);
    this.text = text;
  }
}

/**
 * Whether a failure is Firestore refusing the request.
 *
 * It is worth telling apart from every other failure because the cause is
 * almost never what the owner did: either the rules have not been published or
 * the account is not in the owners list, and both have a specific answer.
 */
export function isPermissionDenied(error: unknown): boolean {
  return /permission|insufficient/i.test(detailOf(error));
}

/** The technical text of a failure, for wrapping in a sentence of our own. */
export function detailOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
