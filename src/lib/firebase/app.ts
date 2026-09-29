import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore/lite";
import { firebaseConfig } from "./config";

/**
 * One Firebase app per process, whether that process is `next build` reading
 * content or a visitor's browser reading counters.
 *
 * The Firestore entry point is `firebase/firestore/lite`, not the full SDK.
 * Lite talks to Firestore over plain HTTP and drops realtime listeners and the
 * offline cache, which is everything we do not use: the site reads its content
 * once at build time, and the admin panel saves on a button press. In exchange
 * the bundle that reaches a visitor is a fraction of the size, which matters
 * for the Lighthouse floor in Т-01.
 */
export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function firestore(): Firestore {
  return getFirestore(firebaseApp());
}
