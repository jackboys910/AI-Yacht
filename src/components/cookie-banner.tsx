"use client";

import { useEffect, useSyncExternalStore } from "react";
import { pagePath, type Locale } from "@/i18n/config";
import {
  consent,
  consentServerSnapshot,
  setConsent,
  subscribeToConsent,
} from "@/lib/analytics/consent";
import { pixelConfigured, startPixel } from "@/lib/analytics/pixel";

/**
 * The cookie banner (§6.7, П-20).
 *
 * It exists because of one thing — the Facebook pixel — and it says so
 * instead of reciting a paragraph about "enhancing your experience". Two
 * buttons, both plain: agree, or only what is necessary. There is no third
 * way out and no cross in the corner, because closing a consent dialog
 * without answering is the pattern that gets sites fined.
 *
 * Until somebody answers, the advertising counters are not loaded at all —
 * П-20 is checked with the network tab open on a first visit, and the honest
 * way to pass that is for the script not to exist yet.
 *
 * It does not appear when there is no pixel to consent to. While
 * `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` is unset nothing of Facebook is on the
 * site, and asking permission for something that is not happening would be
 * the one kind of cookie banner worse than none.
 */

/**
 * Short on purpose, and shortened once already: at 360px the first version
 * stood 424px tall, which is half a phone screen covered by a question. The
 * detail belongs on the page the link leads to; what the banner owes the
 * reader is why it is asking and what each button does.
 */
const COPY = {
  text: {
    en: "We use cookies for advertising statistics — to see how many people the ads bring. Nothing else is tracked.",
    ru: "Мы используем cookies для статистики рекламы — чтобы видеть, сколько людей она приводит. Больше ничего не отслеживается.",
  },
  accept: { en: "Accept", ru: "Принять" },
  reject: { en: "Only what is necessary", ru: "Только необходимое" },
  more: { en: "Privacy Policy", ru: "Политика конфиденциальности" },
  label: { en: "Cookies", ru: "Cookies" },
} as const;

export function CookieBanner({ locale }: { locale: Locale }) {
  // The store, not state in an effect: the printed HTML carries no banner,
  // and the answer in this browser is read a tick after hydration. See
  // `consentServerSnapshot` for why the pending value is its own.
  const state = useSyncExternalStore(subscribeToConsent, consent, consentServerSnapshot);

  useEffect(() => {
    // A visitor who has already agreed gets this page view recorded; one who
    // has not is left alone until they answer.
    if (consent() === "granted") startPixel();
  }, []);

  if (!pixelConfigured || state !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label={COPY.label[locale]}
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/15 bg-[color:var(--primary)]/95 p-4 text-[13px] text-white shadow-elegant backdrop-blur-md sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-sm">
        <p className="min-w-0 grow basis-64 text-white/85">
          {COPY.text[locale]}{" "}
          <a
            href={pagePath("privacy", locale)}
            className="whitespace-nowrap underline decoration-[color:var(--gold)] underline-offset-4 hover:text-white"
          >
            {COPY.more[locale]}
          </a>
        </p>

        {/* One row even on the narrowest phone: stacked, the two buttons and
            the sentence above them filled half the screen. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setConsent("granted");
              startPixel();
            }}
            className="grow rounded-full bg-[color:var(--gold)] px-5 py-2.5 font-semibold text-[color:var(--gold-foreground)] transition hover:brightness-95 sm:grow-0"
          >
            {COPY.accept[locale]}
          </button>
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="grow rounded-full border border-white/30 px-4 py-2.5 font-medium transition hover:border-white sm:grow-0 sm:px-5"
          >
            {COPY.reject[locale]}
          </button>
        </div>
      </div>
    </div>
  );
}
