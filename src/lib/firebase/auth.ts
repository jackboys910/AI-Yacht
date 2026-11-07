import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
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
 * Getting into the admin panel.
 *
 * §7.9 had one user, the owner. ТЗ v4 §2.3 adds a second kind: a person whose
 * email the owner wrote on a trip, who registers here themselves and gets
 * that one trip. So this file now also creates accounts and confirms email
 * addresses — the confirmation being the part that matters, since anyone can
 * register any address with a public API key, and only the person who reads
 * that inbox can prove it is theirs.
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
  | "emailTaken"
  | "weakPassword"
  | "unknown";

const REASONS: Record<string, SignInReason> = {
  "auth/invalid-email": "invalidEmail",
  "auth/email-already-in-use": "emailTaken",
  "auth/weak-password": "weakPassword",
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

/**
 * Creating an account, for someone the owner named as an organizer.
 *
 * It grants nothing on its own. The account exists, the address is not yet
 * confirmed, and `firestore.rules` hands over a trip only once it is — so
 * registering with somebody else's address gets you an account and no more.
 *
 * The confirmation letter goes out straight away; §2.3 of ТЗ v4 has the
 * person arriving here from an email that told them to, and a second email
 * they have to ask for would be a step too many.
 */
export async function register(email: string, password: string): Promise<void> {
  try {
    await setPersistence(auth(), browserLocalPersistence);
    const created = await createUserWithEmailAndPassword(
      auth(),
      email.trim(),
      password,
    );
    await sendEmailVerification(created.user, {
      url: `${window.location.origin}/admin/`,
    });
  } catch (cause) {
    const code = (cause as { code?: string }).code ?? "";
    throw new SignInError(REASONS[code] ?? "unknown", { cause });
  }
}

/** Another copy of the confirmation letter, for the one that never arrived. */
export async function resendVerification(): Promise<void> {
  const user = auth().currentUser;
  if (!user) return;
  await sendEmailVerification(user, { url: `${window.location.origin}/admin/` });
}

/**
 * Asks Firebase again whether the address has been confirmed by now.
 *
 * The confirmation happens in another tab, or on a phone, and nothing tells
 * this one. `reload()` is what turns "I have clicked the link" into a token
 * that says `email_verified`, which is what the database rules read.
 */
export async function refreshUser(): Promise<User | null> {
  const user = auth().currentUser;
  if (!user) return null;
  await user.reload();
  // The claim lives in the token, and the old token still says false until
  // it is reissued. Without this the panel would keep refusing someone who
  // has already confirmed.
  await user.getIdToken(true);
  return auth().currentUser;
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
