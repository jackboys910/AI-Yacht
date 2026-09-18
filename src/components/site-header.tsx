"use client";

import { useEffect, useState } from "react";
import {
  locales,
  pagePath,
  type Dictionary,
  type Locale,
  type PageId,
} from "@/i18n";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader({
  locale,
  page,
  t,
}: {
  locale: Locale;
  page: PageId;
  t: Dictionary["header"];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const home = pagePath("home", locale);
  const itSolutions = pagePath("itSolutions", locale);

  const navLinks = [
    { href: `${home}#benefits`, label: t.nav.benefits, active: false },
    { href: `${home}#route`, label: t.nav.route, active: false },
    { href: `${home}#team`, label: t.nav.team, active: false },
    { href: `${home}#format`, label: t.nav.format, active: false },
    { href: itSolutions, label: t.nav.itSolutions, active: page === "itSolutions" },
  ];

  const cta =
    page === "home"
      ? { href: "#apply", label: t.apply, short: t.applyShort }
      : { href: "#it-apply", label: t.itCta, short: t.itCtaShort };

  const languageHrefs = Object.fromEntries(
    locales.map((l) => [l, pagePath(page, l)]),
  ) as Record<Locale, string>;

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
          href={page === "home" ? "#top" : home}
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 flex-col items-start leading-none text-white"
        >
          <span className="font-display text-xl font-bold leading-none tracking-[0.14em] sm:text-2xl">
            AI YACHT
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--gold)]/85 sm:text-xs">
            {t.dates}
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={`text-sm font-medium transition hover:text-[color:var(--gold)] ${
                link.active ? "text-[color:var(--gold)]" : "text-white/80"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* At 400px and below there is no room for it here; it moves into
              the burger menu instead. */}
          <LanguageSwitcher
            locale={locale}
            hrefs={languageHrefs}
            label={t.language}
            className="hidden min-[401px]:inline-flex"
          />
          <a
            href={cta.href}
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-white/40 px-3.5 text-xs font-medium text-white transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] sm:h-[38px] sm:px-5 sm:text-sm"
          >
            {/* The short label is only needed while the switcher shares the
                row on a narrow screen (401–639px). */}
            <span className="hidden min-[401px]:max-sm:inline">{cta.short}</span>
            <span className="min-[401px]:max-sm:hidden">{cta.label}</span>
          </a>
          <button
            type="button"
            aria-label={t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/30 text-white lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 text-base font-medium ${
                  link.active ? "text-[color:var(--gold)]" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4 pb-1 min-[401px]:hidden">
              <span className="text-sm text-white/60">{t.language}</span>
              <LanguageSwitcher
                locale={locale}
                hrefs={languageHrefs}
                label={t.language}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
