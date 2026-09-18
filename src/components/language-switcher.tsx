"use client";

import { localeLabels, locales, type Locale } from "@/i18n/config";

/**
 * EN / RU pill. Each option links to the same page in the other language;
 * the current #section is carried over so switching mid-page lands on the
 * equivalent section instead of the top of the page.
 */
export function LanguageSwitcher({
  locale,
  hrefs,
  label,
}: {
  locale: Locale;
  hrefs: Record<Locale, string>;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-full border border-white/30 p-0.5 text-[11px] font-semibold tracking-[0.08em] sm:text-xs"
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
              const hash = window.location.hash;
              if (hash) {
                event.preventDefault();
                window.location.assign(hrefs[l] + hash);
              }
            }}
            className={`rounded-full px-2 py-1 leading-none transition sm:px-2.5 sm:py-1.5 ${
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
