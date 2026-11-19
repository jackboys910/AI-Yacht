import { collection, doc, getDocs, updateDoc } from "firebase/firestore/lite";
import type { Locale } from "@/i18n/config";
import type { SolutionsInquiry } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";

/**
 * Solutions enquiries, read by the owner (§7.6, А-17).
 *
 * Written by the Worker through a service account — see `worker/solutions` —
 * and read here with the owner's own account, which is the only one
 * `firestore.rules` opens the collection to. An organizer never sees these:
 * a request to build somebody a website has nothing to do with a trip.
 *
 * The only thing the panel writes is `handled`. The enquiry itself is what
 * somebody sent, and a record the owner can edit is a record that stops being
 * evidence of what was asked for.
 */

function toInquiry(id: string, data: Record<string, unknown>): SolutionsInquiry & {
  locale?: Locale;
  source?: string;
} {
  const str = (value: unknown): string => (typeof value === "string" ? value : "");
  return {
    id,
    name: str(data.name),
    email: str(data.email),
    phone: str(data.phone) || undefined,
    // Kept as it arrived rather than narrowed: the panel shows whatever is
    // there, and an id this version does not know about is better read as a
    // word than silently turned into "Other".
    projectType: str(data.projectType) as SolutionsInquiry["projectType"],
    message: str(data.message),
    handled: data.handled === true,
    createdAt: str(data.createdAt),
    locale: data.locale === "ru" ? "ru" : "en",
    source: str(data.source) || undefined,
  };
}

export type AdminInquiry = ReturnType<typeof toInquiry>;

/** Newest first: the list is read to see what has just come in. */
export async function listInquiries(): Promise<AdminInquiry[]> {
  const snapshot = await getDocs(
    collection(firestore(), collections.solutionsInquiries),
  );
  return snapshot.docs
    .map((one) => toInquiry(one.id, one.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Dealt with, or back in the queue. */
export async function markInquiry(id: string, handled: boolean): Promise<void> {
  await updateDoc(doc(firestore(), collections.solutionsInquiries, id), {
    handled,
    updatedAt: new Date().toISOString(),
  });
}
