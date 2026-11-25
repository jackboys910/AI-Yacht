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
  calendarHref,
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
  /** Every trip by date (the client's list of 24.11.2026). */
  calendarHref?: string;
  languageHrefs: Record<Locale, string>;
  /** Slug of the current interest, or "solutions", "about", "suggest",
   *  "calendar". */
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
  const calendarLabel = locale === "en" ? "Calendar" : "Календарь";
  const panelTitle =
    locale === "en"
      ? "For the owner and trip organizers"
      : "Для владельца и организаторов поездок";

  return (
    <header
      // The height is capped at the screen so that an open menu can never
      // run off the bottom of it. A fixed element does not scroll with the
      // page, so everything below the edge used to be simply unreachable —
      // on a short phone that was the language switch, and in landscape
      // half the menu. `dvh` rather than `vh` because the two differ by the
      // height of the address bar, and it is `vh` that lies.
      className={`fixed top-0 z-40 flex max-h-dvh w-full flex-col transition-colors duration-300 ${
        scrolled || menuOpen
          ? "border-b border-white/10 bg-[color:var(--primary)]/92 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      {/* The header has a wider measure than the page under it, and that is
          deliberate. The content column is 72rem because a column of text
          wider than that is hard to read; a row of links has no such problem
          and every pixel it is given is a pixel the links are not fighting
          over. At 72rem the row had five directions, five pages, the panel
          and the language switch in 1112 pixels, which left four to spare —
          close enough that one more word would have pushed the language
          switch off the screen. */}
      <div className="mx-auto flex w-full max-w-[90rem] shrink-0 items-center justify-between gap-3 px-5 py-3 sm:py-4 lg:gap-5 lg:px-8">
        <a
          href={home}
          onClick={() => setMenuOpen(false)}
          className="shrink-0 font-display text-xl font-bold leading-none tracking-[0.14em] text-white sm:text-2xl"
        >
          NAZAROV
        </a>

        {/* The row appears whole or not at all, from 1100px up.

            Whole, because a header that shows the pages but hides the
            directions is a header with no way to a direction at all: the
            burger that holds them would be gone by then. That is what the
            first attempt at squeezing this row did between 1024 and 1280.
            And from 1200 rather than 1024 because that is where it genuinely
            fits — measured at every width from 320 to 2560, in both
            languages, rather than guessed. Russian is what sets the number:
            «Предложить приключение» and «Панель» are longer than their
            English counterparts, and one breakpoint has to hold both. Below
            it the burger, which has everything in it anyway.

            The gaps grow with the window instead of the row changing shape:
            12px where it is tight, 16 at 1280, 20 at 1536. */}
        <nav className="hidden items-center gap-3 min-[1200px]:flex xl:gap-4 2xl:gap-5">
          {interests.length > 0 && (
            <span className="flex items-center gap-3 xl:gap-4 2xl:gap-5">
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

          {/* From 1440 up, where the row has room to spare for it.

              It took the place of the "My interests" caption, which is the
              right trade: the caption named the links beside it, this leads
              somewhere. Below 1440 the calendar is in the footer of every
              page and in the block of upcoming trips on the home page, which
              is where somebody wondering "and when is the rest" already is.
              Narrower still, it is in the menu with everything else. */}
          {calendarHref && (
            <a
              href={calendarHref}
              aria-current={active === "calendar" ? "page" : undefined}
              className={`hidden text-sm font-medium transition hover:text-[color:var(--gold)] min-[1440px]:inline ${
                active === "calendar" ? "text-[color:var(--gold)]" : "text-white/80"
              }`}
            >
              {calendarLabel}
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 text-white min-[1200px]:hidden"
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
        // Whatever is left of the screen under the row, and scrolling
        // inside it when the list is longer than that. `overscroll-contain`
        // keeps the page behind from being dragged along once the menu has
        // been scrolled to its end.
        <div className="min-h-0 overflow-y-auto overscroll-contain border-t border-white/10 bg-[color:var(--primary)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md min-[1200px]:hidden">
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

            {/* The calendar sits with the directions rather than with the
                pages: it is another way of looking at the same trips, and
                somebody who opened this menu to find a direction is as
                likely to want the month. */}
            {calendarHref && (
              <a
                href={calendarHref}
                onClick={() => setMenuOpen(false)}
                className={`border-t border-white/10 py-3 text-base font-medium ${
                  active === "calendar" ? "text-[color:var(--gold)]" : "text-white/90"
                }`}
              >
                {calendarLabel}
              </a>
            )}

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
