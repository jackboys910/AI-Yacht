import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore/lite";
import { todayUtc } from "@/lib/content/schedule";
import { uniqueSlug } from "@/lib/content/slug";
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

/**
 * Publish, unpublish, archive and bring back (А-10).
 *
 * Archiving remembers what the trip was, so "Вернуть" restores that state in
 * one action rather than always producing a draft the owner then has to
 * publish again.
 */
export async function setTripStatus(
  trip: Trip,
  next: "draft" | "published" | "archived" | "restore",
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updatedAt: now };

  if (next === "archived") {
    patch.status = "archived";
    patch.statusBeforeArchive = trip.status === "archived" ? "draft" : trip.status;
  } else if (next === "restore") {
    patch.status = trip.statusBeforeArchive ?? "draft";
    patch.statusBeforeArchive = deleteField();
  } else {
    if (next === "published" && !canPublish(trip)) {
      throw new TripValidationError(
        "Поездку нельзя опубликовать: не заполнены обязательные блоки.",
      );
    }
    patch.status = next;
    if (next === "published" && !trip.publishedAt) patch.publishedAt = now;
  }

  await setDoc(doc(firestore(), collections.trips, trip.id), patch, { merge: true });
}

/**
 * Copies a trip as a draft (А-11), so the next one in a series is filled in
 * from the last rather than from nothing.
 *
 * Pictures are referenced, not re-uploaded. See the note in storage.ts: the
 * browser cannot read a stored file back without a CORS policy on the bucket,
 * and sharing is safe because stored files are immutable and nothing here
 * deletes them.
 */
export async function duplicateTrip(trip: Trip, others: Trip[]): Promise<string> {
  const taken = others
    .filter((other) => other.interestId === trip.interestId)
    .map((other) => other.slug);

  const draft: TripDraft = {
    ...stripTripIds(trip),
    status: "draft",
    slug: uniqueSlug(`${trip.slug}-copy`, taken),
    title: {
      en: `${trip.title.en} (copy)`.trim(),
      ru: `${trip.title.ru} (копия)`.trim(),
    },
    // A copy has never been published and its announcement has never gone out.
    publishedAt: undefined,
    announcementSentAt: undefined,
    statusBeforeArchive: undefined,
  };

  return saveTrip(null, draft, others);
}

/**
 * The editable half of a trip, without the fields the database owns.
 *
 * Written out field by field rather than by dropping keys: adding a field to
 * `Trip` then fails to compile here until it is either carried across or
 * deliberately left out, instead of silently vanishing on the next save — or,
 * worse, out of every duplicate.
 */
export function stripTripIds(trip: Trip): TripDraft {
  return {
    interestId: trip.interestId,
    slug: trip.slug,
    status: trip.status,
    title: trip.title,
    subtitle: trip.subtitle,
    startDate: trip.startDate,
    endDate: trip.endDate,
    place: trip.place,
    gallery: trip.gallery,
    coverIndex: trip.coverIndex,
    bookingStatus: trip.bookingStatus,
    totalSeats: trip.totalSeats,
    seatsLeft: trip.seatsLeft,
    goingOverride: trip.goingOverride,
    kidFriendly: trip.kidFriendly,
    kidAgeFrom: trip.kidAgeFrom,
    kidAgeTo: trip.kidAgeTo,
    showInPast: trip.showInPast,
    price: trip.price,
    placeDetails: trip.placeDetails,
    audience: trip.audience,
    whatYouGet: trip.whatYouGet,
    howToPrepare: trip.howToPrepare,
    program: trip.program,
    route: trip.route,
    map: trip.map,
    media: trip.media,
    crewPersonIds: trip.crewPersonIds,
    rules: trip.rules,
    faq: trip.faq,
    social: trip.social,
    announcementSentAt: trip.announcementSentAt,
    publishedAt: trip.publishedAt,
    statusBeforeArchive: trip.statusBeforeArchive,
  };
}
