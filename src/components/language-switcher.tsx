"use client";

import { localeLabels, locales, type Locale } from "@/i18n/config";
import { rememberScrollFor } from "@/lib/language-scroll";

/**
 * EN / RU pill. Each option links to the same page in the other language, and
 * the visitor lands at the same point of the page they were reading.
 *
 * Its height matches the header CTA next to it (34px, 38px from `sm`).
 */
export function LanguageSwitcher({
  locale,
  hrefs,
  label,
  className = "",
}: {
  locale: Locale;
  hrefs: Record<Locale, string>;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`h-[34px] items-stretch rounded-full border border-white/30 p-[3px] text-xs font-semibold tracking-[0.08em] sm:h-[38px] ${className || "inline-flex"}`}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={hrefs[l]}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            onClick={(event) => {
              if (active) {
                event.preventDefault();
                return;
              }
              rememberScrollFor(hrefs[l]);
            }}
            className={`inline-flex items-center rounded-full px-2.5 leading-none transition sm:px-3 ${
              active
                ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)]"
                : "text-white/75 hover:text-white"
            }`}
          >
            {localeLabels[l]}
          </a>
        );
      })}
    </div>
  );
}
