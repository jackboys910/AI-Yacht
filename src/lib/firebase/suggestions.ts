import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore/lite";
import { todayUtc } from "@/lib/content/schedule";
import { slugify, uniqueSlug } from "@/lib/content/slug";
import type { AdventureSuggestion, Trip } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { stripUndefined, toSuggestion } from "./mappers";
import { blankTrip, type TripDraft } from "./trips";

/**
 * The queue of ideas people have sent in (ТЗ v4, §3.4).
 *
 * Reading and moderating only. Nothing here creates a suggestion: those are
 * written by the Worker, which checks Turnstile first and talks to Firestore
 * through a service account, because a collection a browser could write to is
 * a collection anyone can fill with rubbish.
 *
 * `firestore.rules` gives the whole collection to the owner alone. It holds
 * email addresses and people's accounts of themselves, and unlike a trip there
 * is no version of it a visitor is meant to see.
 */

export async function listSuggestions(): Promise<AdventureSuggestion[]> {
  const snapshot = await getDocs(
    collection(firestore(), collections.adventureSuggestions),
  );
  return snapshot.docs
    .map((d) => toSuggestion(d.id, d.data()))
    // Newest first: this is a queue, and the thing that came in this morning
    // is the thing the owner is looking for.
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Moving an idea along, and the owner's note to himself. */
export async function patchSuggestion(
  id: string,
  patch: Partial<Pick<AdventureSuggestion, "status" | "adminNote" | "tripId">>,
): Promise<void> {
  await setDoc(
    doc(firestore(), collections.adventureSuggestions, id),
    stripUndefined({ ...patch, updatedAt: new Date().toISOString() }),
    { merge: true },
  );
}

export async function deleteSuggestion(id: string): Promise<void> {
  await deleteDoc(doc(firestore(), collections.adventureSuggestions, id));
}

/** The first whole number in a free-text answer, if there is one. */
function firstNumber(text: string | undefined): number | undefined {
  const match = /\d+/.exec(text ?? "");
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 && value < 1000 ? value : undefined;
}

/**
 * A draft trip built from an idea.
 *
 * Everything the author wrote goes into the language they wrote it in, and the
 * other language is left empty. Translating someone's words into a column they
 * never filled in would be inventing them, and А-03 will stop the trip being
 * published until the owner has written the second version himself — which is
 * the correct outcome, not an obstacle.
 *
 * Dates are deliberately not guessed. "Late spring" is not a date, and a draft
 * that quietly claims to start today is worse than one that is obviously
 * unfinished.
 */
export function tripFromSuggestion(
  suggestion: AdventureSuggestion,
  existing: Trip[],
): TripDraft {
  const locale = suggestion.locale;
  const other = locale === "en" ? "ru" : "en";
  const only = (value: string | undefined) =>
    ({ [locale]: value ?? "", [other]: "" }) as Record<"en" | "ru", string>;
  const onlyLines = (value: string | undefined) =>
    ({
      [locale]: (value ?? "").split("\n").filter((line) => line.trim()),
      [other]: [],
    }) as Record<"en" | "ru", string[]>;

  const taken = existing
    .filter((trip) => trip.interestId === suggestion.interestId)
    .map((trip) => trip.slug);

  const seats = firstNumber(suggestion.groupSize);
  const today = todayUtc();

  return {
    ...blankTrip(suggestion.interestId),
    slug: uniqueSlug(slugify(suggestion.title) || "idea", taken),
    title: only(suggestion.title),
    place: only(suggestion.place),
    // The dates are unknown, but the model needs two: today twice is as
    // plainly a placeholder as it gets, and the form opens on it.
    startDate: today,
    endDate: today,
    totalSeats: seats ?? 0,
    seatsLeft: seats ?? 0,

    // The idea itself is the raw material for "The place", which is the block
    // that answers "what is this and why go".
    placeDetails: suggestion.description.trim()
      ? { paragraphs: onlyLines(suggestion.description) }
      : undefined,
    // Free text by design, so "about $2,000 per person" survives as written.
    price: suggestion.budget?.trim()
      ? { amount: only(suggestion.budget), included: { en: [], ru: [] }, notIncluded: { en: [], ru: [] } }
      : undefined,
    audience: suggestion.audience?.trim()
      ? { items: onlyLines(suggestion.audience) }
      : undefined,

    organizerEmail: suggestion.email,
    suggestionId: suggestion.id,
  };
}
