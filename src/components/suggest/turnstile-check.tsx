"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { loadTurnstile, turnstileSiteKey } from "@/lib/turnstile";

export type CheckState = "loading" | "ready" | "failed";

/**
 * The Turnstile widget, and the only place the page knows about it.
 *
 * Rendered explicitly rather than by putting a `cf-turnstile` class on a div.
 * The implicit mode scans the document when the script loads, which in React
 * means a widget that appears twice or not at all depending on when a render
 * happened to land; rendering it ourselves ties its life to this component's.
 *
 * Failure is reported upwards instead of being swallowed. An ad blocker that
 * eats the script would otherwise leave a Send button that does nothing and
 * explains nothing, and the form has to be able to say so and offer an email
 * address instead.
 */
export function TurnstileCheck({
  locale,
  onToken,
  onState,
}: {
  locale: Locale;
  onToken: (token: string) => void;
  onState: (state: CheckState) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  // Held in a ref, not in state: changing it must not redraw the widget, and
  // the cleanup needs the current value rather than the one it closed over.
  const widget = useRef<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    let alive = true;

    loadTurnstile().then(
      (api) => {
        if (!alive || !host.current || widget.current !== null) return;
        widget.current = api.render(host.current, {
          sitekey: turnstileSiteKey,
          theme: "dark",
          language: locale,
          callback: (token) => {
            onToken(token);
            onState("ready");
          },
          // A token lasts about five minutes. A long form is exactly where
          // that runs out, so an expired one is cleared rather than sent.
          "expired-callback": () => {
            onToken("");
            onState("loading");
          },
          "error-callback": () => {
            onToken("");
            onState("failed");
          },
        });
        // The widget is drawn into a plain DOM node React does not own, so
        // nothing here would re-render otherwise.
        force((n) => n + 1);
      },
      () => {
        if (alive) onState("failed");
      },
    );

    return () => {
      alive = false;
      const api = window.turnstile;
      if (api && widget.current !== null) {
        api.remove(widget.current);
        widget.current = null;
      }
    };
    // Re-rendering the widget because a callback identity changed would throw
    // away a token the visitor has already earned.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return <div ref={host} className="min-h-[65px]" />;
}
