import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container-narrow flex flex-col items-start justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="font-display text-base font-bold tracking-[0.14em] text-foreground">
          AI YACHT
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <div>
            © 2026 · AI Yacht Bootcamp · Grenada → Grenadines → Saint Vincent
          </div>
          <a
            href={siteConfig.url}
            className="text-xs text-muted-foreground/80 hover:text-[color:var(--teal)]"
          >
            {siteConfig.domain}
          </a>
        </div>
      </div>
    </footer>
  );
}
