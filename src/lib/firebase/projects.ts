import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore/lite";
import type { WorkProject } from "@/lib/content/types";
import { firestore } from "./app";
import { collections } from "./config";
import { stripUndefined, toWorkProject } from "./mappers";
import { translateMissing } from "../translate";

/**
 * The "Our work" projects of the Solutions page (§7.7, А-18).
 *
 * A collection of their own rather than a field of the settings document,
 * because each one carries a screenshot: an image in the settings document
 * would be re-read on every page of the site, and a document Firestore
 * limits to a megabyte is the wrong place to keep a growing list anyway.
 *
 * Order is the owner's, not the database's. The panel arranges them with the
 * same arrows as every other repeatable block and the position becomes
 * `order`, so what he sees in the form is what the page prints.
 */

export type ProjectDraft = Omit<WorkProject, "id" | "order">;

export function blankProject(): ProjectDraft {
  return {
    title: { en: "", ru: "" },
    description: { en: "", ru: "" },
    url: "",
    screenshot: undefined,
  };
}

/** Every project, in the order the page shows them. */
export async function listProjects(): Promise<WorkProject[]> {
  const snapshot = await getDocs(collection(firestore(), collections.projects));
  return snapshot.docs
    .map((d) => toWorkProject(d.id, d.data()))
    .sort((a, b) => a.order - b.order);
}

/**
 * Writes the list as the panel holds it: position becomes `order`, a row
 * without an id is new, and an id that is no longer in the list is deleted.
 *
 * One call for the whole list rather than a save button per card. The owner
 * reorders three projects and expects the page to follow; asking him to save
 * each card afterwards is how two of them end up with the same `order`.
 *
 * Not a batch: `firebase/firestore/lite` has no transaction, and the writes
 * are independent — a half-applied list is a list with one project in the
 * wrong place, which the next save fixes.
 */
export async function saveProjects(
  projects: (ProjectDraft & { id?: string })[],
  removedIds: string[] = [],
): Promise<string[]> {
  const store = collection(firestore(), collections.projects);
  const now = new Date().toISOString();
  // The Russian half of what was typed in English (plan 6.9); never a
  // reason for the save to fail.
  const { value: ready } = await translateMissing(projects);

  const ids = await Promise.all(
    ready.map(async (project, index) => {
      const reference = project.id ? doc(store, project.id) : doc(store);
      await setDoc(
        reference,
        stripUndefined({
          title: project.title,
          description: project.description,
          url: project.url.trim(),
          screenshot: project.screenshot,
          order: index,
          ...(project.id ? {} : { createdAt: now }),
          updatedAt: now,
        }),
        { merge: Boolean(project.id) },
      );
      return reference.id;
    }),
  );

  await Promise.all(
    removedIds.map((id) => deleteDoc(doc(store, id))),
  );

  return ids;
}
