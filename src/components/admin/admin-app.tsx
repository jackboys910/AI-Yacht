"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { refreshUser, resendVerification, signOutOwner, watchUser } from "@/lib/firebase/auth";
import { AdminShell } from "./admin-shell";
import { AdminLanguageProvider, useAdmin } from "./i18n";
import { resolveSession, type AdminRole } from "./role";
import { SignInForm } from "./sign-in-form";

/**
 * Decides which of the panel's screens to show.
 *
 * "Signed in" and "allowed in" are separate states on purpose. The project's
 * API key is public and the Email/Password provider will create an account
 * for anyone who calls it directly, so a session proves nothing; authority
 * comes from an entry under `owners/` that only exists for accounts added by
 * hand in the Firebase console, or — since ТЗ v4 §2.3 — from an address the
 * owner wrote on a trip and whose holder has confirmed it.
 *
 * `firestore.rules` enforces both. The checks here exist so that a wrong
 * account gets an explanation instead of a panel where every button quietly
 * fails, and so that someone whose address is not confirmed yet is told what
 * is missing rather than that they are not welcome.
 */
type State =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "unverified"; user: User }
  | { kind: "noAccess"; user: User }
  | { kind: "ready"; user: User; role: AdminRole }
  | { kind: "error" };

export function AdminApp() {
  return (
    <AdminLanguageProvider>
      <AdminScreens />
    </AdminLanguageProvider>
  );
}

function AdminScreens() {
  const { t } = useAdmin();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // Firebase reads its stored session asynchronously, and the checks below
    // are network round trips, so both can finish after the component is gone.
    let active = true;

    const stop = watchUser(async (user) => {
      if (!user) {
        if (active) setState({ kind: "signedOut" });
        return;
      }

      try {
        const { role } = await resolveSession(user);
        if (!active) return;

        if (role !== "none") {
          setState({ kind: "ready", user, role });
          return;
        }

        // The role is asked for **before** the address is looked at, and the
        // order is load-bearing. The owner's account was made by hand in the
        // Firebase console and its address was never confirmed through the
        // site; demanding a confirmation of everyone locked the owner out of
        // his own panel, which is exactly what happened the first time this
        // was written the other way round. His authority is the entry under
        // /owners, which is a stronger proof than a letter anyway.
        //
        // For everybody else the confirmation is the whole point: an address
        // nobody has proved is an address anyone could have typed.
        setState(
          user.emailVerified ? { kind: "noAccess", user } : { kind: "unverified", user },
        );
      } catch {
        if (active) setState({ kind: "error" });
      }
    });

    return () => {
      active = false;
      stop();
    };
  }, []);

  switch (state.kind) {
    case "loading":
      return <Centered>{t.app.loading}</Centered>;

    case "signedOut":
      return <SignInForm />;

    case "unverified":
      return <Unverified user={state.user} />;

    case "ready":
      return <AdminShell user={state.user} role={state.role} />;

    case "noAccess":
      return (
        <Centered>
          <p className="font-medium text-foreground">
            {t.app.noAccess(state.user.email ?? "—")}
          </p>
          <p className="mt-2 max-w-md">{t.app.noAccessHow}</p>
          <p className="mt-2 max-w-md text-xs">{t.app.ownerHint(state.user.uid)}</p>
          <SignOut />
        </Centered>
      );

    case "error":
      return (
        <Centered>
          <p className="font-medium text-foreground">{t.app.unreachable}</p>
          <p className="mt-2 max-w-md">{t.app.unreachableHow}</p>
        </Centered>
      );
  }
}

/**
 * Signed in, address not confirmed yet.
 *
 * The confirmation happens in another tab or on a phone, and nothing tells
 * this one — hence a button that asks Firebase again rather than a spinner
 * that waits for news that never comes.
 */
function Unverified({ user }: { user: User }) {
  const { t } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [stillWaiting, setStillWaiting] = useState(false);

  const check = useCallback(async () => {
    setBusy(true);
    setStillWaiting(false);
    const fresh = await refreshUser();
    // A confirmed address makes the auth listener fire again with a new
    // token, which swaps this screen for the panel. Nothing happening means
    // the link has not been followed yet.
    if (fresh && !fresh.emailVerified) setStillWaiting(true);
    setBusy(false);
  }, []);

  return (
    <Centered>
      <p className="font-medium text-foreground">{t.app.verifyTitle}</p>
      <p className="mt-2 max-w-md">{t.app.verifySent(user.email ?? "—")}</p>
      <p className="mt-2 max-w-md text-xs">{t.app.verifySpam}</p>

      {stillWaiting && (
        <p role="alert" className="mt-4 max-w-md text-amber-700">
          {t.app.verifyNotYet}
        </p>
      )}
      {sent && <p className="mt-4 text-[color:var(--teal)]">{t.app.verifyResent}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void check()}
          className="rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 disabled:opacity-60"
        >
          {busy ? t.app.verifyChecking : t.app.verifyDone}
        </button>
        <button
          type="button"
          disabled={busy || sent}
          onClick={() => {
            void resendVerification();
            setSent(true);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-foreground disabled:opacity-60"
        >
          {t.app.verifyResend}
        </button>
      </div>

      <SignOut />
    </Centered>
  );
}

function SignOut() {
  const { t } = useAdmin();
  return (
    <button
      type="button"
      onClick={() => void signOutOwner()}
      className="mt-6 text-sm text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
    >
      {t.shell.signOut}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--muted)] px-6 py-10 text-center text-sm text-muted-foreground">
      <div>{children}</div>
    </div>
  );
}
