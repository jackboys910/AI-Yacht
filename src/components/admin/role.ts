import type { User } from "firebase/auth";
import { isOwner } from "@/lib/firebase/auth";
import { tripsForOrganizer } from "@/lib/firebase/organizer";

/**
 * Who is signed in, as far as the panel is concerned (ТЗ v4, §2.1).
 *
 * Three answers, and the order they are asked in matters. "Owner" is an entry
 * under `/owners`, added by hand in the Firebase console. "Organizer" is an
 * address the owner wrote on a trip, confirmed by its holder. Everyone else
 * is "none" — including a perfectly valid account, because registering is
 * free and proves nothing.
 */
export type AdminRole = "owner" | "organizer" | "none";

export interface Session {
  role: AdminRole;
  /** The organizer's trips, already fetched: the role was decided by them. */
  tripIds: string[];
}

/**
 * Works out what this account may do.
 *
 * The owner is checked first and the organizer query is skipped if it passes,
 * because the owner's panel reads every trip anyway and a second request
 * would only slow the one visit that happens daily.
 *
 * An unconfirmed address is not an organizer, whatever is written on a trip.
 * The rules would refuse the read regardless — this check only exists so the
 * panel can say so instead of showing a screen with nothing on it.
 */
export async function resolveSession(user: User): Promise<Session> {
  if (await isOwner(user)) return { role: "owner", tripIds: [] };

  if (!user.emailVerified || !user.email) return { role: "none", tripIds: [] };

  const trips = await tripsForOrganizer(user.email);
  return trips.length > 0
    ? { role: "organizer", tripIds: trips.map((trip) => trip.id) }
    : { role: "none", tripIds: [] };
}
