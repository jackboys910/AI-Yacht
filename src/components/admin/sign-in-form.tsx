"use client";

import { useState, type FormEvent } from "react";
import { SignInError, register, signIn } from "@/lib/firebase/auth";
import { PanelLanguage, useAdmin } from "./i18n";

type Mode = "signIn" | "register";

/**
 * А-01, and since ТЗ v4 §2.3 the way in for a second kind of user.
 *
 * The owner's account is made by hand in the Firebase console, so the panel
 * never needed a way to create one. An organizer is different: the owner
 * writes their address on a trip, the letter tells them the panel exists, and
 * they arrive here with no account at all. Sending them to the console is not
 * an option, so this screen registers them.
 *
 * Registering grants nothing. It makes an account whose address is
 * unconfirmed, and `firestore.rules` hands over a trip only to a confirmed
 * address that matches `organizerEmail` — so someone registering with a
 * stranger's address ends up with an account and no trip. That is why the two
 * modes can share one form without the second being a hole in the first.
 */
export function SignInForm() {
  const { t } = useAdmin();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const registering = mode === "register";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (registering) await register(email, password);
      else await signIn(email, password);
      // No redirect either way: the auth listener in AdminApp swaps the
      // screen — for the panel, or for "confirm your address" after a
      // registration, since `register` leaves the new account signed in.
    } catch (cause) {
      setError(
        t.signIn.failed[cause instanceof SignInError ? cause.reason : "unknown"],
      );
      setBusy(false);
    }
  }

  function swap() {
    setMode(registering ? "signIn" : "register");
    // The message belonged to the other mode. "There is already an account on
    // this address" makes no sense once the form is a sign-in form again.
    setError(null);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--primary)] px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-7 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-bold tracking-[0.14em] text-foreground">
              NAZAROV
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {registering ? t.signIn.registerSubtitle : t.signIn.subtitle}
            </p>
          </div>
          {/* The switch belongs on this screen too: the panel's language is
              remembered per browser, so a first visit arrives in English and
              there would otherwise be nothing to change before signing in. */}
          <PanelLanguage tone="light" />
        </div>

        {registering && (
          // Said before the field rather than under it: getting the address
          // wrong here costs a round of email, and nobody reads a note that
          // appears after the box it is about.
          <p className="mt-5 rounded-lg bg-[color:var(--muted)] px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            {t.signIn.registerNote}
          </p>
        )}

        <label
          className={`block text-sm font-medium ${registering ? "mt-5" : "mt-7"}`}
          htmlFor="admin-email"
        >
          {t.signIn.email}
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25 disabled:opacity-60"
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="admin-password">
          {t.signIn.password}
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          // A password manager offering the saved password while someone is
          // creating an account is the wrong suggestion in both directions.
          autoComplete={registering ? "new-password" : "current-password"}
          required
          // Firebase refuses anything shorter, and being told so by the
          // browser before the request is friendlier than after it.
          minLength={registering ? 6 : undefined}
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25 disabled:opacity-60"
        />
        {registering && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.signIn.passwordHint}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-[color:var(--gold)] px-5 py-3 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-60"
        >
          {busy
            ? registering
              ? t.signIn.registering
              : t.signIn.submitting
            : registering
              ? t.signIn.register
              : t.signIn.submit}
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {registering ? t.signIn.toSignIn : t.signIn.toRegister}{" "}
          <button
            type="button"
            onClick={swap}
            disabled={busy}
            className="font-medium text-foreground underline underline-offset-2 transition hover:text-[color:var(--teal)] disabled:opacity-60"
          >
            {registering ? t.signIn.toSignInAction : t.signIn.toRegisterAction}
          </button>
        </p>
      </form>
    </div>
  );
}
