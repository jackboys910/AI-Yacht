/**
 * Firebase project the site's content lives in.
 *
 * Every value here is public by design: Firebase ships this exact object to
 * each visitor's browser, and it identifies the project rather than granting
 * access to it. What actually protects the data is `firestore.rules` and
 * `storage.rules`, which is why they sit in the repository next to this file.
 *
 * The defaults are the real project, so a fresh clone builds without any
 * setup; the environment variables exist to point a build at a different
 * project, which is how a test copy of the site gets its own data.
 */
export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDON3Ue9vCXee9YQ-_-atPZXb9b2fQB08E",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nazarov-net.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nazarov-net",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "nazarov-net.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "893970968976",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:893970968976:web:8ffd62387c9ebbb92a4315",
} as const;

/**
 * False only when someone has deliberately blanked the project id, which is
 * how a build says "there is no database here, render the site empty".
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey,
);

/** Collection names, in one place so a typo cannot go unnoticed in two files. */
export const collections = {
  interests: "interests",
  trips: "trips",
  people: "people",
  projects: "projects",
  settings: "settings",
  counters: "counters",
  subscribers: "subscribers",
  interested: "interested",
  applications: "applications",
  solutionsInquiries: "solutionsInquiries",
  owners: "owners",
} as const;

/** The single settings document (§7.7 describes one set of site-wide values). */
export const SETTINGS_DOC_ID = "site";
