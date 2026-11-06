"use client";

import { useState, type FormEvent } from "react";
import { SignInError, signIn } from "@/lib/firebase/auth";
import { PanelLanguage, useAdmin } from "./i18n";

/** А-01: without this screen nothing else in the panel exists. */
export function SignInForm() {
  const { t } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      // No redirect: the auth listener in AdminApp swaps the screen.
    } catch (cause) {
      setError(
        t.signIn.failed[
          cause instanceof SignInError ? cause.reason : "unknown"
        ],
      );
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--primary)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-7 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-bold tracking-[0.14em] text-foreground">
              NAZAROV
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t.signIn.subtitle}</p>
          </div>
          {/* The switch belongs on this screen too: the panel's language is
              remembered per browser, so a first visit arrives in English and
              there would otherwise be nothing to change before signing in. */}
          <PanelLanguage tone="light" />
        </div>

        <label className="mt-7 block text-sm font-medium" htmlFor="admin-email">
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
          autoComplete="current-password"
          required
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-[color:var(--ring)] focus:ring-2 focus:ring-[color:var(--ring)]/25 disabled:opacity-60"
        />

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
          {busy ? t.signIn.submitting : t.signIn.submit}
        </button>
      </form>
    </div>
  );
}
