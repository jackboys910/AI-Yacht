"use client";

import { useState, type FormEvent } from "react";
import { SignInError, signIn } from "@/lib/firebase/auth";

/** А-01: without this screen nothing else in the panel exists. */
export function SignInForm() {
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
        cause instanceof SignInError ? cause.message : "Не удалось войти.",
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
        <div className="font-display text-2xl font-bold tracking-[0.14em] text-foreground">
          NAZAROV
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Панель управления сайтом</p>

        <label className="mt-7 block text-sm font-medium" htmlFor="admin-email">
          Почта
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
          Пароль
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
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
