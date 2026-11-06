import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore/lite";
import { firebaseApp, firestore } from "./app";
import { collections } from "./config";

/**
 * Signing in to the admin panel (§7.9: one user, the owner).
 *
 * Nothing here runs at build time. Every function reaches for `getAuth()` only
 * when called, because the pages are prerendered in Node where there is no
 * browser storage for Firebase to persist a session into.
 */

function auth(): Auth {
  return getAuth(firebaseApp());
}

/**
 * Why a sign-in failed, as something the panel can translate.
 *
 * The reason is carried rather than a sentence: §6 of ТЗ v4 makes the panel
 * bilingual, and this module has no idea which language is on screen. Only the
 * failures a person can actually cause are named; everything else is "unknown",
 * because a Firebase code the owner cannot act on is not worth a sentence of
 * its own.
 */
export type SignInReason =
  | "invalidEmail"
  | "invalidCredential"
  | "disabled"
  | "tooManyAttempts"
  | "offline"
  | "unknown";

const REASONS: Record<string, SignInReason> = {
  "auth/invalid-email": "invalidEmail",
  "auth/invalid-credential": "invalidCredential",
  "auth/wrong-password": "invalidCredential",
  "auth/user-not-found": "invalidCredential",
  "auth/user-disabled": "disabled",
  "auth/too-many-requests": "tooManyAttempts",
  "auth/network-request-failed": "offline",
};

export class SignInError extends Error {
  readonly reason: SignInReason;

  constructor(reason: SignInReason, options?: ErrorOptions) {
    super(reason, options);
    this.reason = reason;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    // The owner should stay signed in between visits; filling in a trip over
    // several sittings (§7.1) would be miserable otherwise.
    await setPersistence(auth(), browserLocalPersistence);
    await signInWithEmailAndPassword(auth(), email.trim(), password);
  } catch (cause) {
    const code = (cause as { code?: string }).code ?? "";
    throw new SignInError(REASONS[code] ?? "unknown", { cause });
  }
}

export async function signOutOwner(): Promise<void> {
  await signOut(auth());
}

/** Calls back with the current user, then on every change. Returns an unsubscribe. */
export function watchUser(listener: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), listener);
}

/**
 * The signed-in owner's ID token, for the one request that does not go to
 * Firebase: `/api/rebuild` on the Cloudflare Worker, which hands the token
 * back to Firestore to find out whether the caller is the owner.
 *
 * Firebase refreshes the token when it is close to expiring, so this is asked
 * for at the moment of the call rather than kept anywhere.
 */
export async function idToken(): Promise<string | null> {
  const user = auth().currentUser;
  return user ? user.getIdToken() : null;
}

/**
 * Whether this account is the owner.
 *
 * Being signed in is not enough. The project's API key is public and the
 * Email/Password provider will happily create an account for anyone who asks
 * it directly, so `firestore.rules` grants nothing to a bare session — it
 * requires a document at `owners/{uid}`, which only exists for accounts added
 * by hand in the Firebase console.
 *
 * This call is the same check, run in the browser so the panel can say what is
 * wrong instead of showing a screen where every action silently fails.
 */
export async function isOwner(user: User): Promise<boolean> {
  const snapshot = await getDoc(doc(firestore(), collections.owners, user.uid));
  return snapshot.exists();
}
