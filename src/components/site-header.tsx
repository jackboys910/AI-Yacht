"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "#benefits", label: "What you get" },
  { href: "#route", label: "Route" },
  { href: "#team", label: "Team" },
  { href: "#format", label: "Format" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[color:var(--primary)]/92 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container-narrow flex items-center justify-between py-3 sm:py-4">
        <a
          href="#top"
          onClick={() => setMenuOpen(false)}
          className="flex flex-col items-start leading-none text-white"
        >
          <span className="font-display text-xl font-bold leading-none tracking-[0.14em] sm:text-2xl">
            AI YACHT
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--gold)]/85 sm:text-xs">
            {siteConfig.dates}
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/80 transition hover:text-[color:var(--gold)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#apply"
            className="rounded-full border border-white/40 px-4 py-2 text-xs font-medium text-white transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] sm:px-5 sm:text-sm"
          >
            Apply now
          </a>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white md:hidden"
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
        <div className="border-t border-white/10 bg-[color:var(--primary)]/95 backdrop-blur-md md:hidden">
          <div className="container-narrow flex flex-col py-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-medium text-white/90"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
