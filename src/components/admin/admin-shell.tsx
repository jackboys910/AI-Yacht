"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { User } from "firebase/auth";
import { signOutOwner } from "@/lib/firebase/auth";
import { ADMIN_VIEWS, resolveView } from "./views";

/**
 * The frame every admin screen sits in: a menu down the left on a desktop, a
 * bar with a toggle on a phone.
 *
 * §7.8 asks for the whole owner's workflow to be possible from a phone, so the
 * menu is not merely narrower there — it collapses out of the way, because a
 * trip form (item 1.4) needs the full width of a phone screen to be usable.
 */
export function AdminShell({ user }: { user: User }) {
  const params = useSearchParams();
  const active = resolveView(params.get("view"));
  const [menuOpen, setMenuOpen] = useState(false);

  const current = ADMIN_VIEWS.find((view) => view.id === active)!;

  return (
    <div className="min-h-dvh bg-[color:var(--muted)] text-foreground lg:flex">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[color:var(--primary)] px-4 py-3 text-white lg:hidden">
        <span className="font-display text-lg font-bold tracking-[0.14em]">
          NAZAROV
        </span>
        <button
          type="button"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/30"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </header>

      <nav
        className={`${
          menuOpen ? "block" : "hidden"
        } shrink-0 bg-[color:var(--primary)] px-3 py-4 text-white lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:px-4 lg:py-6`}
      >
        <div className="hidden px-2 lg:block">
          <span className="font-display text-xl font-bold tracking-[0.14em]">
            NAZAROV
          </span>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gold)]/85">
            Панель управления
          </p>
        </div>

        <ul className="mt-0 flex flex-col gap-1 lg:mt-8">
          {ADMIN_VIEWS.map((view) => (
            <li key={view.id}>
              <Link
                href={`/admin/?view=${view.id}`}
                // Picking an item is what closes the menu on a phone; left
                // open it would cover the screen the tap just asked for.
                onClick={() => setMenuOpen(false)}
                aria-current={view.id === active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  view.id === active
                    ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {view.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-white/10 pt-4 lg:absolute lg:bottom-6 lg:left-4 lg:right-4 lg:mt-0">
          <p className="truncate px-3 text-xs text-white/50" title={user.email ?? ""}>
            {user.email}
          </p>
          <button
            type="button"
            onClick={() => void signOutOwner()}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Выйти
          </button>
        </div>
      </nav>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <h1 className="font-display text-2xl sm:text-3xl">{current.label}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.description}</p>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 sm:p-10">
          <p className="text-sm text-muted-foreground">
            Раздел появится на пункте {current.comingIn} плана работ. Сейчас готов
            каркас админки: вход, меню и мобильная вёрстка.
          </p>
        </div>
      </main>
    </div>
  );
}
