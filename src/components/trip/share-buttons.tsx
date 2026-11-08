"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";

const COPY = {
  label: { en: "Share this trip", ru: "Поделиться поездкой" },
  copy: { en: "Copy link", ru: "Скопировать ссылку" },
  copied: { en: "Link copied", ru: "Ссылка скопирована" },
  more: { en: "Share…", ru: "Поделиться…" },
} as const;

/**
 * Facebook, WhatsApp, Telegram, "Copy link" — and the phone's own share
 * sheet where there is one (Ш-01).
 *
 * The address is read from the page rather than passed in, so what gets
 * shared is the page the visitor is actually on (Ш-02) — including the
 * language, which a link built from the trip's slug alone would lose.
 *
 * Each link carries where it came from. The owner advertises trips on
 * Facebook (ТЗ v4 §8) and needs to tell a share from an ad; the tag is the
 * cheapest way to do that and costs the visitor nothing.
 *
 * The native button only appears where the browser has the API, and it is
 * checked after mounting rather than during render: the server has no
 * `navigator`, and a button that exists in the HTML and vanishes on
 * hydration is a layout jump on every phone.
 */
export function ShareButtons({
  title,
  locale,
}: {
  title: string;
  locale: Locale;
}) {
  const url = useClientValue(readUrl, "");
  const canShare = useClientValue(readCanShare, false);
  const [copied, setCopied] = useState(false);

  // Before hydration there is nothing to share — and nothing is rendered,
  // rather than four links pointing at the wrong address.
  if (!url) return <Frame locale={locale} />;

  const tagged = (source: string) => {
    const link = new URL(url);
    link.searchParams.set("utm_source", source);
    link.searchParams.set("utm_medium", "share");
    return link.toString();
  };

  const text = `${title} — ${siteConfig.domain}`;

  const links = [
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tagged("facebook"))}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${tagged("whatsapp")}`)}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(tagged("telegram"))}&text=${encodeURIComponent(title)}`,
    },
  ];

  async function copy() {
    const link = tagged("copy");
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access is refused in plenty of ordinary situations — an
      // insecure origin, a browser setting. Selecting the address bar still
      // works, and a silent failure is better than an alert about it.
    }
  }

  return (
    <Frame locale={locale}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
        >
          {link.label}
        </a>
      ))}

      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-foreground"
      >
        {copied ? COPY.copied[locale] : COPY.copy[locale]}
      </button>

      {canShare && (
        <button
          type="button"
          onClick={() =>
            void navigator.share({ title, text, url: tagged("native") }).catch(() => {
              // Dismissing the sheet rejects the promise. That is not a
              // failure worth telling anybody about.
            })
          }
          className="rounded-full bg-[color:var(--gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95"
        >
          {COPY.more[locale]}
        </button>
      )}
    </Frame>
  );
}

/**
 * A value that only exists in a browser, read without a hydration mismatch.
 *
 * Setting it from an effect would be the obvious way and is the wrong one:
 * it renders once with the wrong value and again with the right one, which
 * is the cascade `react-hooks/set-state-in-effect` exists to stop. The
 * server snapshot is what the prerendered HTML contains, and React swaps in
 * the real value as it hydrates.
 *
 * Nothing subscribes: the address of a static page changes by loading
 * another one, and whether the browser can share does not change at all.
 */
const noSubscription = () => () => {};

function useClientValue<T>(read: () => T, onServer: T): T {
  return useSyncExternalStore(noSubscription, read, () => onServer);
}

/** The page's own address, without the query string or the anchor. */
function readUrl(): string {
  const here = new URL(window.location.href);
  here.hash = "";
  here.search = "";
  return here.toString();
}

function readCanShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function Frame({
  locale,
  children,
}: {
  locale: Locale;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-background py-10 sm:py-14">
      <div className="container-narrow flex flex-wrap items-center gap-3">
        <span className="mr-1 text-sm text-muted-foreground">{COPY.label[locale]}</span>
        {children}
      </div>
    </section>
  );
}
