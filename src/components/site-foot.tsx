import { localeLabels, locales, type Locale } from "@/i18n/config";
import type { NavLink } from "@/lib/content/nav";

/**
 * The footer from §6.1: "© Nazarov", the site's sections and the EN / RU
 * switch.
 *
 * "Privacy Policy" and "Unsubscribe" belong here too and arrive with the items
 * that build those pages — 4.2 and 2.5. Linking to them now would mean linking
 * to a 404, which is worse than linking to nothing.
 */
export function SiteFoot({
  locale,
  interests,
  solutionsHref,
  languageHrefs,
}: {
  locale: Locale;
  interests: NavLink[];
  solutionsHref: string;
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
