"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { NavLink } from "@/lib/content/nav";
import { LanguageSwitcher } from "./language-switcher";

/**
 * The site header described in §5: "NAZAROV" on the left, the interests
 * gathered under "MY INTERESTS" on the right, then Solutions and the EN / RU
 * switch.
 *
 * The interests arrive as data, read from Firestore at build time, so adding
 * one in the panel puts it in the menu without a developer (А-14).
 *
 * "MY INTERESTS", the tab names and "Solutions" stay English in both language
 * versions — §16.1 fixes that, and Appendix В lists them as strings to carry
 * across verbatim.
 *
 * "+ Subscribe" joins this header with plan item 2.1, together with the dialog
 * it opens. A button that does nothing yet would be worse than its absence.
 */
export function SiteNav({
  locale,
  interests,
  solutionsHref,
  languageHrefs,
  active,
}: {
  locale: Locale;
  interests: NavLink[];
  solutionsHref: string;
  languageHrefs: Record<Locale, string>;
  /** Slug of the current interest, or "solutions". */
  active?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const home = locale === "en" ? "/" : `/${locale}/`;

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-colors duration-300 ${
        scrolled || menuOpen
          ? "border-b border-white/10 bg-[color:var(--primary)]/92 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container-narrow flex items-center justify-between gap-2 py-3 sm:py-4">
        <a
          href={home}
          onClick={() => setMenuOpen(false)}
          className="shrink-0 font-display text-xl font-bold leading-none tracking-[0.14em] text-white sm:text-2xl"
        >
          NAZAROV
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {interests.length > 0 && (
            <>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                My interests
              </span>
              {interests.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  aria-current={link.id === active ? "page" : undefined}
                  className={`text-sm font-medium transition hover:text-[color:var(--gold)] ${
                    link.id === active ? "text-[color:var(--gold)]" : "text-white/80"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <span aria-hidden="true" className="h-5 w-px bg-white/20" />
            </>
          )}

          <a
            href={solutionsHref}
            aria-current={active === "solutions" ? "page" : undefined}
            className={`text-sm font-medium transition hover:text-[color:var(--gold)] ${
              active === "solutions" ? "text-[color:var(--gold)]" : "text-white/80"
            }`}
          >
            Solutions
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* At 400px and below there is no room for it here; it moves into the
              burger menu instead. */}
          <LanguageSwitcher
            locale={locale}
            hrefs={languageHrefs}
            label={locale === "en" ? "Language" : "Язык"}
            className="hidden min-[401px]:inline-flex"
          />
          <button
            type="button"
            aria-label={locale === "en" ? "Menu" : "Меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[color:var(--primary)]/95 backdrop-blur-md lg:hidden">
          <div className="container-narrow flex flex-col py-3">
            {/* §6.1: on a phone the interests come first in the menu. */}
            {interests.length > 0 && (
              <span className="pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                My interests
              </span>
            )}
            {interests.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-base font-medium ${
                  link.id === active ? "text-[color:var(--gold)]" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}

            <a
              href={solutionsHref}
              onClick={() => setMenuOpen(false)}
              className={`border-t border-white/10 py-3 text-base font-medium ${
                active === "solutions" ? "text-[color:var(--gold)]" : "text-white/90"
              }`}
            >
              Solutions
            </a>

            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4 pb-1 min-[401px]:hidden">
              <span className="text-sm text-white/60">
                {locale === "en" ? "Language" : "Язык"}
              </span>
              <LanguageSwitcher
                locale={locale}
                hrefs={languageHrefs}
                label={locale === "en" ? "Language" : "Язык"}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
