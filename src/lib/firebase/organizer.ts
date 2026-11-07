import { collection, getDocs, query, where } from "firebase/firestore/lite";
import type { Trip } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { toTrip } from "./mappers";

/**
 * The trips opened to one person besides the owner (ТЗ v4, §2.3).
 *
 * The filter is not a convenience — it is what makes the request legal.
 * `firestore.rules` lets an organizer read a trip whose `organizerEmail`
 * matches the verified address in their token, and Firestore decides whether
 * a *list* is allowed by looking at the query rather than at the documents it
 * would return. A query without this `where` cannot be shown to be safe, so
 * it is refused whole; the panel would then show an organizer an error, or
 * worse, an empty list that looks like "you have no trips".
 *
 * Which is also why the address is lowercased here: the rule compares the two
 * strings exactly, because a `lower()` call on either side would defeat that
 * same proof.
 */
export async function tripsForOrganizer(email: string): Promise<Trip[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.trips),
      where("organizerEmail", "==", email.trim().toLowerCase()),
    ),
  );

  return snapshot.docs
    .map((d) => toTrip(d.id, d.data()))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}
