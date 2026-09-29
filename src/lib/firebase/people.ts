import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore/lite";
import type { Person } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { stripUndefined, toPerson } from "./mappers";

/**
 * The crew directory (§7.4).
 *
 * The point of it is that a skipper who comes on three trips is described
 * once: §7.2 adds people to a trip by picking them from here, so their photo
 * and bio are not retyped per trip — and correcting a typo fixes it in every
 * trip at once.
 */

export type PersonDraft = Omit<Person, "id" | "createdAt" | "updatedAt">;

export function blankPerson(): PersonDraft {
  return {
    name: { en: "", ru: "" },
    role: { en: "", ru: "" },
    bio: { en: "", ru: "" },
  };
}

export async function listPeople(): Promise<Person[]> {
  const snapshot = await getDocs(collection(firestore(), collections.people));
  return snapshot.docs
    .map((d) => toPerson(d.id, d.data()))
    .sort((a, b) => a.name.en.localeCompare(b.name.en, "en"));
}

export function validatePerson(draft: PersonDraft): string[] {
  const problems: string[] = [];
  if (!draft.name.en.trim()) problems.push("Не заполнено имя на английском.");
  if (!draft.name.ru.trim()) problems.push("Не заполнено имя на русском.");
  return problems;
}

export async function savePerson(
  id: string | null,
  draft: PersonDraft,
): Promise<string> {
  const now = new Date().toISOString();
  const people = collection(firestore(), collections.people);

  // People have no address of their own and names repeat, so the id is
  // generated rather than derived: a trip refers to a person by id, and an id
  // built from a name would break the moment a name is corrected.
  const reference = id ? doc(people, id) : doc(people);

  await setDoc(
    reference,
    stripUndefined({ ...draft, ...(id ? {} : { createdAt: now }), updatedAt: now }),
    { merge: Boolean(id) },
  );

  return reference.id;
}

/** Trips whose crew includes this person. */
export async function tripsWithPerson(personId: string): Promise<string[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore(), collections.trips),
      where("crewPersonIds", "array-contains", personId),
    ),
  );
  return snapshot.docs.map((d) => d.id);
}

export class PersonInUseError extends Error {}

/**
 * Removing someone still listed on a trip would leave that trip pointing at a
 * person who no longer exists, and their card would quietly disappear from a
 * published page. So it is refused, and the owner is told where they appear.
 */
export async function deletePerson(personId: string): Promise<void> {
  const trips = await tripsWithPerson(personId);
  if (trips.length > 0) {
    throw new PersonInUseError(
      `Этот человек указан в поездках (${trips.length}). Сначала уберите его из них — ` +
        "иначе на их страницах пропадёт карточка команды.",
    );
  }

  await deleteDoc(doc(firestore(), collections.people, personId));
}
