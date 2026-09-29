import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore/lite";
import { RESERVED_SLUGS, isValidSlug } from "@/lib/content/slug";
import type { Interest } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { stripUndefined, toInterest } from "./mappers";

/**
 * Reading and writing the site's tabs (§7.3).
 *
 * Every write here is refused by `firestore.rules` unless the caller is the
 * owner; the checks in this file are about keeping the data sensible, not
 * about security.
 */

/** An interest as the form holds it, before the database assigns the rest. */
export type InterestDraft = Omit<Interest, "id" | "createdAt" | "updatedAt">;

export function blankInterest(order: number): InterestDraft {
  return {
    slug: "",
    // §16.1 fixes the launch tabs as English in both language versions, so a
    // new interest starts with the same string on both sides and the owner
    // changes the Russian one only if they want a Russian label.
    name: { en: "", ru: "" },
    description: { en: "", ru: "" },
    tileCaption: { en: "", ru: "" },
    order,
    showPastTrips: true,
    hidden: false,
    collectsKidFriendly: false,
  };
}

export async function listInterests(): Promise<Interest[]> {
  const snapshot = await getDocs(collection(firestore(), collections.interests));
  return snapshot.docs
    .map((d) => toInterest(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** Everything wrong with a draft, in the admin panel's language. */
export function validateInterest(
  draft: InterestDraft,
  others: Interest[],
): string[] {
  const problems: string[] = [];

  if (!draft.name.en.trim()) problems.push("Не заполнено название на английском.");
  if (!draft.name.ru.trim()) problems.push("Не заполнено название на русском.");

  if (!draft.slug.trim()) {
    problems.push("Не заполнен адрес вкладки.");
  } else if (!isValidSlug(draft.slug)) {
    problems.push(
      "Адрес может состоять только из латинских букв, цифр и дефисов между ними.",
    );
  } else if (RESERVED_SLUGS.has(draft.slug)) {
    problems.push(`Адрес «${draft.slug}» занят служебной страницей сайта.`);
  } else if (others.some((other) => other.slug === draft.slug)) {
    problems.push(`Адрес «${draft.slug}» уже занят другим направлением.`);
  }

  return problems;
}

/**
 * Saves a draft. A new interest gets its address as its document id, which
 * keeps the database readable and means the build can resolve a trip's tab
 * without a second lookup.
 */
export async function saveInterest(
  id: string | null,
  draft: InterestDraft,
): Promise<string> {
  const now = new Date().toISOString();
  const documentId = id ?? draft.slug;

  await setDoc(
    doc(firestore(), collections.interests, documentId),
    stripUndefined({
      ...draft,
      ...(id ? {} : { createdAt: now }),
      updatedAt: now,
    }),
    { merge: Boolean(id) },
  );

  return documentId;
}

/**
 * How many trips belong to an interest.
 *
 * §7.3 wants an interest hidden rather than deleted precisely so its trips
 * survive, so deleting one that still has trips would strand them: they would
 * keep existing with no tab to live under and no address to be built at.
 */
export async function countTripsIn(interestId: string): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.trips),
      where("interestId", "==", interestId),
    ),
  );
  return snapshot.size;
}

export class InterestInUseError extends Error {}

export async function deleteInterest(interestId: string): Promise<void> {
  const trips = await countTripsIn(interestId);
  if (trips > 0) {
    throw new InterestInUseError(
      `В этом направлении ${trips} ${plural(trips)}. Удалите или перенесите их, ` +
        "либо скройте направление — тогда вкладка исчезнет с сайта, а поездки останутся.",
    );
  }

  await deleteDoc(doc(firestore(), collections.interests, interestId));
}

function plural(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) return "поездок";
  if (ones === 1) return "поездка";
  if (ones >= 2 && ones <= 4) return "поездки";
  return "поездок";
}

/** Whether any interest already gathers kid-friendly trips (§6.4 — that is Son). */
export async function hasCollector(exceptId?: string): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.interests),
      where("collectsKidFriendly", "==", true),
      limit(2),
    ),
  );
  return snapshot.docs.some((d) => d.id !== exceptId);
}
