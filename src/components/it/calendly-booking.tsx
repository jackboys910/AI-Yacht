"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";

const SCRIPT = "https://assets.calendly.com/assets/external/widget.js";
const STYLES = "https://assets.calendly.com/assets/external/widget.css";

/**
 * The one call we make into Calendly's script.
 *
 * Its own way in is to scan the document for `.calendly-inline-widget`
 * elements when it loads — which, in a page that renders the block after the
 * script has already run, finds nothing. Asking it directly is deterministic
 * and leaves no second, auto-created widget behind.
 */
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

const COPY = {
  kicker: { en: "Book a call", ru: "Записаться на звонок" },
  heading: {
    en: "Twenty minutes, no slides",
    ru: "Двадцать минут без презентаций",
  },
  text: {
    en: "Pick a time that suits you. We talk about what you want built, and you leave knowing roughly what it takes.",
    ru: "Выберите удобное время. Поговорим о том, что нужно сделать, и вы уйдёте с понятной оценкой.",
  },
  open: { en: "Open the calendar", ru: "Открыть календарь" },
  loading: { en: "Loading the calendar…", ru: "Загружаем календарь…" },
} as const;

/**
 * Booking a consultation on /solutions/ (ТЗ v4 §7, С-14).
 *
 * Calendly's widget is a third-party script with a stylesheet behind it, and
 * the page is otherwise static files from the edge. So nothing is requested
 * until the block is close to the viewport: a visitor who reads the top of
 * the page and leaves never touches calendly.com at all, which is both the
 * speed argument and the privacy one.
 *
 * The plain link is there from the first render, not as a fallback that
 * appears after a failure. If the script is blocked — and a script from
 * another domain often is — the booking still works, in a new tab.
 */
export function CalendlyBooking({
  url,
  locale,
}: {
  url: string;
  locale: Locale;
}) {
  const host = useRef<HTMLDivElement>(null);
  // A browser without IntersectionObserver gets the widget straight away:
  // deciding that here rather than inside the effect keeps the effect from
  // setting state on its first run, which is a cascading render.
  const [near, setNear] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const [ready, setReady] = useState(false);

  // Does the browser have the block in sight, or nearly? `rootMargin` starts
  // the download a screen early so the widget is there by the time the
  // heading is read, without being there for someone who never scrolls.
  useEffect(() => {
    const element = host.current;
    if (!element || near) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near || ready) return;
    let alive = true;

    const draw = () => {
      if (!alive || !host.current || !window.Calendly) return;
      window.Calendly.initInlineWidget({
        // Calendly's own cookie notice inside an embed is a second banner on
        // a page that already has to carry one.
        url: `${url}?hide_gdpr_banner=1`,
        parentElement: host.current,
      });
      setReady(true);
    };

    if (!document.querySelector(`link[href="${STYLES}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLES;
      document.head.appendChild(link);
    }

    if (window.Calendly) {
      draw();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", draw, { once: true });

    if (!existing) {
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      alive = false;
      script.removeEventListener("load", draw);
    };
  }, [near, ready, url]);

  return (
    <section id="book" className="bg-[color:var(--muted)] py-16 sm:py-24">
      <div className="container-narrow">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--teal)]">
          {COPY.kicker[locale]}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
          {COPY.heading[locale]}
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{COPY.text[locale]}</p>

        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="mt-6 inline-flex rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-foreground"
        >
          {COPY.open[locale]}
        </a>

        {/* The height is reserved from the start, so the page does not jump
            when the calendar arrives. The waiting line is a sibling rather
            than a child: Calendly appends its iframe into this node and
            would otherwise append it underneath the text. */}
        {/* A real height, not a minimum, and that is the whole trick: the
            widget sets its iframe to `height: 100%`, which resolves to
            nothing against a parent that only has a `min-height` — the
            iframe then falls back to its default 150px and the calendar is
            a sliver. The space is reserved either way, so the page does not
            jump when the calendar arrives. */}
        <div className="relative mt-8 h-[760px] overflow-hidden rounded-2xl border border-border bg-card sm:h-[720px]">
          {!ready && (
            <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              {COPY.loading[locale]}
            </span>
          )}
          <div ref={host} className="h-full" />
        </div>
      </div>
    </section>
  );
}
