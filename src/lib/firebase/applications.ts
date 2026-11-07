import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  where,
} from "firebase/firestore/lite";
import type { ApplicationStatus, TripApplication } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { toApplication } from "./mappers";
import { stripUndefined } from "./mappers";

/**
 * Who asked to come, in the panel (ТЗ v4 §12, С-06).
 *
 * Reading and deciding only. Applications are written by the Worker through a
 * service account: `applications` is the most private collection on the site,
 * and a browser that could write to it could also fill it.
 *
 * Two readers, two queries. The owner reads the lot. An organizer may only
 * read the applications to their own trip, and the filter below is not a
 * convenience — `firestore.rules` has to be able to prove a list query safe
 * from the query itself, so a query without this filter is refused whole and
 * the panel would show an error where the organizer expects their applicants.
 */

export async function listApplications(): Promise<TripApplication[]> {
  const snapshot = await getDocs(collection(firestore(), collections.applications));
  return sortNewestFirst(snapshot.docs.map((d) => toApplication(d.id, d.data())));
}

/** The applications an organizer is allowed to see — their own trips'. */
export async function applicationsForOrganizer(
  email: string,
): Promise<TripApplication[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.applications),
      // Lowercase on both sides: Firebase lowercases the address in the
      // token, and so does the Worker when it copies it onto the record.
      where("organizerEmail", "==", email.trim().toLowerCase()),
    ),
  );
  return sortNewestFirst(snapshot.docs.map((d) => toApplication(d.id, d.data())));
}

/** The owner's decision, and his note to himself. */
export async function patchApplication(
  id: string,
  patch: Partial<Pick<TripApplication, "status" | "handled" | "adminNote">>,
): Promise<void> {
  await setDoc(
    doc(firestore(), collections.applications, id),
    stripUndefined({ ...patch, updatedAt: new Date().toISOString() }),
    { merge: true },
  );
}

/**
 * Hands every application on a trip to whoever organizes it now.
 *
 * The organizer's address is copied onto each application when it arrives,
 * so an application that arrived before the owner named an organizer — or
 * before he changed his mind about who it should be — would be invisible to
 * them. This is what the trip form calls after saving that change.
 */
export async function restampOrganizer(
  tripId: string,
  organizerEmail: string | undefined,
): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.applications),
      where("tripId", "==", tripId),
    ),
  );

  const email = organizerEmail?.trim().toLowerCase();
  let touched = 0;

  for (const found of snapshot.docs) {
    if ((found.data().organizerEmail ?? "") === (email ?? "")) continue;
    await setDoc(
      doc(firestore(), collections.applications, found.id),
      // An empty string rather than a deleted field: the rule compares it
      // with the address in a token, and "" matches nobody.
      { organizerEmail: email ?? "", updatedAt: new Date().toISOString() },
      { merge: true },
    );
    touched += 1;
  }

  return touched;
}

export function statusesInOrder(): ApplicationStatus[] {
  return ["new", "accepted", "declined"];
}

function sortNewestFirst(rows: TripApplication[]): TripApplication[] {
  // A queue: what came in this morning is what the owner is looking for.
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
