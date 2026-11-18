import { collection, deleteDoc, doc, getDocs } from "firebase/firestore/lite";
import type { Locale } from "@/i18n/config";
import type { Subscriber } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";

/**
 * The mailing list, read by the owner (А-16).
 *
 * Read with his own account, not through the Worker: `firestore.rules` opens
 * `subscribers` to the owner and to nobody else, and the panel is already
 * signed in as him. The Worker exists for the writes a browser may not do —
 * subscribing somebody, which the visitor's browser must not be able to do
 * directly.
 *
 * Read whole rather than paged. The list is one row per address and the spec
 * puts the ceiling of the current mail plan at five to seven hundred of them
 * (§8.2); paging a list that size would cost more in code than it saves in
 * bytes, and the counts and the CSV both want all of it anyway.
 */

function toSubscriber(id: string, data: Record<string, unknown>): Subscriber {
  const str = (value: unknown): string => (typeof value === "string" ? value : "");
  return {
    id,
    email: str(data.email),
    interestIds: Array.isArray(data.interestIds)
      ? (data.interestIds as unknown[]).filter((one): one is string => typeof one === "string")
      : [],
    locale: (data.locale === "ru" ? "ru" : "en") as Locale,
    source: str(data.source) || undefined,
    viaInterested: data.viaInterested === true,
    unsubscribed: data.unsubscribed === true,
    manageKey: str(data.manageKey),
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

/** Newest first: the list is read to see who has just arrived. */
export async function listSubscribers(): Promise<Subscriber[]> {
  const snapshot = await getDocs(collection(firestore(), collections.subscribers));
  return snapshot.docs
    .map((one) => toSubscriber(one.id, one.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Removing somebody at their request (А-16).
 *
 * Deleted rather than marked, and the difference matters: unsubscribing is
 * the page in the letter, and it leaves the record so the person can come
 * back to the same directions. This is for the other request — "take my
 * address off your systems" — which a flag would not honour.
 */
export async function deleteSubscriber(id: string): Promise<void> {
  await deleteDoc(doc(firestore(), collections.subscribers, id));
}
