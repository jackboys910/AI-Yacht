import { localeLabels, locales, type Locale } from "@/i18n/config";
import type { NavLink } from "@/lib/content/nav";

/**
 * The footer from §6.1: "© Nazarov", the site's sections and the EN / RU
 * switch.
 *
 * "Unsubscribe" is here as Appendix В asks, and it leads to the page the
 * letters link to (item 3.3). Without a key that page cannot know whose
 * subscription it is looking at, so it says so and points at the letters —
 * which is the honest answer to somebody who arrived from the footer.
 *
 * "Privacy Policy" joins them with item 5.2, which is where that page is
 * written. Linking to it now would mean linking to a 404.
 */
export function SiteFoot({
  locale,
  interests,
  solutionsHref,
  aboutHref,
  suggestHref,
  languageHrefs,
}: {
  locale: Locale;
  interests: NavLink[];
  solutionsHref: string;
  aboutHref?: string;
  /** ТЗ v4 §3.1 wants the way in on every page, footer included. */
  suggestHref?: string;
  languageHrefs: Record<Locale, string>;
}) {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container-narrow flex flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <div>
          <a
            href={locale === "en" ? "/" : `/${locale}/`}
            className="font-display text-base font-bold tracking-[0.14em] text-foreground"
          >
            NAZAROV
          </a>
          <p className="mt-2 text-xs">© Nazarov</p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:justify-end">
          {interests.map((link) => (
            <a key={link.id} href={link.href} className="hover:text-[color:var(--teal)]">
              {link.label}
            </a>
          ))}
          <a href={solutionsHref} className="hover:text-[color:var(--teal)]">
            Solutions
          </a>
          {aboutHref && (
            <a href={aboutHref} className="hover:text-[color:var(--teal)]">
              About
            </a>
          )}
          {suggestHref && (
            <a href={suggestHref} className="hover:text-[color:var(--teal)]">
              {locale === "en" ? "Suggest an idea" : "Предложить идею"}
            </a>
          )}
          <a
            href={locale === "en" ? "/unsubscribe/" : `/${locale}/unsubscribe/`}
            className="hover:text-[color:var(--teal)]"
          >
            {locale === "en" ? "Unsubscribe" : "Отписаться"}
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/" className="hover:text-[color:var(--teal)]">
            {locale === "en" ? "Panel" : "Панель"}
          </a>
        </nav>

        <div className="flex items-center gap-2 text-xs">
          {locales.map((l, index) => (
            <span key={l} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">·</span>}
              {l === locale ? (
                <span className="font-semibold text-foreground">{localeLabels[l]}</span>
              ) : (
                <a href={languageHrefs[l]} hrefLang={l} className="hover:text-[color:var(--teal)]">
                  {localeLabels[l]}
                </a>
              )}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
