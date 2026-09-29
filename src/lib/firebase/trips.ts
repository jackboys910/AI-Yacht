import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore/lite";
import { todayUtc } from "@/lib/content/schedule";
import type { Trip } from "@/lib/content/types";
import { canPublish } from "@/lib/content/validation";
import { firestore } from "./app";
import { collections } from "./config";
import { stripUndefined, toTrip } from "./mappers";

/**
 * Reading and writing trips (§6.3, §7.2).
 *
 * Draft, publish, archive and duplicate arrive with plan item 1.7; this file
 * carries what the form itself needs — load, save, publish once the mandatory
 * blocks are filled, and delete.
 */

export type TripDraft = Omit<Trip, "id" | "createdAt" | "updatedAt">;

export function blankTrip(interestId: string): TripDraft {
  const today = todayUtc();
  return {
    interestId,
    slug: "",
    status: "draft",

    title: { en: "", ru: "" },
    subtitle: { en: "", ru: "" },
    startDate: today,
    endDate: today,
    place: { en: "", ru: "" },
    gallery: [],
    coverIndex: 0,

    bookingStatus: "open",
    totalSeats: 0,
    seatsLeft: 0,

    kidFriendly: false,
    // A new trip shows up among the past ones once it is over (§6.2).
    showInPast: true,

    crewPersonIds: [],
    faq: [],

    social: { title: { en: "", ru: "" }, description: { en: "", ru: "" } },
  };
}

export async function listTrips(): Promise<Trip[]> {
  const snapshot = await getDocs(collection(firestore(), collections.trips));
  return snapshot.docs
    .map((d) => toTrip(d.id, d.data()))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export class TripValidationError extends Error {}

/**
 * Saves a trip.
 *
 * Ids are generated rather than built from the address: the address is only
 * unique inside its interest, and moving a trip to another tab or correcting
 * its address would otherwise change the document's identity and orphan
 * everything pointing at it.
 *
 * А-03 lives here as well as in the form. The form will not offer Publish while
 * something is missing, but a draft can be edited into an invalid state and
 * published from a stale page, so the last word belongs to the write path.
 */
export async function saveTrip(
  id: string | null,
  draft: TripDraft,
  others: Trip[],
): Promise<string> {
  const clash = others.some(
    (trip) =>
      trip.id !== id && trip.interestId === draft.interestId && trip.slug === draft.slug,
  );
  if (clash) {
    throw new TripValidationError(
      `В этом направлении уже есть поездка с адресом «${draft.slug}».`,
    );
  }

  if (draft.status === "published" && !canPublish({ ...draft, id: id ?? "new", createdAt: "", updatedAt: "" })) {
    throw new TripValidationError(
      "Поездку нельзя опубликовать: не заполнены обязательные блоки.",
    );
  }

  const now = new Date().toISOString();
  const trips = collection(firestore(), collections.trips);
  const reference = id ? doc(trips, id) : doc(trips);

  await setDoc(
    reference,
    stripUndefined({
      ...draft,
      ...(id ? {} : { createdAt: now }),
      updatedAt: now,
      ...(draft.status === "published" && !draft.publishedAt ? { publishedAt: now } : {}),
    }),
    { merge: Boolean(id) },
  );

  return reference.id;
}

export async function deleteTrip(tripId: string): Promise<void> {
  await deleteDoc(doc(firestore(), collections.trips, tripId));
}
