import { pagePath, type Dictionary, type Locale } from "@/i18n";
import { siteConfig } from "@/lib/site";

export function SiteFooter({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["footer"];
}) {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container-narrow flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <a
          href={pagePath("home", locale)}
          className="font-display text-base font-bold tracking-[0.14em] text-foreground"
        >
          AI YACHT
        </a>
        <div className="flex flex-col gap-1 sm:items-end">
          <div>{t.copyright}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a
              href={pagePath("itSolutions", locale)}
              className="text-muted-foreground/80 hover:text-[color:var(--teal)]"
            >
              {t.itLink}
            </a>
            <a
              href={siteConfig.url}
              className="text-muted-foreground/80 hover:text-[color:var(--teal)]"
            >
              {siteConfig.domain}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
