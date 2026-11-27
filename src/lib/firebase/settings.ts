import { doc, getDoc, setDoc } from "firebase/firestore/lite";
import type { Settings } from "@/lib/content/types";
import { firestore } from "./app";
import { SETTINGS_DOC_ID, collections } from "./config";
import { stripUndefined, toSettings } from "./mappers";
import { translateMissing } from "../translate";

/**
 * The one settings document, read and written by the owner (§7.7, А-15).
 *
 * Everything site-wide that is not a trip, a direction or a person lives in
 * it: the words of the first screen, the top and bottom of About, the Story
 * and Solutions pages, the Calendly address, the counter thresholds, the
 * sender's postal address.
 *
 * A single document rather than a collection, because there is exactly one
 * site. That also means the whole of it is read in one request at build time,
 * which is what `getSiteContent` does.
 */

export type SettingsDraft = Omit<Settings, "updatedAt">;

/** What the panel shows before anybody has written anything. */
export function blankSettings(): SettingsDraft {
  const text = () => ({ en: "", ru: "" });
  const lines = () => ({ en: [] as string[], ru: [] as string[] });

  return {
    home: {
      communityA: text(),
      communityB: text(),
      free: text(),
      noFees: text(),
      titleA: text(),
      titleB: text(),
    },
    about: {
      heroEyebrow: text(),
      heroTitle: text(),
      heroParagraphs: lines(),
      closingTitle: text(),
      closingParagraphs: lines(),
      closingSign: text(),
    },
    story: {
      title: text(),
      text: text(),
      photo: undefined,
      youtubeChannelId: undefined,
      socialLinks: [],
    },
    solutions: {
      heroTitle: text(),
      heroSubtitle: text(),
      services: [],
      process: [],
    },
    calendlyUrl: "",
    counterThresholds: { going: 3, interested: 10 },
    postalAddress: "",
  };
}

/**
 * The settings as they are, or a blank set when nobody has saved any.
 *
 * The mapper fills the gaps, so the form is handed a complete shape whatever
 * the document contains — including a document written by an older version of
 * the panel that had fewer fields in it.
 */
export async function readSettings(): Promise<SettingsDraft> {
  const snapshot = await getDoc(
    doc(firestore(), collections.settings, SETTINGS_DOC_ID),
  );
  if (!snapshot.exists()) return blankSettings();

  // Written out field by field rather than spread: a field added to
  // `Settings` then fails to compile here instead of silently never
  // reaching the form. `updatedAt` is the document's own record of when it
  // was written, and the form neither shows it nor sends it back.
  const settings = toSettings(snapshot.data());
  return {
    home: settings.home,
    about: settings.about,
    story: settings.story,
    solutions: settings.solutions,
    calendlyUrl: settings.calendlyUrl,
    counterThresholds: settings.counterThresholds,
    postalAddress: settings.postalAddress,
  };
}

/**
 * Saves the whole document, merging into what is there.
 *
 * `merge` matters: a field this version of the panel does not know about —
 * written by a newer one, or left over from an older — survives the save
 * rather than being deleted by a form that never showed it.
 */
export async function saveSettings(draft: SettingsDraft): Promise<void> {
  // The Russian half of what was typed in English (plan 6.9); never a
  // reason for the save to fail.
  const { value: ready } = await translateMissing(draft);
  await setDoc(
    doc(firestore(), collections.settings, SETTINGS_DOC_ID),
    stripUndefined({ ...ready, updatedAt: new Date().toISOString() }),
    { merge: true },
  );
}
