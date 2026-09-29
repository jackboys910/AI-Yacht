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

/** Wording for the failures a person can actually cause, in the admin's language. */
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Неверный адрес почты.",
  "auth/invalid-credential": "Неверная почта или пароль.",
  "auth/wrong-password": "Неверная почта или пароль.",
  "auth/user-not-found": "Неверная почта или пароль.",
  "auth/user-disabled": "Этот аккаунт отключён.",
  "auth/too-many-requests":
    "Слишком много попыток входа. Подождите несколько минут и попробуйте снова.",
  "auth/network-request-failed": "Нет связи с сервером. Проверьте интернет.",
};

export class SignInError extends Error {}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    // The owner should stay signed in between visits; filling in a trip over
    // several sittings (§7.1) would be miserable otherwise.
    await setPersistence(auth(), browserLocalPersistence);
    await signInWithEmailAndPassword(auth(), email.trim(), password);
  } catch (cause) {
    const code = (cause as { code?: string }).code ?? "";
    throw new SignInError(
      MESSAGES[code] ?? "Не удалось войти. Попробуйте ещё раз.",
      { cause },
    );
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
