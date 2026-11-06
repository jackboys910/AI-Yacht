"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { isOwner, signOutOwner, watchUser } from "@/lib/firebase/auth";
import { AdminShell } from "./admin-shell";
import { AdminLanguageProvider, useAdmin } from "./i18n";
import { SignInForm } from "./sign-in-form";

/**
 * Decides which of the panel's screens to show.
 *
 * "Signed in" and "allowed in" are separate states on purpose. The project's
 * API key is public and the Email/Password provider will create an account for
 * anyone who calls it directly, so a session proves nothing; authority comes
 * from an entry under `owners/` that only exists for accounts added by hand in
 * the Firebase console. `firestore.rules` enforces that, and the check here
 * only exists so a wrong account gets an explanation instead of a panel where
 * every button quietly fails.
 */
type State =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "notOwner"; user: User }
  | { kind: "ready"; user: User }
  | { kind: "error" };

/**
 * The panel's language wraps every screen, the sign-in form included: someone
 * who cannot read the interface cannot be asked to sign in first to change it.
 */
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
    // Firebase reads its stored session asynchronously, and the check below is
    // a network round trip, so both can finish after the component is gone.
    let active = true;

    const stop = watchUser(async (user) => {
      if (!user) {
        if (active) setState({ kind: "signedOut" });
        return;
      }

      // Show the frame straight away and confirm authority behind it: the
      // owner should not watch a spinner on every visit for a check that
      // almost always passes.
      if (active) setState({ kind: "ready", user });

      try {
        const allowed = await isOwner(user);
        if (!active) return;
        if (!allowed) setState({ kind: "notOwner", user });
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

    case "ready":
      return <AdminShell user={state.user} />;

    case "notOwner":
      return (
        <Centered>
          <p className="font-medium text-foreground">
            {t.app.notOwner(state.user.email ?? "—")}
          </p>
          <p className="mt-2 max-w-md">{t.app.notOwnerHow(state.user.uid)}</p>
          <button
            type="button"
            onClick={() => void signOutOwner()}
            className="mt-6 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
          >
            {t.shell.signOut}
          </button>
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--muted)] px-6 text-center text-sm text-muted-foreground">
      <div>{children}</div>
    </div>
  );
}
