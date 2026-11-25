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
 * "+ Subscribe" joins this header with plan item 2.7, together with the dialog
 * it opens. A button that does nothing yet would be worse than its absence.
 *
 * The way into the panel sits here too (ТЗ v4, §9). It is not hidden, because
 * hiding it protects nothing — the panel is behind a sign-in either way — and
 * because the people who most need it are organizers, who have no reason to
 * guess that typing /admin/ leads anywhere.
 */
export function SiteNav({
  locale,
  interests,
  solutionsHref,
  aboutHref,
  storyHref,
  suggestHref,
  languageHrefs,
  active,
}: {
  locale: Locale;
  interests: NavLink[];
  solutionsHref: string;
  aboutHref?: string;
  /** ТЗ v3 §6.5 — личная страница владельца. */
  storyHref?: string;
  /** ТЗ v4 §3.1 asks for this in the menu on every page. */
  suggestHref?: string;
  languageHrefs: Record<Locale, string>;
  /** Slug of the current interest, or "solutions", "about", "suggest". */
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
  const panelLabel = locale === "en" ? "Panel" : "Панель";
  const suggestLabel = locale === "en" ? "Suggest an Adventure" : "Предложить приключение";
  const panelTitle =
    locale === "en"
      ? "For the owner and trip organizers"
      : "Для владельца и организаторов поездок";

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

        {/* Tighter at 1024 than at 1280: with Story added (item 4.1) the row
            no longer fit on a laptop, and what it lost there is the caption
            over the interests — a label, not a way anywhere. */}
        <nav className="hidden items-center gap-4 lg:flex">
          {interests.length > 0 && (
            // From 1280 up, not from 1024, and without the "My interests"
            // caption that used to stand in front of them.
            //
            // There are five directions now rather than four, and the button
            // beside them says "Suggest an Adventure" rather than "Suggest an
            // idea" (the client's list of 24.11.2026). Together that is more
            // than the row holds: at 1280 the language switch was pushed off
            // the right edge of the screen, and the caption would not fit at
            // any width at all, because the row is capped at 72rem however
            // wide the window is. The caption was the right thing to drop —
            // it named the links rather than leading anywhere. On a laptop
            // the directions themselves are in the menu, one press away,
            // where they already were below 1024.
            <span className="hidden items-center gap-4 xl:flex">
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
            </span>
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

          {storyHref && (
            <a
              href={storyHref}
              aria-current={active === "story" ? "page" : undefined}
              className={`text-sm font-medium transition hover:text-[color:var(--gold)] ${
                active === "story" ? "text-[color:var(--gold)]" : "text-white/80"
              }`}
            >
              Story
            </a>
          )}

          {aboutHref && (
            <a
              href={aboutHref}
              aria-current={active === "about" ? "page" : undefined}
              className={`text-sm font-medium transition hover:text-[color:var(--gold)] ${
                active === "about" ? "text-[color:var(--gold)]" : "text-white/80"
              }`}
            >
              About
            </a>
          )}

          {suggestHref && (
            <a
              href={suggestHref}
              aria-current={active === "suggest" ? "page" : undefined}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active === "suggest"
                  ? "border-[color:var(--gold)] text-[color:var(--gold)]"
                  : "border-[color:var(--gold)]/50 text-white hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
              }`}
            >
              {suggestLabel}
            </a>
          )}

          {/* Обычная ссылка, а не next/link: вход в панель — полная
              загрузка страницы. Клиентский переход потянул бы RSC-ответ
              маршрута, которого при статическом экспорте по ожидаемому адресу
              нет (та же причина, что у prefetch={false} в меню панели), и
              начинал бы работу с унаследованным состоянием входа. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/"
            title={panelTitle}
            className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/70 transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            {panelLabel}
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

            {storyHref && (
              <a
                href={storyHref}
                onClick={() => setMenuOpen(false)}
                className={`border-t border-white/10 py-3 text-base font-medium ${
                  active === "story" ? "text-[color:var(--gold)]" : "text-white/90"
                }`}
              >
                Story
              </a>
            )}

            {aboutHref && (
              <a
                href={aboutHref}
                onClick={() => setMenuOpen(false)}
                className={`border-t border-white/10 py-3 text-base font-medium ${
                  active === "about" ? "text-[color:var(--gold)]" : "text-white/90"
                }`}
              >
                About
              </a>
            )}

            {suggestHref && (
              <a
                href={suggestHref}
                onClick={() => setMenuOpen(false)}
                className={`border-t border-white/10 py-3 text-base font-medium ${
                  active === "suggest" ? "text-[color:var(--gold)]" : "text-[color:var(--gold)]/90"
                }`}
              >
                {suggestLabel}
              </a>
            )}

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/admin/"
              onClick={() => setMenuOpen(false)}
              className="border-t border-white/10 py-3 text-base font-medium text-white/60"
            >
              {panelLabel}
              <span className="ml-2 text-xs text-white/35">{panelTitle}</span>
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
